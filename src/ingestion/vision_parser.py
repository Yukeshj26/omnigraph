"""
Vision-native-ish document parsing (layer 1 of the README's architecture).

DocumentParser uses PyMuPDF to extract text blocks with real bounding boxes
from PDFs -- enough to give every downstream attribute a genuine page +
coordinate citation, which is what powers the "visual grounding" story.

This is a deliberately lighter-weight stand-in for ColPali's late-interaction
retrieval, which is built for visually dense pages (schematics, multi-column
tables, dimensioned CAD blueprints) at a model-weights/GPU cost that isn't
worth pulling into a starter scaffold. See render_page_image() below for the
extension point: route a rendered page image to a vision LLM (or swap in
ColPali) for pages where text extraction alone isn't enough.
"""
from pathlib import Path
from typing import List, Literal

import pymupdf
from pydantic import BaseModel

from src.models.schemas import BoundingBox


class ParsedBlock(BaseModel):
    document_id: str
    page_number: int
    block_type: Literal["text"] = "text"
    text: str
    bounding_box: BoundingBox


class DocumentParser:
    def parse(self, file_path: str) -> List[ParsedBlock]:
        path = Path(file_path)
        document_id = path.stem
        blocks: List[ParsedBlock] = []
        with pymupdf.open(file_path) as doc:
            for page_index, page in enumerate(doc):
                for x0, y0, x1, y1, text, *_rest in page.get_text("blocks"):
                    cleaned = text.strip()
                    if not cleaned:
                        continue
                    blocks.append(
                        ParsedBlock(
                            document_id=document_id,
                            page_number=page_index + 1,
                            text=cleaned,
                            bounding_box=BoundingBox(x0=x0, y0=y0, x1=x1, y1=y1),
                        )
                    )
        return blocks

    def render_page_image(self, file_path: str, page_number: int, dpi: int = 150) -> bytes:
        """Rasterize a single page to PNG bytes -- feed this to a vision LLM
        (GPT-4o / Claude) for schematics and dense tables that plain text
        extraction handles poorly."""
        with pymupdf.open(file_path) as doc:
            page = doc[page_number - 1]
            pix = page.get_pixmap(dpi=dpi)
            return pix.tobytes("png")
