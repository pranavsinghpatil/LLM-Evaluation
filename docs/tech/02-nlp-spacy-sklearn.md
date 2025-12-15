# NLP Libraries: Spacy & Scikit-learn

## 1. Natural Language Processing (NLP)
At the heart of our "Evaluator" is **NLP**. We don't just "guess" if the model is right; we measure the mathematical distance between words and concepts.

---

## 2. Spacy: Industrial-Strength NLP
**SpaCy** is a library for advanced Natural Language Processing. It is designed for production use, meaning it’s fast and efficient.

### How we use it:
1.  **Tokenization**: Breaking a sentence into individual words (tokens).
    *   *Example*: "Hello world" -> ["Hello", "world"]
2.  **Stopword Removal**: Removing common, non-informative words like "the", "is", "at". This leaves us with the core content.
3.  **Lemmatization**: Converting words to their root form.
    *   *Example*: "Running", "Ran", "Runs" -> "Run".
    *   *Why?*: It ensures that strict matching doesn't fail just because of tense differences.
4.  **Named Entity Recognition (NER)** (For Completeness):
    *   Spacy's pre-trained models can detect Entities like `ORG` (Organizations), `GPE` (Countries), or `DATE`.
    *   *Usage*: If the User asks about "Paris", we check if the LLM response contains the entity "Paris". If not, the Completeness score drops.

---

## 3. Scikit-Lear: Machine Learning in Python
**Scikit-learn** is the standard for classical machine learning. We use it for vectorization and similarity calculation.

### A. TF-IDF (Term Frequency - Inverse Document Frequency)
This is the algorithm we use to convert text into numbers (vectors).
*   **TF (Term Frequency)**: How often a word appears in a document.
*   **IDF (Inverse Document Frequency)**: How rare a word is across all documents. (e.g., "The" is common, so it has low value. "Quantum" is rare, so it has high value).
*   **Result**: A matrix where every sentence is a row of numbers representing its unique semantic fingerprint.

### B. Cosine Similarity
Once we have vectors (numbers) from TF-IDF, we need to compare them.
*   **What it is**: It measures the cosine of the angle between two vectors.
*   **Formula**: `A . B / ||A|| ||B||`
*   **Output**: A number between 0 and 1.
    *   `1.0`: Identical meaning.
    *   `0.0`: Completely unrelated.
*   **Usage**: We calculate the Cosine Similarity between the **User's Query** and the **LLM's Response**. A high score (> 0.7) typically indicates the model answered the question relevantly.

---

## Why this Combination?
We chose **Spacy + Scikit-learn** instead of deep learning models (like BERT or GPT) for the evaluator because:
1.  **Speed**: They run in milliseconds (Latency Requirement < 200ms).
2.  **Cost**: They run on a standard CPU; no expensive GPUs required.
3.  **Explainability**: It is easy to debug why TF-IDF gave a certain score, whereas Neural Networks are "black boxes".
