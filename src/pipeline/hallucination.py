from typing import List, Set
import nltk
from nltk.util import ngrams

import spacy
from typing import List, Set
import nltk
from nltk.util import ngrams

# Load Spacy model (Medium model used for vectors)
from .model import nlp

class HallucinationEvaluator:
    """
    Evaluates hallucination using two methods:
    1. N-gram overlap (Surface level)
    2. Named Entity Recognition (NER) Consistency (Fact level)

    LIMITATIONS:
    - N-grams don't understand numerical deviation (100 vs 1000).
    - Entity presence != Claim support ("Google is here" vs "Google bought X").
    - TODO: Upgrade to Claim-Based Verification (Phase 2).
    """

    # Verbs that imply a factual claim (Assertive)
    # MUST include base forms (lemmas) as Spacy uses lemmas for matching
    ASSERTIVE_VERBS = {
        "be", "is", "are", "was", "were", 
        "cost", "costs", 
        "include", "includes", "included",
        "offer", "offers", "offered", 
        "release", "released", "releases", 
        "announce", "announced",
        "acquire", "acquired", 
        "buy", "bought", 
        "sell", "sold", 
        "win", "won", 
        "lose", "lost", 
        "found", "founded", 
        "locate", "located"
    }
    
    # ... (HEDGING_VERBS unchanged)

    # ... (__init__ to _extract_anchors start unchanged)

    def _normalize_numeric_value(self, val: str) -> float:
        """
        Converts string numbers (10k, $5M, 1,000) to floats.
        Returns None if conversion fails.
        """
        if not val:
            return None
            
        # Remove currency symbols and commas
        clean_val = val.lower().replace("$", "").replace("€", "").replace("£", "").replace(",", "").strip()
        
        # Handle suffixes
        multiplier = 1.0
        if clean_val.endswith("k"):
            multiplier = 1000.0
            clean_val = clean_val[:-1]
        elif clean_val.endswith("m"):
            multiplier = 1000000.0
            clean_val = clean_val[:-1]
        elif clean_val.endswith("b"):
            multiplier = 1000000000.0
            clean_val = clean_val[:-1]
            
        try:
            return float(clean_val) * multiplier
        except ValueError:
            return None

    def _verify_anchor(self, anchor: dict, context_text: str) -> bool:
        """
        Checks if an anchor is supported by the context.
        Returns True if supported, False if unsupported.
        """
        # 1. Numeric Verification
        if anchor["type"] == "numeric":
            val = anchor["value"]
            
            # A. Direct String Match (Fast & Simple)
            # Remove "pure" formatting chars like commas
            val_simple = val.replace(",", "")
            if val in context_text or val_simple in context_text:
                return True
                
            # B. Semantic Numeric Match (e.g. 10k == 10,000)
            anchor_num = self._normalize_numeric_value(val)
            if anchor_num is not None:
                # Scan context for numbers that might match
                # This is expensive so we rely on regex for candidates
                import re
                # Find all potential number-like tokens in context
                # Matches: $100, 100k, 100.00, 100,000
                candidates = re.findall(r'[\$£€]?\d+(?:[\.,]\d+)?[kmbKMB]?', context_text)
                
                for cand in candidates:
                    cand_num = self._normalize_numeric_value(cand)
                    if cand_num is not None:
                        # Allow small tolerance
                        if abs(cand_num - anchor_num) < 0.01:
                            return True
                            
            # C. Percentage Formatting
            if "%" in val:
                val_num = val.replace("%", "").strip()
                if f"{val_num} percent" in context_text:
                    return True
                    
            return False

        # 2. Date Verification
        if anchor["type"] == "date":
            # Direct match
            if anchor["value"] in context_text:
                return True
            
            # Simple Date Normalization
            val = anchor["value"]
            val_clean = val.replace(",", "").replace("st", "").replace("nd", "").replace("rd", "").replace("th", "")
            if val_clean in context_text:
                return True
                
            # Month Mapping
            months_map = {
                "january": "01", "jan": "01", 
                "february": "02", "feb": "02",
                "march": "03", "mar": "03", 
                "april": "04", "apr": "04",
                "may": "05", 
                "june": "06", "jun": "06", 
                "july": "07", "jul": "07",
                "august": "08", "aug": "08", 
                "september": "09", "sep": "09", "sept": "09",
                "october": "10", "oct": "10", 
                "november": "11", "nov": "11", 
                "december": "12", "dec": "12"
            }
            
            val_lower = val.lower()
            
            # 1. Try to detect text-month in Anchor
            detected_month_num = None
            detected_month_name = None
            
            for m_name, m_num in months_map.items():
                # Simple substring check
                if m_name in val_lower:
                    detected_month_num = m_num
                    detected_month_name = m_name
                    break
            

            # ... (Month detection logic)
            if detected_month_num:
                # Try to extract day
                import re
                day_match = re.search(r'(\d+)(?:st|nd|rd|th)?', val_lower)
                if day_match:
                    day_val = day_match.group(1).zfill(2)
                    # Construct numeric patterns: MM-DD
                    pat_num1 = f"{detected_month_num}-{day_val}"
                    pat_num2 = f"{detected_month_num}/{day_val}"
                    
                    if pat_num1 in context_text or pat_num2 in context_text:
                        return True
            
            # Smart Year Check

            years = re.findall(r'\b(19|20)\d{2}\b', val)
            if years:
                for year in years:
                    if year not in context_text:
                        return False 
                return True 
            
            return False 

        # 3. Claim (SVO) Verification
        if anchor["type"] == "claim":
            subj, verb, obj = anchor["components"]
            subj = subj.lower()
            obj = obj.lower()
            
            if subj not in context_text:
                return False
                
            if obj not in context_text:
                return False
                
            # Distance check
            import re
            subj_indices = [m.start() for m in re.finditer(re.escape(subj), context_text)]
            obj_indices = [m.start() for m in re.finditer(re.escape(obj), context_text)]
            
            for s_idx in subj_indices:
                for o_idx in obj_indices:
                    diff = abs(s_idx - o_idx)
                    if diff < 300:
                        return True
            
            return False 


            
        return True
    HEDGING_VERBS = {
        "may", "might", "could", "can", "appears", "seems", "suggests", 
        "estimated", "likely", "possibly", "probably"
    }

    def __init__(self, n: int = 1, mode: str = "claims"):
        """
        Args:
            n (int): N-gram size for surface checking.
            mode (str): 'legacy' (surface/entity) or 'claims' (deep verification).
        """
        self.n = n
        self.mode = mode

    def _get_ngrams(self, text: str) -> Set[str]:
        tokens = nltk.word_tokenize(text.lower())
        if len(tokens) < self.n:
            return set()
        return set(ngrams(tokens, self.n))

    def _extract_entities(self, text: str) -> Set[str]:
        """Legacy extraction for 'legacy' mode."""
        doc = nlp(text)
        return {ent.text.lower() for ent in doc.ents}

    def _extract_anchors(self, text: str) -> List[dict]:
        """
        Extracts verifiable facts (Anchors) from text.
        Includes:
        1. Numerical Values (MONEY, CARDINAL, QUANTITY)
        2. Dates (DATE)
        3. Subject-Verb-Object Triplets (only with ASSERTIVE verbs)
        """
        doc = nlp(text)
        anchors = []

        # 1. Extract Named Entities & Numbers
        for ent in doc.ents:
            if ent.label_ in ["MONEY", "CARDINAL", "QUANTITY", "DATE", "TIME", "PERCENT"]:
                anchors.append({
                    "type": "numeric" if ent.label_ != "DATE" else "date",
                    "text": ent.text,
                    "value": ent.text.lower(),
                    "span": (ent.start_char, ent.end_char)
                })

        # 2. Extract Action/Assertion Claims (Dependency Parse)
        # Look for Subject + Verb + Object
        for token in doc:
            # Check if token is a verb and strict match for assertive verbs
            if token.pos_ == "VERB" and token.lemma_.lower() in self.ASSERTIVE_VERBS:
                
                # Find Subject (nsubj) and Object (dobj, attr, prep+pobj)
                subj = None
                obj = None
                
                for child in token.children:
                    if child.dep_ in ["nsubj", "nsubjpass"]:
                        subj = child
                    if child.dep_ in ["dobj", "attr", "acomp"]:
                        obj = child
                
                # If direct object missing, check for prepositional object (e.g. "located in Paris")
                if not obj:
                    for child in token.children:
                        if child.dep_ == "prep":
                            for grandchild in child.children:
                                if grandchild.dep_ == "pobj":
                                    obj = grandchild
                                    break

                if subj and obj:
                    # Construct the claim
                    claim_text = f"{subj.text} {token.text} {obj.text}"
                    anchors.append({
                        "type": "claim",
                        "text": claim_text,
                        "components": (subj.text, token.text, obj.text),
                        "span": (subj.idx, obj.idx + len(obj.text))
                    })
        
        return anchors

    def evaluate(self, response: str, context: List[str]) -> dict:
        """
        Dispatches evaluation based on selected mode.
        Returns: dict with 'score' and 'unsupported_claims'
        """
        if not response:
            return {"score": 0.0, "unsupported_claims": []}
        if not context:
            return {"score": 1.0, "unsupported_claims": [{"type": "context", "text": "No context provided", "reason": "Cannot verify claims without context"}]}

        if self.mode == "legacy":
            score = self._evaluate_legacy(response, context)
            return {"score": score, "unsupported_claims": []}
        else:
            score, claims = self._evaluate_claims(response, context)
            return {"score": score, "unsupported_claims": claims}

    def _evaluate_legacy(self, response: str, context: List[str]) -> float:
        """
        DEPRECATED: Old heuristic scoring using entity & n-gram overlap.
        """
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
        
        # Simple set difference of proper nouns
        unsupported_fact_ratio = 0.0
        if response_entities:
            unsupported_entities = response_entities - context_entities
            unsupported_fact_ratio = len(unsupported_entities) / len(response_entities)
        else:
            return float(ngram_score)

        return float((0.6 * unsupported_fact_ratio) + (0.4 * ngram_score))

    def _evaluate_claims(self, response: str, context: List[str]) -> tuple:
        """
        Claim-Based Verification with detailed reporting.
        Returns: (score, unsupported_claims_list)
        """
        full_context_text = " ".join(context).lower()
        
        # Step 1: Extract Anchors
        anchors = self._extract_anchors(response)
        
        # If no verifiable claims are made, we can't fact-check.
        if not anchors:
            drift_score = self._get_topic_drift_score(response, context)
            return (drift_score, [])

        # Step 2: Verification (Evidence Matching)
        total_weight = 0.0
        error_weight = 0.0
        unsupported_claims = []
        
        for anchor in anchors:
            # Assign weights
            weight = 1.0 if anchor["type"] in ["numeric", "date"] else 0.5
            total_weight += weight
            
            is_supported = self._verify_anchor(anchor, full_context_text)
            if not is_supported:
                error_weight += weight
                # Track the unsupported claim for reporting
                unsupported_claims.append({
                    "type": anchor["type"],
                    "text": anchor["text"],
                    "reason": f"'{anchor['text']}' not found in context"
                })
        
        # Step 3: Calculation
        if total_weight > 0:
            claim_error_rate = error_weight / total_weight
        else:
            claim_error_rate = 0.0
        
        # Step 4: Topic Drift Gate
        drift_penalty = self._get_topic_drift_score(response, context)
        final_score = max(claim_error_rate, drift_penalty if claim_error_rate == 0 else 0)
        
        return (float(final_score), unsupported_claims)




    def _get_topic_drift_score(self, response: str, context: List[str]) -> float:
        """Calculates simple N-gram overlap for topic drift detection."""
        full_context = " ".join(context)
        response_ngrams = self._get_ngrams(response)
        if not response_ngrams: 
            return 0.0 # No text, no drift? Or 1.0?
            
        context_ngrams = self._get_ngrams(full_context)
        overlap = response_ngrams.intersection(context_ngrams)
        overlap_ratio = len(overlap) / len(response_ngrams)
        
        # If overlap is very low (< 0.2), assume topic drift
        if overlap_ratio < 0.2:
            return 0.2 # Small penalty
        return 0.0
