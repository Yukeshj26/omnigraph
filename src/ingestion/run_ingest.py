"""
CLI entry point matching the README's documented command:
    python src/ingestion/run_ingest.py --input ./data/raw_catalogs/
"""
import argparse
import sys
from pathlib import Path

# Allow `python src/ingestion/run_ingest.py` to be run directly from the
# project root, exactly as documented in the README, without needing
# `python -m` or an installed package.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.agents.orchestrator import ExtractionOrchestrator  # noqa: E402
from src.ingestion.vision_parser import DocumentParser  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest raw catalog PDFs into OGPI.")
    parser.add_argument("--input", required=True, help="Directory of PDF files to ingest.")
    args = parser.parse_args()

    input_dir = Path(args.input)
    pdfs = sorted(input_dir.glob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found in {input_dir}.")
        print("Run `python scripts/generate_sample_pdf.py` to create a demo file.")
        return

    doc_parser = DocumentParser()
    orchestrator = ExtractionOrchestrator()

    for pdf_path in pdfs:
        print(f"\n=== Ingesting {pdf_path.name} ===")
        blocks = doc_parser.parse(str(pdf_path))
        sku = pdf_path.stem.upper()
        result = orchestrator.run(blocks, sku=sku, name=pdf_path.stem.replace("_", " ").title())

        print(result.product.model_dump_json(indent=2))
        print(f"Validation passed: {result.validation.passed}")
        for issue in result.validation.issues:
            print(f"  ! [{issue.severity}] {issue.rule_name}: {issue.message}")
        for note in result.verifier_notes:
            print(f"  ? verifier: {note}")

        try:
            from src.config import get_settings
            from src.graph.neo4j_client import Neo4jClient

            settings = get_settings()
            client = Neo4jClient(
                settings.neo4j_uri, settings.neo4j_user, settings.neo4j_password, connection_timeout=3.0
            )
            client.verify_connectivity()
            client.upsert_product(result.product)
            client.close()
            print("  -> synced to Neo4j")
        except Exception as exc:
            print(f"  -> Neo4j unavailable, skipped graph sync ({exc.__class__.__name__})")


if __name__ == "__main__":
    main()
