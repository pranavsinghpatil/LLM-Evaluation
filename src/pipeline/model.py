import spacy
import subprocess
import sys

# Singleton NLP loader
print("Loading Spacy Model (en_core_web_md)...")

try:
    # First try loading the directly installed package
    import en_core_web_md
    nlp = en_core_web_md.load()
    print("Model loaded via package import.")
except ImportError:
    try:
        nlp = spacy.load("en_core_web_md")
        print("Model loaded via spacy.load().")
    except OSError:
        print("Model not found. Downloading...")
        subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_md"])
        nlp = spacy.load("en_core_web_md")
        print("Model downloaded and loaded.")
