"""
Intelligent Payment Routing Engine
Evaluates merchant routing rules, gateway health, processing costs, historical success rates,
and currency affinity to select the optimal primary gateway and cascade fallback path.
"""
from typing import Dict, List, Any, Optional

PROVIDER_PROFILES: Dict[str, Dict[str, Any]] = {
    "stripe": {
        "id": "stripe",
        "name": "Stripe Global",
        "supported_currencies": ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD", "NZD", "CHF"],
        "supported_methods": ["credit_card", "debit_card", "apple_pay", "google_pay"],
        "supported_countries": ["US", "CA", "GB", "AU", "DE", "FR", "JP", "SG", "NL", "IE", "ES", "IT"],
        "base_fee_percent": 2.9,
        "base_fee_fixed": 0.30, # USD
        "avg_latency_ms": 320,
        "historical_success_rate": 0.962,
        "uptime": 0.9998,
        "is_active": True
    },
    "adyen": {
        "id": "adyen",
        "name": "Adyen European & Global",
        "supported_currencies": ["EUR", "GBP", "USD", "CHF", "SEK", "NOK", "DKK", "PLN"],
        "supported_methods": ["credit_card", "debit_card", "sepa_debit", "ideal", "sofort", "giropay"],
        "supported_countries": ["DE", "FR", "NL", "GB", "ES", "IT", "SE", "CH", "BE", "AT", "PL"],
        "base_fee_percent": 1.9,
        "base_fee_fixed": 0.12, # EUR/USD
        "avg_latency_ms": 285,
        "historical_success_rate": 0.978,
        "uptime": 0.9999,
        "is_active": True
    },
    "paypal": {
        "id": "paypal",
        "name": "PayPal Sandbox / Enterprise",
        "supported_currencies": ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"],
        "supported_methods": ["paypal_wallet", "paypal_credit", "credit_card", "debit_card"],
        "supported_countries": ["US", "GB", "DE", "FR", "CA", "AU", "JP"],
        "base_fee_percent": 3.49,
        "base_fee_fixed": 0.49,
        "avg_latency_ms": 520,
        "historical_success_rate": 0.945,
        "uptime": 0.9995,
        "is_active": True
    },
    "razorpay_upi": {
        "id": "razorpay_upi",
        "name": "Razorpay / UPI India Gateway",
        "supported_currencies": ["INR"],
        "supported_methods": ["upi", "upi_qr", "upi_intent", "netbanking", "rupay_card"],
        "supported_countries": ["IN"],
        "base_fee_percent": 0.5,
        "base_fee_fixed": 0.00,
        "avg_latency_ms": 190,
        "historical_success_rate": 0.985,
        "uptime": 0.9997,
        "is_active": True
    },
    "dlocal": {
        "id": "dlocal",
        "name": "dLocal Emerging Corridors",
        "supported_currencies": ["BRL", "MXN", "COP", "CLP", "PEN", "ZAR", "NGN", "KES", "INR", "USD"],
        "supported_methods": ["pix", "oxxo", "pse", "boleto", "credit_card", "debit_card"],
        "supported_countries": ["BR", "MX", "CO", "CL", "PE", "ZA", "NG", "KE", "IN"],
        "base_fee_percent": 2.4,
        "base_fee_fixed": 0.20,
        "avg_latency_ms": 410,
        "historical_success_rate": 0.951,
        "uptime": 0.9992,
        "is_active": True
    }
}

def calculate_provider_fee(provider: Dict[str, Any], amount: float) -> float:
    pct = provider["base_fee_percent"] / 100.0
    return round((amount * pct) + provider["base_fee_fixed"], 4)

def optimize_route(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates candidates and returns primary route + cascade order.
    Merchant custom weights can prioritize:
      - cost_weight (default: 0.35)
      - success_weight (default: 0.35)
      - latency_weight (default: 0.15)
      - uptime_weight (default: 0.15)
    """
    currency = str(payload.get("currency", "USD")).upper()
    payment_method = str(payload.get("payment_method", "credit_card")).lower()
    customer_country = str(payload.get("customer_country", "US")).upper()
    amount = float(payload.get("amount", 100.0))
    active_rules = payload.get("custom_rules", [])

    cost_weight = float(payload.get("cost_weight", 0.35))
    success_weight = float(payload.get("success_weight", 0.35))
    latency_weight = float(payload.get("latency_weight", 0.15))
    uptime_weight = float(payload.get("uptime_weight", 0.15))

    # Normalize weights so they sum to 1.0
    total_w = cost_weight + success_weight + latency_weight + uptime_weight
    if total_w > 0:
        cost_weight /= total_w
        success_weight /= total_w
        latency_weight /= total_w
        uptime_weight /= total_w

    # Step 1: Filter compatible providers
    compatible_candidates = []
    rejection_reasons = {}

    for pid, p in PROVIDER_PROFILES.items():
        if not p.get("is_active", True):
            rejection_reasons[pid] = "Provider temporarily disabled or under maintenance"
            continue

        # Check currency compatibility
        if currency not in p["supported_currencies"]:
            rejection_reasons[pid] = f"Currency {currency} not natively supported"
            continue

        # Check method compatibility
        # If method is generic card, check if provider supports card
        if payment_method in ["credit_card", "debit_card", "card"]:
            if not ("credit_card" in p["supported_methods"] or "debit_card" in p["supported_methods"]):
                rejection_reasons[pid] = f"Method {payment_method} not supported"
                continue
        elif payment_method.startswith("upi"):
            if not any(m.startswith("upi") for m in p["supported_methods"]):
                rejection_reasons[pid] = "UPI rails not supported"
                continue
        elif payment_method.startswith("paypal"):
            if not any("paypal" in m for m in p["supported_methods"]):
                rejection_reasons[pid] = "PayPal wallet not supported"
                continue
        elif payment_method in ["pix", "oxxo", "pse"]:
            if payment_method not in p["supported_methods"]:
                rejection_reasons[pid] = f"Local APM {payment_method} not supported"
                continue
        elif payment_method in ["sepa_debit", "ideal", "sofort"]:
            if payment_method not in p["supported_methods"]:
                rejection_reasons[pid] = f"European APM {payment_method} not supported"
                continue

        compatible_candidates.append(p)

    # Fallback to general providers with multi-currency FX if no direct native match
    if not compatible_candidates:
        for pid in ["stripe", "adyen", "dlocal"]:
            p = PROVIDER_PROFILES[pid]
            if p.get("is_active", True):
                compatible_candidates.append(p)
                break

    # Step 2: Check hard custom merchant rule overrides
    forced_provider_id = None
    applied_rule_name = None

    for rule in active_rules:
        if not rule.get("is_active", True):
            continue
        condition = rule.get("condition", {})
        cond_currency = condition.get("currency")
        cond_country = condition.get("country")
        cond_method = condition.get("payment_method")

        match = True
        if cond_currency and cond_currency.upper() != currency:
            match = False
        if cond_country and cond_country.upper() != customer_country:
            match = False
        if cond_method and cond_method.lower() != payment_method:
            match = False

        if match:
            target_provider = rule.get("target_provider")
            if target_provider in PROVIDER_PROFILES and PROVIDER_PROFILES[target_provider]["is_active"]:
                forced_provider_id = target_provider
                applied_rule_name = rule.get("name", "Merchant Custom Rule")
                break

    # Step 3: Compute Multi-Factor Scores
    scored_candidates = []
    max_latency = 600.0  # normalize
    max_fee = 10.0      # normalize

    for candidate in compatible_candidates:
        pid = candidate["id"]
        fee = calculate_provider_fee(candidate, amount)
        latency = candidate["avg_latency_ms"]
        success_rate = candidate["historical_success_rate"]
        uptime = candidate["uptime"]

        # Normalized sub-scores from 0.0 to 1.0 (higher is better)
        # Fee score: lower fee -> closer to 1.0
        s_fee = max(0.0, 1.0 - (fee / max(amount * 0.05 + 1.0, 1.0)))
        # Latency score: lower latency -> closer to 1.0
        s_lat = max(0.0, 1.0 - (latency / max_latency))
        # Success rate score: already 0.0 to 1.0
        s_success = success_rate
        # Uptime score: already ~0.999
        s_uptime = uptime

        # Composite match score (0 - 100)
        composite_score = (
            (s_fee * cost_weight) +
            (s_success * success_weight) +
            (s_lat * latency_weight) +
            (s_uptime * uptime_weight)
        ) * 100.0

        # Special affinity bonuses:
        # Native domestic currency affinity
        if currency == "INR" and pid == "razorpay_upi":
            composite_score += 15.0
        elif currency == "EUR" and pid == "adyen":
            composite_score += 10.0
        elif currency == "USD" and pid == "stripe":
            composite_score += 8.0
        elif currency in ["BRL", "MXN", "COP"] and pid == "dlocal":
            composite_score += 12.0
        elif payment_method.startswith("paypal") and pid == "paypal":
            composite_score += 25.0

        # Forced rule boost
        if forced_provider_id and pid == forced_provider_id:
            composite_score += 100.0

        scored_candidates.append({
            "provider_id": pid,
            "provider_name": candidate["name"],
            "score": round(composite_score, 2),
            "estimated_fee": fee,
            "fee_percent": candidate["base_fee_percent"],
            "avg_latency_ms": latency,
            "success_rate": round(success_rate * 100, 2),
            "uptime_percent": round(uptime * 100, 3)
        })

    # Sort descending by composite score
    scored_candidates.sort(key=lambda x: x["score"], reverse=True)

    primary_route = scored_candidates[0] if scored_candidates else None
    cascade_routes = scored_candidates[1:] if len(scored_candidates) > 1 else []

    routing_rationale = []
    if applied_rule_name:
        routing_rationale.append(f"Matched rule '{applied_rule_name}' prioritizing {primary_route['provider_name']}.")
    if primary_route:
        routing_rationale.append(
            f"Selected {primary_route['provider_name']} with composite efficiency score {primary_route['score']} "
            f"(Est fee: ${primary_route['estimated_fee']:.2f}, Latency: {primary_route['avg_latency_ms']}ms, Success: {primary_route['success_rate']}%)."
        )

    return {
        "status": "OPTIMIZED",
        "primary_provider": primary_route["provider_id"] if primary_route else "stripe",
        "primary_provider_name": primary_route["provider_name"] if primary_route else "Stripe Global",
        "primary_details": primary_route,
        "cascade_fallback_order": [c["provider_id"] for c in cascade_routes],
        "cascade_candidates": cascade_routes,
        "rejection_reasons": rejection_reasons,
        "applied_rule": applied_rule_name,
        "routing_rationale": " ".join(routing_rationale),
        "total_evaluated": len(PROVIDER_PROFILES)
    }

