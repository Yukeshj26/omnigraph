"""
The "Specification Extractor" side of the README's critic-verifier loop.

SpecificationExtractorAgent prefers a live LLM (structured JSON generation
against the ProductSpec schema) and transparently falls back to
HeuristicExtractor -- a fully offline, regex-based label matcher -- when no
LLM provider is configured. The heuristic path is intentionally simple: it's
a floor, not a replacement for the real vision-LLM + GraphRAG pipeline the
README describes, but it means run_ingest.py and the demo script produce
real, non-fake output with zero setup.
"""
import re
from typing import Dict, List, Optional, Tuple

from src.agents.llm_client import LLMClient
from src.ingestion.vision_parser import ParsedBlock
from src.models.schemas import ProductAttribute, ProductSpec, SourceCitation

# label text -> (attribute key, canonical unit)
LABEL_MAP: Dict[str, Tuple[str, str]] = {
    "Operating Pressure": ("operating_pressure_bar", "bar"),
    "Burst Pressure": ("burst_pressure_bar", "bar"),
    "Min Temperature": ("min_operating_temp_c", "C"),
    "Max Temperature": ("max_operating_temp_c", "C"),
    "Ambient Temperature": ("operating_temp_c", "C"),
    "Shaft Diameter": ("shaft_diameter_mm", "mm"),
    "Bore Diameter": ("bore_diameter_mm", "mm"),
    "Rated Voltage": ("rated_voltage_v", "V"),
    "Operating Voltage": ("operating_voltage_v", "V"),
    "Rated Load": ("rated_load_n", "N"),
    "Applied Load": ("applied_load_n", "N"),
}

NUMBER_PATTERN = r"(-?\d+(?:\.\d+)?)"


class HeuristicExtractor:
    """Fully offline fallback: regex-matches known labels against each
    parsed block's text. Used automatically whenever no LLM provider is
    configured (see LLMClient.is_live)."""

    def extract(
        self,
        blocks: List[ParsedBlock],
        sku: str,
        name: str,
        category: Optional[str] = None,
    ) -> ProductSpec:
        attributes: List[ProductAttribute] = []
        for label, (key, unit) in LABEL_MAP.items():
            pattern = re.compile(rf"{re.escape(label)}\s*:?\s*{NUMBER_PATTERN}", re.IGNORECASE)
            for block in blocks:
                match = pattern.search(block.text)
                if not match:
                    continue
                value = float(match.group(1))
                attributes.append(
                    ProductAttribute(
                        key=key,
                        label=label,
                        value=value,
                        unit=unit,
                        confidence=0.6,
                        citation=SourceCitation(
                            document_id=block.document_id,
                            page_number=block.page_number,
                            bounding_box=block.bounding_box,
                            text_snippet=block.text.strip()[:200],
                        ),
                    )
                )
                break  # first match wins; avoids duplicate attributes
        return ProductSpec(
            sku=sku,
            name=name,
            category=category,
            attributes=attributes,
            source_document_ids=sorted({b.document_id for b in blocks}),
        )


class SpecificationExtractorAgent:
    def __init__(self, llm: LLMClient):
        self.llm = llm
        self.fallback = HeuristicExtractor()

    def extract(
        self,
        blocks: List[ParsedBlock],
        sku: str,
        name: str,
        category: Optional[str] = None,
    ) -> ProductSpec:
        if self.llm.is_live:
            context = "\n\n".join(f"[page {b.page_number}] {b.text}" for b in blocks)
            result = self.llm.structured_complete(
                system_prompt=(
                    "You are the Specification Extractor agent in an industrial "
                    "product data pipeline. Extract structured attributes strictly "
                    "from the provided source text -- never invent values that "
                    "aren't present."
                ),
                user_prompt=(
                    f"SKU: {sku}\nName: {name}\nCategory: {category or 'unknown'}\n\n"
                    f"Source text:\n{context}"
                ),
                response_model=ProductSpec,
            )
            if result is not None:
                return result
        return self.fallback.extract(blocks, sku, name, category)
