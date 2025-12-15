# React & Vite: The Frontend Framework

## 1. React: The UI Library
**React** is a JavaScript library for building user interfaces. It lets us build the UI as a collection of legitimate "Components".

### Key Concepts in our Pipeline:

#### A. Components
We break the UI into reusable pieces.
*   `App.jsx`: The main container that manages the state of the application.
*   `HowItWorks.jsx`: A separate, reusable page that renders the educational content.
*   *Benefit*: If we want to change the "How it Works" page, we only edit that file. We don't risk breaking the main evaluator.

#### B. Hooks (`useState`, `useEffect`)
React Hooks allow us to add logic to our components.
*   **`useState`**: Used to track variable data.
    *   *Example*: `const [query, setQuery] = useState('')`. When the user types in the box, `query` updates, and React automatically re-renders the part of the screen that relies on `query`.
*   **`useEffect`**: Used for side effects. We use this to trigger actions when the component loads or when specific data changes.

#### C. JSX (JavaScript XML)
JSX allows us to write HTML-like syntax directly inside JavaScript.
*   *Example*: `<div>{result.score}</div>`
*   This makes it intuitive to bind our backend data (JSON) directly to the visual elements (HTML).

---

## 2. Vite: The Build Tool
**Vite** (French for "fast") is the build tool that runs our React environment.

### Why Vite over Create-React-App (CRA)?
1.  **Instant Server Start**: Vite uses native ES modules. It doesn't need to bundle the whole app before starting the server. This makes `npm run dev` start almost instantly.
2.  **Hot Module Replacement (HMR)**: When we save a file (like `App.jsx`), Vite updates *only* that component in the browser capability instantly without a full page reload. This was crucial for iterating on the design quickly.
3.  **optimized Build**: When we run `npm run build`, Vite uses **Rollup** to create highly optimized, tiny static files that can be deployed anywhere.

### Connection to Backend
We configured Vite to proxy requests or simply fetch directly from `http://localhost:8000`. In our current setup, we use direct CORS fetching, where the React app (Client) makes an HTTP POST request to the FastAPI (Server) and waits for the JSON response.
