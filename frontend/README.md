# Frontend

Static HTML/CSS/JavaScript frontend.

## Local use

Open `index.html` after starting the backend.

By default it connects to:
`http://127.0.0.1:8000`

## Before deployment

Set the deployed backend URL in `app.js`:

```js
const API_BASE = "https://YOUR-BACKEND.onrender.com";
```

Or use browser local storage:

```js
localStorage.setItem("bst_api_url", "https://YOUR-BACKEND.onrender.com");
```

## Netlify

Publish the `frontend` folder as the site directory.
