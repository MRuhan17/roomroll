# Assumptions, Constraints & Test Scenarios

## 1. Assumptions
*   **Backend Independent**: The Auth UI currently runs in "mock mode" (simulated delays and hardcoded success). It does not connect to a real backend yet.
*   **State Persistence**: Session state is **ephemeral (memory-only)** for this task. Refreshing the browser will log the user out.
*   **Styling**: Visuals are functional and minimal. The fantasy theme is applied only in structure/naming, not in assets/fonts.

## 2. Constraints (Non-Negotiable)
*   **No Backend Logic**: We do not implement real JWT/Session exchanges yet.
*   **No "Forgot Password"**: User must create a new account if they fail.
*   **No Social Login**: Pure email/password only.
*   **No Profile Management**: Users cannot change their name/email once set in this session.
*   **No Onboarding Flow**: Users drop directly into the Dashboard.

## 3. Test Scenarios (Manual)

### Scenario 1: Successful Login
1.  Navigate to `/login`.
2.  Enter `test@example.com` in Email.
3.  Enter `password123` in Password.
4.  Click "Login".
5.  **Expect**: Button disabled during load ("Loading...").
6.  **Expect**: Redirect to `/` (Dashboard).
7.  **Expect**: "Welcome, adventurer test@example.com" text visible.

### Scenario 2: Invalid Credentials (Mock)
*Note: Since the mock currently checks only for detailed validation, this tests validation failure.*
1.  Navigate to `/login`.
2.  Enter `bad-email` (no @ symbol).
3.  Enter `short` (password < 6 chars).
4.  Click "Login".
5.  **Expect**: Error message "Invalid email address" or "Password must be at least 6 characters" appears in red.
6.  **Expect**: User stays on Login page.

### Scenario 3: Unauthorized Access
1.  Ensure you are logged out (refresh page or click Depart).
2.  Manually change URL bar to `http://localhost:5173/` (Dashboard).
3.  Press Enter.
4.  **Expect**: Immediate redirect back to `/login`.

### Scenario 4: Guest Protection
1.  Login successfully.
2.  Manually change URL bar to `http://localhost:5173/login`.
3.  Press Enter.
4.  **Expect**: Immediate redirect back to `/` (Dashboard).

### Scenario 5: Successful Signup
1.  Navigate to `/signup`.
2.  Enter `newuser@guild.com`.
3.  Enter `securepass`.
4.  Click "Sign Up".
5.  **Expect**: Redirect to `/` (Dashboard).
6.  **Expect**: Welcome message reflects `newuser`.
