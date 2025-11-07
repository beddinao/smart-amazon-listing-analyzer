import chromadb
from sentence_transformers import SentenceTransformer
import os

#init chromadb client with persistent storage 
chroma_client = chromadb.PersistentClient(path="./chroma_db")

#create/get collection for storing amazon best practices 
collection = chroma_client.get_or_create_collection(name="amazon_best_practices")

#load embedding model - converts text to vectors 
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def add_best_practices():

    #hardcoded amazon optimization strategies
    best_practices = [
            "Place primary keyword in the first 50 characters of title - most critical for search",
            "Use title structure: Brand + Primary Keyword + Key Feature + Quantity/Size",
            "Include 5 bullet points with emotional benefit-driven language (not just features)",
            "Start each bullet point with capital letter and end without punctuation for scannability",
            "Use all 250 characters available for each bullet point",
            "Incorporate secondary keywords naturally in bullet points and description",
            "Write description that tells a story and addresses customer pain points directly",
            "Include social proof elements like 'Join 50,000+ satisfied customers'",
            "Use power words: Revolutionary, Proven, Instant, Effortless, Guaranteed",
            "Add comparison charts showing advantages over competitor products",
            "Include specific measurements, sizing charts with visual guides",
            "Address common objections upfront: 'Worried about durability? Our...'",
            "Place warranty/guarantee information in first bullet point when possible",
            "Use all available backend search term fields with relevant long-tail keywords",
            "Create A+ Content with branded headers and comparison modules",
            "Include video demonstrating key features and real-world usage",
            "Add multiple high-resolution images showing scale (with common objects)",
            "Use infographic-style images highlighting key specifications",
            "Include lifestyle photos showing product in use contexts",
            "Add close-up shots of materials, textures, and craftsmanship",
            "Use all 9 image slots with varied angles and contexts",
            "Optimize for mobile - test title visibility on mobile preview",
            "Keep sentences short and scannable (under 15 words when possible)",
            "Use symbols and emojis sparingly in bullet points for visual breaks",
            "Include 'What's in the Box' section to manage expectations",
            "Add usage instructions or quick-start guides in description",
            "Highlight key differentiators in the first 3 bullet points",
            "Use temperature/hardness/performance ratings with industry standards",
            "Include certifications, awards, or industry recognition badges",
            "Add seasonal or occasion-based keywords when relevant",
            "Update listing regularly with new customer review insights",
            "Use urgency language: 'Limited Stock', 'Bestseller', 'Amazon's Choice'",
            "Include compatibility information with other products/systems",
            "Add maintenance and care instructions for long-term satisfaction",
            "Use color options with clear, consistent naming conventions"
            ]

    #convert each practice to vector and store in chromadb 
    for i, practice in enumerate(best_practices):
        embedding = embedding_model.encode(practice).tolist() #text => vector
        collection.add(
                documents=[practice],   #origianl text
                embeddings=[embedding], #vector represantation
                ids=[f"practice_{i}"]   #unique id
                )

    print(f"Added {len(best_practices)} best practices to ChromaDB")

#init if db does not exist
if not os.path.exists("./chroma_db"):
    add_best_practices()
