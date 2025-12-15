# Design Decisions & Trade-offs

## 1. TF-IDF vs. BERT Embeddings
**Decision**: Use **TF-IDF** for the initial prototype.
- **Pros**: 
    - Extremely fast (<10ms).
    - No GPU required.
    - Highly interpretable (we know exactly which words caused the match).
- **Cons**: 
    - Misses semantic meaning (e.g., "car" vs "automobile").
- **Mitigation**: The architecture allows swapping in a `BertEvaluator` class later without changing the pipeline logic.

## 2. Local Context vs. Vector DB
**Decision**: Pass **Context** as part of the input JSON.
- **Pros**: 
    - Simplifies the testing environment (no need to spin up Weaviate/Pinecone).
    - Makes the evaluation pipeline purely functional (stateless).
- **Cons**: 
    - Input payload size increases.
- **Justification**: For an evaluation microservice, decoupling the "Retrieval" from the "Evaluation" is good practice. The Evaluator shouldn't need DB access; it should just judge the data it's given.

## 3. Python vs. TypeScript
**Decision**: **Python**.
- **Reason**: The ecosystem for NLP (`nltk`, `scikit-learn`, `spacy`) is vastly superior in Python. While the web app might be Next.js, the heavy-lifting evaluation engine should be in Python.

## 4. Synchronous vs. Asynchronous
**Decision**: **Synchronous** for the CLI, but designed classes to be **Async-ready**.
- **Reason**: CLI usage is inherently sequential. However, the `Pipeline` class is stateless, making it trivial to wrap in a `FastAPI` async endpoint for high-throughput production usage.

## 5. Hallucination: Claim-Based vs. Surface Similarity
**Decision**: **Claim-Based Verification**.
- **Old Approach**: Weighted average of Entity Overlap and N-gram Similarity.
- **New Approach**: Extract "Anchors" (Numbers, Dates, Assertive Facts) and verify each against evidence.
- **Reason**: Surface similarity is a poor proxy for factual correctness. A response can be 90% similar (high n-gram overlap) but contain a critical numeric error ($100 vs $1000).
- **Trade-off**: Requires dependency parsing (slower than simple regex), but significantly reduces false negatives for "silent hallucinations".
