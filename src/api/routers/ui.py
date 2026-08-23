from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from src.models.schemas import ProductAttribute, ProductSpec
from src.validation.rules import default_rules

router = APIRouter()

SAMPLE_PDF_PATH = Path("data/raw_catalogs/sample_hydraulic_fitting.pdf")


@router.get("/sample-catalogs", tags=["ui"])
def list_sample_catalogs() -> List[Dict[str, Any]]:
    catalogs = []
    if SAMPLE_PDF_PATH.exists():
        catalogs.append(
            {
                "id": "sample_hydraulic_fitting",
                "filename": "sample_hydraulic_fitting.pdf",
                "name": "Hydraulic Hose Fitting DN12",
                "category": "Hydraulic Fittings",
                "size_bytes": SAMPLE_PDF_PATH.stat().st_size,
                "description": "Standard industrial catalog sheet containing pressure, temperature, and dimensional specifications.",
            }
        )
    return catalogs


@router.get("/sample-catalogs/download", tags=["ui"])
def download_sample_catalog():
    if not SAMPLE_PDF_PATH.exists():
        raise HTTPException(status_code=404, detail="Sample PDF has not been generated yet.")
    return FileResponse(
        path=str(SAMPLE_PDF_PATH),
        media_type="application/pdf",
        filename="sample_hydraulic_fitting.pdf",
    )


@router.get("/rules-meta", tags=["ui"])
def get_rules_metadata() -> List[Dict[str, Any]]:
    return [
        {
            "name": "pressure_safety_margin",
            "title": "Pressure Safety Margin",
            "description": "Proves that Burst Pressure is at least 4.0x the Operating Pressure for hydraulic safety standards.",
            "formula": "Burst Pressure >= 4.0 * Operating Pressure",
            "category": "Hydraulics & Pressure",
            "severity": "critical",
            "required_keys": ["operating_pressure_bar", "burst_pressure_bar"],
            "unit": "bar",
            "default_params": {
                "operating_pressure_bar": 150,
                "burst_pressure_bar": 700,
                "safety_factor": 4.0,
            },
        },
        {
            "name": "voltage_rating",
            "title": "Voltage Rating Safety",
            "description": "Ensures operating voltage does not exceed the manufacturer rated voltage limit.",
            "formula": "Operating Voltage <= Rated Voltage",
            "category": "Electrical",
            "severity": "critical",
            "required_keys": ["rated_voltage_v", "operating_voltage_v"],
            "unit": "V",
            "default_params": {
                "rated_voltage_v": 24,
                "operating_voltage_v": 24,
            },
        },
        {
            "name": "temperature_range",
            "title": "Operating Temperature Envelope",
            "description": "Verifies that operating temperature falls strictly within the allowable min/max boundary.",
            "formula": "Min Temp <= Operating Temp <= Max Temp",
            "category": "Thermal",
            "severity": "error",
            "required_keys": ["min_operating_temp_c", "max_operating_temp_c", "operating_temp_c"],
            "unit": "°C",
            "default_params": {
                "min_operating_temp_c": -20,
                "max_operating_temp_c": 100,
                "operating_temp_c": 60,
            },
        },
        {
            "name": "dimensional_fit",
            "title": "Worst-Case Tolerance Fit",
            "description": "Uses interval arithmetic to verify that maximum shaft diameter never exceeds minimum bore diameter under full tolerance stack-up.",
            "formula": "(Shaft + Tol_shaft) <= (Bore - Tol_bore)",
            "category": "Mechanical & Tolerances",
            "severity": "error",
            "required_keys": ["shaft_diameter_mm", "bore_diameter_mm"],
            "unit": "mm",
            "default_params": {
                "shaft_diameter_mm": 12.0,
                "shaft_tolerance_mm": 0.05,
                "bore_diameter_mm": 12.2,
                "bore_tolerance_mm": 0.05,
            },
        },
        {
            "name": "load_capacity",
            "title": "Mechanical Load Capacity",
            "description": "Validates that applied mechanical working load does not exceed rated load capacity.",
            "formula": "Applied Load <= Rated Load",
            "category": "Structural",
            "severity": "warning",
            "required_keys": ["rated_load_n", "applied_load_n"],
            "unit": "N",
            "default_params": {
                "rated_load_n": 5000,
                "applied_load_n": 3200,
            },
        },
    ]


@router.get("/demo-products", tags=["ui"])
def get_demo_products() -> List[Dict[str, Any]]:
    return [
        {
            "sku": "DEMO-001",
            "name": "Hydraulic Hose Fitting DN12",
            "category": "Hydraulic Fittings",
            "description": "High-pressure industrial hydraulic hose end connection fitting for heavy machinery and fluids.",
            "status": "compliant",
            "attributes": [
                {
                    "key": "operating_pressure_bar",
                    "label": "Operating Pressure",
                    "value": 150.0,
                    "unit": "bar",
                    "confidence": 0.98,
                    "standard_scheme": "ETIM",
                    "standard_code": "EC011478",
                    "citation": {
                        "document_id": "sample_hydraulic_fitting",
                        "page_number": 1,
                        "bounding_box": {"x0": 72.0, "y0": 200.2, "x1": 210.8, "y1": 215.3},
                        "text_snippet": "Operating Pressure: 150 bar",
                    },
                },
                {
                    "key": "burst_pressure_bar",
                    "label": "Burst Pressure",
                    "value": 700.0,
                    "unit": "bar",
                    "confidence": 0.96,
                    "standard_scheme": "ETIM",
                    "standard_code": "EC011478",
                    "citation": {
                        "document_id": "sample_hydraulic_fitting",
                        "page_number": 1,
                        "bounding_box": {"x0": 72.0, "y0": 220.2, "x1": 188.2, "y1": 235.3},
                        "text_snippet": "Burst Pressure: 700 bar",
                    },
                },
                {
                    "key": "min_operating_temp_c",
                    "label": "Min Temperature",
                    "value": -20.0,
                    "unit": "°C",
                    "confidence": 0.95,
                    "standard_scheme": "eCl@ss",
                    "standard_code": "27-02-01-01",
                    "citation": {
                        "document_id": "sample_hydraulic_fitting",
                        "page_number": 1,
                        "bounding_box": {"x0": 72.0, "y0": 240.2, "x1": 188.8, "y1": 255.3},
                        "text_snippet": "Min Temperature: -20 C",
                    },
                },
                {
                    "key": "max_operating_temp_c",
                    "label": "Max Temperature",
                    "value": 100.0,
                    "unit": "°C",
                    "confidence": 0.95,
                    "standard_scheme": "eCl@ss",
                    "standard_code": "27-02-01-01",
                    "citation": {
                        "document_id": "sample_hydraulic_fitting",
                        "page_number": 1,
                        "bounding_box": {"x0": 72.0, "y0": 260.2, "x1": 194.3, "y1": 275.3},
                        "text_snippet": "Max Temperature: 100 C",
                    },
                },
                {
                    "key": "operating_temp_c",
                    "label": "Ambient Temperature",
                    "value": 60.0,
                    "unit": "°C",
                    "confidence": 0.92,
                    "standard_scheme": "UNSPSC",
                    "standard_code": "40141700",
                    "citation": {
                        "document_id": "sample_hydraulic_fitting",
                        "page_number": 1,
                        "bounding_box": {"x0": 72.0, "y0": 280.2, "x1": 207.7, "y1": 295.3},
                        "text_snippet": "Ambient Temperature: 60 C",
                    },
                },
                {
                    "key": "shaft_diameter_mm",
                    "label": "Shaft Diameter",
                    "value": 12.0,
                    "unit": "mm",
                    "tolerance": 0.05,
                    "confidence": 0.97,
                    "standard_scheme": "ETIM",
                    "standard_code": "EC002598",
                    "citation": {
                        "document_id": "sample_hydraulic_fitting",
                        "page_number": 1,
                        "bounding_box": {"x0": 72.0, "y0": 300.2, "x1": 194.3, "y1": 315.3},
                        "text_snippet": "Shaft Diameter: 12.0 mm",
                    },
                },
                {
                    "key": "bore_diameter_mm",
                    "label": "Bore Diameter",
                    "value": 12.2,
                    "unit": "mm",
                    "tolerance": 0.05,
                    "confidence": 0.97,
                    "standard_scheme": "ETIM",
                    "standard_code": "EC002598",
                    "citation": {
                        "document_id": "sample_hydraulic_fitting",
                        "page_number": 1,
                        "bounding_box": {"x0": 72.0, "y0": 320.2, "x1": 191.8, "y1": 335.3},
                        "text_snippet": "Bore Diameter: 12.2 mm",
                    },
                },
                {
                    "key": "rated_load_n",
                    "label": "Rated Load",
                    "value": 5000.0,
                    "unit": "N",
                    "confidence": 0.94,
                    "standard_scheme": "UNSPSC",
                    "standard_code": "40141700",
                    "citation": {
                        "document_id": "sample_hydraulic_fitting",
                        "page_number": 1,
                        "bounding_box": {"x0": 72.0, "y0": 340.2, "x1": 170.4, "y1": 355.3},
                        "text_snippet": "Rated Load: 5000 N",
                    },
                },
                {
                    "key": "applied_load_n",
                    "label": "Applied Load",
                    "value": 3200.0,
                    "unit": "N",
                    "confidence": 0.94,
                    "standard_scheme": "UNSPSC",
                    "standard_code": "40141700",
                    "citation": {
                        "document_id": "sample_hydraulic_fitting",
                        "page_number": 1,
                        "bounding_box": {"x0": 72.0, "y0": 360.2, "x1": 177.8, "y1": 375.3},
                        "text_snippet": "Applied Load: 3200 N",
                    },
                },
            ],
            "verifier_notes": [
                "Citations verified against page 1 text bounding boxes.",
                "Taxonomy mappings resolved to ETIM 9.0 and UNSPSC.",
                "Neuro-symbolic Z3 verification passed all 4 physical constraints.",
            ],
        },
        {
            "sku": "DEMO-002",
            "name": "Underrated High-Pressure Valve (Non-Compliant)",
            "category": "Valves & Actuators",
            "description": "Synthetic failing test case demonstrating mathematical constraint violation detection.",
            "status": "violation",
            "attributes": [
                {
                    "key": "operating_pressure_bar",
                    "label": "Operating Pressure",
                    "value": 150.0,
                    "unit": "bar",
                    "confidence": 0.99,
                    "standard_scheme": "ETIM",
                    "standard_code": "EC011478",
                },
                {
                    "key": "burst_pressure_bar",
                    "label": "Burst Pressure",
                    "value": 200.0,
                    "unit": "bar",
                    "confidence": 0.99,
                    "standard_scheme": "ETIM",
                    "standard_code": "EC011478",
                },
                {
                    "key": "rated_voltage_v",
                    "label": "Rated Voltage",
                    "value": 12.0,
                    "unit": "V",
                    "confidence": 0.95,
                    "standard_scheme": "eCl@ss",
                    "standard_code": "27-02-01-01",
                },
                {
                    "key": "operating_voltage_v",
                    "label": "Operating Voltage",
                    "value": 24.0,
                    "unit": "V",
                    "confidence": 0.95,
                    "standard_scheme": "eCl@ss",
                    "standard_code": "27-02-01-01",
                },
            ],
            "verifier_notes": [
                "Burst pressure (200 bar) provides only 1.33x margin over 150 bar (minimum required is 4.0x).",
                "Operating voltage (24V) exceeds rated limit (12V).",
            ],
        },
    ]


# In-memory user profile store for session demo
_user_profile_store = {
    "id": "usr_99812",
    "name": "Jeet Pramanick",
    "email": "jeet.pramanick@industrial-intel.com",
    "role": "Principal Catalog Engineer",
    "department": "Industrial Automation & Fluid Systems",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "auth_provider": "google",
    "api_key": "ogpi_live_9f823a1c8b20464293f0bce427a1",
    "connected_integrations": {
        "sap": {"status": "connected", "endpoint": "https://sap.corp.internal/odata/v4/catalog", "last_sync": "10 mins ago"},
        "akeneo": {"status": "connected", "endpoint": "https://pim.industrial.io/api/rest/v1", "last_sync": "1 hour ago"},
        "neo4j": {"status": "connected", "endpoint": "bolt://localhost:7687", "last_sync": "Active"}
    },
    "preferences": {
        "theme": "light",
        "email_alerts": True,
        "auto_z3_verification": True,
        "tolerance_strictness": "standard"
    }
}


@router.post("/auth/login", tags=["auth"])
def email_login(payload: Dict[str, Any]) -> Dict[str, Any]:
    email = payload.get("email", "engineer@industrial-intel.com")
    name = payload.get("name") or email.split("@")[0].replace(".", " ").title()
    _user_profile_store["email"] = email
    _user_profile_store["name"] = name
    _user_profile_store["auth_provider"] = "email"
    return {
        "status": "success",
        "token": "bearer_jwt_token_sample_abc123",
        "user": _user_profile_store
    }


@router.post("/auth/google", tags=["auth"])
def google_login(payload: Dict[str, Any]) -> Dict[str, Any]:
    email = payload.get("email", "jeet.pramanick@industrial-intel.com")
    name = payload.get("name", "Jeet Pramanick")
    avatar = payload.get("avatar", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
    _user_profile_store["email"] = email
    _user_profile_store["name"] = name
    _user_profile_store["avatar"] = avatar
    _user_profile_store["auth_provider"] = "google"
    return {
        "status": "success",
        "token": "bearer_google_oauth_token_xyz789",
        "user": _user_profile_store
    }


@router.get("/user/profile", tags=["user"])
def get_user_profile() -> Dict[str, Any]:
    return _user_profile_store


@router.put("/user/profile", tags=["user"])
def update_user_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    for key in ["name", "department", "role", "preferences"]:
        if key in payload:
            _user_profile_store[key] = payload[key]
    return {
        "status": "updated",
        "user": _user_profile_store
    }

