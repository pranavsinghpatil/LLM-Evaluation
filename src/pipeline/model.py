import spacy
import subprocess
import sys

# Singleton NLP loader
print("Loading Spacy Model (en_core_web_md)...")

try:
    nlp = spacy.load("en_core_web_md")
    print("Model loaded successfully.")
except OSError:
    print("Model not found. Downloading...")
    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_md"])
    nlp = spacy.load("en_core_web_md")
    print("Model downloaded and loaded.")
