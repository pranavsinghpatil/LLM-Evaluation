# Icons & UI/UX Strategy

## 1. Visual Signaling
We use color semantics and iconography to communicate the "invisible" math of the evaluation pipeline instantly to the user.

### A. Color Semantics
We stick to a strict traffic-light system:

*   **Green (`text-green-400`)**: Success / High Score (> 0.8).
    *   Used for: `PASS` verdict, High Relevance.
*   **Yellow (`text-yellow-400`)**: Warning / Mediocre Score (0.5 - 0.79).
    *   Used for: Uncertainty, acceptable but imperfect matches.
*   **Red (`text-red-400`)**: Failure / Critical Issue (< 0.5).
    *   Used for: `FAIL` verdict, High Hallucination.

---

## 2. Iconography (Lucide React)
We use **Lucide React**, a modern, lightweight icon library. Each metric has a dedicated icon to build mental associations.

### 1. Relevance: The Lightning Bolt (`Zap`)
*   **Symbol**: ⚡
*   **Meaning**: Speed, direct connection, power.
*   **Why**: A relevant answer strikes the target instantly.

### 2. Completeness: The Stack (`Layers` / `FileText`)
*   **Symbol**: 📄
*   **Meaning**: Substance, fullness, documentation.
*   **Why**: A complete answer covers all layers of the question.

### 3. Hallucination: The Alert (`AlertTriangle`)
*   **Symbol**: ⚠️
*   **Meaning**: Danger, caution, error.
*   **Why**: Hallucinations are dangerous misinformation.

---

## 3. Micro-Interactions
The UI is not static. We use specific Tailwind classes to make it feel "alive".

*   **Hover Effects**: `hover:scale-[1.02]`
    *   Cards gently lift up when touched, inviting interaction.
*   **Transitions**: `transition-all duration-300`
    *   Color changes (e.g., Green to Blue) happen smoothly.
*   **Loading State**: `animate-spin`
    *   The "Run Evaluation" button shows a spinning circle, giving immediate feedback that the system is working, preventing rage-clicks.
