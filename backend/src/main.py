import faiss
import numpy as np
import pandas as pd
import openai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables from .env
load_dotenv(dotenv_path="../.env")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Load CSV Data with correct column mapping
data = pd.read_csv("data.csv")
data.rename(columns={
    "Incident": "incident",
    "Date/Time of Request": "date",
    "Original Description of Expenditure": "full_description",
    "Brief Description": "brief_description",
    "Amount Requested": "budget"  # Added budget column
}, inplace=True)

# Create Text Embeddings using TF-IDF
vectorizer = TfidfVectorizer(stop_words="english")
X = vectorizer.fit_transform(data['brief_description'])

# Create FAISS Index
index = faiss.IndexFlatL2(X.shape[1])
index.add(X.toarray().astype(np.float32))


class RequestBody(BaseModel):
    incident: str
    date: str
    brief_description: str
    budget: str


def find_similar_case(brief_description, top_k=3):
    """Finds the most similar past cases based on brief description."""
    query_vector = vectorizer.transform([brief_description]).toarray().astype(np.float32)
    distances, indices = index.search(query_vector, top_k)
    return data.iloc[indices[0]]


def generate_full_description(incident, date, brief_description, budget):
    similar_cases = find_similar_case(brief_description)
    # You can optionally use similar cases only for structure, if needed
    examples = "\n".join(
        [f"Brief: {row['brief_description']}\nFull: {row['full_description']}" 
         for _, row in similar_cases.iterrows()]
    )

    prompt = f"""
    You are a professional assistant tasked with generating the description of expenditure for an EAF form. 
    Use only the provided input data. Do not invent any additional details.
    
    Here are some examples of past requests:
    {examples}
    
    Input:
    Incident: {incident}
    Date: {date}
    Budget: {budget}
    Brief Description: {brief_description}
    
    Generate a single, cohesive full description that can be used in a word document. 
    Do not include header labels or repeat the input data. Do not add any extra details such as which EOC is sending the request unless mentioned in the brief descrition.
    The output should strictly describe the situation using the provided data.
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates formal, factual descriptions based only on input data."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.0  # Lower temperature to reduce creative deviations
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generateEAF/")
def generate_text(request: RequestBody):
    full_description = generate_full_description(
        request.incident, request.date, request.brief_description, request.budget
    )
    return {"full_description": full_description}
