# Scaling Strategy

## 1. Horizontal Scaling
The evaluation pipeline is **stateless**.
- **Strategy**: Deploy the `main.py` logic as a Dockerized microservice (e.g., using FastAPI).
- **Scaling**: Run behind a Load Balancer (AWS ALB or Nginx). Spin up N replicas based on CPU utilization.
- **Throughput**: Since TF-IDF is CPU-bound and fast, a single t3.medium instance can handle ~50-100 req/sec.

## 2. Batch Processing
For offline analytics (evaluating yesterday's chat logs):
- **Strategy**: Use a queue (Kafka/SQS).
- **Worker**: A consumer script reads batches of 100 conversations, loads the TF-IDF model once, and processes the batch in vector space (using matrix operations instead of single loops) for 100x speedup.

## 3. Caching
- **Strategy**: Cache the "Relevance Score" for identical Query-Response pairs.
- **Tool**: Redis.
- **Hit Rate**: High for FAQs.

## 4. Model Optimization
- **Strategy**: If we upgrade to BERT, we will use **ONNX Runtime** or **Quantization** (int8) to reduce inference time from ~200ms to ~50ms.
