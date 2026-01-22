# Component Responsibility & State Notes

## Component Responsibilities

### 1. AuthContext (`src/context/AuthContext.tsx`)
*   **Owns**: 
    *   The "Truth" of the user's identity.
    *   Managing the async lifecycle of login/signup requests (mock API calls).
    *   Detailed error strings returned from the "backend".
*   **Does NOT Own**: 
    *   UI presentation (doesn't render forms).
    *   Routing logic (doesn't call `navigate()`, simply updates state).

### 2. AuthGuard (`src/components/auth/AuthGuard.tsx`)
*   **Owns**: 
    *   Access control logic.
    *   Deciding *where* a user should go if they are unauthorized (Login) or authorized but on a guest page (Dashboard).
*   **Inputs**: 
    *   `requireAuth` (boolean, default: `true`).
    *   `children` (ReactNode).
*   **Outputs**: 
    *   Renders `<Navigate>` (redirect) OR `children` (content).

### 3. LoginForm / SignupForm (`src/components/auth/*.tsx`)
*   **Owns**: 
    *   Local form state (email input value, password input value).
    *   Capturing user intent (onSubmit events).
    *   Triggering `login()` or `signup()` methods from context.
*   **Does NOT Own**: 
    *   The definition of "what happens on success" (this is reactive based on user state change).

---

## State Management Notes

### Where State Lives
*   **User Data**: `AuthContext` (Global).
*   **Form Data**: Local Component State (`useState` in Forms).
*   **Routing State**: React Router's internal history stack.

### How Transitions Occur
1.  **User Action**: User types in `LoginForm` component -> updates local state.
2.  **Submission**: User clicks "Submit" -> calls `AuthContext.login()`.
3.  **Processing**: `AuthContext` sets `isLoading: true`.
4.  **Result**: 
    *   **Success**: `AuthContext` sets `user: {...}`, `isLoading: false`.
    *   **Failure**: `AuthContext` sets `error: "..."`, `isLoading: false`.
5.  **Reaction**: `AuthGuard` (listening to context) sees `user` exists -> triggers re-render -> redirects to Protected Route.

### What Triggers Re-renders
*   Updates to `user` object id/references.
*   Toggling `isLoading` boolean.
*   Setting/Clearing `error` string.
