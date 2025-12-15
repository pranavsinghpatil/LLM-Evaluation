from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import spacy
import time
import re

# Load smaller model for Vercel (50MB limit)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    import sys
    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

app = FastAPI(title="LLM Evaluation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvalRequest(BaseModel):
    query: str
    response: str
    context: List[str]

# ============ RELEVANCE ============
def evaluate_relevance(query: str, response: str) -> float:
    if not query or not response:
        return 0.0
    
    q_doc = nlp(query.lower())
    r_doc = nlp(response.lower())
    
    # Intent detection
    text = query.lower()
    expected = set()
    if any(w in text for w in ["cost", "price", "how much"]):
        expected.add("MONEY")
    if any(w in text for w in ["when", "time", "date"]):
        expected.add("DATE")
    
    found = {ent.label_ for ent in r_doc.ents}
    intent_score = 0.85 if expected and not expected.isdisjoint(found) else 0.0
    
    # Lemma overlap
    q_lemmas = {t.lemma_ for t in q_doc if not t.is_stop and not t.is_punct}
    r_lemmas = {t.lemma_ for t in r_doc if not t.is_stop and not t.is_punct}
    lemma_sim = len(q_lemmas & r_lemmas) / len(q_lemmas) if q_lemmas else 0.0
    
    return max(intent_score, lemma_sim, 0.3)

# ============ COMPLETENESS ============
def evaluate_completeness(query: str, response: str) -> float:
    if not query or not response:
        return 0.0
    
    q_doc = nlp(query.lower())
    r_doc = nlp(response.lower())
    
    q_lemmas = {t.lemma_ for t in q_doc if not t.is_stop and not t.is_punct}
    r_lemmas = {t.lemma_ for t in r_doc if not t.is_stop and not t.is_punct}
    
    overlap = len(q_lemmas & r_lemmas) / len(q_lemmas) if q_lemmas else 0.5
    
    # Follow-up bonus
    followup = any(p in response.lower() for p in ["would you like", "let me know", "anything else"])
    
    return min(overlap + (0.2 if followup else 0) + 0.3, 1.0)

# ============ HALLUCINATION ============
def evaluate_hallucination(response: str, context: List[str]) -> dict:
    if not response:
        return {"score": 0.0, "unsupported_claims": []}
    if not context:
        return {"score": 1.0, "unsupported_claims": [{"text": "No context", "reason": "Cannot verify"}]}
    
    full_context = " ".join(context).lower()
    r_doc = nlp(response)
    
    unsupported = []
    total = 0
    errors = 0
    
    # Check entities
    for ent in r_doc.ents:
        if ent.label_ in ["MONEY", "DATE", "CARDINAL", "PERCENT"]:
            total += 1
            if ent.text.lower() not in full_context:
                errors += 1
                unsupported.append({"text": ent.text, "reason": f"'{ent.text}' not in context"})
    
    score = errors / total if total > 0 else 0.0
    return {"score": score, "unsupported_claims": unsupported}

# ============ PIPELINE ============
@app.post("/evaluate")
async def evaluate(request: EvalRequest):
    start = time.time()
    
    relevance = evaluate_relevance(request.query, request.response)
    completeness = evaluate_completeness(request.query, request.response)
    hall_result = evaluate_hallucination(request.response, request.context)
    
    latency = (time.time() - start) * 1000
    cost = len(request.query + request.response) * 0.000001
    
    # Verdict
    verdict = "PASS"
    reasons = []
    
    if hall_result["score"] > 0.5:
        verdict = "FAIL"
        claims = [c["text"] for c in hall_result["unsupported_claims"][:3]]
        reasons.append(f"High hallucination: {', '.join(claims)}" if claims else "High hallucination")
    elif hall_result["score"] > 0.1:
        verdict = "WARN"
        reasons.append("Potential hallucination")
    
    if relevance < 0.2:
        verdict = "FAIL" if relevance < 0.05 else "WARN"
        reasons.append("Low relevance")
    
    if completeness < 0.5 and verdict == "PASS":
        verdict = "WARN"
        reasons.append("Incomplete")
    
    return {
        "metrics": {
            "relevance": round(relevance, 4),
            "completeness": round(completeness, 4),
            "hallucination": round(hall_result["score"], 4),
            "latency_ms": round(latency, 2),
            "estimated_cost_usd": round(cost, 6)
        },
        "verdict": {
            "status": verdict,
            "reasons": reasons
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "model": "en_core_web_sm", "platform": "vercel"}

@app.get("/")
async def root():
    return {"message": "LLM Evaluation API", "docs": "/docs"}
