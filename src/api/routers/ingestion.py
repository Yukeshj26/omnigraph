import tempfile
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, File, HTTPException, UploadFile

from src.services.catalog_store import catalog_store

router = APIRouter()


@router.post("/upload")
async def upload_catalog(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    filename = file.filename or "uploaded_catalog.pdf"
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = catalog_store.ingest_pdf_file(tmp_path, original_filename=filename)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to scan PDF catalog: {str(exc)}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)
