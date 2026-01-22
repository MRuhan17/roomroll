# Roomroll Onboarding Guide

Welcome to the Roomroll team! This document is designed to help you get up and running with the Roomroll codebase.

## 1. Project Overview

Roomroll is a browser-based tabletop platform for running role-playing game sessions online. It aims to reduce friction in online tabletop play by keeping sessions lightweight and reliable.

The project is currently organized as a monorepo with distinct `frontend` and `backend` directories.
- **Frontend**: A React application built with Vite and TypeScript.
- **Backend**: (Currently under development)

## 2. Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (Latest LTS version recommended)
- **Git**
- **npm** (comes with Node.js)

## 3. Getting Started

### 3.1 Clone the Repository

```bash
git clone <repository-url>
cd roomroll
```

### 3.2 Frontend Setup

The frontend is located in the `frontend` directory.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application should now be running locally, typically at `http://localhost:5173`.

## 4. Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React

## 5. Project Structure

### Root Directory
- `/frontend`: Contains the React application.
- `/backend`: Contains the backend logic (in progress).
- `/docs`: Documentation files.

### Frontend Structure (`frontend/src`)
- `components/`: Reusable UI components.
  - `auth/`: Authentication screens (Login, Signup)
  - `dashboard/`: Dashboard with lobby list
  - `lobby/`: Lobby view with member management
  - `session/`: Session room with game board and panels
  - `navigation/`: Top navigation bar
  - `common/`: Shared components (backgrounds, etc.)
  - `ui/`: shadcn/ui component library
- `context/`: React Context definitions for global state.
  - `AuthContext.tsx`: Authentication state management
- `assets/`: Static assets like images.
- `App.tsx`: Main application component and routing setup.
- `main.tsx`: Entry point of the application.

## 5.1. Current Application State

The application currently has **wireframe implementations** for all core screens:

### Auth Screens
- **Login Form**: Email and password fields with validation
- **Signup Form**: Account creation with email/password
- Toggle between login and signup views

### Dashboard
- **Lobby List**: Displays available game lobbies (currently using mock data)
- **Create Lobby Button**: Prominent button to start a new lobby
- Each lobby card shows: name, host, and member count

### Lobby View
- **Party Members List**: Shows all players in the lobby with avatars
- **Invite Link**: Copy-able invite URL for sharing
- **Start Session Button**: DM-only control to begin the game session
- Member count badge and role indicators (DM crown icon)

### Session Room
- **Resizable Layout**: Split-panel design with draggable divider
- **Game Board Area**: Large canvas placeholder for map/board rendering
- **Side Panel with Tabs**:
  - **Chat**: Message history and input field
  - **Players**: Party member list with avatars
  - **Dice**: Dice roller interface (D4, D6, D8, D10, D12, D20)

**Note**: All data is currently mocked for demonstration. Backend integration is pending.

## 6. Key Commands

Run these commands from the `frontend` directory:

- `npm run dev`: Starts the local development server.
- `npm run build`: Type-checks and builds the application for production.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run preview`: Preview the production build locally.

## 7. Contribution Guidelines

- **Code Style**: We use ESLint and TypeScript for code quality. Ensure there are no linting errors before pushing.
- **Commits**: Write clear and concise commit messages.

## 8. Troubleshooting

If you encounter issues:
1. Ensure all dependencies are installed (`npm install`).
2. Check that you are running the correct Node.js version.
3. Reach out to the team for help!
