"""
Neo4j schema setup for the GraphRAG layer: constraints + indexes.
Idempotent -- safe to re-run against an existing database.
"""

SCHEMA_STATEMENTS = [
    "CREATE CONSTRAINT product_sku IF NOT EXISTS FOR (p:Product) REQUIRE p.sku IS UNIQUE",
    "CREATE INDEX product_category IF NOT EXISTS FOR (p:Product) ON (p.category)",
    "CREATE INDEX attribute_key IF NOT EXISTS FOR (a:Attribute) ON (a.key)",
    "CREATE INDEX standard_code IF NOT EXISTS FOR (s:StandardCode) ON (s.code)",
]

# Relationship shapes used across the graph (documentation, not executed):
#   (:Product)-[:HAS_ATTRIBUTE]->(:Attribute)
#   (:Product)-[:CLASSIFIED_AS]->(:StandardCode)
#   (:Product)-[:INTERCHANGEABLE_WITH]->(:Product)   -- OEM cross-references
#   (:Product)-[:COMPATIBLE_THREAD]->(:ThreadSpec)   -- thread pitch matching


def apply_schema(client) -> None:
    """client: a Neo4jClient (see neo4j_client.py)."""
    for statement in SCHEMA_STATEMENTS:
        client.run(statement)
