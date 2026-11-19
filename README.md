# Student Record Management System using Binary Search Tree

A deployable DSA web application built with:

- Python
- FastAPI
- Binary Search Tree
- HTML
- CSS
- JavaScript

## Features

- Add student
- Search student by ID
- Update student
- Delete student
- Inorder sorted student records
- Dashboard statistics
- Live BST visualizer
- Responsive interface
- REST API

## Project structure

student-bst-management/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── README.md
└── README.md

## Local setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend:
http://127.0.0.1:8000

API docs:
http://127.0.0.1:8000/docs

### Frontend

Open `frontend/index.html`.

If the backend runs on another URL, change `API_BASE` at the top of `frontend/app.js`.

## Deployment

### Backend on Render

Root directory: `backend`

Build command:
```bash
pip install -r requirements.txt
```

Start command:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend on Netlify

Deploy the `frontend` folder.

After backend deployment, change `API_BASE` in `frontend/app.js` to the Render backend URL and redeploy the frontend.

## Important limitation

The current version stores records in memory, so records reset when the backend restarts/redeploys. This is intentional for a pure BST/DSA training project. The BST is the actual storage structure used by the application.
