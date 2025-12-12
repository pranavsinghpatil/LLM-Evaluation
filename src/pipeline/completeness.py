import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from typing import Set

# Ensure NLTK data is downloaded (in a real app, this would be done in a setup script)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)

class CompletenessEvaluator:
    """
    Evaluates if the response addresses the key concepts in the query.
    """

    def __init__(self):
        self.stop_words = set(stopwords.words('english'))

    def _extract_keywords(self, text: str) -> Set[str]:
        """
        Extracts non-stopword tokens from the text.
        """
        tokens = word_tokenize(text.lower())
        keywords = {word for word in tokens if word.isalnum() and word not in self.stop_words}
        return keywords

    def evaluate(self, query: str, response: str) -> float:
        """
        Calculates the fraction of query keywords present in the response.

        Args:
            query (str): The user's input question.
            response (str): The LLM's generated answer.

        Returns:
            float: A score between 0.0 and 1.0.
        """
        if not query:
            return 1.0 # No query means nothing to be complete about
        
        if not response:
            return 0.0

        query_keywords = self._extract_keywords(query)
        response_keywords = self._extract_keywords(response)

        if not query_keywords:
            return 1.0 # Query had no meaningful keywords (e.g. "is it?")

        # Calculate intersection
        common_keywords = query_keywords.intersection(response_keywords)
        
        score = len(common_keywords) / len(query_keywords)
        return float(score)
