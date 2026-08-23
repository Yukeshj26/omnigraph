from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status

from src.services.catalog_store import catalog_store
from src.models.schemas import ProductSpec

router = APIRouter()


@router.get("/", tags=["products"])
def list_products() -> List[Dict[str, Any]]:
    """List all real products in the catalog."""
    return catalog_store.list_products()


@router.get("/{sku}", tags=["products"])
def get_product(sku: str) -> Dict[str, Any]:
    """Retrieve details for a specific product by SKU."""
    product = catalog_store.get_product(sku)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{sku}' not found.")
    return product


@router.post("/", tags=["products"], status_code=status.HTTP_201_CREATED)
def create_or_update_product(product: ProductSpec) -> Dict[str, Any]:
    """Create or update a product specification."""
    return catalog_store.save_product(product.model_dump())


@router.delete("/{sku}", tags=["products"])
def delete_product(sku: str) -> Dict[str, str]:
    """Delete a product from the live catalog."""
    deleted = catalog_store.delete_product(sku)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Product '{sku}' not found.")
    return {"status": "deleted", "sku": sku}
