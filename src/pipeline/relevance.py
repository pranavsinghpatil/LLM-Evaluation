import math
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RelevanceEvaluator:
    """
    Evaluates the relevance of a response to a user query using TF-IDF and Cosine Similarity.
    """

    def __init__(self):
        """
        Initialize the TF-IDF vectorizer.
        """
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def evaluate(self, query: str, response: str) -> float:
        """
        Computes the cosine similarity between the query and the response.

        Args:
            query (str): The user's input question.
            response (str): The LLM's generated answer.

        Returns:
            float: A score between 0.0 (irrelevant) and 1.0 (highly relevant).
        """
        if not query or not response:
            return 0.0

        try:
            # Fit and transform the query and response
            tfidf_matrix = self.vectorizer.fit_transform([query, response])
            
            # Compute cosine similarity
            # tfidf_matrix[0] is the query vector, tfidf_matrix[1] is the response vector
            cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # Compute Jaccard Similarity (Set overlap) as a fallback/booster
            q_tokens = set(query.lower().split())
            r_tokens = set(response.lower().split())
            intersection = len(q_tokens.intersection(r_tokens))
            union = len(q_tokens.union(r_tokens))
            jaccard_sim = intersection / union if union > 0 else 0.0

            # Return the average to balance keyword overlap vs term frequency importance
            return float((cosine_sim + jaccard_sim) / 2)
        except ValueError:
            # Handle cases where vocabulary is empty (e.g., only stop words)
            return 0.0
