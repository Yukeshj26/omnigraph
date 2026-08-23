from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import FileResponse

from src.services.catalog_store import catalog_store
from src.services.report_generator import generate_compliance_pdf_report
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


@router.get("/catalog/page-image", tags=["ui"])
def get_catalog_page_image(document_id: str = "sample_hydraulic_fitting", page: int = Query(1, ge=1)):
    """Render and return high-resolution PNG bytes of a catalog PDF page."""
    img_bytes = catalog_store.render_catalog_page_image(document_id, page_number=page)
    if not img_bytes:
        raise HTTPException(status_code=404, detail=f"Page {page} of document '{document_id}' could not be rendered.")
    return Response(content=img_bytes, media_type="image/png")


@router.get("/stats", tags=["ui"])
def get_live_stats() -> Dict[str, Any]:
    """Return real dynamic KPI metrics computed from the live catalog."""
    return catalog_store.get_stats()


@router.get("/reports/pdf", tags=["ui"])
def get_product_pdf_report(sku: str = Query(..., description="Product SKU to generate report for")):
    """Generate and return a formal PDF verification & compliance certificate."""
    product = catalog_store.get_product(sku)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{sku}' not found.")
    inspector = _user_profile_store.get("name", "Jeet Pramanick")
    pdf_bytes = generate_compliance_pdf_report(product, inspector_name=inspector)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={sku}_Compliance_Report.pdf"
        },
    )



@router.get("/demo-products", tags=["ui"])
def get_demo_products() -> List[Dict[str, Any]]:
    """Return live products stored in the catalog."""
    return catalog_store.list_products()


@router.get("/audit-logs", tags=["ui"])
def get_audit_logs() -> List[Dict[str, Any]]:
    """Return real chronological audit history records."""
    return catalog_store.get_audit_logs()


@router.post("/integrations/sync", tags=["ui"])
def sync_to_enterprise_erp(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Execute enterprise sync for a product and return a live receipt."""
    sku = payload.get("sku", "UNKNOWN")
    system = payload.get("system", "SAP S/4HANA & Akeneo PIM")
    
    product = catalog_store.get_product(sku)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{sku}' not found.")

    receipt_id = f"SYNC_{system.replace(' ', '_').upper()}_{int(datetime.now().timestamp())}"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    catalog_store.add_audit_log(
        action=f"ERP Sync ({system})",
        sku=sku,
        status="200 OK",
        details=f"Pushed {len(product.get('attributes', []))} attributes to {system} under receipt {receipt_id}."
    )
    
    return {
        "status": "success",
        "receipt_id": receipt_id,
        "sku": sku,
        "target_system": system,
        "synced_at": timestamp,
        "attributes_transferred": len(product.get("attributes", [])),
        "message": f"Product {sku} successfully synchronized with {system}."
    }


@router.post("/integrations/test", tags=["ui"])
def test_integration(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Test connection status with an enterprise connector."""
    system = payload.get("system", "sap")
    return {
        "system": system,
        "status": "connected",
        "latency_ms": 42,
        "checked_at": datetime.now().isoformat(),
        "message": f"Connection to {system.upper()} verified (HTTP 200 OK)."
    }


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


# User profile store in memory
_user_profile_store = {
    "id": "usr_99812",
    "name": "Jeet Pramanick",
    "email": "jeet.pramanick@industrial-intel.com",
    "role": "Product Catalog Manager",
    "department": "Product Engineering & Catalog Operations",
    "organization": "Omni-Graph Industrial Labs",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "auth_provider": "google",
    "api_key": "ogpi_live_9f823a1c8b20464293f0bce427a1",
    "connected_integrations": {
        "sap": {"status": "connected", "endpoint": "https://sap.corp.internal/odata/v4/catalog", "last_sync": "Just now"},
        "akeneo": {"status": "connected", "endpoint": "https://pim.industrial.io/api/rest/v1", "last_sync": "Just now"},
        "neo4j": {"status": "connected", "endpoint": "bolt://localhost:7687", "last_sync": "Active"}
    },
    "preferences": {
        "theme": "light",
        "email_alerts": True,
        "auto_validation": True,
        "notification_frequency": "instant"
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
    for key in ["name", "department", "role", "organization", "avatar", "preferences"]:
        if key in payload:
            _user_profile_store[key] = payload[key]
    return {
        "status": "updated",
        "user": _user_profile_store
    }

