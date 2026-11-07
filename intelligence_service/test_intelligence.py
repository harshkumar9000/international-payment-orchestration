"""
Unit tests for the Intelligence Microservice
Tests Fraud Scoring, Routing Engine, and Decline Recovery.
"""
import unittest
import os
import sys

# Ensure intelligence_service directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fraud_engine import evaluate_fraud
from routing_engine import optimize_route, PROVIDER_PROFILES
from recovery_engine import analyze_decline

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
            "customer_country": "IR", # Iran (Sanctioned)
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
            "ip_country": "FR",  # Mismatch
            "card_country": "DE",# Mismatch
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
        # Adyen has lowest fee and highest success rate in EUR
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

if __name__ == "__main__":
    unittest.main()
