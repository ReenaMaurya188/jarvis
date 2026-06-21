from fastapi import APIRouter
from ddgs import DDGS

router = APIRouter()

def perform_search(query: str):
    try:
        results = DDGS().text(query, max_results=3)
        return [{"title": r["title"], "snippet": r["body"], "url": r["href"]} for r in results]
    except Exception as e:
        return f"Error performing search: {e}"

@router.get("/")
def search_endpoint(query: str):
    return perform_search(query)
