from sentence_transformers import SentenceTransformer
import requests
import json
from typing import List, Dict
from .chroma_setup import collection, embedding_model

class AmazonAnalyzer:
    def __init__(self, openrouter_api_key: str):
        self.openrouter_api_key = openrouter_api_key
        self.embedding_model = embedding_model
        
    def get_relevant_best_practices(self, query: str, n_results: int = 5) -> List[str]:
        """Retrieve relevant best practices from ChromaDB"""
        try:
            # Encode query
            query_embedding = self.embedding_model.encode(query).tolist()
            
            # Query ChromaDB
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            return results['documents'][0] if results['documents'] else []
        except Exception as e:
            print(f"Error querying ChromaDB: {e}")
            # Return default best practices if ChromaDB fails
            return [
                "Use primary keywords in the product title first 50 characters",
                "Include secondary keywords in bullet points and description",
                "Keep title under 200 characters for mobile optimization",
                "Use all available image slots with high-quality photos",
                "Write bullet points that focus on benefits not just features"
            ]
    
    def analyze_listing(self, title: str, description: str) -> Dict:
        """Analyze Amazon listing using OpenRouter and ChromaDB"""
        
        # Get relevant best practices
        best_practices = self.get_relevant_best_practices(f"{title} {description}")
        
        # Create enhanced prompt with best practices
        prompt = f"""
        Analyze this Amazon product listing and provide specific, actionable improvement suggestions.

        PRODUCT TITLE: {title}
        PRODUCT DESCRIPTION: {description}

        RELEVANT BEST PRACTICES:
        {chr(10).join(f"- {practice}" for practice in best_practices)}

        ANALYSIS CRITERIA:
        1. KEYWORD OPTIMIZATION: Check primary/secondary keyword usage, placement, and density
        2. READABILITY: Assess clarity, scannability, and emotional appeal  
        3. COMPETITOR STRENGTHS: Identify missing elements that competitors likely have
        4. BEST-PRACTICE COMPLIANCE: Rate compliance with Amazon listing standards

        Provide your response in this exact JSON format:
        {{
            "keyword_score": 0-100,
            "readability_score": 0-100,
            "compliance_score": 0-100,
            "overall_score": 0-100,
            "keyword_analysis": "detailed analysis text",
            "readability_analysis": "detailed analysis text", 
            "competitor_analysis": "detailed analysis text",
            "compliance_analysis": "detailed analysis text",
            "top_improvements": ["improvement1", "improvement2", "improvement3", "improvement4", "improvement5"]
        }}

        Be brutally honest and specific with improvements.
        """
        
        # Call OpenRouter API
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 2000,
            "temperature": 0.1
        }
        
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis_text = result["choices"][0]["message"]["content"]
                
                # Parse JSON response
                try:
                    analysis_data = json.loads(analysis_text)
                    # Ensure best_practices_used is always included
                    analysis_data["best_practices_used"] = best_practices
                    analysis_data["status"] = "success"
                    return analysis_data
                except json.JSONDecodeError:
                    # Fallback if JSON parsing fails
                    return {
                        "status": "success",
                        "analysis": analysis_text,
                        "best_practices_used": best_practices,
                        "keyword_score": 0,
                        "readability_score": 0,
                        "compliance_score": 0,
                        "overall_score": 0,
                        "keyword_analysis": "Analysis completed but format was unexpected",
                        "readability_analysis": "Analysis completed but format was unexpected",
                        "competitor_analysis": "Analysis completed but format was unexpected",
                        "compliance_analysis": "Analysis completed but format was unexpected",
                        "top_improvements": ["Check the raw analysis for specific suggestions"]
                    }
            else:
                return {
                    "status": "error",
                    "message": f"OpenRouter API error: {response.status_code} - {response.text}"
                }
                
        except Exception as e:
            return {
                "status": "error", 
                "message": f"Analysis failed: {str(e)}"
            }
