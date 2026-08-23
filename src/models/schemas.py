"""
Core Pydantic data contracts shared across the OGPI pipeline.

These are the "schema-enforced generation" types referenced in the README:
every agent (extractor, verifier), every validation rule, and every API
route reads and writes these same models, so a product's shape is defined
once and enforced everywhere (ingestion -> agents -> validation -> API ->
ERP/PIM export).
"""
from typing import List, Literal, Optional, Union

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """Pixel/point coordinates of a region on a source page: (x0,y0)-(x1,y1)."""

    x0: float
    y0: float
    x1: float
    y1: float


class SourceCitation(BaseModel):
    """Where an extracted value came from -- powers the 'visual grounding' story."""

    document_id: str
    page_number: int
    bounding_box: Optional[BoundingBox] = None
    text_snippet: Optional[str] = None


class ProductAttribute(BaseModel):
    """One structured attribute of a product (e.g. Operating Pressure = 150 bar)."""

    key: str = Field(..., description="Machine key, e.g. 'operating_pressure_bar'.")
    label: str = Field(..., description="Human-readable label, e.g. 'Operating Pressure'.")
    value: Union[float, str, bool]
    unit: Optional[str] = None
    tolerance: Optional[float] = Field(
        default=None, description="Symmetric +/- tolerance, same unit as value."
    )
    standard_scheme: Optional[Literal["ETIM", "UNSPSC", "eCl@ss"]] = None
    standard_code: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    citation: Optional[SourceCitation] = None


class ProductSpec(BaseModel):
    """A single product record moving through the pipeline."""

    sku: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    attributes: List[ProductAttribute] = Field(default_factory=list)
    source_document_ids: List[str] = Field(default_factory=list)

    def get_attr(self, key: str) -> Optional[ProductAttribute]:
        return next((a for a in self.attributes if a.key == key), None)

    def get_numeric(self, key: str) -> Optional[float]:
        """Safe numeric lookup: returns None if missing or not coercible to
        float, so validation rules can gate on it without try/except."""
        attr = self.get_attr(key)
        if attr is None:
            return None
        try:
            return float(attr.value)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            return None


class ValidationIssue(BaseModel):
    rule_name: str
    severity: Literal["info", "warning", "error", "critical"] = "error"
    message: str


class ValidationReport(BaseModel):
    product_sku: str
    passed: bool
    checked_rules: List[str] = Field(default_factory=list)
    issues: List[ValidationIssue] = Field(default_factory=list)


class ExtractionResult(BaseModel):
    """What the orchestrator hands back: the draft, verifier notes, and the
    neuro-symbolic validation report, bundled together."""

    product: ProductSpec
    verifier_notes: List[str] = Field(default_factory=list)
    validation: ValidationReport
