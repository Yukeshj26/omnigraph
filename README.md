# Omni-Graph Product Intelligence (OGPI)

![Status](https://img.shields.io/badge/Status-Enterprise_Ready-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Architecture](https://img.shields.io/badge/Architecture-GraphRAG_%2B_Neuro--Symbolic-purple)

## 📌 Overview
Industrial companies manage vast amounts of product information across scattered sources such as websites, complex catalogs, and technical PDFs. **Omni-Graph Product Intelligence** is an enterprise-grade AI pipeline designed to ingest fragmented data and transform it into rich, reliable, and commerce-ready product catalogs.

This solution directly tackles the challenges of **data enrichment, rigorous validation, and explainable AI** by integrating Vision-Native Retrieval, GraphRAG, Multi-Agent extraction, and Neuro-Symbolic logic.

---

## 🏗️ Core Architecture

The system operates across four primary layers to guarantee data accuracy, structural integrity, and enterprise scalability.

### 1. Vision-Native Ingestion & Layout Parsing
*   **ColPali & Document-AI Integration:** Replaces traditional decoupled OCR by utilizing vision-native late-interaction retrieval to parse multi-column tables, complex technical schematics, and dimensioned CAD blueprints directly from images.
*   **Standardized Taxonomy Normalization:** Automatically maps raw attributes to global industrial standards including **ETIM 9.0**, **UNSPSC**, and **eCl@ss**.

### 2. Hybrid GraphRAG & Multi-Agent Extraction
*   **GraphRAG Infrastructure:** Merges semantic dense vector retrieval with **Neo4j** graph database traversals to resolve multi-hop physical relationships (e.g., OEM interchangeability, thread pitch matching).
*   **Schema-Enforced Generation:** Uses structured output engines (e.g., Instructor) with deterministic unit-conversion tools to enforce strict data typing.
*   **Adversarial Critic-Verifier Loops:** A dual-agent setup where a *Specification Extractor* drafts the attributes and an adversarial *Verifier Agent* independently cross-examines citations before saving.

### 3. Neuro-Symbolic Validation & Explainability
*   **Deterministic Constraint Solvers:** Integrates **Z3 SMT solvers** to mathematically validate physical engineering rules (e.g., `Burst Pressure > Operating Pressure`). Probabilistic LLMs guess; our neuro-symbolic engine *proves*.
*   **Token-Level Visual Grounding:** Provides human operators with bidirectional visual explainability, generating exact bounding boxes over source PDFs to show where data originated.
*   **Continuous Alignment (DPO):** Feeds Human-In-The-Loop (HITL) corrections into a Direct Preference Optimization pipeline to fine-tune domain-specialized small language models (SLMs).

### 4. Scalable Enterprise Deployment
*   **Tiered Model Cascading:** Utilizes high-throughput inference (vLLM / TensorRT-LLM). Routes standard tasks to efficient 8B SLMs while reserving frontier Vision LLMs for complex schematics, optimizing costs by up to 70%.
*   **Turnkey ERP/PIM Connectors:** Asynchronous gRPC/REST endpoints for native, bidirectional sync with enterprise ecosystems like **SAP, Akeneo, and Pimcore**.

---

## 🚀 Pipeline Data Flow

1.  **Ingest:** Raw PDFs, schemas, and supplier websites are uploaded.
2.  **Parse & Embed:** Vision LLMs parse documents preserving layout; text and relationships are embedded into the Graph+Vector database.
3.  **Extract & Standardize:** Multi-Agent LLMs generate structured specifications mapping to industry standards.
4.  **Validate:** The Neuro-Symbolic Rule Engine mathematically verifies engineering constraints.
5.  **Audit:** Verified data is pushed to commerce channels with exact PDF bounding-box citations. Exceptions are routed to HITL.

---

## ⚙️ Tech Stack

*   **Orchestration & Agents:** LangChain / LlamaIndex / CrewAI
*   **Vector & Graph DB:** Neo4j (GraphRAG), Milvus or Qdrant (Vector)
*   **Inference Engine:** vLLM, TensorRT-LLM
*   **Validation:** Z3 Theorem Prover (SMT), Pydantic, Instructor
*   **Vision/Parsing:** ColPali, Docling, GPT-4o / Claude 3.5 Sonnet
*   **Integrations:** REST/gRPC API, Akeneo / SAP Connectors

---

## 🛠️ Getting Started (Local Deployment)

### Prerequisites
*   Python 3.10+
*   Docker & Docker Compose (for Neo4j and Vector DB)
*   Access to an LLM provider (OpenAI, Anthropic) or local GPUs for vLLM.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/omni-graph-product-intel.git
   cd omni-graph-product-intel
   ```

2. **Environment Setup**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Start Graph and Vector Databases**
   ```bash
   docker-compose up -d neo4j qdrant
   ```

4. **Run the Ingestion Pipeline**
   ```bash
   python src/ingestion/run_ingest.py --input ./data/raw_catalogs/
   ```

5. **Start the API Server**
   ```bash
   uvicorn src.api.main:app --host 0.0.0.0 --port 8000
   ```

---

## 📊 Evaluation & Metrics
*   **Extraction Accuracy:** > 99% (Post Neuro-Symbolic Validation)
*   **Hallucination Rate:** < 0.1% (Adversarial loops + GraphRAG)
*   **Cost Reduction:** 70% decrease in inference cost via Model Cascading.

## 🤝 Contributing
Please see `CONTRIBUTING.md` for our guide on creating pull requests, coding standards, and testing procedures.

## 📄 License
This project is licensed under the MIT License - see the `LICENSE` file for details.

---

## 🗂️ Repository Layout

This scaffold maps directly onto the four architecture layers above:

```
src/
├── ingestion/         # Layer 1: vision_parser.py (PDF parsing + bounding boxes),
│                      #   taxonomy_normalizer.py (ETIM/UNSPSC/eCl@ss), embedder.py
├── graph/              # Layer 2: Neo4j client + schema (GraphRAG)
├── vectorstore/        # Layer 2: Qdrant client (dense retrieval)
├── agents/              # Layer 2: extractor_agent.py + verifier_agent.py
│                      #   (critic-verifier loop) + orchestrator.py + llm_client.py
├── validation/         # Layer 3: rules.py (engineering constraints) +
│                      #   z3_validator.py (the Z3 SMT engine)
├── integrations/       # Layer 4: Akeneo / SAP connector templates
├── api/                 # FastAPI app + routers (/ingest, /products, /validate)
├── models/              # Shared Pydantic schemas used by every layer
└── config.py

scripts/
├── generate_sample_pdf.py   # builds a demo catalog sheet
└── seed_demo_data.py        # end-to-end offline demo (no keys/DB required)

tests/                       # pytest suite covering schemas, Z3 rules, and the API
data/raw_catalogs/           # drop PDFs here for run_ingest.py
```

## ✅ What's real vs. what's a starting point

**Built and tested in this scaffold:**
- **Pydantic schema layer** (`src/models/schemas.py`) enforcing the product/
  attribute/citation shape everywhere.
- **Neuro-symbolic validation** (`src/validation/`): real Z3 SMT constraints
  for pressure safety margin, voltage rating, temperature range, dimensional
  fit (worst-case tolerance reasoning), and load capacity. Run
  `python -m pytest tests/test_z3_validator.py -v` to see them pass/fail.
- **PDF parsing with real bounding boxes** (`src/ingestion/vision_parser.py`,
  via PyMuPDF) -- a lighter stand-in for ColPali's late-interaction
  retrieval, with an extension point (`render_page_image`) for routing
  complex pages to a vision LLM.
- **A fully offline demo path**: `python scripts/generate_sample_pdf.py &&
  python scripts/seed_demo_data.py` runs parsing -> extraction -> validation
  end to end with zero API keys, via a heuristic (regex) extractor that's
  automatically used whenever no LLM provider is configured.
- **FastAPI app** (`/health`, `/validate`, `/ingest/upload`) -- exercised by
  `tests/test_api.py`.

**Provided as structurally-correct starting points, not yet exercised
against live infrastructure here** (no GPU / Docker / paid API keys in the
environment this was built in):
- **Neo4j + Qdrant clients** -- real driver code; needs
  `docker-compose up -d neo4j qdrant` (or your own instances) to actually
  connect. Both the API and `run_ingest.py` degrade gracefully (a clear
  error or warning, no crash) when the databases aren't reachable.
- **Live LLM extraction/verification** (OpenAI/Anthropic) -- implemented in
  `src/agents/llm_client.py`; set `LLM_PROVIDER` + an API key in `.env` to
  switch on from the offline heuristic path.
- **ColPali / Docling, vLLM / TensorRT-LLM, LangChain / LlamaIndex / CrewAI**
  -- named in the tech stack above; not vendored in here since they need a
  GPU and/or a much heavier install. See `requirements-extras.txt` for where
  each one plugs in.
- **Akeneo / SAP connectors** (`src/integrations/`) -- correct request
  shapes for each platform's standard API, but every real deployment needs
  endpoint/field adjustments for your specific PIM/ERP configuration.
- **ETIM / UNSPSC / eCl@ss codes** in `taxonomy_normalizer.py` are
  illustrative placeholders, not verified codes from a licensed release --
  see that file's docstring.

The accuracy/hallucination/cost figures in the Evaluation section above are
targets from the original spec, not numbers this scaffold has been
benchmarked against -- real numbers depend on the LLM/vision models you
configure and your own evaluation set.

## 🏁 Quick start (from zero)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Fully offline demo -- no keys, no databases
python scripts/generate_sample_pdf.py
python scripts/seed_demo_data.py

# Test suite
python -m pytest -v

# API (Swagger UI at /docs)
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

To bring up the graph/vector databases and switch on live LLM calls, follow
the "Getting Started" steps above and set `LLM_PROVIDER=openai` (or
`anthropic`) plus the matching API key in `.env`.
