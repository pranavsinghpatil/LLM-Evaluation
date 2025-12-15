# 🔍 LLM Evaluation Pipeline

<div align="center">

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![Spacy](https://img.shields.io/badge/Spacy-NLP-09A3D5?logo=spacy&logoColor=white)

**A production-ready evaluation system for RAG-based LLM applications**

[Live Demo](#-quick-start) • [Documentation](#-documentation) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 🎯 What is This?

An automated **Quality Control System** for LLM responses. Before showing an AI-generated answer to your users, this pipeline checks:

| Metric | What it Checks | How |
|--------|---------------|-----|
| **Relevance** | Does the answer match the user's intent? | Intent-Entity Alignment + Vector Similarity |
| **Completeness** | Are all parts of the question addressed? | Semantic Coverage + Slot Fulfillment |
| **Hallucination** | Are claims grounded in retrieved context? | NER-based Claim Verification |
| **Latency/Cost** | Is it production-ready? | Mandated thresholds (< 2s, < $0.05) |

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/pranavsinghpatil/LLM-Evaluation-Pipeline.git
cd LLM-Evaluation-Pipeline

# Backend
pip install -r requirements.txt
python -m spacy download en_core_web_md

# Frontend
cd frontend && npm install
```

### 2. Start the Services

```bash
# Terminal 1: Backend API
cd LLM-Evaluation-Pipeline
set PYTHONPATH=src && uvicorn src.api:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 3. Open the Dashboard

Visit **http://localhost:5173** and start evaluating!

---

## 🖥️ Screenshots

### Evaluation Dashboard
The intuitive interface allows you to:
- Upload conversation history (JSON)
- Upload retrieved context (JSON)
- Run evaluations with a single click
- View detailed metrics and verdicts

### Sample Output
```json
{
  "metrics": {
    "relevance": 0.85,
    "completeness": 0.92,
    "hallucination": 0.0,
    "latency_ms": 45.2,
    "estimated_cost_usd": 0.00004
  },
  "verdict": {
    "status": "PASS",
    "reasons": []
  }
}
```

---

## 🧠 Deep Semantic Architecture

### Why Vector Embeddings?

Traditional evaluation uses **keyword matching** which fails on:
- "I am sad" vs "Don't be unhappy" (synonyms)
- "The cost is $50" vs "It's fifty dollars" (paraphrasing)

We use **Spacy's `en_core_web_md`** model with 20k+ word vectors for true semantic understanding:

```python
# Old approach (fails)
"sad" in "unhappy"  # False

# Our approach (works)
nlp("sad").similarity(nlp("unhappy"))  # 0.72 ✓
```

### Evaluation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Query     │ ──► │  Pipeline   │ ──► │   Verdict   │
│  Response   │     │  Evaluator  │     │   Report    │
│  Context    │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │Relevance │     │Complete- │     │Hallucin- │
   │ Scorer   │     │  ness    │     │  ation   │
   └──────────┘     └──────────┘     └──────────┘
```

---

## 📂 Project Structure

```
LLM-Evaluation-Pipeline/
│
├── src/
│   ├── pipeline/
│   │   ├── model.py           # Shared Spacy model (singleton)
│   │   ├── relevance.py       # Intent + Vector scoring
│   │   ├── completeness.py    # Semantic coverage
│   │   ├── hallucination.py   # Claim extraction & verification
│   │   ├── latency_cost.py    # Performance tracking
│   │   └── evaluation.py      # Orchestrator & verdict logic
│   └── api.py                 # FastAPI endpoints
│
├── frontend/                  # React + Vite + TailwindCSS
│   ├── src/
│   │   └── App.jsx           # Main dashboard component
│   └── package.json
│
├── docs/                      # Architecture & design docs
├── samples/                   # Example JSON files
├── tests/                     # Test suites
│
├── requirements.txt           # Python dependencies
└── README.md                  # You are here
```

---

## 🔧 API Reference

### POST `/evaluate`

Evaluate a query-response pair against retrieved context.

**Request:**
```json
{
  "query": "What is the price of the product?",
  "response": "The product costs $49.99 and ships in 2 days.",
  "context": ["Our flagship product is priced at $49.99.", "Shipping takes 2-3 business days."]
}
```

**Response:**
```json
{
  "metrics": {
    "relevance": 0.85,
    "completeness": 0.78,
    "hallucination": 0.0,
    "latency_ms": 52.3,
    "estimated_cost_usd": 0.000056
  },
  "verdict": {
    "status": "PASS",
    "reasons": []
  }
}
```

### GET `/health`

Health check endpoint.

```json
{"status": "healthy", "model": "en_core_web_md"}
```

---

## 📊 Verdict Logic

| Condition | Status | Example Reason |
|-----------|--------|----------------|
| Hallucination > 0.5 | **FAIL** | "High hallucination: Unsupported claims found: $999, Jan 2025" |
| Relevance < 0.05 | **FAIL** | "Irrelevant" |
| Hallucination > 0.1 | **WARN** | "Potential hallucination: March 15" |
| Completeness < 0.5 | **WARN** | "Incomplete answer" |
| Latency > 2000ms | **WARN** | "Latency > 2000ms" |
| Cost > $0.05 | **WARN** | "Cost limit exceeded" |
| All checks pass | **PASS** | [] |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Python 3.9+, FastAPI | REST API & evaluation logic |
| **NLP** | Spacy (`en_core_web_md`) | Vector embeddings, NER, lemmatization |
| **Frontend** | React 18, Vite, TailwindCSS | Interactive dashboard |
| **Testing** | Pytest, Unittest | Automated test suites |

---

## 🎓 Key Design Decisions

### 1. Intent-Entity Alignment (Relevance)
- Detects query intent ("how much?" → expects MONEY entity)
- Awards high score (0.85) if response contains matching entity type
- Fallback to vector similarity for general queries

### 2. Claim-Based Hallucination Detection
- Extracts verifiable "anchors": Numbers, Dates, SVO triplets
- Verifies each anchor against context
- Weighted scoring: Facts (1.0) > Claims (0.5)

### 3. Mandated Production Limits
- Latency > 2s → WARN (ensures responsiveness)
- Cost > $0.05 → WARN (prevents budget overruns)

---

## 📚 Documentation

Detailed documentation is available in `/docs`:

| File | Contents |
|------|----------|
| `00-overview.md` | Project introduction |
| `01-problem-statement.md` | The challenge we're solving |
| `02-requirements.md` | Functional specifications |
| `03-architecture.md` | System design diagrams |
| `04-evaluation-criteria.md` | Scoring formulas explained |
| `05-design-decisions.md` | Why we chose each approach |
| `06-scaling-strategy.md` | Production scaling plan |
| `07-future-improvements.md` | Roadmap |

---

## 🚀 Future Roadmap

- [ ] **Batch Evaluation**: Process multiple conversations at once
- [ ] **Streaming Support**: WebSocket-based real-time evaluation
- [ ] **Custom Thresholds**: User-configurable pass/fail limits
- [ ] **Export Reports**: PDF/CSV export functionality
- [ ] **Multi-language**: Support for non-English evaluation
- [ ] **LLM-as-Judge**: Optional GPT-4 verification layer

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Pranav Singh Patil**

- Website: [prnav.me](https://prnav.me)
- GitHub: [@pranavsinghpatil](https://github.com/pranavsinghpatil)
- Twitter: [@pranavenv](https://twitter.com/pranavenv)
- LinkedIn: [pranavsinghpatil](https://linkedin.com/in/pranavsinghpatil)

---

<div align="center">

**Built with ❤️ for reliable AI**

*Making LLMs trustworthy, one evaluation at a time.*

</div>
