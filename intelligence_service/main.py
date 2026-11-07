"""
FastAPI Intelligence Microservice for International Payment Orchestration
Serves:
1. Real-time Fraud Detection & Risk Scoring
2. Rule-based & Multi-factor Payment Routing Optimization
3. Decline Classification & Intelligent Payment Recovery Analysis
"""
import uvicorn
import os
import sys

# Ensure intelligence_service directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional

from fraud_engine import evaluate_fraud, SANCTIONED_COUNTRIES, HIGH_RISK_CORRIDORS
from routing_engine import optimize_route, PROVIDER_PROFILES
from recovery_engine import analyze_decline, DECLINE_TAXONOMY

app = FastAPI(
    title="International Payment Orchestration - Intelligence Service",
    description="Python & FastAPI microservice powering AI fraud scoring, rule-based intelligent payment routing, and recovery analytics.",
    version="1.0.0"
)

# CORS setup for local development and backend bridge
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# Request Models
# -----------------
class FraudAssessmentRequest(BaseModel):
    amount: float = Field(..., example=129.99)
    currency: str = Field(default="USD", example="USD")
    customer_country: str = Field(default="US", example="US")
    billing_country: Optional[str] = Field(default=None, example="US")
    ip_country: Optional[str] = Field(default=None, example="US")
    card_country: Optional[str] = Field(default=None, example="US")
    customer_email: Optional[str] = Field(default="customer@example.com")
    ip_address: Optional[str] = Field(default="127.0.0.1")
    payment_method: Optional[str] = Field(default="credit_card")
    cvc_provided: Optional[bool] = Field(default=True)
    is_vpn: Optional[bool] = Field(default=False)
    merchant_avg_amount: Optional[float] = Field(default=120.0)

class RoutingOptimizationRequest(BaseModel):
    amount: float = Field(..., example=150.00)
    currency: str = Field(..., example="EUR")
    payment_method: str = Field(default="credit_card", example="credit_card")
    customer_country: str = Field(default="DE", example="DE")
    merchant_id: Optional[str] = Field(default="demo-merchant")
    custom_rules: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    cost_weight: Optional[float] = Field(default=0.35)
    success_weight: Optional[float] = Field(default=0.35)
    latency_weight: Optional[float] = Field(default=0.15)
    uptime_weight: Optional[float] = Field(default=0.15)

class RecoveryAnalysisRequest(BaseModel):
    decline_code: str = Field(..., example="network_timeout")
    decline_message: Optional[str] = Field(default="Processor timeout")
    attempt_count: Optional[int] = Field(default=1)
    failed_provider: Optional[str] = Field(default="stripe")
    cascade_options: Optional[List[str]] = Field(default_factory=list)
    currency: Optional[str] = Field(default="USD")
    payment_method: Optional[str] = Field(default="credit_card")

# -----------------
# Endpoints
# -----------------
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "international-payment-intelligence",
        "version": "1.0.0",
        "features": ["fraud_detection", "intelligent_routing", "decline_recovery"]
    }

@app.post("/api/v1/fraud/assess")
def assess_fraud(req: FraudAssessmentRequest):
    try:
        result = evaluate_fraud(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud engine failure: {str(e)}")

@app.post("/api/v1/routing/optimize")
def optimize_routing(req: RoutingOptimizationRequest):
    try:
        result = optimize_route(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing engine failure: {str(e)}")

@app.post("/api/v1/recovery/analyze")
def analyze_failed_payment(req: RecoveryAnalysisRequest):
    try:
        result = analyze_decline(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recovery engine failure: {str(e)}")

@app.get("/api/v1/providers/profiles")
def get_providers():
    return {
        "providers": list(PROVIDER_PROFILES.values())
    }

@app.get("/api/v1/taxonomies")
def get_taxonomies():
    return {
        "declines": DECLINE_TAXONOMY,
        "sanctioned_countries": list(SANCTIONED_COUNTRIES),
        "high_risk_corridors": list(HIGH_RISK_CORRIDORS)
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
