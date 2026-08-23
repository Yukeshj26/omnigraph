.PHONY: install test run ingest demo db-up db-down

install:
	python -m venv .venv
	. .venv/bin/activate && pip install -r requirements.txt

test:
	python -m pytest -v

run:
	uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

ingest:
	python src/ingestion/run_ingest.py --input ./data/raw_catalogs/

demo:
	python scripts/generate_sample_pdf.py
	python scripts/seed_demo_data.py

db-up:
	docker-compose up -d neo4j qdrant

db-down:
	docker-compose down
