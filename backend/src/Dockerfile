FROM python:3.10-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    uvicorn \
    fastapi[all] \
    accelerate \
    pandas \
    faiss-cpu \
    openai \
    scikit-learn \
    cohere \
    openai

COPY . .

EXPOSE 5001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001", "--reload"]
