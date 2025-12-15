from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import sys

# Allow importing from 'src' root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from src.pipeline.evaluation import Pipeline
except ImportError:
    try:
        from pipeline.evaluation import Pipeline
    except ImportError:
        # Last resort for local runs inside src
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        from pipeline.evaluation import Pipeline

app = FastAPI(
    title="LLM Evaluation Microservice",
    description="API for evaluating Relevance, Completeness, and Hallucination of LLM responses.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pipeline once (load models)
pipeline = Pipeline()

class EvalRequest(BaseModel):
    query: str
    response: str
    context: List[str]

class EvalMetrics(BaseModel):
    relevance: float
    completeness: float
    hallucination: float
    latency_ms: float
    estimated_cost_usd: float

class Verdict(BaseModel):
    status: str
    reasons: List[str]

class EvalResponse(BaseModel):
    metrics: EvalMetrics
    verdict: Verdict

@app.post("/evaluate", response_model=EvalResponse)
async def evaluate_response(request: EvalRequest):
    """
    Evaluates a single Query-Response pair against the provided Context.
    """
    if not request.query or not request.response:
        raise HTTPException(status_code=400, detail="Query and Response cannot be empty.")

    try:
        result = pipeline.run(request.query, request.response, request.context)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "en_core_web_md"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
