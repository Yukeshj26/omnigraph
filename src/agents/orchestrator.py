"""
Ties the Extractor and Verifier agents together with the Z3 validation
engine into a single pipeline call -- the practical entry point used by
run_ingest.py, the API's /ingest/upload endpoint, and the demo script.
"""
from typing import List, Optional

from src.agents.extractor_agent import SpecificationExtractorAgent
from src.agents.llm_client import LLMClient
from src.agents.verifier_agent import VerifierAgent
from src.ingestion.vision_parser import ParsedBlock
from src.models.schemas import ExtractionResult
from src.validation.rules import EngineeringRule, default_rules
from src.validation.z3_validator import ValidationEngine


class ExtractionOrchestrator:
    def __init__(
        self,
        llm: Optional[LLMClient] = None,
        rules: Optional[List[EngineeringRule]] = None,
    ):
        self.llm = llm or LLMClient()
        self.extractor = SpecificationExtractorAgent(self.llm)
        self.verifier = VerifierAgent(self.llm)
        self.validator = ValidationEngine(rules or default_rules())

    def run(
        self,
        blocks: List[ParsedBlock],
        sku: str,
        name: str,
        category: Optional[str] = None,
    ) -> ExtractionResult:
        product = self.extractor.extract(blocks, sku, name, category)
        verifier_notes = self.verifier.verify(product)
        report = self.validator.validate(product)
        return ExtractionResult(product=product, verifier_notes=verifier_notes, validation=report)
