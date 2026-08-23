"""
Standardized Taxonomy Normalization (README layer 1): maps extracted
attribute keys to industrial classification codes -- ETIM, UNSPSC, eCl@ss.

IMPORTANT: ETIM, UNSPSC and eCl@ss are licensed, versioned classification
standards maintained by their respective bodies (ETIM International, the
UNSPSC administrator, and eCl@ss e.V.). The codes in SAMPLE_TAXONOMY_MAP
below are illustrative placeholders to demonstrate the mapping shape -- they
are NOT verified codes from an official release and must not be treated as
such. Replace SAMPLE_TAXONOMY_MAP with a loader over your organization's
licensed taxonomy export before this touches production data.
"""
from typing import Dict, Optional, TypedDict

from src.models.schemas import ProductAttribute


class TaxonomyCodes(TypedDict, total=False):
    etim_class: str
    unspsc: str
    eclass: str


_SCHEME_LABELS = {"etim_class": "ETIM", "unspsc": "UNSPSC", "eclass": "eCl@ss"}

# key -> illustrative placeholder codes. See module docstring.
SAMPLE_TAXONOMY_MAP: Dict[str, TaxonomyCodes] = {
    "operating_pressure_bar": {"etim_class": "EC000001", "unspsc": "40141700", "eclass": "27-14-01-01"},
    "burst_pressure_bar": {"etim_class": "EC000002", "unspsc": "40141700", "eclass": "27-14-01-02"},
    "rated_voltage_v": {"etim_class": "EC000010", "unspsc": "39121400", "eclass": "27-06-01-01"},
    "operating_voltage_v": {"etim_class": "EC000011", "unspsc": "39121400", "eclass": "27-06-01-02"},
    "shaft_diameter_mm": {"etim_class": "EC000020", "unspsc": "31161500", "eclass": "23-08-01-01"},
    "bore_diameter_mm": {"etim_class": "EC000021", "unspsc": "31161500", "eclass": "23-08-01-02"},
}


class TaxonomyNormalizer:
    def __init__(self, mapping: Optional[Dict[str, TaxonomyCodes]] = None, preferred: str = "eclass"):
        self.mapping = mapping or SAMPLE_TAXONOMY_MAP
        self.preferred = preferred

    def normalize(self, attribute: ProductAttribute) -> ProductAttribute:
        """Returns a copy of attribute with standard_code/standard_scheme
        filled in, or the attribute unchanged if no mapping is known."""
        codes = self.mapping.get(attribute.key)
        if not codes:
            return attribute
        scheme_key = self.preferred if self.preferred in codes else next(iter(codes), None)
        if scheme_key is None:
            return attribute
        code = codes[scheme_key]  # type: ignore[literal-required]
        return attribute.model_copy(
            update={"standard_code": code, "standard_scheme": _SCHEME_LABELS[scheme_key]}
        )
