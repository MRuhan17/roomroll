# Phase 1 Auth UI - Technical Design Document (TDD)

## 1. Purpose
To provide a secure, clear, and distinct entry point for users to access the application. The Auth UI acts as the gatekeeper, ensuring only identified users can reach the Dashboard and Session Rooms.

## 2. High-Level Architecture
The authentication system relies on a client-side state management approach for Phase 1 (mock/local only).

*   **AuthContext**: A global React Context provider.
    *   Holds the "Truth" of the user's identity (`User` object | `null`).
    *   Manages the async lifecycle of `login` and `signup` requests.
    *   Exposes `isAuthenticated`, `isLoading`, and `error` states to the component tree.
*   **AuthGuard**: A Higher-Order Component (wrapper) that protects routes.
    *   Inspects `AuthContext` state.
    *   Conditionally renders children (if access granted) or `<Navigate>` (if access denied).
*   **Routing (React Router)**:
    *   **Public Routes**: `/login`, `/signup` (accessible to guests; redirects authenticated users to Dashboard).
    *   **Protected Routes**: `/` (Dashboard), `/lobby`, `/session` (accessible to auth users only).

## 3. Auth State Assumptions
The application assumes the following valid states for the Auth subsystem:

1.  **Idle (Guest)**
    *   `user`: `null`
    *   `isLoading`: `false`
    *   `error`: `null`
    *   *Behavior*: Access restricted to public pages.
2.  **Loading**
    *   `isLoading`: `true`
    *   *Behavior*: Form inputs disabled, spinners shown, navigation blocked.
3.  **Authenticated**
    *   `user`: `{ id, email, name }`
    *   `isLoading`: `false`
    *   *Behavior*: Access granted to protected pages.
4.  **Error**
    *   `error`: `"String message"`
    *   *Behavior*: User remains in previous state (Guest), error displayed in UI.

## 4. Error Handling Strategy
*   **Validation Errors**: Caught client-side immediately (e.g., missing `@` in email). displayed inline or via browser validation.
*   **System/API Errors**: Caught in the `try/catch` block within `AuthContext` providers. Stored in `error` state variable. Displayed as a red alert/text in the Auth forms.
*   **Boundary Errors**: (Future) React Error Boundary will wrap the App for fatal crashes.

## 5. Redirect Logic
The `AuthGuard` component is the central authority for redirects:
*   **Scenario A**: Unauthenticated user attempts to visit `/` (Dashboard).
    *   *Action*: Redirect to `/login`.
    *   *State*: Preserve original location (optional for Ph1) for post-login redirect.
*   **Scenario B**: Authenticated user attempts to visit `/login`.
    *   *Action*: Redirect to `/` (Dashboard).

## 6. Explicit Non-Goals (Phase 1)
*   Password recovery or "Forgot Password" flows.
*   Email verification loops.
*   Social Login (OAuth) integration.
*   Permanent session storage (LocalStorage/Cookies) - Session is memory-only for this specific task scope.
*   Remember Me functionality.
