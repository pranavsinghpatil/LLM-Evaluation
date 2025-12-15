# Evaluation Criteria & Scoring Logic

## 1. Relevance Score ($S_{rel}$)
We use a hybrid approach to measure how well the response answers the query.

$$ S_{cosine} = \text{CosineSimilarity}(\text{TF-IDF}(Q), \text{TF-IDF}(R)) $$
$$ S_{jaccard} = \frac{|Tokens(Q) \cap Tokens(R)|}{|Tokens(Q) \cup Tokens(R)|} $$
$$ S_{rel} = \frac{S_{cosine} + S_{jaccard}}{2} $$

- **Threshold**: $S_{rel} < 0.1 \rightarrow$ **FAIL** (Irrelevant).

## 2. Completeness Score ($S_{comp}$)
Measures if the response covers the key topics asked in the query.

$$ K_Q = \text{ExtractKeywords}(Q) $$
$$ S_{comp} = \frac{|K_Q \cap Tokens(R)|}{|K_Q|} $$

- **Threshold**: $S_{comp} < 0.6 \rightarrow$ **WARN** (Potentially incomplete).

## 3. Hallucination Score ($S_{hall}$)
We use a **Claim-Based Verification** approach, moving beyond simple surface-level similarity.

**A. Anchor Extraction ($A_{total}$)**
We verify specific factual claims, defined as "Anchors":
- **Numeric**: Prices, quantities, percentages.
- **Dates**: Specific years, days, times.
- **Assertive Claims**: SVO (Subject-Verb-Object) triples where the verb implies a fact (e.g., *released, cost, includes*) rather than a guess (e.g., *may, suggests*).

**B. Evidence Matching ($A_{unsupported}$)**
Each anchor is checked against the context:
1.  **Numbers/Dates**: Checked for presence (with exact or format-aware matching) in context.
2.  **Claims**: Checked if Subject and Object co-occur in close proximity in the context.

**C. Scoring Logic**
$$ S_{claims} = \frac{A_{unsupported}}{A_{total}} $$

**D. Topic Drift Gate ($P_{drift}$)**
We use N-grams only as a safety gate for relevance.
- If $NgramOverlap < 0.2$, we apply a small penalty ($P_{drift} = 0.2$).
- Otherwise, $P_{drift} = 0.0$.

**Final Score**:
$$ S_{hall} = \max(S_{claims}, P_{drift}) $$

- **Threshold**: $S_{hall} > 0.6 \rightarrow$ **FAIL** (High Hallucination Risk).


## 4. Verdict Logic
The final decision is hierarchical:
1.  **FAIL** if Hallucination > 0.5 (Safety First).
2.  **FAIL** if Relevance < 0.1 (Quality Second).
3.  **WARN** if Completeness < 0.6 (Detail Third).
4.  **PASS** otherwise.
