import nltk
import whisper
import google.generativeai as genai
import streamlit as st
import os
import warnings
import tempfile


# Silence unnecessary warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings("ignore", category=UserWarning, module="whisper")
warnings.filterwarnings("ignore", category=RuntimeWarning, module="torch")

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab', quiet=True)  # Silent install
    nltk.download('punkt', quiet=True)  # Core sentence tokenizer

st.set_page_config(page_title="Podcast Summarizer")
genai.configure(api_key="AIzaSyAYqEVojzmSLv101fVPvEzDHLhpuR7SYso")  # Get key: https://ai.google.dev/

def transcribe_with_timestamps(audio_path):
    model = whisper.load_model("small")  # Balance speed/accuracy
    result = model.transcribe(audio_path, verbose=False)
    return [
        {"start": seg["start"], "text": seg["text"]} 
        for seg in result["segments"]
    ]

def chunk_segments(segments, max_chars=3000):
    nltk.download('punkt', quiet=True)  # Redundant but safe
    from nltk import sent_tokenize  # Import AFTER download
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for seg in segments:
        sentences = sent_tokenize(seg["text"])
        for sent in sentences:
            if current_length + len(sent) > max_chars:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_length = 0
            current_chunk.append(f"[{seg['start']}] {sent}")
            current_length += len(sent)
    return chunks



def summarize_chunk(chunk):
    st.write(f"Chunk length: {len(chunk)} chars")  # Debug output
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(
            f"Create concise timestamped summary from this transcript chunk:\n\n{chunk[:30000]}"  # Safety trim
        )
        return response.text
    except Exception as e:
        return f"Error: {str(e)}"

def mn():
    st.title("Podcast Summarizer")
    audio = st.file_uploader("Upload MP3/WAV", type=["mp3", "wav"])
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
        temp_audio.write(audio.read())
        temp_audio_path = temp_audio.name
    
    if audio:
        with st.spinner("Transcribing..."):
            segments = transcribe_with_timestamps(temp_audio_path)
    
        if not segments:  # Add validation
            st.error("Transcription failed")
            return
    
        with st.spinner("Summarizing..."):
            try:
                chunks = chunk_segments(segments)
                summaries = []
                for chunk in chunks:
                    summary = summarize_chunk(chunk)
                    summaries.append(summary)
                
                st.subheader("Summary")
                for summary in summaries:
                    st.write(summary)
                
            except Exception as e:
                st.error(f"Summarization failed: {str(e)}")  # Surface errors

def main():
    st.title("Podcast Summarizer")
    audio = st.file_uploader("Upload MP3/WAV", type=["mp3", "wav"])

    if not audio:  # Check if a file is uploaded
        st.warning("Please upload an audio file to proceed.")
        return  # Stop execution

    with st.spinner("Processing audio..."):
        try:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
                temp_audio.write(audio.read())  # Safe file handling
                temp_audio_path = temp_audio.name
            
            segments = transcribe_with_timestamps(temp_audio_path)

            if not segments:
                st.error("Transcription failed.")
                return

            with st.spinner("Summarizing..."):
                chunks = chunk_segments(segments)
                summaries = [summarize_chunk(chunk) for chunk in chunks]

                st.subheader("Summary")
                for summary in summaries:
                    st.write(summary)

        except Exception as e:
            st.error(f"An error occurred: {str(e)}")


if __name__ == "__main__":
    main()