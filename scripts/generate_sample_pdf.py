"""
Generates a small demo catalog PDF at data/raw_catalogs/sample_hydraulic_fitting.pdf
so `python src/ingestion/run_ingest.py --input ./data/raw_catalogs/` (the exact
command in the README) has something real to ingest out of the box.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pymupdf  # noqa: E402

OUTPUT_PATH = Path(__file__).resolve().parents[1] / "data" / "raw_catalogs" / "sample_hydraulic_fitting.pdf"

LINES = [
    "Omni-Graph Product Intelligence -- Demo Catalog Sheet",
    "",
    "Product: Hydraulic Hose Fitting DN12",
    "SKU: DEMO-001",
    "Category: Hydraulic Fittings",
    "",
    "Specifications:",
    "Operating Pressure: 150 bar",
    "Burst Pressure: 700 bar",
    "Min Temperature: -20 C",
    "Max Temperature: 100 C",
    "Ambient Temperature: 60 C",
    "Shaft Diameter: 12.0 mm",
    "Bore Diameter: 12.2 mm",
    "Rated Load: 5000 N",
    "Applied Load: 3200 N",
    "",
    "Source: internal demo fixture generated for the OGPI scaffold.",
]


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open()
    page = doc.new_page()
    y = 72
    for line in LINES:
        page.insert_text((72, y), line, fontsize=11)
        y += 20
    doc.save(str(OUTPUT_PATH))
    doc.close()
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
