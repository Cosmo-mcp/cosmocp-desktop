# A Software Engineer's Guide to the `Cosmo MCP` Project

This guide is a checklist to help you write, test, and review code *specifically for this Electron/Next.js project*. It builds on our exact tech stack and file structure.

---

## 1. Before You Write a Single Line of Code

*   **Understand the Architecture:** Remember the two main parts of this app:
    1.  **Main Process (Electron):** Lives in `src/main`. It manages windows and has access to Node.js APIs (like `fs` for files). The entry point is `src/main/index.ts`.
    2.  **Renderer Process (Next.js):** Lives in `src/renderer`. This is our entire UI. It's a standard Next.js app. You can see the main page component at `src/renderer/src/app/page.tsx`.
*   **Plan Your Feature Location:**
    *   Is it a purely visual change? It belongs in `src/renderer` (e.g., modifying a React component in `src/renderer/src/components`).
    *   Does it need to access the user's file system or other OS-level features? The logic must go in the **Main Process**. You will then need to expose it securely to the UI.
*   **How to Expose Main Process APIs:** To get data from the main process to the UI, you must use our established IPC (Inter-Process Communication) pattern:
    1.  Add your function/API in the main process in `src/main/ipc/index.ts`.
    2.  Define the types for the exposed API in `src/preload/api.ts`.
    3.  Expose it to the renderer in the preload script: `src/preload/index.ts`.
*   **Check Project Conventions:** Before creating a new component, look at existing ones like `src/renderer/src/components/chat.tsx` and `chat-header.tsx`. We use Tailwind CSS for styling and `lucide-react` for icons. Match the existing style.

---

## 2. While You Are Coding

### Code Readability & Best Practices
*   **Component Structure:** Keep React components small and focused. If a component in `src/renderer/src/components` gets too large, break it down.
*   **State Management:** For UI state, use React hooks (`useState`, `useReducer`). For shared data definitions, see `src/renderer/src/lib/types.ts`.
*   **Styling:** Use Tailwind CSS utility classes directly in your `className` attributes. For common styles, you can use the `@apply` directive in `src/renderer/src/app/globals.css`.
*   **Linting:** we use google typescript style guide(gts) for linting, please run `npm run lint` to lint the code 
*   **Style Fix:** we use google typescript style guide(gts) for fixing style problems, please run `npm run fix` for gts to fix style according to it's guide

### Security
*   **IPC Security is Critical:** The `src/preload/index.ts` script is a security boundary. When you expose functions from the main process using `contextBridge`, **never** expose entire modules like `fs`. Only expose the specific, minimal functionality the renderer needs. Always validate and sanitize arguments coming from the renderer process.
*   **Dependency Audits:** We have two `package.json` files. Regularly run `npm audit` in the root directory and in `src/renderer` to check for vulnerabilities in our dependencies.
*   **Cross-Site Scripting (XSS):** React automatically helps prevent XSS, but be careful when using `dangerouslySetInnerHTML`. In our chat interface, ensure any content rendered from user input is properly sanitized.

### Performance
*   **Main vs. Renderer:** Keep the renderer process (the UI) snappy. If you have a long-running or computationally expensive task, move it to the main process to avoid freezing the UI. Use our IPC mechanism to send the result back.
*   **React Performance:** In our React components (`src/renderer/src/components`), be mindful of re-renders. Use `React.memo`, `useCallback`, and `useMemo` where appropriate. The `ChatHeader` component is a good example of using `memo`.
*   **Next.js Build:** Pay attention to the build output from `npm run build` in the `src/renderer` directory. Next.js provides insights into page sizes and performance.

---

## 3. Testing Your Code

*   **Linting:** Before anything else, run `npm run lint` in both the root and `src/renderer` directories.
*   **Unit Tests:** Create test files next to the files they are testing. If you add a utility function to `src/renderer/src/lib/utils.ts`, add a corresponding `utils.test.ts`.
*   **End-to-End Testing:** The most important test is to run the application itself. Use `npm run dev` to start the development environment. Click through your new feature and try to break it. Test the entire flow from the UI in the renderer to the logic in the main process.

---

## 4. Preparing for and Reviewing Code

*   **Small Pull Requests:** A PR should focus on one feature or bug fix. If you changed both the main process and the renderer, that's fine, but don't mix in an unrelated component refactor.
*   **Clear PR Description:** Explain *what* you changed and *why*. Crucially, explain *how the reviewer can test it*. "To test, open the app and..."
*   **Review Checklist:** When reviewing a teammate's PR, ask yourself:
    *   Does this logic belong in the main process or the renderer? Is it in the right place?
    *   If an IPC call was added, is it secure? Does it expose the minimum necessary?
    *   Does the UI match our existing design language (see other components and `tailwind.config.ts`)?
    *   Are there new dependencies? Have they been added to the correct `package.json`?