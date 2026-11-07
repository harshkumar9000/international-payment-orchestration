"""
Student & Under-18 Payment Intelligence Engine
Enforces age verification, parent/guardian consent status, spending limit quotas,
and merchant category whitelisting for educational and minor payments.
"""
from typing import Dict, List, Any, Optional

# Merchant Category Code (MCC) Groups
WHITELISTED_STUDENT_CATEGORIES = {
    "education_higher_ed": {"name": "Universities & Colleges (Tuition / Admission)", "whitelisted": True, "requires_parent_over": 100.0},
    "online_courses": {"name": "Educational Courseware (Coursera, edX, Udemy)", "whitelisted": True, "requires_parent_over": 60.0},
    "books_study_materials": {"name": "Textbooks & Academic Publications", "whitelisted": True, "requires_parent_over": 50.0},
    "software_tools": {"name": "Student Development Software (GitHub, JetBrains, Notion)", "whitelisted": True, "requires_parent_over": 35.0},
    "standardized_testing": {"name": "International Testing (TOEFL, GRE, IELTS, SAT)", "whitelisted": True, "requires_parent_over": 150.0},
    "general_educational": {"name": "General Educational Subscriptions", "whitelisted": True, "requires_parent_over": 40.0}
}

PROHIBITED_STUDENT_CATEGORIES = {
    "gambling_betting": "Gambling, lotteries, and betting platforms are strictly prohibited for student accounts.",
    "cryptocurrency": "Cryptocurrency exchanges and speculative trading are strictly blocked for minors.",
    "bars_alcohol": "Alcohol, tobacco, and nightlife merchant establishments are blocked.",
    "adult_content": "Adult entertainment and age-restricted services are strictly prohibited.",
    "weapons_defense": "Weapons and hazardous goods merchants are prohibited."
}

def verify_student_payment_intent(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates a proposed payment by a student/minor against limits,
    category whitelists, and guardian consent policies.
    """
    student_age = int(payload.get("age", 17))
    is_minor = student_age < 18
    guardian_consent_status = str(payload.get("guardian_consent_status", "ACTIVE")).upper()
    category = str(payload.get("merchant_category", "online_courses")).lower()
    amount = float(payload.get("amount", 45.0))
    currency = str(payload.get("currency", "USD")).upper()
    merchant_name = str(payload.get("merchant_name", "Coursera International"))

    # Configurable limits from student profile (or defaults)
    single_limit = float(payload.get("single_tx_limit", 250.0))
    daily_limit = float(payload.get("daily_limit", 100.0))
    current_day_spend = float(payload.get("current_day_spend", 0.0))
    monthly_limit = float(payload.get("monthly_limit", 1200.0))
    current_month_spend = float(payload.get("current_month_spend", 0.0))
    auto_approval_threshold = float(payload.get("auto_approval_threshold", 50.0))

    # Convert approx to USD for uniform limit check
    amount_usd = amount if currency == "USD" else (amount * 1.08 if currency == "EUR" else amount / 86.45)

    # 1. Check Guardian Consent Status
    if is_minor and guardian_consent_status != "ACTIVE":
        return {
            "status": "BLOCKED",
            "decision": "GUARDIAN_CONSENT_REQUIRED",
            "reason": f"Parent / Guardian consent is '{guardian_consent_status}'. Minor accounts cannot transact without verified parental authorization.",
            "requires_parent_approval": False,
            "category": category,
            "amount_usd": amount_usd
        }

    # 2. Check Prohibited Merchant Categories
    if category in PROHIBITED_STUDENT_CATEGORIES:
        return {
            "status": "BLOCKED",
            "decision": "PROHIBITED_MERCHANT_CATEGORY",
            "reason": PROHIBITED_STUDENT_CATEGORIES[category],
            "requires_parent_approval": False,
            "category": category,
            "amount_usd": amount_usd
        }

    # 3. Check Hard Spending Limit Caps
    if amount_usd > single_limit:
        return {
            "status": "BLOCKED",
            "decision": "EXCEEDS_SINGLE_TRANSACTION_LIMIT",
            "reason": f"Transaction amount (${amount_usd:.2f}) exceeds configured single-transaction cap (${single_limit:.2f}).",
            "requires_parent_approval": False,
            "category": category,
            "amount_usd": amount_usd
        }

    if (current_day_spend + amount_usd) > daily_limit:
        return {
            "status": "BLOCKED",
            "decision": "EXCEEDS_DAILY_SPENDING_LIMIT",
            "reason": f"Transaction brings daily spend to ${(current_day_spend + amount_usd):.2f}, exceeding daily limit of ${daily_limit:.2f}.",
            "requires_parent_approval": False,
            "category": category,
            "amount_usd": amount_usd
        }

    if (current_month_spend + amount_usd) > monthly_limit:
        return {
            "status": "BLOCKED",
            "decision": "EXCEEDS_MONTHLY_SPENDING_LIMIT",
            "reason": f"Transaction brings monthly spend to ${(current_month_spend + amount_usd):.2f}, exceeding monthly limit of ${monthly_limit:.2f}.",
            "requires_parent_approval": False,
            "category": category,
            "amount_usd": amount_usd
        }

    # 4. Determine Parent Approval Requirement
    # If transaction exceeds auto_approval_threshold or category-specific threshold
    cat_rule = WHITELISTED_STUDENT_CATEGORIES.get(category, {"requires_parent_over": auto_approval_threshold})
    threshold = min(auto_approval_threshold, cat_rule["requires_parent_over"])

    if is_minor and amount_usd > threshold:
        return {
            "status": "PENDING_APPROVAL",
            "decision": "REQUIRES_PARENT_APPROVAL",
            "reason": f"Amount (${amount_usd:.2f}) exceeds student instant allowance of ${threshold:.2f}. Notification and approval request dispatched to guardian.",
            "requires_parent_approval": True,
            "approval_threshold": threshold,
            "category": category,
            "category_name": cat_rule.get("name", category),
            "amount_usd": amount_usd,
            "merchant_name": merchant_name
        }

    # 5. Passed all guardrails -> Instant Clearance
    return {
        "status": "APPROVED",
        "decision": "INSTANT_ALLOWANCE_APPROVED",
        "reason": f"Educational transaction to '{merchant_name}' within student pre-approved allowance.",
        "requires_parent_approval": False,
        "category": category,
        "category_name": cat_rule.get("name", category),
        "amount_usd": amount_usd,
        "merchant_name": merchant_name
    }

