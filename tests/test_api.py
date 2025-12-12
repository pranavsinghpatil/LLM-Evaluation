from fastapi.testclient import TestClient
from src.api import app
import json

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "model": "en_core_web_sm"}

def test_evaluate_good_response():
    payload = {
        "query": "What is the capital of France?",
        "response": "The capital of France is Paris.",
        "context": ["Paris is the capital and most populous city of France."]
    }
    response = client.post("/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"]["status"] == "PASS"
    assert data["metrics"]["hallucination"] < 0.5

def test_evaluate_bad_response():
    payload = {
        "query": "What is the capital of France?",
        "response": "The capital of France is London.",
        "context": ["Paris is the capital and most populous city of France."]
    }
    response = client.post("/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    # This might fail or warn depending on strictness, but hallucination score should be high
    # "London" is an entity not in context
    assert data["metrics"]["hallucination"] > 0.0

def test_empty_input():
    payload = {
        "query": "",
        "response": "",
        "context": []
    }
    response = client.post("/evaluate", json=payload)
    assert response.status_code == 400
