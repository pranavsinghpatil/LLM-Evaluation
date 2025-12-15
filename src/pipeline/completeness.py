import spacy
from typing import Set, List

from .model import nlp

class CompletenessEvaluator:
    """
    Evaluates if the response addresses the key concepts in the query.
    Now scoped to Question Intent (Entity Check).
    """

    def __init__(self):
        pass

    def _detect_intent_slots(self, doc) -> Set[str]:
        """
        Heuristic to guess what the question is asking for based on Wh-words.
        Returns expected Entity Labels.
        """
        text = doc.text.lower()
        expected = set()
        
        # When -> DATE, TIME
        if "when" in text or "what time" in text:
            expected.add("DATE")
            expected.add("TIME")
        
        # How much/cost/price -> MONEY
        if "how much" in text or "cost" in text or "price" in text:
            expected.add("MONEY")
            
        # Who -> PERSON, ORG
        if "who" in text:
            expected.add("PERSON")
            expected.add("ORG")
            
        # Where -> GPE, LOC
        if "where" in text:
            expected.add("GPE")
            expected.add("LOC")
            
        return expected

    def _check_followup(self, text: str) -> bool:
        """
        Detects if the response invites further interaction or offers help.
        This mitigates 'incomplete' penalties for partial answers that offer more.
        """
        followup_phrases = [
            "let me know", "would you like", "do you want", "can i help", 
            "feel free", "happy to help", "anything else", "questions?", 
            "more details"
        ]
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in followup_phrases)

    def evaluate(self, query: str, response: str) -> float:
        """
        Calculates Completeness based on:
        1. Intent Slot Fulfillment (Primary Metric).
        2. Semantic Coverage (Vector Similarity).
        3. Conversational Follow-up (Bonus).
        """
        if not query:
            return 1.0 
        if not response:
            return 0.0

        q_doc = nlp(query)
        r_doc = nlp(response)
        
        # 1. Intent Check (Gold Standard)
        expected_slots = self._detect_intent_slots(q_doc)
        intent_score = 0.5 # Default neutral
        
        if expected_slots:
            found_slots = {ent.label_ for ent in r_doc.ents}
            if not expected_slots.isdisjoint(found_slots):
                intent_score = 1.0 
            else:
                intent_score = 0.0

        # 2. Semantic Coverage (Silver Standard)
        # Did we cover the "meaning" of the question?
        vector_sim = 0.0
        if q_doc.vector_norm and r_doc.vector_norm:
            vector_sim = q_doc.similarity(r_doc)

        # 3. Lemma Coverage (Bronze Standard)
        q_lemmas = {token.lemma_.lower() for token in q_doc if not token.is_stop and not token.is_punct}
        r_lemmas = {token.lemma_.lower() for token in r_doc if not token.is_stop and not token.is_punct}
        lemma_score = 0.0
        if q_lemmas:
            common = q_lemmas.intersection(r_lemmas)
            lemma_score = len(common) / len(q_lemmas)

        # 4. Follow-up Bonus
        has_followup = self._check_followup(response)
        followup_bonus = 0.2 if has_followup else 0.0
        
        # Final Score Mix
        # Intent is King. Vector is Queen. Lemma is Pawn.
        if expected_slots:
            # 60% Intent, 20% Vector, 20% Lemma
            base_score = (0.6 * intent_score) + (0.2 * vector_sim) + (0.2 * lemma_score)
        else:
            # No intent? Rely on Semantics
            # 50% Vector, 50% Lemma
            base_score = (0.5 * vector_sim) + (0.5 * lemma_score) + 0.2 # Base boost for chit-chat

        final_score = base_score + followup_bonus

        # Semantic Floor for Vector Match
        if vector_sim > 0.8 and final_score < 0.8:
            final_score = 0.8

        return min(float(final_score), 1.0)
