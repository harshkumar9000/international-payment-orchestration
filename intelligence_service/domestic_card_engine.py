"""
Domestic Card & UPI International Compatibility Engine
Specialized in evaluating Indian domestic payment rails (RuPay, UPI)
for international cross-border eligibility, compliance, and alternative routing.
"""
from typing import Dict, List, Any, Optional

# RuPay BIN Ranges & Network Alliances
# - RuPay Global / Platinum / Select cards partner with Discover, Diners Club, JCB, and Pulse for worldwide acceptance.
# - RuPay Classic / PMJDY (Pradhan Mantri Jan Dhan Yojana) cards are strictly domestic-only.
RUPAY_BIN_DATABASE = {
    # 6-digit BIN prefix mappings
    "6521": {
        "variant": "RuPay Global Platinum",
        "international_capable": True,
        "co_branded_networks": ["Discover", "Diners Club", "JCB", "Pulse"],
        "max_single_tx_usd": 5000.0,
        "requires_bank_app_enablement": True,
        "description": "Dual-network international RuPay Platinum card supported across Discover and JCB acceptance points."
    },
    "6522": {
        "variant": "RuPay Global Select / Business",
        "international_capable": True,
        "co_branded_networks": ["Discover", "Diners Club", "JCB"],
        "max_single_tx_usd": 10000.0,
        "requires_bank_app_enablement": True,
        "description": "Commercial / Premium RuPay Global card with cross-border lounge and POS access."
    },
    "6528": {
        "variant": "RuPay Global Classic Co-badged",
        "international_capable": True,
        "co_branded_networks": ["Discover"],
        "max_single_tx_usd": 2500.0,
        "requires_bank_app_enablement": True,
        "description": "Standard RuPay card enabled for Discover global network."
    },
    "6070": {
        "variant": "RuPay Domestic Classic",
        "international_capable": False,
        "co_branded_networks": [],
        "max_single_tx_usd": 0.0,
        "requires_bank_app_enablement": False,
        "description": "Domestic-only RuPay classic card. Cross-border e-commerce is blocked by NPCI / issuing bank."
    },
    "6071": {
        "variant": "RuPay PMJDY Financial Inclusion",
        "international_capable": False,
        "co_branded_networks": [],
        "max_single_tx_usd": 0.0,
        "requires_bank_app_enablement": False,
        "description": "PMJDY basic savings card strictly restricted to domestic Indian terminals and domestic e-commerce."
    }
}

# UPI International Supported Corridors (NPCI International Payments Ltd - NIPL partnerships)
UPI_INTERNATIONAL_CORRIDORS = {
    "SG": {"country": "Singapore", "clearing_partner": "PayNow / NETS", "supported": True, "currency": "SGD"},
    "AE": {"country": "United Arab Emirates", "clearing_partner": "NeoPay / Mashreq", "supported": True, "currency": "AED"},
    "FR": {"country": "France", "clearing_partner": "Lyra Network / Eiffel Tower", "supported": True, "currency": "EUR"},
    "MU": {"country": "Mauritius", "clearing_partner": "Bank of Mauritius MauCAS", "supported": True, "currency": "MUR"},
    "NP": {"country": "Nepal", "clearing_partner": "Fonepay", "supported": True, "currency": "NPR"},
    "BT": {"country": "Bhutan", "clearing_partner": "Royal Monetary Authority", "supported": True, "currency": "INR"},
    "LK": {"country": "Sri Lanka", "clearing_partner": "LankaPay", "supported": True, "currency": "LKR"}
}

def evaluate_domestic_instrument(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates whether a domestic Indian card (RuPay, Visa, Mastercard) or UPI
    can execute an international transaction to target country and currency.
    """
    payment_method = str(payload.get("payment_method", "credit_card")).lower()
    card_number = str(payload.get("card_number", "")).replace(" ", "").replace("-", "")
    card_bin = card_number[:4] if len(card_number) >= 4 else str(payload.get("bin", "6521"))
    currency = str(payload.get("currency", "USD")).upper()
    merchant_country = str(payload.get("merchant_country", "US")).upper()
    amount_inr = float(payload.get("amount_inr", 0.0))
    is_educational = bool(payload.get("is_educational", False))
    annual_remittance_usd = float(payload.get("annual_remittance_usd", 12000.0))

    # Calculate INR equivalent if amount is passed in USD/EUR
    amount_usd = float(payload.get("amount_usd", 100.0))
    if amount_inr <= 0:
        amount_inr = amount_usd * 86.45

    compliance_flags = []
    alternative_recommendations = []
    eligible = False
    rejection_reason = None
    instrument_variant = "Generic Card"
    networks = []

    # 1. UPI Payment Rails Evaluation
    if payment_method.startswith("upi"):
        # UPI is domestic INR by default
        if merchant_country in UPI_INTERNATIONAL_CORRIDORS:
            corridor_info = UPI_INTERNATIONAL_CORRIDORS[merchant_country]
            eligible = True
            instrument_variant = f"UPI International (NIPL - {corridor_info['clearing_partner']})"
            compliance_flags.append({
                "code": "UPI_INTL_CORRIDOR_VERIFIED",
                "status": "APPROVED",
                "description": f"Merchant country {corridor_info['country']} has bilateral UPI cross-border clearing enabled."
            })
        else:
            eligible = False
            rejection_reason = (
                f"Standard UPI rails do not support direct settlement to foreign merchants in {merchant_country}. "
                "NPCI International bilateral clearing is not established in this jurisdiction."
            )
            alternative_recommendations.extend([
                {
                    "method": "credit_card",
                    "title": "International Credit / Debit Card (Visa, Mastercard, RuPay Global)",
                    "estimated_success_rate": 0.96
                },
                {
                    "method": "paypal",
                    "title": "PayPal Wallet (Links Indian debit/credit cards with automated 2FA)",
                    "estimated_success_rate": 0.95
                }
            ])

    # 2. RuPay Card Rails Evaluation
    elif payment_method in ["credit_card", "debit_card", "rupay_card"]:
        # Check BIN
        bin_match = RUPAY_BIN_DATABASE.get(card_bin)
        
        # If card number starts with standard Visa (4) or Mastercard (51-55)
        if card_number.startswith("4"):
            eligible = True
            instrument_variant = "Visa International"
            networks = ["Visa Worldwide"]
        elif card_number.startswith(("51", "52", "53", "54", "55")):
            eligible = True
            instrument_variant = "Mastercard International"
            networks = ["Mastercard Worldwide"]
        elif bin_match:
            instrument_variant = bin_match["variant"]
            networks = bin_match["co_branded_networks"]
            
            if bin_match["international_capable"]:
                # Card is technically capable, check country network acceptance
                eligible = True
                compliance_flags.append({
                    "code": "RUPAY_GLOBAL_ACCEPTED",
                    "status": "APPROVED",
                    "description": f"{bin_match['variant']} accepted internationally via {', '.join(networks)} partnership."
                })
                compliance_flags.append({
                    "code": "BANK_APP_ENABLEMENT_REQUIRED",
                    "status": "ADVISORY",
                    "description": "RBI mandates customer must enable 'International Online Usage' in their mobile banking app."
                })
            else:
                eligible = False
                rejection_reason = (
                    f"Selected card is a {bin_match['variant']}, which is domestic-only. "
                    "Cross-border transactions are prohibited by NPCI rules for this card tier."
                )
                alternative_recommendations.extend([
                    {
                        "method": "rupay_global",
                        "title": "Upgrade to RuPay Global Platinum / Select with Discover co-branding",
                        "estimated_success_rate": 0.94
                    },
                    {
                        "method": "credit_card",
                        "title": "Visa / Mastercard International Card",
                        "estimated_success_rate": 0.98
                    },
                    {
                        "method": "paypal",
                        "title": "PayPal Checkout",
                        "estimated_success_rate": 0.94
                    }
                ])
        else:
            # Fallback for generic card
            eligible = True
            instrument_variant = "Global Card Instrument"
            networks = ["International Network"]

    # 3. Regulatory Checks (RBI LRS, TCS, GST)
    # LRS Annual Cap: $250,000 USD per financial year
    if annual_remittance_usd + amount_usd > 250000.0:
        eligible = False
        rejection_reason = "Transaction exceeds RBI Liberalised Remittance Scheme (LRS) annual cap of $250,000 USD."

    # Tax Collected at Source (TCS) Rules (Section 206C of Income Tax Act):
    # - Threshold: ₹7,00,000 INR per financial year
    # - Non-education: 20% TCS on amount exceeding 7 Lakhs
    # - Education (self-funded): 5% TCS on amount exceeding 7 Lakhs
    # - Education (via loan): 0.5% TCS on amount exceeding 7 Lakhs
    tcs_applicable = False
    tcs_rate_percent = 0.0
    tcs_amount_inr = 0.0

    if amount_inr > 700000.0:
        tcs_applicable = True
        tcs_rate_percent = 5.0 if is_educational else 20.0
        taxable_slice = amount_inr - 700000.0
        tcs_amount_inr = round(taxable_slice * (tcs_rate_percent / 100.0), 2)
        compliance_flags.append({
            "code": "RBI_LRS_TCS_APPLICABLE",
            "status": "TAX_MANDATORY",
            "description": f"TCS under Sec 206C(1G) applied at {tcs_rate_percent}% on amount exceeding ₹7,00,000 INR (Est: ₹{tcs_amount_inr:,.2f})."
        })

    # Transparent Forex Markup & GST (18% on bank forex spread)
    bank_forex_markup_percent = 2.0  # Typical bank markup
    forex_markup_inr = round(amount_inr * (bank_forex_markup_percent / 100.0), 2)
    gst_on_forex_inr = round(forex_markup_inr * 0.18, 2)

    return {
        "eligible": eligible,
        "payment_method": payment_method,
        "instrument_variant": instrument_variant,
        "card_bin": card_bin,
        "co_branded_networks": networks,
        "rejection_reason": rejection_reason,
        "merchant_country": merchant_country,
        "currency": currency,
        "amount_usd": amount_usd,
        "amount_inr": round(amount_inr, 2),
        "compliance_flags": compliance_flags,
        "alternative_recommendations": alternative_recommendations,
        "fee_breakdown": {
            "base_amount_inr": round(amount_inr, 2),
            "estimated_forex_markup_inr": forex_markup_inr,
            "forex_markup_percent": bank_forex_markup_percent,
            "gst_on_forex_inr": gst_on_forex_inr,
            "tcs_applicable": tcs_applicable,
            "tcs_rate_percent": tcs_rate_percent,
            "tcs_amount_inr": tcs_amount_inr,
            "total_estimated_debit_inr": round(amount_inr + forex_markup_inr + gst_on_forex_inr + tcs_amount_inr, 2)
        }
    }

