
import unittest
import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from pipeline.hallucination import HallucinationEvaluator

class TestHallucinationUpgraded(unittest.TestCase):
    def setUp(self):
        # Initialize with 'claims' mode (default)
        self.evaluator = HallucinationEvaluator(mode="claims")

    def test_numeric_deviation(self):
        """Test Case 1: Numeric Deviation (Silent Hallucination)"""
        context = ["The price is $100."]
        response = "The price is $150."
        
        # Expectation: High Hallucination Score
        # Old system would give low score due to n-gram overlap.
        # New system should flag $150 as unsupported.
        score = self.evaluator.evaluate(response, context)
        print(f"\nTest 1 (Numeric Deviation): Score = {score}")
        self.assertGreater(score, 0.5, "Numeric deviation should be penalized heavily.")

    def test_entity_action_mismatch(self):
        """Test Case 2: Entity Action Mismatch (Relational Error)"""
        context = ["Google released the Pixel phone."]
        response = "Microsoft released the Pixel phone."
        
        # Expectation: High Hallucination Score
        # 'Microsoft' is an anchor not found in context.
        score = self.evaluator.evaluate(response, context)
        print(f"Test 2 (Entity Action Mismatch): Score = {score}")
        # Microsoft is the Subject of an SVO claim. It shouldn't be found.
        self.assertGreater(score, 0.0, "Unsupported entity claim should be penalized.")

    def test_supported_paraphrase(self):
        """Test Case 3: Supported Paraphrase (Good Answer)"""
        # We ensure the number is exact match (comma normalized) to test logic foundation
        # without needing complex unit conversion (k -> 000) yet.
        context = ["The car costs 50,000."]
        response = "The vehicle price is 50,000."
        
        # Expectation: Low Hallucination Score
        # 50,000 matches 50,000 (after comma stripping if needed, or direct)
        # N-grams (car/vehicle, costs/price) mismatch, so drift score might be non-zero
        # but claim score should be 0.0.
        
        score = self.evaluator.evaluate(response, context)
        print(f"Test 3 (Supported Paraphrase): Score = {score}")
        self.assertLess(score, 0.5, "Supported paraphrase should have low penalty.")

    def test_hedging_verbs_ignored(self):
        """Test Case 4: Hedging Verbs (Should not be verified)"""
        context = ["The revenue is unknown."]
        response = "The revenue may be around 1 million."
        
        # '1 million' is numeric, so it will be checked and fail (correct).
        # But 'may be' claim should NOT be extracted as an SVO anchor.
        
        anchors = self.evaluator._extract_anchors(response)
        print(f"Test 4 Anchors: {[a['text'] for a in anchors]}")
        
        # Check that no 'claim' type anchor exists for 'may be'
        claim_anchors = [a for a in anchors if a['type'] == 'claim']
        self.assertEqual(len(claim_anchors), 0, "Hedging verbs should not trigger claim extraction.")

if __name__ == '__main__':
    unittest.main()
