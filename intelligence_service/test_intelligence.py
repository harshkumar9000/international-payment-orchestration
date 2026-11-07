"""
Unit tests for the Intelligence Microservice
Tests Fraud Scoring, Routing Engine, Decline Recovery,
Domestic Card Compatibility, Agentic Refunds, and Student Payments.
"""
import unittest
import os
import sys

# Ensure intelligence_service directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fraud_engine import evaluate_fraud
from routing_engine import optimize_route, PROVIDER_PROFILES
from recovery_engine import analyze_decline
from domestic_card_engine import evaluate_domestic_instrument
from agentic_refund_engine import evaluate_agentic_refund
from student_payment_engine import verify_student_payment_intent

class TestFraudEngine(unittest.TestCase):
    def test_clean_transaction_approves(self):
        payload = {
            "amount": 49.99,
            "currency": "USD",
            "customer_country": "US",
            "billing_country": "US",
            "ip_country": "US",
            "card_country": "US",
            "customer_email": "clean.user@acme.corp",
            "ip_address": "198.51.100.1",
            "cvc_provided": True,
            "is_vpn": False
        }
        res = evaluate_fraud(payload)
        self.assertEqual(res["decision"], "APPROVE")
        self.assertLessEqual(res["risk_score"], 30)
        self.assertEqual(res["risk_level"], "LOW")

    def test_sanctioned_country_blocks(self):
        payload = {
            "amount": 100.0,
            "currency": "USD",
            "customer_country": "IR",
            "billing_country": "IR",
            "customer_email": "test@domain.com"
        }
        res = evaluate_fraud(payload)
        self.assertEqual(res["decision"], "DECLINE")
        self.assertGreaterEqual(res["risk_score"], 85)
        self.assertTrue(any(r["code"] == "FATF_SANCTIONED_COUNTRY" for r in res["triggered_rules"]))

    def test_geo_mismatch_flags(self):
        payload = {
            "amount": 250.0,
            "currency": "USD",
            "customer_country": "US",
            "billing_country": "US",
            "ip_country": "FR",
            "card_country": "DE",
            "customer_email": "traveller@domain.com"
        }
        res = evaluate_fraud(payload)
        self.assertGreaterEqual(res["risk_score"], 31)
        self.assertIn(res["decision"], ["3DS_CHALLENGE", "MANUAL_REVIEW"])

    def test_disposable_email_domain(self):
        payload = {
            "amount": 60.0,
            "currency": "USD",
            "customer_country": "US",
            "customer_email": "hacker123@mailinator.com"
        }
        res = evaluate_fraud(payload)
        self.assertTrue(any(r["code"] == "DISPOSABLE_EMAIL_DOMAIN" for r in res["triggered_rules"]))

class TestRoutingEngine(unittest.TestCase):
    def test_inr_routes_to_razorpay_upi(self):
        payload = {
            "amount": 2500.0,
            "currency": "INR",
            "payment_method": "upi",
            "customer_country": "IN"
        }
        res = optimize_route(payload)
        self.assertEqual(res["primary_provider"], "razorpay_upi")

    def test_eur_advanatage_adyen(self):
        payload = {
            "amount": 120.0,
            "currency": "EUR",
            "payment_method": "credit_card",
            "customer_country": "DE"
        }
        res = optimize_route(payload)
        self.assertEqual(res["primary_provider"], "adyen")
        self.assertIn("stripe", res["cascade_fallback_order"])

    def test_custom_merchant_override_rule(self):
        payload = {
            "amount": 100.0,
            "currency": "USD",
            "payment_method": "credit_card",
            "customer_country": "US",
            "custom_rules": [
                {
                    "name": "Force PayPal for US Cards",
                    "is_active": True,
                    "condition": {
                        "currency": "USD",
                        "country": "US"
                    },
                    "target_provider": "paypal"
                }
            ]
        }
        res = optimize_route(payload)
        self.assertEqual(res["primary_provider"], "paypal")
        self.assertIn("Force PayPal for US Cards", res["applied_rule"])

class TestRecoveryEngine(unittest.TestCase):
    def test_network_timeout_triggers_cascade(self):
        payload = {
            "decline_code": "network_timeout",
            "failed_provider": "stripe",
            "cascade_options": ["stripe", "adyen"],
            "attempt_count": 1
        }
        res = analyze_decline(payload)
        self.assertTrue(res["is_recoverable"])
        self.assertEqual(res["recommended_action"], "CASCADE_FALLBACK")
        self.assertEqual(res["fallback_provider"], "adyen")

    def test_stolen_card_is_unrecoverable(self):
        payload = {
            "decline_code": "stolen_card",
            "attempt_count": 1
        }
        res = analyze_decline(payload)
        self.assertFalse(res["is_recoverable"])
        self.assertEqual(res["recommended_action"], "HALT_AND_FLAG")
        self.assertEqual(res["retry_probability"], 0.0)

class TestDomesticCardEngine(unittest.TestCase):
    def test_rupay_global_eligible_for_international(self):
        payload = {
            "payment_method": "rupay_card",
            "bin": "6521",
            "currency": "USD",
            "merchant_country": "US",
            "amount_usd": 120.0
        }
        res = evaluate_domestic_instrument(payload)
        self.assertTrue(res["eligible"])
        self.assertIn("Discover", res["co_branded_networks"])

    def test_rupay_pmjdy_domestic_only_blocks(self):
        payload = {
            "payment_method": "rupay_card",
            "bin": "6071",
            "currency": "USD",
            "merchant_country": "US",
            "amount_usd": 50.0
        }
        res = evaluate_domestic_instrument(payload)
        self.assertFalse(res["eligible"])
        self.assertIn("domestic-only", res["rejection_reason"])
        self.assertTrue(len(res["alternative_recommendations"]) > 0)

    def test_upi_international_corridor(self):
        # Singapore is an approved UPI International bilateral corridor
        res_sg = evaluate_domestic_instrument({
            "payment_method": "upi",
            "merchant_country": "SG",
            "currency": "SGD"
        })
        self.assertTrue(res_sg["eligible"])

        # US is not directly bilateral without domestic gateway
        res_us = evaluate_domestic_instrument({
            "payment_method": "upi",
            "merchant_country": "US",
            "currency": "USD"
        })
        self.assertFalse(res_us["eligible"])

class TestAgenticRefundEngine(unittest.TestCase):
    def test_orphaned_captured_charge_auto_refunds(self):
        payload = {
            "transaction_id": "tx_test_stuck_01",
            "provider": "stripe",
            "gateway_actual_status": "CAPTURED",
            "amount": 89.00,
            "currency": "USD",
            "decline_code": "network_timeout"
        }
        res = evaluate_agentic_refund(payload)
        self.assertEqual(res["decision"], "AUTO_REFUND_APPROVED")
        self.assertTrue(res["refund_eligible"])
        self.assertIn("idem_", res["idempotency_key"])

    def test_no_capture_releases_hold(self):
        payload = {
            "transaction_id": "tx_test_void_02",
            "provider": "adyen",
            "gateway_actual_status": "FAILED",
            "amount": 150.00,
            "currency": "EUR"
        }
        res = evaluate_agentic_refund(payload)
        self.assertEqual(res["decision"], "NO_REFUND_NEEDED_HOLD_RELEASED")
        self.assertFalse(res["refund_eligible"])
        self.assertTrue(res["safe_retry_viable"])

    def test_high_value_escalates_to_human(self):
        payload = {
            "transaction_id": "tx_test_high_03",
            "provider": "stripe",
            "gateway_actual_status": "CAPTURED",
            "amount": 1200.00,
            "currency": "USD"
        }
        res = evaluate_agentic_refund(payload)
        self.assertEqual(res["decision"], "REQUIRES_HUMAN_APPROVAL")
        self.assertTrue(res["requires_human_approval"])

    def test_idempotency_prevents_duplicate_refund(self):
        payload = {
            "transaction_id": "tx_test_dup_04",
            "already_refunded": True,
            "amount": 50.00
        }
        res = evaluate_agentic_refund(payload)
        self.assertEqual(res["decision"], "REFUND_REJECTED")
        self.assertEqual(res["reason_code"], "DUPLICATE_REFUND_PREVENTED")

class TestStudentPaymentEngine(unittest.TestCase):
    def test_minor_with_active_consent_under_threshold_approves(self):
        payload = {
            "age": 16,
            "guardian_consent_status": "ACTIVE",
            "merchant_category": "online_courses",
            "amount": 35.00,
            "currency": "USD",
            "auto_approval_threshold": 50.0
        }
        res = verify_student_payment_intent(payload)
        self.assertEqual(res["status"], "APPROVED")
        self.assertFalse(res["requires_parent_approval"])

    def test_minor_over_threshold_requires_parent_approval(self):
        payload = {
            "age": 16,
            "guardian_consent_status": "ACTIVE",
            "merchant_category": "online_courses",
            "amount": 89.00,
            "currency": "USD",
            "auto_approval_threshold": 50.0
        }
        res = verify_student_payment_intent(payload)
        self.assertEqual(res["status"], "PENDING_APPROVAL")
        self.assertTrue(res["requires_parent_approval"])

    def test_prohibited_category_blocked(self):
        payload = {
            "age": 17,
            "merchant_category": "gambling_betting",
            "amount": 20.00
        }
        res = verify_student_payment_intent(payload)
        self.assertEqual(res["status"], "BLOCKED")
        self.assertEqual(res["decision"], "PROHIBITED_MERCHANT_CATEGORY")

    def test_missing_guardian_consent_blocked(self):
        payload = {
            "age": 15,
            "guardian_consent_status": "PENDING",
            "merchant_category": "books_study_materials",
            "amount": 25.00
        }
        res = verify_student_payment_intent(payload)
        self.assertEqual(res["status"], "BLOCKED")
        self.assertEqual(res["decision"], "GUARDIAN_CONSENT_REQUIRED")

if __name__ == "__main__":
    unittest.main()
