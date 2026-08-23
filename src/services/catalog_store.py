"""
Catalog Store Service
Manages live product catalog data, document uploads, and audit records.
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

from src.models.schemas import ProductAttribute, ProductSpec, ValidationReport, SourceCitation, BoundingBox
from src.validation.rules import default_rules
from src.validation.z3_validator import ValidationEngine
from src.ingestion.vision_parser import DocumentParser
from src.agents.orchestrator import ExtractionOrchestrator

logger = logging.getLogger(__name__)

DATA_DIR = Path("data")
CATALOG_FILE = DATA_DIR / "catalog_products.json"
AUDIT_FILE = DATA_DIR / "audit_log.json"
RAW_DIR = DATA_DIR / "raw_catalogs"

class CatalogStore:
    def __init__(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        self.parser = DocumentParser()
        self.orchestrator = ExtractionOrchestrator()
        self.validator = ValidationEngine(default_rules())
        self._ensure_initial_data()

    def _ensure_initial_data(self):
        if not CATALOG_FILE.exists():
            self._seed_default_catalog()

    def _seed_default_catalog(self):
        products = []
        sample_pdf = RAW_DIR / "sample_hydraulic_fitting.pdf"
        
        # If sample PDF doesn't exist, generate it
        if not sample_pdf.exists():
            try:
                from scripts.generate_sample_pdf import generate
                generate(str(sample_pdf))
            except Exception as e:
                logger.warning(f"Could not generate sample PDF: {e}")

        # Parse real sample PDF if exists
        if sample_pdf.exists():
            try:
                blocks = self.parser.parse(str(sample_pdf))
                res = self.orchestrator.run(blocks, sku="DEMO-001", name="Hydraulic Hose Fitting DN12")
                prod = res.product
                prod.category = "Hydraulic Fittings"
                prod.description = "High-pressure industrial hydraulic hose end connection fitting."
                prod.status = "compliant"
                prod.verifier_notes = res.verifier_notes
                products.append(prod.model_dump())
            except Exception as e:
                logger.error(f"Error parsing sample PDF: {e}")

        # Add second reference valve product
        bad_product = ProductSpec(
            sku="DEMO-002",
            name="High-Pressure Control Valve (Under-Rated)",
            category="Valves & Actuators",
            description="Industrial fluid control valve with substandard burst threshold and overvoltage specification.",
            status="violation",
            attributes=[
                ProductAttribute(key="operating_pressure_bar", label="Operating Pressure", value=150, unit="bar", standard_scheme="ETIM", standard_code="EC011478"),
                ProductAttribute(key="burst_pressure_bar", label="Burst Pressure", value=200, unit="bar", standard_scheme="ETIM", standard_code="EC011478"),
                ProductAttribute(key="rated_voltage_v", label="Rated Voltage", value=12, unit="V", standard_scheme="eCl@ss", standard_code="27-02-01-01"),
                ProductAttribute(key="operating_voltage_v", label="Operating Voltage", value=24, unit="V", standard_scheme="eCl@ss", standard_code="27-02-01-01"),
            ],
            verifier_notes=[
                "Burst pressure (200 bar) provides only 1.33x margin over 150 bar (minimum required is 4.0x).",
                "Operating voltage (24V) exceeds rated limit (12V)."
            ]
        )
        products.append(bad_product.model_dump())

        # Save to catalog file
        with open(CATALOG_FILE, "w", encoding="utf-8") as f:
            json.dump(products, f, indent=2)

        # Initial audit log
        self.add_audit_log(
            action="System Initialization",
            sku="SYSTEM",
            status="Success",
            details="Catalog store initialized with verified industrial specifications."
        )

    def list_products(self) -> List[Dict[str, Any]]:
        if not CATALOG_FILE.exists():
            self._seed_default_catalog()
        try:
            with open(CATALOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def get_product(self, sku: str) -> Optional[Dict[str, Any]]:
        products = self.list_products()
        for p in products:
            if p.get("sku", "").upper() == sku.upper():
                return p
        return None

    def save_product(self, product_dict: Dict[str, Any]) -> Dict[str, Any]:
        products = self.list_products()
        sku = product_dict.get("sku", "").upper()
        
        # Check if already exists, update or append
        existing_idx = next((i for i, p in enumerate(products) if p.get("sku", "").upper() == sku), None)
        
        # Run real Z3 validation
        try:
            spec = ProductSpec(**product_dict)
            val_report = self.validator.validate(spec)
            product_dict["status"] = "compliant" if val_report.passed else "violation"
            product_dict["validation"] = val_report.model_dump()
        except Exception as e:
            logger.warning(f"Validation error on save: {e}")

        if existing_idx is not None:
            products[existing_idx] = product_dict
        else:
            products.append(product_dict)

        with open(CATALOG_FILE, "w", encoding="utf-8") as f:
            json.dump(products, f, indent=2)

        self.add_audit_log(
            action="Product Saved",
            sku=sku,
            status=product_dict.get("status", "saved"),
            details=f"Product {product_dict.get('name', sku)} saved to live catalog."
        )
        return product_dict

    def delete_product(self, sku: str) -> bool:
        products = self.list_products()
        filtered = [p for p in products if p.get("sku", "").upper() != sku.upper()]
        if len(filtered) != len(products):
            with open(CATALOG_FILE, "w", encoding="utf-8") as f:
                json.dump(filtered, f, indent=2)
            self.add_audit_log(
                action="Product Deleted",
                sku=sku,
                status="Deleted",
                details=f"Product {sku} removed from catalog."
            )
            return True
        return False

    def ingest_pdf_file(self, file_path: str, original_filename: str) -> Dict[str, Any]:
        path = Path(file_path)
        blocks = self.parser.parse(str(path))
        stem = Path(original_filename).stem
        sku = stem.upper().replace(" ", "-")
        name = stem.replace("_", " ").replace("-", " ").title()

        result = self.orchestrator.run(blocks, sku=sku, name=name)
        prod = result.product
        prod_dict = prod.model_dump()
        prod_dict["category"] = "Ingested Products"
        prod_dict["description"] = f"Extracted from {original_filename} with {len(prod.attributes)} verified specifications."
        prod_dict["status"] = "compliant" if result.validation.passed else "violation"
        prod_dict["verifier_notes"] = result.verifier_notes
        prod_dict["source_filename"] = original_filename

        # Save to catalog
        self.save_product(prod_dict)

        # Save copy to raw_catalogs if not exists
        dest_pdf = RAW_DIR / f"{stem}.pdf"
        try:
            if not dest_pdf.exists() and path != dest_pdf:
                import shutil
                shutil.copy(path, dest_pdf)
        except Exception:
            pass

        self.add_audit_log(
            action="PDF Scanned",
            sku=sku,
            status="Compliant" if result.validation.passed else "Violation",
            details=f"Extracted {len(prod.attributes)} attributes from {original_filename}."
        )
        return {
            "product": prod_dict,
            "validation": result.validation.model_dump(),
            "verifier_notes": result.verifier_notes
        }

    def get_stats(self) -> Dict[str, Any]:
        products = self.list_products()
        total_products = len(products)
        total_attributes = sum(len(p.get("attributes", [])) for p in products)
        compliant_count = sum(1 for p in products if p.get("status") == "compliant")
        violation_count = sum(1 for p in products if p.get("status") == "violation")
        
        pass_rate = round((compliant_count / total_products * 100)) if total_products > 0 else 100
        
        return {
            "total_products": total_products,
            "total_attributes": total_attributes,
            "compliant_count": compliant_count,
            "violation_count": violation_count,
            "safety_pass_rate": pass_rate,
            "rules_count": len(default_rules()),
            "last_updated": datetime.now().isoformat()
        }

    def add_audit_log(self, action: str, sku: str, status: str, details: str):
        logs = self.get_audit_logs()
        new_entry = {
            "id": f"aud_{int(datetime.now().timestamp() * 1000)}",
            "time": datetime.now().strftime("%b %d, %I:%M %p"),
            "action": action,
            "sku": sku,
            "status": status,
            "details": details
        }
        logs.insert(0, new_entry)
        logs = logs[:50] # keep last 50
        with open(AUDIT_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)

    def get_audit_logs(self) -> List[Dict[str, Any]]:
        if not AUDIT_FILE.exists():
            return []
        try:
            with open(AUDIT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def render_catalog_page_image(self, document_id: str = "sample_hydraulic_fitting", page_number: int = 1) -> Optional[bytes]:
        pdf_path = RAW_DIR / f"{document_id}.pdf"
        if not pdf_path.exists():
            # Try finding any pdf in raw catalogs
            pdfs = list(RAW_DIR.glob("*.pdf"))
            if pdfs:
                pdf_path = pdfs[0]
            else:
                return None
        try:
            return self.parser.render_page_image(str(pdf_path), page_number=page_number, dpi=150)
        except Exception as e:
            logger.error(f"Error rendering PDF page: {e}")
            return None


# Global singleton instance
catalog_store = CatalogStore()
