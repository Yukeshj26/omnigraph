"""
The adversarial "Verifier Agent" side of the critic-verifier loop: independently
cross-examines the Extractor's citations instead of trusting them outright.

HeuristicVerifier is the offline fallback -- a simple "does the value actually
appear in its own cited snippet" check. It won't catch subtle misreadings the
way a real LLM cross-exam would, but it catches the most common failure mode
(an attribute cited against the wrong line) with zero dependencies.
"""
from typing import List

from src.agents.llm_client import LLMClient
from src.models.schemas import ProductSpec


class HeuristicVerifier:
    def verify(self, product: ProductSpec) -> List[str]:
        notes: List[str] = []
        for attr in product.attributes:
            if attr.citation and attr.citation.text_snippet:
                snippet = attr.citation.text_snippet
                if not self._value_appears_in(attr.value, snippet):
                    notes.append(
                        f"{attr.key}: value '{attr.value}' not found verbatim in its "
                        f"cited snippet -- flagged for human review."
                    )
        return notes

    @staticmethod
    def _value_appears_in(value, snippet: str) -> bool:
        """Checks both the raw string form and, for whole-number floats, the
        integer form (150.0 -> "150") so a Python float repr doesn't produce
        a spurious mismatch against source text that never had a decimal."""
        candidates = {str(value)}
        if isinstance(value, float) and value.is_integer():
            candidates.add(str(int(value)))
        return any(candidate in snippet for candidate in candidates)


class VerifierAgent:
    def __init__(self, llm: LLMClient):
        self.llm = llm
        self.fallback = HeuristicVerifier()

    def verify(self, product: ProductSpec) -> List[str]:
        if self.llm.is_live:
            notes: List[str] = []
            for attr in product.attributes:
                snippet = attr.citation.text_snippet if attr.citation else None
                if not snippet:
                    continue
                unit_str = attr.unit or ""
                reply = self.llm.complete(
                    system_prompt=(
                        "You are an adversarial Verifier agent. Be skeptical: only "
                        "say YES if the cited text unambiguously supports the exact "
                        "value."
                    ),
                    user_prompt=(
                        f"Attribute '{attr.label}' = '{attr.value}{unit_str}'.\n"
                        f'Cited source text: "{snippet}"\n\n'
                        "Does the source text support this exact value? Reply "
                        "'YES' or 'NO: <reason>'."
                    ),
                )
                if reply and reply.strip().upper().startswith("NO"):
                    notes.append(f"{attr.key}: verifier rejected -- {reply.strip()}")
            return notes
        return self.fallback.verify(product)
