"""
End-to-end offline demo. Runs entirely without any API keys or databases:
  1. Parses the generated sample PDF through the full extract/verify/validate
     pipeline (expected to pass all applicable rules).
  2. Builds a second, deliberately non-compliant product directly (not from
     a PDF) to show the Z3 validator actually catching real engineering
     issues, not just rubber-stamping everything.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.agents.orchestrator import ExtractionOrchestrator  # noqa: E402
from src.ingestion.vision_parser import DocumentParser  # noqa: E402
from src.models.schemas import ProductAttribute, ProductSpec  # noqa: E402
from src.validation.rules import default_rules  # noqa: E402
from src.validation.z3_validator import ValidationEngine  # noqa: E402

SAMPLE_PDF = Path(__file__).resolve().parents[1] / "data" / "raw_catalogs" / "sample_hydraulic_fitting.pdf"


def run_passing_example() -> None:
    print("=" * 70)
    print("Example 1: extracted from PDF, expected to PASS validation")
    print("=" * 70)
    if not SAMPLE_PDF.exists():
        print(f"Sample PDF not found at {SAMPLE_PDF}. Run generate_sample_pdf.py first.")
        return

    blocks = DocumentParser().parse(str(SAMPLE_PDF))
    result = ExtractionOrchestrator().run(blocks, sku="DEMO-001", name="Hydraulic Hose Fitting DN12")

    print(result.product.model_dump_json(indent=2))
    print(f"\nValidation passed: {result.validation.passed}")
    for issue in result.validation.issues:
        print(f"  ! [{issue.severity}] {issue.rule_name}: {issue.message}")
    for note in result.verifier_notes:
        print(f"  ? verifier: {note}")


def run_failing_example() -> None:
    print("\n" + "=" * 70)
    print("Example 2: hand-built product, deliberately non-compliant")
    print("=" * 70)
    bad_product = ProductSpec(
        sku="DEMO-002",
        name="Underrated Pressure Valve (synthetic failing example)",
        category="Valves",
        attributes=[
            ProductAttribute(key="operating_pressure_bar", label="Operating Pressure", value=150, unit="bar"),
            ProductAttribute(key="burst_pressure_bar", label="Burst Pressure", value=200, unit="bar"),
            ProductAttribute(key="rated_voltage_v", label="Rated Voltage", value=12, unit="V"),
            ProductAttribute(key="operating_voltage_v", label="Operating Voltage", value=24, unit="V"),
        ],
    )
    report = ValidationEngine(default_rules()).validate(bad_product)
    print(report.model_dump_json(indent=2))


if __name__ == "__main__":
    run_passing_example()
    run_failing_example()
