# Backend

FastAPI backend for the Student Record Management System.

## Run locally

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs: `http://127.0.0.1:8000/docs`

## Render deployment

Build command:
```bash
pip install -r requirements.txt
```

Start command:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
