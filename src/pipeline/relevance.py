import spacy
from typing import Set

# Load Spacy
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

class RelevanceEvaluator:
    """
    Evaluates the relevance of a response to a user query.
    Moved from strict TF-IDF to Lemma & Entity Overlap (Semantic-lite).
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
        Computes relevance using Intent-Entity Alignment + Semantic Overlap.
        """
        if not query or not response:
            return 0.0

        q_doc = nlp(query.lower())
        r_doc = nlp(response.lower())

        # 1. Intent-Entity Check (High Confidence Signal)
        expected_entities = self._detect_intent_entities(q_doc)
        found_entities = {ent.label_ for ent in r_doc.ents}
        
        intent_score = 0.0
        if expected_entities:
            # If we find ANY matching entity type
            if not expected_entities.isdisjoint(found_entities):
                # Major boost: The response contains the *type* of info requested
                # e.g. Q: "Cost?" A: "$10" (No semantic overlap, but correct entity)
                intent_score = 0.8
            else:
                # Mismatch: Asked for Price, got no Money. 
                # Could be a "It's free" answer, so strict 0.0 is risky, but we penalty.
                intent_score = 0.0
        
        # 2. Lemma Jaccard (Textual Overlap - Backup)
        q_lemmas = {token.lemma_ for token in q_doc if not token.is_stop and not token.is_punct}
        r_lemmas = {token.lemma_ for token in r_doc if not token.is_stop and not token.is_punct}
        
        lemma_sim = 0.0
        if q_lemmas:
            intersection = len(q_lemmas.intersection(r_lemmas))
            # Use smaller denominator (query length) to support short answers
            lemma_sim = intersection / len(q_lemmas)

        # 3. Entity Overlap (Verification Bridge)
        # Shared proper nouns (e.g. "Google")
        q_ents = {ent.text for ent in q_doc.ents}
        r_ents = {ent.text for ent in r_doc.ents}
        entity_overlap = 0.0
        if q_ents and r_ents and not q_ents.isdisjoint(r_ents):
            entity_overlap = 0.2

        # Final Score Combination
        # If Intent is met, that's the dominant signal.
        # Otherwise, rely on text overlap.
        
        if expected_entities:
            # Weight Intent heavly
            final_score = max(intent_score, (lemma_sim + entity_overlap))
        else:
            # No specific intent? Use standard overlap + entities
            final_score = lemma_sim + entity_overlap

        # "Semantic Floor": If there is some entity overlap, don't drop to 0.
        if final_score < 0.2 and entity_overlap > 0:
            final_score = 0.2
            
        return min(final_score, 1.0)
