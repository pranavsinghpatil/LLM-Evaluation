import argparse
import json
import sys
import os
from pipeline.evaluation import Pipeline

def load_json(path: str):
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found at {path}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON at {path}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="LLM Response Evaluation Pipeline")
    parser.add_argument("--conv", required=True, help="Path to conversation JSON (query + response)")
    parser.add_argument("--ctx", required=True, help="Path to context JSON (retrieved chunks)")
    parser.add_argument("--out", default="report.json", help="Path to output JSON report")
    
    args = parser.parse_args()

    # Load Data
    conv_data = load_json(args.conv)
    ctx_data = load_json(args.ctx)

    # Extract fields (assuming a specific schema, but robust to minor variations)
    query = conv_data.get("query") or conv_data.get("user_message")
    response = conv_data.get("response") or conv_data.get("assistant_message")
    context = ctx_data.get("context") or ctx_data.get("chunks")

    if not query or not response:
        print("Error: Conversation JSON must contain 'query' and 'response' fields.")
        sys.exit(1)
    
    if not isinstance(context, list):
        print("Error: Context JSON must contain a 'context' list.")
        sys.exit(1)

    # Run Pipeline
    print(f"Starting evaluation for query: '{query[:50]}...'")
    pipeline = Pipeline()
    report = pipeline.run(query, response, context)

    # Output
    with open(args.out, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"Evaluation complete. Report saved to {args.out}")
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
