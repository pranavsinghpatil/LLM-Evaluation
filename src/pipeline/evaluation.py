from typing import Dict, List, Any
from .relevance import RelevanceEvaluator
from .completeness import CompletenessEvaluator
from .hallucination import HallucinationEvaluator
from .latency_cost import CostEvaluator

class Pipeline:
    """
    Orchestrates the evaluation modules.
    """

    def __init__(self):
        self.relevance_evaluator = RelevanceEvaluator()
        self.completeness_evaluator = CompletenessEvaluator()
        self.hallucination_evaluator = HallucinationEvaluator()
        self.cost_evaluator = CostEvaluator()

    def run(self, query: str, response: str, context: List[str]) -> Dict[str, Any]:
        """
        Runs all evaluators and returns a structured report.
        """
        self.cost_evaluator.start_timer()

        # 1. Relevance
        relevance_score = self.relevance_evaluator.evaluate(query, response)

        # 2. Completeness
        completeness_score = self.completeness_evaluator.evaluate(query, response)

        # 3. Hallucination
        hallucination_score = self.hallucination_evaluator.evaluate(response, context)

        self.cost_evaluator.stop_timer()
        
        # 4. Latency & Cost
        latency_ms = self.cost_evaluator.get_latency_ms()
        cost_usd = self.cost_evaluator.estimate_cost(query + response + "".join(context))

        # 5. Verdict Logic
        verdict = "PASS"
        reasons = []

        if hallucination_score > 0.5:
            verdict = "FAIL"
            reasons.append("High hallucination risk")
        
        if relevance_score < 0.1:
            verdict = "FAIL"
            reasons.append("Low relevance")
        
        if verdict == "PASS" and completeness_score < 0.6:
            verdict = "WARN"
            reasons.append("Incomplete answer")

        return {
            "metrics": {
                "relevance": round(relevance_score, 4),
                "completeness": round(completeness_score, 4),
                "hallucination": round(hallucination_score, 4),
                "latency_ms": round(latency_ms, 2),
                "estimated_cost_usd": round(cost_usd, 6)
            },
            "verdict": {
                "status": verdict,
                "reasons": reasons
            }
        }
