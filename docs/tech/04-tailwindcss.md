# TailwindCSS: The Styling Engine

## 1. What is TailwindCSS?
**TailwindCSS** is a "utility-first" CSS framework. Instead of writing custom CSS classes like `.btn-primary` and defining styles in a separate `.css` file, we use pre-defined utility classes directly in our HTML.

### Example comparison:
**Traditional CSS:**
```css
/* style.css */
.card {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

**TailwindCSS:**
```html
<div class="bg-white p-5 rounded-lg shadow-md">
    Content
</div>
```

---

## 2. Why we chose it for this Project?
1.  **Speed of Design**: We could build the "Dark Mode" aesthetic simply by adding `bg-slate-900` to the main container. No need to manage complex theme files.
2.  **Consistency**: Tailwind provides a curated color palette (e.g., `slate`, `blue`, `green`). This ensures that the "Green" used for a high score matches the "Green" used in the success icon, without us having to look up Hex codes.
3.  **Responsiveness**: Tailwind makes mobile-friendly design easy.
    *   *Syntax*: `grid-cols-1 md:grid-cols-3`
    *   *Meaning*: On mobile (default), use 1 column. On medium screens (`md`) and larger, use 3 columns. This allows our "Metric Cards" to stack on phones but sit side-by-side on laptops.

## 3. Advanced Features Used

### A. Gradients and Glassmorphism
For the "How it Works" page, we used advanced utilities:
*   `bg-gradient-to-br`: Creates a gradient background.
*   `backdrop-blur-sm`: Creates the "frosted glass" effect behind cards.
*   `opacity-0 group-hover:opacity-100`: Creates the interactive hover effects where elements light up when the mouse moves over them.

### B. Animation
We used Tailwind's built-in animations for polish:
*   `animate-spin`: Used on the "Loading..." icon when the evaluation is processing.
*   `transition-all duration-300`: Ensures that all color changes and hover effects are smooth and not jerky.

## 4. Configuration
We use a `postcss.config.js` and `tailwind.config.js` to integrate Tailwind with Vite. This allows the compiler to scan our `.jsx` files, find the classes we used, and generate the smallest possible CSS file for production, removing all unused styles.
