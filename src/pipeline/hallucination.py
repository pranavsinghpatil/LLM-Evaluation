from typing import List, Set
import nltk
from nltk.util import ngrams

import spacy
from typing import List, Set
import nltk
from nltk.util import ngrams

# Load Spacy model (lightweight English model)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback if model isn't downloaded yet (shouldn't happen if setup run)
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

class HallucinationEvaluator:
    """
    Evaluates hallucination using two methods:
    1. N-gram overlap (Surface level)
    2. Named Entity Recognition (NER) Consistency (Fact level)
    """

    def __init__(self, n: int = 1):
        self.n = n

    def _get_ngrams(self, text: str) -> Set[str]:
        tokens = nltk.word_tokenize(text.lower())
        if len(tokens) < self.n:
            return set()
        return set(ngrams(tokens, self.n))

    def _extract_entities(self, text: str) -> Set[str]:
        """Extracts proper nouns and numbers using Spacy."""
        doc = nlp(text)
        # Filter for entities like PERSON, ORG, GPE, DATE, etc.
        entities = {ent.text.lower() for ent in doc.ents}
        return entities

    def evaluate(self, response: str, context: List[str]) -> float:
        """
        Computes a weighted hallucination score.
        
        Score = 0.6 * (Entity Error Rate) + 0.4 * (N-gram Error Rate)
        
        Args:
            response (str): The LLM's generated answer.
            context (List[str]): A list of retrieved context strings.

        Returns:
            float: Hallucination score (0.0 to 1.0).
        """
        if not response:
            return 0.0
        
        if not context:
            return 1.0

        full_context = " ".join(context)
        
        # 1. N-gram Check (Surface)
        response_ngrams = self._get_ngrams(response)
        context_ngrams = self._get_ngrams(full_context)
        
        ngram_score = 0.0
        if response_ngrams:
            overlap = response_ngrams.intersection(context_ngrams)
            ngram_score = 1.0 - (len(overlap) / len(response_ngrams))
        
        # 2. Entity Check (Deep)
        response_entities = self._extract_entities(response)
        context_entities = self._extract_entities(full_context)
        
        entity_score = 0.0
        if response_entities:
            # Check which entities in response are NOT in context
            unsupported_entities = response_entities - context_entities
            entity_score = len(unsupported_entities) / len(response_entities)
        else:
            # If no entities, rely solely on N-grams
            return float(ngram_score)

        # Weighted Average (Entities matter more for "facts")
        final_score = (0.6 * entity_score) + (0.4 * ngram_score)
        
        return float(final_score)
