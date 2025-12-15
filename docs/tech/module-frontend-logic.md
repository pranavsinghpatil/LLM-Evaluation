# Frontend Logic Module
**File**: `frontend/src/App.jsx`

## Overview
This is the brain of the React application. It handles user input, file processing, state management, and the network request to the backend.

## State Management (`useState`)
We track several key pieces of data:
- `inputMode`: Toggles between "Manual Text Entry" and "File Upload".
- `query`, `response`, `context`: The core data strings displayed in the UI.
- `result`: The JSON object returned from the backend (or `null` if not run yet).
- `loading`: Boolean flag to show the spinner.

## Key Methods

### `handleFileUpload(event, type)`
The entry point for the "Upload" feature.
- **Robustness**: It uses a `FileReader` to read the file asynchronously.
- **Sanitization**: Calls `parseJsonWithComments` to clean up the user's messy JSON.

### `parseJsonWithComments(text)`
A custom parser designed for resilience.
- **Problem**: Users (or developers) often leave comments `//` or trailing commas `,` in JSON files, which breaks the standard `JSON.parse()`.
- **Solution**: We use Regex to strip comments and trailing commas *before* parsing.
    - *Crucial Detail*: The Regex is smart enough NOT to strip `//` if it appears inside a URL (like `https://...`).

### `processParsedJson(json, type)`
Logic to extract the *right* data from the uploaded file.
- **Complex Chat Logic**:
    - The sample files contain long conversation histories.
    - We don't want to evaluate the *entire* history.
    - **Algorithm**:
        1.  Find the *last* AI message.
        2.  Find the *last* User message that came *before* that AI message.
        3.  Ignore any dangling User questions at the end (which haven't been answered yet).
    - This ensures we evaluate a valid Q&A pair.

### `handleEvaluate()`
The network handler.
- **Async/Await**: It pauses execution while waiting for the Python backend.
- **Error Handling**: Wrapped in `try/catch` to display a red error message if the server is down or returns a 500.
- **Data Prep**: It splits the `context` string by newlines into a List/Array, because the Backend API expects `List[str]`.
