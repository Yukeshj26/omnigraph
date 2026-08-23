"""
Thin wrapper over the official Neo4j Python driver for the GraphRAG layer.
Needs a running Neo4j instance (`docker-compose up -d neo4j`) to actually
connect -- every call here can raise if it isn't running, which callers
(run_ingest.py, the /products API router) catch and degrade gracefully from.
"""
from typing import Any, Dict, List, Optional

from neo4j import GraphDatabase

from src.models.schemas import ProductSpec


class Neo4jClient:
    def __init__(self, uri: str, user: str, password: str, connection_timeout: float = 5.0):
        self._driver = GraphDatabase.driver(
            uri, auth=(user, password), connection_timeout=connection_timeout
        )

    def close(self) -> None:
        self._driver.close()

    def verify_connectivity(self) -> None:
        self._driver.verify_connectivity()

    def run(self, cypher: str, **params: Any) -> List[Dict[str, Any]]:
        with self._driver.session() as session:
            result = session.run(cypher, **params)
            return [record.data() for record in result]

    def upsert_product(self, product: ProductSpec) -> None:
        with self._driver.session() as session:
            session.execute_write(self._upsert_product_tx, product)

    @staticmethod
    def _upsert_product_tx(tx, product: ProductSpec) -> None:
        tx.run(
            """
            MERGE (p:Product {sku: $sku})
            SET p.name = $name, p.category = $category
            WITH p
            UNWIND $attributes AS attr
            MERGE (a:Attribute {product_sku: $sku, key: attr.key})
            SET a.value = attr.value, a.unit = attr.unit
            MERGE (p)-[:HAS_ATTRIBUTE]->(a)
            """,
            sku=product.sku,
            name=product.name,
            category=product.category,
            attributes=[
                {"key": a.key, "value": a.value, "unit": a.unit} for a in product.attributes
            ],
        )

    def get_product(self, sku: str) -> Optional[Dict[str, Any]]:
        rows = self.run(
            """
            MATCH (p:Product {sku: $sku})
            OPTIONAL MATCH (p)-[:HAS_ATTRIBUTE]->(a:Attribute)
            RETURN p.sku AS sku, p.name AS name, p.category AS category,
                   collect({key: a.key, value: a.value, unit: a.unit}) AS attributes
            """,
            sku=sku,
        )
        return rows[0] if rows else None

    def find_interchangeable(self, sku: str, max_hops: int = 2) -> List[Dict[str, Any]]:
        """Multi-hop traversal example: OEM interchangeability / compatible parts."""
        return self.run(
            f"""
            MATCH (p:Product {{sku: $sku}})-[:INTERCHANGEABLE_WITH*1..{max_hops}]-(other:Product)
            RETURN DISTINCT other.sku AS sku, other.name AS name
            """,
            sku=sku,
        )
