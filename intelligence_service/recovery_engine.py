"""
Payment Decline Recovery Engine
Categorizes decline codes, assesses recoverability probability, and orchestrates
recovery pathways (cascading fallback, smart retry scheduling, alternate APM suggestions).
"""
from typing import Dict, List, Any

# Taxonomy of decline codes
DECLINE_TAXONOMY = {
    # Soft declines (Recoverable immediately or with retry)
    "network_timeout": {
        "type": "SOFT_DECLINE",
        "recoverable": True,
        "action": "CASCADE_FALLBACK",
        "retry_probability": 0.88,
        "message": "Gateway network timeout. Rerouting through secondary active provider immediately."
    },
    "gateway_unavailable": {
        "type": "SOFT_DECLINE",
        "recoverable": True,
        "action": "CASCADE_FALLBACK",
        "retry_probability": 0.92,
        "message": "Primary gateway service unavailable (503/504). Cascading to secondary provider."
    },
    "insufficient_funds": {
        "type": "SOFT_DECLINE",
        "recoverable": True,
        "action": "SCHEDULED_RETRY_OR_APM",
        "retry_probability": 0.54,
        "message": "Insufficient balance. Schedule smart retry on next pay cycle or suggest alternative card / UPI."
    },
    "currency_not_supported": {
        "type": "SOFT_DECLINE",
        "recoverable": True,
        "action": "CURRENCY_CONVERSION_RETRY",
        "retry_probability": 0.85,
        "message": "Gateway does not settle natively in this currency. Convert to USD/EUR and retry."
    },
    "velocity_exceeded": {
        "type": "SOFT_DECLINE",
        "recoverable": True,
        "action": "DELAYED_RETRY",
        "retry_probability": 0.65,
        "message": "Card issuer transaction limit hit for this hour. Retry after cooldown period."
    },
    "do_not_honor": {
        "type": "SOFT_DECLINE",
        "recoverable": True,
        "action": "CASCADE_FALLBACK_WITH_3DS",
        "retry_probability": 0.48,
        "message": "Issuer generic decline. Rerouting with explicit 3-D Secure authentication challenge."
    },
    # Hard declines (Non-recoverable without customer intervention)
    "suspected_fraud": {
        "type": "HARD_DECLINE",
        "recoverable": False,
        "action": "HALT_AND_FLAG",
        "retry_probability": 0.05,
        "message": "Risk engine flagged suspected fraudulent activity. Do not retry automatically."
    },
    "stolen_card": {
        "type": "HARD_DECLINE",
        "recoverable": False,
        "action": "HALT_AND_FLAG",
        "retry_probability": 0.0,
        "message": "Card marked as stolen or lost by issuer. Terminate payment attempt."
    },
    "expired_card": {
        "type": "HARD_DECLINE",
        "recoverable": False,
        "action": "PROMPT_NEW_CARD",
        "retry_probability": 0.0,
        "message": "Card expired. Prompt customer for updated card credentials."
    },
    "invalid_account": {
        "type": "HARD_DECLINE",
        "recoverable": False,
        "action": "PROMPT_NEW_METHOD",
        "retry_probability": 0.0,
        "message": "Account or card number does not exist."
    }
}

def analyze_decline(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes transaction decline details and generates an intelligent recovery strategy.
    """
    decline_code = str(payload.get("decline_code", "generic_decline")).lower()
    decline_message = str(payload.get("decline_message", "Transaction was declined"))
    attempt_count = int(payload.get("attempt_count", 1))
    failed_provider = str(payload.get("failed_provider", "stripe"))
    cascade_options = payload.get("cascade_options", [])
    currency = str(payload.get("currency", "USD")).upper()
    payment_method = str(payload.get("payment_method", "credit_card")).lower()

    meta = DECLINE_TAXONOMY.get(decline_code, {
        "type": "SOFT_DECLINE" if attempt_count < 3 else "HARD_DECLINE",
        "recoverable": attempt_count < 3,
        "action": "CASCADE_FALLBACK" if attempt_count < 3 else "MANUAL_INTERVENTION",
        "retry_probability": max(0.1, 0.6 - (attempt_count * 0.2)),
        "message": decline_message
    })

    recoverable = meta["recoverable"] and (attempt_count < 4)
    action = meta["action"]

    # Select alternative fallback gateway if cascading
    fallback_provider = None
    if recoverable and cascade_options:
        for prov in cascade_options:
            if prov != failed_provider:
                fallback_provider = prov
                break

    # Alternative payment method suggestion if card failed
    suggested_alternative_methods = []
    if payment_method in ["credit_card", "debit_card"]:
        if currency == "INR":
            suggested_alternative_methods.append({
                "method": "upi",
                "label": "Instant UPI (PhonePe / GPay / Paytm)",
                "estimated_success_rate": 0.98
            })
        elif currency == "EUR":
            suggested_alternative_methods.append({
                "method": "sepa_debit",
                "label": "SEPA Direct Debit / iDEAL",
                "estimated_success_rate": 0.97
            })
        elif currency == "BRL":
            suggested_alternative_methods.append({
                "method": "pix",
                "label": "Pix Instant Bank Transfer",
                "estimated_success_rate": 0.99
            })
        suggested_alternative_methods.append({
            "method": "paypal",
            "label": "PayPal Checkout",
            "estimated_success_rate": 0.94
        })

    return {
        "decline_code": decline_code,
        "decline_type": meta["type"],
        "is_recoverable": recoverable,
        "retry_probability": meta["retry_probability"],
        "recommended_action": action,
        "recovery_strategy_description": meta["message"],
        "fallback_provider": fallback_provider,
        "attempt_count": attempt_count,
        "next_retry_delay_seconds": 0 if action == "CASCADE_FALLBACK" else (3600 * 6),
        "suggested_alternative_methods": suggested_alternative_methods
    }

