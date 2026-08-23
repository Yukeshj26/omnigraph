from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from src.api.routers import ingestion, products, ui, validation


app = FastAPI(
    title="Omni-Graph Product Intelligence API",
    description="Ingestion, extraction, and neuro-symbolic validation endpoints for OGPI.",
    version="1.0.0",
)

# Enable CORS for split deployment (e.g. Vercel frontend + Render backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


STATIC_DIR = Path(__file__).resolve().parents[1] / "static"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(ingestion.router, prefix="/ingest", tags=["ingestion"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(validation.router, prefix="/validate", tags=["validation"])
app.include_router(ui.router, prefix="/api", tags=["ui"])


@app.get("/", include_in_schema=False)
def root_page():
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return RedirectResponse(url="/docs")


@app.get("/ui", include_in_schema=False)
def ui_page():
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}


