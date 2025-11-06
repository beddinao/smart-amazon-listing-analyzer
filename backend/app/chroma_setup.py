import chromadb
from sentence_transformers import SentenceTransformer
import os

# Initialize ChromaDB
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Create collection for Amazon best practices
collection = chroma_client.get_or_create_collection(name="amazon_best_practices")

# Initialize embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def add_best_practices():
    """Add Amazon listing best practices to ChromaDB"""
    best_practices = [
        "Use primary keywords in the product title first 50 characters",
        "Include secondary keywords in bullet points and description",
        "Keep title under 200 characters for mobile optimization",
        "Write bullet points that focus on benefits not just features",
        "Use emotional language that connects with customer pain points",
        "Include size charts and measurement guides for apparel",
        "Add comparison charts against competitor products",
        "Use A+ content for brand storytelling",
        "Include customer reviews and testimonials in listing",
        "Optimize backend search terms with relevant keywords",
        "Use clear, scannable formatting with line breaks",
        "Address common customer objections in the description",
        "Include warranty and guarantee information prominently"
    ]
    
    # Add to ChromaDB
    for i, practice in enumerate(best_practices):
        embedding = embedding_model.encode(practice).tolist()
        collection.add(
            documents=[practice],
            embeddings=[embedding],
            ids=[f"practice_{i}"]
        )
    
    print(f"Added {len(best_practices)} best practices to ChromaDB")

# Initialize on first run
if not os.path.exists("./chroma_db"):
    add_best_practices()
