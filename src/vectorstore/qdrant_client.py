"""
Thin wrapper over the Qdrant client for the vector half of GraphRAG.
Needs a running Qdrant instance (`docker-compose up -d qdrant`) to connect.

Note: qdrant-client >=1.10 removed .search() in favor of .query_points() --
this wrapper targets the current API (verified against qdrant-client 1.19).
"""
from typing import Any, Dict, List

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams


class VectorStore:
    def __init__(self, url: str, collection: str, vector_size: int = 384):
        self.client = QdrantClient(url=url)
        self.collection = collection
        self.vector_size = vector_size

    def ensure_collection(self) -> None:
        existing = [c.name for c in self.client.get_collections().collections]
        if self.collection not in existing:
            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
            )

    def upsert(self, point_id: str, vector: List[float], payload: Dict[str, Any]) -> None:
        self.client.upsert(
            collection_name=self.collection,
            points=[PointStruct(id=point_id, vector=vector, payload=payload)],
        )

    def search(self, vector: List[float], limit: int = 5):
        return self.client.query_points(collection_name=self.collection, query=vector, limit=limit)
