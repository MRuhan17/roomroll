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
- `pages/`: Page components corresponding to routes.
- `context/`: React Context definitions for global state.
- `assets/`: Static assets like images.
- `utils/`: Utility functions and helpers.
- `App.tsx`: Main application component and routing setup.
- `main.tsx`: Entry point of the application.

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
