# Future Improvements Roadmap

## Short Term (1-2 Weeks)
- [ ] **Embeddings**: Replace TF-IDF with `sentence-transformers/all-MiniLM-L6-v2` for better semantic relevance.
- [ ] **NER for Hallucination**: Use Spacy NER to extract entities and strictly check them against context (more robust than n-gram).
- [ ] **API Wrapper**: Wrap `src/main.py` in a FastAPI app.

## Medium Term (1-2 Months)
- [ ] **LLM-as-a-Judge**: Integrate a small LLM (e.g., GPT-3.5-Turbo or a local Llama-3-8b) to provide a "human-like" critique of the response style and tone.
- [ ] **Feedback Loop**: Implement a `/feedback` endpoint where human reviewers can correct the automated scores, fine-tuning the thresholds over time.

## Long Term (6+ Months)
- [ ] **Adversarial Testing**: Build a "Red Teaming" module that generates tricky prompts to try and fool the evaluator.
- [ ] **Multi-Modal Eval**: Extend support for Image and Audio response evaluation.
