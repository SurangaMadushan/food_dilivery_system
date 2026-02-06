# Delivery Frontend (React)

React-based UI for the delivery team. Includes dedicated login, delivery menu, and delivery confirmation. Admins can view confirmations.

## Setup

1. Ensure the delivery backend is running on `http://localhost:8081`.
2. Install dependencies:

```bash
npm install
```

## Run in VS Code

```bash
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Environment

To point the UI to a different API host, create a `.env` file with:

```bash
VITE_API_BASE=http://localhost:8081
```
