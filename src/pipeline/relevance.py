import spacy
from typing import Set

# Load Spacy
from .model import nlp

class RelevanceEvaluator:
    """
    Evaluates relevance using Deep Semantic Embeddings (Vectors).
    Precision: Intent Entities > Vector Similarity > Lemma Overlap.
    """

    def __init__(self):
        pass

    def _detect_intent_entities(self, doc) -> Set[str]:
        """
        Detects expected Named Entity labels based on query intent.
        """
        text = doc.text.lower()
        expected = set()
        
        # Cost/Price -> MONEY
        if any(w in text for w in ["cost", "price", "how much", "rate", "fee"]):
            expected.add("MONEY")
            
        # Time/Date -> DATE, TIME
        if any(w in text for w in ["when", "time", "date", "long", "year", "month"]):
            expected.add("DATE")
            expected.add("TIME")
            
        # Location -> GPE, LOC
        if any(w in text for w in ["where", "location", "located", "place"]):
            expected.add("GPE")
            expected.add("LOC")
            
        # Person/Org -> PERSON, ORG
        if any(w in text for w in ["who", "company", "organization"]):
            expected.add("PERSON")
            expected.add("ORG")
            
        return expected

    def evaluate(self, query: str, response: str) -> float:
        """
        Computes relevance using Intent Entities & Vector Cosine Similarity.
        """
        if not query or not response:
            return 0.0

        q_doc = nlp(query.lower())
        r_doc = nlp(response.lower())

        # 1. Intent-Entity Check (Gold Standard)
        expected_entities = self._detect_intent_entities(q_doc)
        found_entities = {ent.label_ for ent in r_doc.ents}
        
        intent_score = 0.0
        if expected_entities:
            if not expected_entities.isdisjoint(found_entities):
                # Strong signal: "How much" -> "$10"
                intent_score = 0.85
        
        # 2. Vector Semantic Similarity (Silver Standard)
        # Catches: "Sad" <-> "Unhappy"
        # Spacy .similarity is Cosine Similarity of averaged word vectors
        vector_sim = 0.0
        if q_doc.vector_norm and r_doc.vector_norm:
            vector_sim = q_doc.similarity(r_doc)
            
        # 3. Lemma Jaccard (Bronze Standard - Fallback)
        q_lemmas = {token.lemma_ for token in q_doc if not token.is_stop and not token.is_punct}
        r_lemmas = {token.lemma_ for token in r_doc if not token.is_stop and not token.is_punct}
        lemma_sim = 0.0
        if q_lemmas:
            lemma_sim = len(q_lemmas.intersection(r_lemmas)) / len(q_lemmas)

        # Final Score: Take the BEST signal
        # We trust Intent > Vector > Lemma
        final_score = max(intent_score, vector_sim, lemma_sim)

        # Semantic Floor Check
        # If vector similarity is decent (>0.5), ensure we don't fail hard
        if vector_sim > 0.5 and final_score < 0.5:
             final_score = 0.5
            
        return min(final_score, 1.0)
