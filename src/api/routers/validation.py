from fastapi import APIRouter

from src.models.schemas import ProductSpec, ValidationReport
from src.validation.rules import default_rules
from src.validation.z3_validator import ValidationEngine

router = APIRouter()
_engine = ValidationEngine(default_rules())


@router.post("/", response_model=ValidationReport)
def validate_product(product: ProductSpec) -> ValidationReport:
    return _engine.validate(product)
