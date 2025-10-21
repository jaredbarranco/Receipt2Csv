## Build, Lint, and Test

- **Run:** `npm start` or `node index.js`
- **Build:** None
- **Lint:** None
- **Test:** None

## Code Style

- **Imports:** Use `require` for imports.
- **Formatting:**
  - 2-space indentation.
  - Semicolons at the end of statements.
  - Curly braces for all `if` statements.
  - Trailing commas.
- **Types:** No type annotations.
- **Naming:**
  - `PascalCase` for classes.
  - `camelCase` for functions and variables.
  - `UPPER_SNAKE_CASE` for constants.
  - Use `#` for private class methods.
- **Error Handling:** No explicit `try...catch` blocks. Rely on promise chains.
- **General:** Follow existing code patterns.

## Notes
- The `costco-receipt-pdfs` and `fred-meyer-receipt-pdfs` directories contain PDF files, not code.
- The main logic is in `index.js` and the `src` directory.
