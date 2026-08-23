"""
Engineering constraint rules for the Neuro-Symbolic Validation layer.

Each rule is a small, self-contained class with:
  - applies_to(product): whether the product has the attributes this rule needs
  - check(product): runs the actual check (using Z3 where that adds value)
    and returns a RuleResult

Add a new rule by subclassing EngineeringRule and adding an instance to
default_rules(). Rules are independent and composable -- ValidationEngine
(see z3_validator.py) just runs whichever ones apply to a given product.

A note on *why* Z3 for what look like simple comparisons: PressureSafetyMarginRule,
VoltageRatingRule and LoadCapacityRule really are just point-value comparisons --
plain Python would do the same job. They're written as Z3 refutation proofs
anyway ("is it possible to violate this?") to keep every rule in the same
explainable pattern, and because in production these values rarely stay
single points for long (tolerances, unit conversions, multi-attribute
dependencies) -- exactly where a real solver starts to earn its keep.
DimensionalFitRule is the more honest showcase: it reasons over a full
tolerance interval and asks Z3 to find a worst-case counterexample, not a
single number.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List

from z3 import And, Not, Reals, Solver, sat, unsat

from src.models.schemas import ProductSpec


@dataclass
class RuleResult:
    rule_name: str
    passed: bool
    message: str
    severity: str = "error"


class EngineeringRule(ABC):
    name: str
    description: str

    @abstractmethod
    def applies_to(self, product: ProductSpec) -> bool: ...

    @abstractmethod
    def check(self, product: ProductSpec) -> RuleResult: ...


class PressureSafetyMarginRule(EngineeringRule):
    name = "pressure_safety_margin"
    description = "Burst pressure must exceed operating pressure by a safety factor."

    def __init__(self, safety_factor: float = 4.0):
        self.safety_factor = safety_factor

    def applies_to(self, product: ProductSpec) -> bool:
        return (
            product.get_numeric("operating_pressure_bar") is not None
            and product.get_numeric("burst_pressure_bar") is not None
        )

    def check(self, product: ProductSpec) -> RuleResult:
        op = product.get_numeric("operating_pressure_bar")
        bp = product.get_numeric("burst_pressure_bar")
        OP, BP = Reals("operating_pressure burst_pressure")
        s = Solver()
        s.add(OP == op, BP == bp)
        s.add(Not(BP >= OP * self.safety_factor))  # try to prove violation exists
        if s.check() == unsat:
            return RuleResult(
                self.name,
                True,
                f"Burst pressure {bp} bar exceeds {self.safety_factor}x operating "
                f"pressure {op} bar.",
            )
        return RuleResult(
            self.name,
            False,
            f"Burst pressure {bp} bar does not provide the required "
            f"{self.safety_factor}x margin over operating pressure {op} bar "
            f"(needs >= {op * self.safety_factor} bar). Confirm the correct "
            f"factor against the governing standard for this product category "
            f"(e.g. SAE/EN) before trusting this default.",
            severity="critical",
        )


class VoltageRatingRule(EngineeringRule):
    name = "voltage_rating"
    description = "Rated voltage must be at or above the operating voltage."

    def applies_to(self, product: ProductSpec) -> bool:
        return (
            product.get_numeric("rated_voltage_v") is not None
            and product.get_numeric("operating_voltage_v") is not None
        )

    def check(self, product: ProductSpec) -> RuleResult:
        rated = product.get_numeric("rated_voltage_v")
        operating = product.get_numeric("operating_voltage_v")
        R, O = Reals("rated_voltage operating_voltage")
        s = Solver()
        s.add(R == rated, O == operating)
        s.add(Not(R >= O))
        if s.check() == unsat:
            return RuleResult(
                self.name, True, f"Rated voltage {rated}V covers operating voltage {operating}V."
            )
        return RuleResult(
            self.name,
            False,
            f"Rated voltage {rated}V is below the operating voltage {operating}V.",
            severity="critical",
        )


class TemperatureRangeRule(EngineeringRule):
    name = "temperature_range"
    description = "Ambient/operating temperature must fall within the rated range."

    def applies_to(self, product: ProductSpec) -> bool:
        return (
            product.get_numeric("min_operating_temp_c") is not None
            and product.get_numeric("max_operating_temp_c") is not None
            and product.get_numeric("operating_temp_c") is not None
        )

    def check(self, product: ProductSpec) -> RuleResult:
        lo = product.get_numeric("min_operating_temp_c")
        hi = product.get_numeric("max_operating_temp_c")
        t = product.get_numeric("operating_temp_c")
        LO, HI, T = Reals("min_temp max_temp op_temp")
        s = Solver()
        s.add(LO == lo, HI == hi, T == t)
        s.add(Not(And(T >= LO, T <= HI)))
        if s.check() == unsat:
            return RuleResult(
                self.name,
                True,
                f"Operating temperature {t}C is within the rated range [{lo}C, {hi}C].",
            )
        return RuleResult(
            self.name,
            False,
            f"Operating temperature {t}C falls outside the rated range [{lo}C, {hi}C].",
        )


class DimensionalFitRule(EngineeringRule):
    name = "dimensional_fit"
    description = "Shaft must clear the bore across the full stated tolerance range."

    def __init__(self, min_clearance_mm: float = 0.0):
        self.min_clearance_mm = min_clearance_mm

    def applies_to(self, product: ProductSpec) -> bool:
        return (
            product.get_numeric("shaft_diameter_mm") is not None
            and product.get_numeric("bore_diameter_mm") is not None
        )

    def check(self, product: ProductSpec) -> RuleResult:
        shaft = product.get_attr("shaft_diameter_mm")
        bore = product.get_attr("bore_diameter_mm")
        shaft_val = float(shaft.value)  # type: ignore[arg-type]
        bore_val = float(bore.value)  # type: ignore[arg-type]
        shaft_tol = shaft.tolerance or 0.0
        bore_tol = bore.tolerance or 0.0

        S, B = Reals("shaft_actual bore_actual")
        s = Solver()
        s.add(S >= shaft_val - shaft_tol, S <= shaft_val + shaft_tol)
        s.add(B >= bore_val - bore_tol, B <= bore_val + bore_tol)
        s.add(B - S < self.min_clearance_mm)  # ask Z3: does a violating pair exist?
        if s.check() == sat:
            m = s.model()
            return RuleResult(
                self.name,
                False,
                f"Worst-case fit fails: shaft {m[S]} mm vs bore {m[B]} mm leaves less "
                f"than {self.min_clearance_mm} mm clearance (shaft {shaft_val}+/-"
                f"{shaft_tol} mm, bore {bore_val}+/-{bore_tol} mm).",
            )
        return RuleResult(
            self.name,
            True,
            f"Fit holds across the full tolerance range: shaft {shaft_val}+/-{shaft_tol} mm, "
            f"bore {bore_val}+/-{bore_tol} mm.",
        )


class LoadCapacityRule(EngineeringRule):
    name = "load_capacity"
    description = "Rated load must be at or above the applied/working load."

    def __init__(self, safety_factor: float = 1.0):
        self.safety_factor = safety_factor

    def applies_to(self, product: ProductSpec) -> bool:
        return (
            product.get_numeric("rated_load_n") is not None
            and product.get_numeric("applied_load_n") is not None
        )

    def check(self, product: ProductSpec) -> RuleResult:
        rated = product.get_numeric("rated_load_n")
        applied = product.get_numeric("applied_load_n")
        R, A = Reals("rated_load applied_load")
        s = Solver()
        s.add(R == rated, A == applied)
        s.add(Not(R >= A * self.safety_factor))
        if s.check() == unsat:
            return RuleResult(
                self.name,
                True,
                f"Rated load {rated}N covers applied load {applied}N x {self.safety_factor}.",
            )
        return RuleResult(
            self.name,
            False,
            f"Rated load {rated}N is below applied load {applied}N x {self.safety_factor} "
            f"safety factor (needs >= {applied * self.safety_factor}N).",
            severity="critical",
        )


def default_rules() -> List[EngineeringRule]:
    return [
        PressureSafetyMarginRule(safety_factor=4.0),
        VoltageRatingRule(),
        TemperatureRangeRule(),
        DimensionalFitRule(min_clearance_mm=0.0),
        LoadCapacityRule(safety_factor=1.0),
    ]
