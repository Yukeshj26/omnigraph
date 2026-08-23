"""
Chunk + embed parsed blocks for the vector store side of GraphRAG.

Uses OpenAI embeddings when OPENAI_API_KEY is set; otherwise falls back to a
deterministic hash-based pseudo-embedding so ingestion still runs offline.
The fallback is NOT semantically meaningful -- it exists so the pipeline
doesn't crash without credentials, not as a real similarity-search
substitute. Swap in a real embedding model (OpenAI, Cohere, or a local
sentence-transformers model) before relying on search quality.
"""
import hashlib
import os
from typing import List

DEFAULT_DIM = 384


def embed_text(text: str, dim: int = DEFAULT_DIM) -> List[float]:
    if os.getenv("OPENAI_API_KEY"):
        import openai

        resp = openai.OpenAI().embeddings.create(model="text-embedding-3-small", input=text)
        return list(resp.data[0].embedding)

    digest = hashlib.sha256(text.encode("utf-8")).digest()
    return [(digest[i % len(digest)] / 255.0) * 2 - 1 for i in range(dim)]
