"""
Unified LLM client for the multi-agent extraction pipeline.

Three provider modes, selected via LLM_PROVIDER (see .env.example):
  - "openai":    OpenAI Chat Completions, JSON mode for structured output
  - "anthropic": Anthropic Messages API
  - "mock":      no network calls. Both methods below return None so callers
                 fall back to the offline heuristic implementations in
                 extractor_agent.py / verifier_agent.py.

"mock" is the default, so the whole pipeline (parse -> extract -> verify ->
validate) runs end to end with zero credentials -- useful for demos, tests,
and CI. Set OPENAI_API_KEY or ANTHROPIC_API_KEY plus LLM_PROVIDER in .env to
switch on a live model.
"""
import json
import os
from typing import Optional, Type, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

# Sensible, known-good defaults. These are just fallbacks -- override with
# LLM_MODEL in .env for whatever your account actually has access to.
_DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
_DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5"


class LLMClient:
    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None):
        self.provider = provider or os.getenv("LLM_PROVIDER", "mock")
        default_model = _DEFAULT_OPENAI_MODEL if self.provider == "openai" else _DEFAULT_ANTHROPIC_MODEL
        self.model = model or os.getenv("LLM_MODEL", default_model)
        self._client = None

        if self.provider == "openai":
            import openai  # local import: only required when this branch runs

            self._client = openai.OpenAI()
        elif self.provider == "anthropic":
            import anthropic  # local import: only required when this branch runs

            self._client = anthropic.Anthropic()
        elif self.provider != "mock":
            raise ValueError(
                f"Unknown LLM_PROVIDER '{self.provider}' (expected openai/anthropic/mock)"
            )

    @property
    def is_live(self) -> bool:
        return self.provider in ("openai", "anthropic")

    def structured_complete(
        self, system_prompt: str, user_prompt: str, response_model: Type[T]
    ) -> Optional[T]:
        """Ask the configured LLM for JSON matching response_model. Returns
        None in mock mode (or on parse failure) so callers fall back to a
        deterministic offline path instead of crashing."""
        if not self.is_live:
            return None

        schema_hint = json.dumps(response_model.model_json_schema())
        instructions = (
            f"{system_prompt}\n\nRespond with ONLY a single JSON object matching "
            f"this JSON Schema, no markdown fences and no other text:\n{schema_hint}"
        )

        if self.provider == "openai":
            resp = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
            )
            raw = resp.choices[0].message.content or ""
        else:  # anthropic
            resp = self._client.messages.create(
                model=self.model,
                max_tokens=2000,
                system=instructions,
                messages=[{"role": "user", "content": user_prompt}],
            )
            raw = "".join(block.text for block in resp.content if hasattr(block, "text"))

        return self._parse(raw, response_model)

    def complete(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        """Plain free-text completion (used by the adversarial verifier).
        Returns None in mock mode."""
        if not self.is_live:
            return None

        if self.provider == "openai":
            resp = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            return resp.choices[0].message.content

        resp = self._client.messages.create(
            model=self.model,
            max_tokens=300,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(block.text for block in resp.content if hasattr(block, "text"))

    @staticmethod
    def _parse(raw: str, response_model: Type[T]) -> Optional[T]:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
        try:
            return response_model.model_validate_json(cleaned)
        except Exception:
            return None
