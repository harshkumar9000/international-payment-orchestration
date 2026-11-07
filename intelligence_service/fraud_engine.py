"""
Fraud Detection Engine
Multi-factor risk assessment incorporating velocity checks, geolocation anomalies,
transaction amount deviations, sanctioned corridor checks, and heuristic indicators.
"""
from typing import Dict, List, Any, Optional
import time
from collections import defaultdict

# High risk or sanctioned ISO-2 countries (FATF / OFAC lists)
SANCTIONED_COUNTRIES = {"KP", "IR", "SY", "CU", "SD"}
HIGH_RISK_CORRIDORS = {"AF", "YE", "VE", "MM"}

# Disposable / disposable burner email domains
SUSPICIOUS_EMAIL_DOMAINS = {
    "mailinator.com", "tempmail.com", "10minutemail.com",
    "guerrillamail.com", "throwawaymail.com", "yopmail.com", "trashmail.com"
}

# In-memory velocity tracker: {identifier: [timestamps]}
velocity_tracker: Dict[str, List[float]] = defaultdict(list)

def clean_old_velocity(identifier: str, window_seconds: float = 300.0):
    now = time.time()
    velocity_tracker[identifier] = [
        t for t in velocity_tracker[identifier] if (now - t) <= window_seconds
    ]

def evaluate_fraud(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates payment context and computes a comprehensive risk score (0 - 100).
    Decisions:
      - APPROVE (0 - 30)
      - 3DS_CHALLENGE (31 - 65)
      - MANUAL_REVIEW (66 - 85)
      - DECLINE (86 - 100)
    """
    risk_score = 0
    triggered_rules: List[Dict[str, Any]] = []
    score_breakdown: Dict[str, int] = {}

    amount = float(payload.get("amount", 0.0))
    currency = str(payload.get("currency", "USD")).upper()
    customer_country = str(payload.get("customer_country", "US")).upper()
    billing_country = str(payload.get("billing_country", customer_country)).upper()
    ip_country = str(payload.get("ip_country", customer_country)).upper()
    card_country = str(payload.get("card_country", customer_country)).upper()
    customer_email = str(payload.get("customer_email", "")).lower()
    ip_address = str(payload.get("ip_address", "127.0.0.1"))
    payment_method = str(payload.get("payment_method", "credit_card")).lower()
    cvc_provided = bool(payload.get("cvc_provided", True))
    is_vpn = bool(payload.get("is_vpn", False))
    merchant_avg_amount = float(payload.get("merchant_avg_amount", 120.0))

    # 1. Sanctioned & High-Risk Corridor Check (Critical)
    if customer_country in SANCTIONED_COUNTRIES or billing_country in SANCTIONED_COUNTRIES or ip_country in SANCTIONED_COUNTRIES:
        pts = 95
        risk_score += pts
        score_breakdown["sanctions_check"] = pts
        triggered_rules.append({
            "code": "FATF_SANCTIONED_COUNTRY",
            "severity": "CRITICAL",
            "score": pts,
            "description": f"Country in international sanctions blacklist ({customer_country}/{ip_country})."
        })
    elif customer_country in HIGH_RISK_CORRIDORS or ip_country in HIGH_RISK_CORRIDORS:
        pts = 40
        risk_score += pts
        score_breakdown["high_risk_country"] = pts
        triggered_rules.append({
            "code": "HIGH_RISK_CORRIDOR",
            "severity": "HIGH",
            "score": pts,
            "description": f"Corridor flagged for elevated fraud rate ({customer_country})."
        })

    # 2. Geolocation Mismatch (IP vs Billing vs Card Origin)
    geo_mismatches = 0
    if ip_country != billing_country and ip_country != "UNKNOWN":
        geo_mismatches += 1
    if payment_method in ["credit_card", "debit_card"] and card_country and card_country != billing_country:
        geo_mismatches += 1

    if geo_mismatches >= 2:
        pts = 35
        risk_score += pts
        score_breakdown["geo_mismatch_multi"] = pts
        triggered_rules.append({
            "code": "MULTI_GEO_MISMATCH",
            "severity": "HIGH",
            "score": pts,
            "description": f"Severe geolocation discrepancy: IP ({ip_country}), Billing ({billing_country}), Card ({card_country})."
        })
    elif geo_mismatches == 1:
        pts = 18
        risk_score += pts
        score_breakdown["geo_mismatch_single"] = pts
        triggered_rules.append({
            "code": "GEO_IP_BILLING_MISMATCH",
            "severity": "MEDIUM",
            "score": pts,
            "description": f"IP location ({ip_country}) does not match billing country ({billing_country})."
        })

    # 3. VPN / Proxy / TOR Detection
    if is_vpn:
        pts = 25
        risk_score += pts
        score_breakdown["vpn_detected"] = pts
        triggered_rules.append({
            "code": "ANONYMOUS_PROXY_OR_VPN",
            "severity": "MEDIUM",
            "score": pts,
            "description": "Connection originated from known commercial VPN, data center, or proxy node."
        })

    # 4. Velocity Check (Rapid attempts from same IP or Email)
    velocity_id = customer_email if customer_email else ip_address
    clean_old_velocity(velocity_id)
    history = velocity_tracker[velocity_id]
    recent_count = len(history)
    # Record current attempt
    history.append(time.time())

    if recent_count >= 5:
        pts = 45
        risk_score += pts
        score_breakdown["velocity_burst"] = pts
        triggered_rules.append({
            "code": "EXTREME_VELOCITY_BURST",
            "severity": "CRITICAL",
            "score": pts,
            "description": f"Excessive transaction volume: {recent_count + 1} requests within 5 minutes."
        })
    elif recent_count >= 3:
        pts = 25
        risk_score += pts
        score_breakdown["velocity_spike"] = pts
        triggered_rules.append({
            "code": "VELOCITY_SPIKE",
            "severity": "MEDIUM",
            "score": pts,
            "description": f"Rapid recurring transactions detected ({recent_count + 1} within 5 minutes)."
        })

    # 5. Amount Anomaly Detection
    # Baseline comparison in normalized USD-equivalent approximation
    usd_norm_amount = amount
    if currency == "INR":
        usd_norm_amount = amount / 86.0
    elif currency == "JPY":
        usd_norm_amount = amount / 150.0
    elif currency == "EUR":
        usd_norm_amount = amount * 1.08
    elif currency == "GBP":
        usd_norm_amount = amount * 1.28

    if usd_norm_amount > (merchant_avg_amount * 6):
        pts = 30
        risk_score += pts
        score_breakdown["amount_outlier_high"] = pts
        triggered_rules.append({
            "code": "AMOUNT_OUTLIER_CRITICAL",
            "severity": "HIGH",
            "score": pts,
            "description": f"Transaction amount (${usd_norm_amount:.2f}) is over 6x the average merchant ticket size (${merchant_avg_amount:.2f})."
        })
    elif usd_norm_amount > (merchant_avg_amount * 3):
        pts = 15
        risk_score += pts
        score_breakdown["amount_outlier_moderate"] = pts
        triggered_rules.append({
            "code": "AMOUNT_OUTLIER_ELEVATED",
            "severity": "LOW",
            "score": pts,
            "description": f"Transaction amount is significantly above standard ticket size."
        })

    # 6. Disposable / Throwaway Email Detection
    if "@" in customer_email:
        email_domain = customer_email.split("@")[-1].strip()
        if email_domain in SUSPICIOUS_EMAIL_DOMAINS:
            pts = 25
            risk_score += pts
            score_breakdown["disposable_email"] = pts
            triggered_rules.append({
                "code": "DISPOSABLE_EMAIL_DOMAIN",
                "severity": "MEDIUM",
                "score": pts,
                "description": f"Customer email domain (@{email_domain}) is a temporary or throwaway inbox service."
            })

    # 7. CVC missing on card
    if payment_method in ["credit_card", "debit_card"] and not cvc_provided:
        pts = 20
        risk_score += pts
        score_breakdown["missing_cvc"] = pts
        triggered_rules.append({
            "code": "MISSING_CARD_CVC",
            "severity": "MEDIUM",
            "score": pts,
            "description": "Card security code (CVC/CVV) was omitted."
        })

    # Cap score between 0 and 100
    risk_score = min(max(risk_score, 0), 100)

    # Determine Decision & Level
    if risk_score >= 85:
        decision = "DECLINE"
        risk_level = "CRITICAL"
        action_required = "Automatic rejection to prevent chargeback loss."
    elif risk_score >= 65:
        decision = "MANUAL_REVIEW"
        risk_level = "HIGH"
        action_required = "Held in review queue for compliance officer inspection."
    elif risk_score >= 31:
        decision = "3DS_CHALLENGE"
        risk_level = "MEDIUM"
        action_required = "Mandatory 3-D Secure Strong Customer Authentication (SCA)."
    else:
        decision = "APPROVE"
        risk_level = "LOW"
        action_required = "Proceed directly with frictionless routing and capture."

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "decision": decision,
        "action_required": action_required,
        "triggered_rules": triggered_rules,
        "score_breakdown": score_breakdown,
        "assessed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "flags_count": len(triggered_rules)
    }

