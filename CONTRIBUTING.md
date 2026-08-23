# Contributing to OGPI

Thanks for improving Omni-Graph Product Intelligence. This is a starter
scaffold matching the architecture in the README -- there's a lot of room
to build out real implementations behind the interfaces defined here.

## Dev setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m pytest -v
```

## Project layout

See the "Repository Layout" section in the README -- each `src/` package
maps directly to one of the four architecture layers.

## Coding standards

- Format with `black`, lint with `ruff` (both optional -- not yet wired
  into CI; add them if your team wants enforced style).
- Type hints on public functions; Pydantic models for anything crossing a
  module boundary (agents, API, validation).
- Every new `EngineeringRule` (`src/validation/rules.py`) needs a test in
  `tests/test_z3_validator.py` covering both a passing and a failing case.

## Adding a new validation rule

1. Subclass `EngineeringRule` in `src/validation/rules.py`.
2. Implement `applies_to()` (which attributes it needs) and `check()` (the
   actual Z3 constraint).
3. Add an instance to `default_rules()`.
4. Add pass/fail tests.

## Pull requests

- Keep PRs scoped to one layer/concern where possible.
- Include `python -m pytest -v` output (or CI status) in the PR description.
- Flag any change that touches `src/models/schemas.py` explicitly -- it's
  the shared contract every other module depends on.

## License

By contributing, you agree your contributions are licensed under the
project's MIT License.
