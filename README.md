# *`smart-amazon-listing-analyzer`*

*a basic implementation of retrieval augmented generation (RAG) using a vector database (chromaDB) for semantic search*

## features

- **`AI-Powered Analysis`**: Uses OpenRouter API for intelligent listing evaluation
- **`Vector Search`**: ChromaDB retrieves relevant Amazon best practices
- **`Real-time Feedback`**: Get instant improvement suggestions
- **`Multiple Metrics`**: Scores for keywords, readability, compliance, and overall quality
- **`Streaming Responses`**: Watch analysis generate in real-time

## stack

```
backend:
- FastAPI (Python web framework)
- ChromaDB (vector database for best practices)
- Sentence Transformers (embeddings for vector search)
- OpenRouter API (LLM access)

frontend:
- Next.js 14 with TypeScript
- Tailwind CSS (styling)
- Axios (HTTP client)
```

## structure
```
smart-amazon-analyzer/
├── backend/
│   ├── app/
│   │   ├── analyzer.py (AI analysis logic)
│   │   └── chroma_setup.py (vector database)
│   ├── main.py (FastAPI server)
│   └── requirements.txt
└── frontend/
    ├── pages/
    │   └── index.tsx (main interface)
    └── package.json
```

## run 

```
docker-compose up
```
