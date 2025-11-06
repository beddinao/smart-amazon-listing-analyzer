from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.analyzer import AmazonAnalyzer
import os
from dotenv import load_dotenv
import json
import asyncio

# Load environment variables
load_dotenv()

app = FastAPI(title="Smart Amazon Listing Analyzer")

# Get environment variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    product_title: str
    product_description: str

@app.post("/analyze")
async def analyze_listing(request: AnalysisRequest):
    """Analyze Amazon listing with ChromaDB integration"""
    analyzer = AmazonAnalyzer(OPENROUTER_API_KEY)
    result = analyzer.analyze_listing(request.product_title, request.product_description)
    return result

@app.post("/analyze-stream")
async def analyze_listing_stream(request: AnalysisRequest):
    """Streaming analysis endpoint"""
    analyzer = AmazonAnalyzer(OPENROUTER_API_KEY)
    
    async def generate():
        # Simulate streaming by yielding chunks
        result = analyzer.analyze_listing(request.product_title, request.product_description)
        
        if result["status"] == "success":
            # Yield analysis in chunks for streaming effect
            if "analysis" in result:
                yield f"data: {json.dumps({'type': 'analysis', 'content': result['analysis']})}\n\n"
            else:
                for key in ['keyword_analysis', 'readability_analysis', 'competitor_analysis', 'compliance_analysis']:
                    if key in result:
                        yield f"data: {json.dumps({'type': key, 'content': result[key]})}\n\n"
                        await asyncio.sleep(0.5)
                
                if 'top_improvements' in result:
                    yield f"data: {json.dumps({'type': 'improvements', 'content': result['top_improvements']})}\n\n"
                
                if 'best_practices_used' in result:
                    yield f"data: {json.dumps({'type': 'best_practices', 'content': result['best_practices_used']})}\n\n"
            
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
        else:
            yield f"data: {json.dumps({'type': 'error', 'content': result['message']})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "chromadb": "initialized"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
