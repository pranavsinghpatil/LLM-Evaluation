# Python & FastAPI: The Backend Core

## 1. Python: The Foundation
**Python** is the programming language powering the backend of this pipeline. It was chosen for its dominance in the implementation of Artificial Intelligence and Natural Language Processing (NLP).

### Why Python?
- **Readability**: Python code reads like English, making it accessible for evaluating complex logic.
- **Ecosystem**: It has the world's richest set of libraries for data science (NumPy, Pandas, Scikit-learn).
- **Speed of Development**: We can prototype concepts like TF-IDF or Cosine Similarity in lines of code that would take hundreds in languages like C++ or Java.

---

## 2. FastAPI: The Web Framework
**FastAPI** is a modern, high-performance web framework for building APIs with Python 3.8+.

### Core Concepts used in this Project:

#### A. Asynchronous Handling (`async` / `await`)
FastAPI is built on **Starlette** and **Uvicorn**, making it one of the fastest Python frameworks.
- **Synchronous vs Asynchronous**: In standard web frameworks (like Flask), one request blocks the server until it's finished. In FastAPI, we use `async def` endpoints. This allows the server to handle other requests (like a heartbeat check) while waiting for heavier operations (like an NLP computation) to complete, although CPU-bound tasks are often still blocking unless offloaded.
- **In our Pipeline**: We define our endpoint as `async def evaluate(...)`, allowing for future scalability if we move to model serving that involves I/O waiting (e.g., calling an external API like OpenAI).

#### B. Pydantic Models (Data Validation)
FastAPI uses **Pydantic** for data validation. This is critical for our "Strict Input" requirement.
- **How it works**: We define a class `EvaluationRequest` that inherits from `BaseModel`.
- **Type Safety**: If a user sends a number where a string is expected, Pydantic throws a clear 422 Error automatically.
- **Schema Generation**: Pydantic models automatically generate the Swagger UI/OpenAPI documentation (`/docs`), allowing us to test the API without writing a frontend.

#### C. Dependency Injection
FastAPI has a powerful Dependency Injection system.
- **Usage**: structuring the pipeline components. We can define the "Pipeline" as a dependency that is initialized once (loading the heavy NLP models) and then injected into every request. This prevents reloading models for every API call, keeping latency < 200ms.

#### D. CORS Middleware
**Cross-Origin Resource Sharing (CORS)** is a security mechanism.
- **The Problem**: Browsers block a frontend (running on port 5173) from talking to a backend (running on port 8000) for security reasons.
- **The Solution**: We explicitly add `CORSMiddleware` to our FastAPI app to whitelist `http://localhost:5173`, allowing the secure exchange of JSON data between our React App and Python API.

### Code Snippet Explanation
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Pydantic Model strictly defines the JSON structure
class Request(BaseModel):
    query: str
    response: str

@app.post("/evaluate")
async def evaluate(data: Request):
    # This function is the entry point
    return {"status": "processing"}
```
