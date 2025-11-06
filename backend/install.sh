#/bin/bash

pip install --upgrade pip
pip install fastapi uvicorn python-multipart

# HTTP clients
pip install requests httpx

# Environment variables
pip install python-dotenv

# Data processing
pip install numpy pydantic

# ChromaDB with explicit CPU dependencies
pip install chromadb --no-deps
pip install duckdb posthog pypika onnxruntime

# Install CPU-only PyTorch
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Then sentence transformers and langchain
pip install sentence-transformers
pip install langchain
