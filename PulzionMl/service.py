# embedding_service.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn
import os

app = FastAPI(title="Free Embedding Service")

# Allow Node.js to call it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading all-MiniLM-L6-v2... (5-10 sec)")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded!")

class TextInput(BaseModel):
    text: str

@app.post("/embed")
def embed(input: TextInput):
    if not input.text.strip():
        raise HTTPException(400, "text is required")
    vector = model.encode(input.text).tolist()
    return {"vector": vector, "dim": len(vector)}

@app.get("/")
def root():
    return {"status": "healthy", "model": "all-MiniLM-L6-v2"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)