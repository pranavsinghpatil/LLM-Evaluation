import time

class CostEvaluator:
    """
    Tracks the latency and estimated cost of the operation.
    """

    def __init__(self):
        self.start_time = 0
        self.end_time = 0
        # Approximate cost per 1k tokens (e.g., GPT-3.5 input/output avg)
        self.cost_per_1k_tokens = 0.002 

    def start_timer(self):
        self.start_time = time.time()

    def stop_timer(self):
        self.end_time = time.time()

    def get_latency_ms(self) -> float:
        return (self.end_time - self.start_time) * 1000

    def estimate_cost(self, text: str) -> float:
        """
        Rough estimate of cost based on character count (4 chars ~= 1 token).
        """
        num_chars = len(text)
        num_tokens = num_chars / 4
        cost = (num_tokens / 1000) * self.cost_per_1k_tokens
        return cost
