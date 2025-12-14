import spacy
from typing import Set, List

# Load Spacy model (shared instance would be better, but safe here)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

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
        2. Conversational Follow-up (Bonus).
        3. Lemma Coverage (Secondary/Fallback).
        """
        if not query:
            return 1.0 
        if not response:
            return 0.0

        q_doc = nlp(query)
        r_doc = nlp(response)
        
        # 1. Intent Check
        expected_slots = self._detect_intent_slots(q_doc)
        intent_score = 0.0
        
        if expected_slots:
            found_slots = {ent.label_ for ent in r_doc.ents}
            if not expected_slots.isdisjoint(found_slots):
                # Primary intent met (e.g. asked for Price, got Money)
                intent_score = 0.8 # Base robust score
            else:
                intent_score = 0.0
        else:
            # If no finding, default to 0.5 neutral
            intent_score = 0.5

        # 2. Lemma Coverage (Background check)
        q_lemmas = {token.lemma_.lower() for token in q_doc if not token.is_stop and not token.is_punct}
        r_lemmas = {token.lemma_.lower() for token in r_doc if not token.is_stop and not token.is_punct}
        
        lemma_score = 0.0
        if q_lemmas:
            common = q_lemmas.intersection(r_lemmas)
            lemma_score = len(common) / len(q_lemmas)

        # 3. Follow-up Bonus
        has_followup = self._check_followup(response)
        followup_bonus = 0.2 if has_followup else 0.0
        
        # Final Verification
        final_score = 0.0
        
        if expected_slots:
            # If we knew what we wanted, that matters most
            # 70% Intent + 10% Lemma + 20% Followup
            final_score = (0.7 * intent_score) + (0.1 * lemma_score) + followup_bonus
        else:
            # General chit-chat? Relies more on coverage
            final_score = (0.6 * lemma_score) + 0.2 + followup_bonus

        # Conversational Floor
        if final_score < 0.3 and len(r_lemmas) > 0:
             final_score = 0.3

        return min(float(final_score), 1.0)
