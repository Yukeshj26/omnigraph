from fastapi import APIRouter, HTTPException

from src.config import get_settings
from src.graph.neo4j_client import Neo4jClient

router = APIRouter()


def _connect() -> Neo4jClient:
    settings = get_settings()
    client = Neo4jClient(
        settings.neo4j_uri, settings.neo4j_user, settings.neo4j_password, connection_timeout=3.0
    )
    try:
        client.verify_connectivity()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Graph database unavailable ({exc.__class__.__name__}). "
                "Start it with `docker-compose up -d neo4j`."
            ),
        ) from exc
    return client


@router.get("/{sku}")
def get_product(sku: str):
    client = _connect()
    try:
        data = client.get_product(sku)
    finally:
        client.close()
    if data is None:
        raise HTTPException(status_code=404, detail=f"Product '{sku}' not found.")
    return data
