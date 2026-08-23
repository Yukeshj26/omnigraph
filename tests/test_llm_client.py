import pytest

from src.agents.llm_client import LLMClient
from src.models.schemas import ProductSpec


def test_mock_provider_is_default_and_not_live(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    client = LLMClient()
    assert client.provider == "mock"
    assert client.is_live is False


def test_mock_structured_complete_returns_none():
    client = LLMClient(provider="mock")
    assert client.structured_complete("sys", "user", ProductSpec) is None


def test_mock_complete_returns_none():
    client = LLMClient(provider="mock")
    assert client.complete("sys", "user") is None


def test_unknown_provider_raises():
    with pytest.raises(ValueError):
        LLMClient(provider="not-a-real-provider")
