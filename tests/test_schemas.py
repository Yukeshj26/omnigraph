import pytest
from pydantic import ValidationError

from src.models.schemas import ProductAttribute, ProductSpec


def test_get_attr_and_get_numeric():
    product = ProductSpec(
        sku="SKU1",
        name="Test",
        attributes=[ProductAttribute(key="a", label="A", value=1.5)],
    )
    assert product.get_attr("a").value == 1.5
    assert product.get_attr("missing") is None
    assert product.get_numeric("a") == 1.5
    assert product.get_numeric("missing") is None


def test_get_numeric_returns_none_for_non_numeric_value():
    product = ProductSpec(
        sku="SKU1",
        name="Test",
        attributes=[ProductAttribute(key="material", label="Material", value="Stainless Steel")],
    )
    assert product.get_numeric("material") is None


def test_product_attribute_requires_key_and_value():
    with pytest.raises(ValidationError):
        ProductAttribute(label="A")  # type: ignore[call-arg]
