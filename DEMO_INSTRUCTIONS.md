# LLM Evaluation Pipeline - Demo Instructions

This project now includes a modern **Frontend Web Application** to visualize the evaluation pipeline, in addition to the standard CLI.

## Why a Frontend?
For a demo or selection process, a frontend provides:
1.  **Transparency**: Visualizes the "black box" metrics (Relevance, Completeness, Hallucination).
2.  **Interactivity**: Allows the user to play with different inputs and see results in real-time.
3.  **Aesthetics**: Demonstrates "product-minded" engineering with a polished UI.

## How to Run the Demo

You need two terminals.

### Terminal 1: Start the Backend API
This runs the evaluation logic.

```bash
# Make sure you are in the root directory
python src/api.py
```
*The API will start on http://localhost:8000*

### Terminal 2: Start the Frontend UI
This runs the web interface.

```bash
cd frontend
npm run dev
```
*The UI will start on http://localhost:5173*

## Features
- **Real-time Evaluation**: Enter a query, response, and context to get immediate scores.
- **File Upload Support**: Upload `conversation.json` and `context.json` files directly (supports complex formats).
- **Visual Metrics**: Color-coded score cards for quick assessment.
- **Verdict Explanation**: Detailed breakdown of why a response passed or failed.
- **JSON Inspection**: View the raw JSON output for technical deep-dives.
- **Educational Mode**: "How it Works" page explains the inner workings of the pipeline.

## CLI Usage (Original)
If you prefer the command line:
```bash
python src/main.py --conv samples/sample-chat-1.json --ctx samples/sample-context-1.json --out report.json
```
