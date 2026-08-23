"""
The Neuro-Symbolic Validation engine: runs every applicable EngineeringRule
against a ProductSpec and aggregates the results into a ValidationReport.

Kept separate from rules.py so the *registry/execution* concern (which rules
apply, how failures are aggregated) stays independent from *rule content*
(the actual engineering constraints).
"""
from typing import List

from src.models.schemas import ProductSpec, ValidationIssue, ValidationReport
from src.validation.rules import EngineeringRule


class ValidationEngine:
    def __init__(self, rules: List[EngineeringRule]):
        self.rules = rules

    def validate(self, product: ProductSpec) -> ValidationReport:
        checked_rules: List[str] = []
        issues: List[ValidationIssue] = []
        for rule in self.rules:
            if not rule.applies_to(product):
                continue
            result = rule.check(product)
            checked_rules.append(result.rule_name)
            if not result.passed:
                issues.append(
                    ValidationIssue(
                        rule_name=result.rule_name,
                        severity=result.severity,  # type: ignore[arg-type]
                        message=result.message,
                    )
                )
        return ValidationReport(
            product_sku=product.sku,
            passed=len(issues) == 0,
            checked_rules=checked_rules,
            issues=issues,
        )
