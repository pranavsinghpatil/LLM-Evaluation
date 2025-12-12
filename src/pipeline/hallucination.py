from typing import List, Set
import nltk
from nltk.util import ngrams

class HallucinationEvaluator:
    """
    Evaluates the hallucination level by checking if the response is grounded in the context.
    Uses N-gram overlap as a proxy for entailment.
    """

    def __init__(self, n: int = 1):
        """
        Args:
            n (int): The size of n-grams to check (default=1 for unigrams).
        """
        self.n = n

    def _get_ngrams(self, text: str) -> Set[str]:
        """Generates a set of n-grams from the text."""
        tokens = nltk.word_tokenize(text.lower())
        if len(tokens) < self.n:
            return set()
        return set(ngrams(tokens, self.n))

    def evaluate(self, response: str, context: List[str]) -> float:
        """
        Computes a hallucination score based on n-gram overlap.
        
        Score = 1.0 - (Overlapping N-grams / Total Response N-grams)
        
        0.0 = Fully grounded (Good)
        1.0 = Completely hallucinated (Bad)

        Args:
            response (str): The LLM's generated answer.
            context (List[str]): A list of retrieved context strings.

        Returns:
            float: Hallucination score (0.0 to 1.0).
        """
        if not response:
            return 0.0 # Empty response cannot hallucinate
        
        if not context:
            return 1.0 # No context provided -> everything is technically "unsupported" by context

        # Combine all context chunks into one large text for checking
        full_context = " ".join(context)
        
        response_ngrams = self._get_ngrams(response)
        context_ngrams = self._get_ngrams(full_context)

        if not response_ngrams:
            # Response is too short to have n-grams (e.g., "Yes.")
            # Fallback: Check if the simple words exist in context
            return 0.0 if response.lower() in full_context.lower() else 1.0

        # Calculate overlap
        overlap = response_ngrams.intersection(context_ngrams)
        
        grounding_score = len(overlap) / len(response_ngrams)
        hallucination_score = 1.0 - grounding_score
        
        return float(hallucination_score)
