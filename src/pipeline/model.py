import spacy
import subprocess
import sys

class LazyNLP:
    """
    Lazy loader for Spacy model.
    Defers loading until the first actual usage to prevent server timeouts during startup.
    """
    def __init__(self, model_name="en_core_web_md"):
        self.model_name = model_name
        self._model = None

    def _load(self):
        if self._model:
            return
            
        print(f"Lazy Loading Spacy Model ({self.model_name})...")
        try:
            # 1. Try direct import (fastest/cleanest for prod)
            import en_core_web_md
            self._model = en_core_web_md.load()
            print("Model loaded via package import.")
        except ImportError:
            try:
                # 2. Try spacy registry
                self._model = spacy.load(self.model_name)
                print("Model loaded via spacy.load().")
            except OSError:
                # 3. Fallback: Download runtime
                print("Model not found. Downloading...")
                subprocess.run([sys.executable, "-m", "spacy", "download", self.model_name])
                self._model = spacy.load(self.model_name)
                print("Model downloaded and loaded.")

    def __call__(self, *args, **kwargs):
        self._load()
        return self._model(*args, **kwargs)

    def __getattr__(self, name):
        self._load()
        return getattr(self._model, name)

# Global singleton is now an instance of LazyNLP
# This is lightweight and initializes instantly.
nlp = LazyNLP("en_core_web_md")
