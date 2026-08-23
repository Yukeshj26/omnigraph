import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from src.agents.orchestrator import ExtractionOrchestrator
from src.ingestion.vision_parser import DocumentParser
from src.models.schemas import ExtractionResult

router = APIRouter()
_parser = DocumentParser()
_orchestrator = ExtractionOrchestrator()


@router.post("/upload", response_model=ExtractionResult)
async def upload_catalog(file: UploadFile = File(...)) -> ExtractionResult:
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported in this scaffold.")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        blocks = _parser.parse(tmp_path)
        stem = Path(file.filename).stem
        result = _orchestrator.run(blocks, sku=stem.upper(), name=stem.replace("_", " ").title())
        return result
    finally:
        Path(tmp_path).unlink(missing_ok=True)
