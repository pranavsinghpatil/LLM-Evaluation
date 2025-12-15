# 🎬 Demo Instructions

## Quick Demo (2 Minutes)

### Step 1: Start the Backend
```bash
cd LLM-Evaluation-Pipeline
set PYTHONPATH=src
uvicorn src.api:app --host 0.0.0.0 --port 8000
```

Wait for: `Uvicorn running on http://0.0.0.0:8000`

### Step 2: Start the Frontend
```bash
cd frontend
npm run dev
```

Wait for: `Local: http://localhost:5173`

### Step 3: Open the Dashboard
Navigate to **http://localhost:5173**

---

## Demo Scenarios

### Scenario 1: Successful Evaluation (PASS)

**Query:** What is the capital of France?
**Response:** The capital of France is Paris.
**Context:** France is a country in Europe. Paris is the capital city of France.

**Expected Result:** ✅ PASS (High relevance, low hallucination)

---

### Scenario 2: Hallucination Detection (FAIL)

**Query:** What is the price?
**Response:** The product costs $999 and was released on January 15, 2025.
**Context:** Our product is available for purchase.

**Expected Result:** ❌ FAIL
- Reason: "High hallucination: Unsupported claims found: $999, January 15, 2025"

---

### Scenario 3: Low Relevance (WARN/FAIL)

**Query:** What's the weather today?
**Response:** The mitochondria is the powerhouse of the cell.
**Context:** Weather information for today.

**Expected Result:** ❌ FAIL (Irrelevant response)

---

## Using Sample Files

1. Click "Load Sample Data" button in the dashboard
2. The sample conversation and context will be loaded
3. Click "Run Evaluation"

---

## API Testing (cURL)

```bash
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How much does it cost?",
    "response": "It costs $50.",
    "context": ["The product is priced at $50."]
  }'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to fetch" | Ensure backend is running on port 8000 |
| Slow first request | Spacy model loading (one-time, ~5s) |
| CORS error | Backend must be started with PYTHONPATH=src |

---

**Ready to demo! 🚀**
