# Evaluation Metrics Algorithms

This document details the specific algorithms and mathematical logic used to compute our three core metrics.

## 1. Relevance Evaluator
**Goal**: Measure how well the Response answers the Query.
**File**: `src/pipeline/relevance.py`

### Algorithm: Hybrid Similarity (Cosine + Jaccard)

We use a hybrid approach that averages two distinct similarity metrics to balance semantic meaning with direct keyword overlap.

#### A. TF-IDF Cosine Similarity
1.  **Vectorization**: We use `TfidfVectorizer` from Scikit-Learn.
    *   It converts the Query and Response into sparse vectors.
    *   Common words (stop words) are ignored.
    *   Rare words get higher weights.
2.  **Calculation**: We compute the dot product of the two vectors divided by the product of their magnitudes.
    *   $$ \text{Cosine} = \frac{A \cdot B}{||A|| \times ||B||} $$

#### B. Jaccard Similarity (Fallback)
1.  **Tokenization**: We split both strings into sets of unique words.
2.  **Calculation**: Intersection over Union.
    *   $$ \text{Jaccard} = \frac{|Query \cap Response|}{|Query \cup Response|} $$

#### Final Score
$$ \text{Relevance} = \frac{\text{Cosine Score} + \text{Jaccard Score}}{2} $$

---

## 2. Completeness Evaluator
**Goal**: Check if the Response addresses all key concepts asked in the Query.
**File**: `src/pipeline/completeness.py`

### Algorithm: Keyword Coverage Ratio

1.  **Extraction**:
    *   We use `nltk.word_tokenize` to break the Query into tokens.
    *   We filter out stop words (is, the, at) and non-alphanumeric characters.
    *   This leaves us with a set of `Query Keywords`.
2.  **Verification**:
    *   We repeat the process for the Response to get `Response Keywords`.
3.  **Calculation**:
    *   We find the intersection: Keywords found in both Query and Response.
    *   $$ \text{Score} = \frac{|\text{Common Keywords}|}{|\text{Query Keywords}|} $$

*Note*: If the Query has no significant keywords (e.g., "Is it?"), the score defaults to 1.0.

---

## 3. Hallucination Evaluator
**Goal**: Ensure the Response contains only facts present in the Context.
**File**: `src/pipeline/hallucination.py`

### Algorithm: Claim-Based verification + Topic Gate

We assume that "facts" are specific anchors (Numbers, Dates, Assertive Claims) that must be strictly verified.

#### Step 1: Anchor Extraction
*   We use **Spacy Dependency Parsing** and **POS Tagging**.
*   We extract:
    *   **Numeric**: Money, Cardinals.
    *   **Dates**: Dates, Times.
    *   **Claims**: `Subject + Verb + Object` triples (Only if Verb is Assertive).
*   *Note*: Hedging verbs (e.g. "may") are filtered out.

#### Step 2: Evidence Matching
*   For each anchor, we search the Context.
*   **Result**: Validated Count vs Total Count.
*   $$ \text{Claim Error} = \frac{|\text{Unsupported Anchors}|}{|\text{Total Anchors}|} $$

#### Step 3: Topic Drift Gate
*   We calculate N-gram overlap as a safety check.
*   $$ P_{drift} = 0.2 \text{ if Overlap } < 0.2 \text{ else } 0.0 $$

#### Final Score
Lower is better (0.0 = No Hallucination).
$$ \text{Hallucination} = \max(\text{Claim Error}, P_{drift}) $$

