from sentence_transformers import SentenceTransformer

# Load the model globally so it's only loaded once in memory
# all-MiniLM-L6-v2 is small enough (~80MB) to run on Render free tier
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Error loading sentence-transformers model: {e}")
    model = None

def get_embedding(text: str) -> list:
    if not model:
        return []
    try:
        # Encode text and convert to a list of floats
        embedding = model.encode(text)
        return embedding.tolist()
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []
