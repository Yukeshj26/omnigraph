from src.models.schemas import ProductAttribute, ProductSpec
from src.validation.rules import default_rules
from src.validation.z3_validator import ValidationEngine


def make_product(sku="TEST-1", **kwargs) -> ProductSpec:
    attrs = [ProductAttribute(key=k, label=k, value=v) for k, v in kwargs.items()]
    return ProductSpec(sku=sku, name="Test Product", attributes=attrs)


def test_pressure_rule_passes_with_sufficient_margin():
    product = make_product(operating_pressure_bar=150, burst_pressure_bar=700)
    report = ValidationEngine(default_rules()).validate(product)
    assert report.passed
    assert "pressure_safety_margin" in report.checked_rules


def test_pressure_rule_fails_with_insufficient_margin():
    product = make_product(operating_pressure_bar=150, burst_pressure_bar=200)
    report = ValidationEngine(default_rules()).validate(product)
    assert not report.passed
    assert any(i.rule_name == "pressure_safety_margin" for i in report.issues)


def test_voltage_rule():
    ok = make_product(rated_voltage_v=24, operating_voltage_v=12)
    bad = make_product(rated_voltage_v=12, operating_voltage_v=24)
    assert ValidationEngine(default_rules()).validate(ok).passed
    assert not ValidationEngine(default_rules()).validate(bad).passed


def test_temperature_range_rule():
    ok = make_product(min_operating_temp_c=-20, max_operating_temp_c=100, operating_temp_c=60)
    bad = make_product(min_operating_temp_c=-20, max_operating_temp_c=100, operating_temp_c=150)
    assert ValidationEngine(default_rules()).validate(ok).passed
    assert not ValidationEngine(default_rules()).validate(bad).passed


def test_dimensional_fit_rule_with_tolerance_passes():
    product = ProductSpec(
        sku="FIT-1",
        name="Fit test",
        attributes=[
            ProductAttribute(key="shaft_diameter_mm", label="Shaft", value=12.0, tolerance=0.05),
            ProductAttribute(key="bore_diameter_mm", label="Bore", value=12.2, tolerance=0.05),
        ],
    )
    report = ValidationEngine(default_rules()).validate(product)
    assert report.passed


def test_dimensional_fit_rule_fails_when_tolerances_overlap():
    product = ProductSpec(
        sku="FIT-2",
        name="Fit test (tight)",
        attributes=[
            ProductAttribute(key="shaft_diameter_mm", label="Shaft", value=12.0, tolerance=0.2),
            ProductAttribute(key="bore_diameter_mm", label="Bore", value=12.05, tolerance=0.05),
        ],
    )
    report = ValidationEngine(default_rules()).validate(product)
    assert not report.passed
    assert any(i.rule_name == "dimensional_fit" for i in report.issues)


def test_load_capacity_rule():
    ok = make_product(rated_load_n=5000, applied_load_n=3200)
    bad = make_product(rated_load_n=2000, applied_load_n=3200)
    assert ValidationEngine(default_rules()).validate(ok).passed
    assert not ValidationEngine(default_rules()).validate(bad).passed


def test_rule_skipped_when_attributes_missing():
    product = make_product(operating_pressure_bar=150)  # no burst pressure
    report = ValidationEngine(default_rules()).validate(product)
    assert "pressure_safety_margin" not in report.checked_rules
    assert report.passed  # nothing applicable => nothing to fail
