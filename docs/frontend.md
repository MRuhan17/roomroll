# RoomRoll Frontend Architecture

This document provides an overview of the frontend architecture for the RoomRoll project. The frontend is built using **React** with **Vite**, leveraging a modular directory structure.

## Directory Structure
- `src/assets/`: Static assets.
- `src/components/`: Reusable UI components. Includes primitives (`ui/`), layouts (`layout/`), and domain-specific components (`campaign/`, `world/`, `landing/`).
- `src/lib/`: Utility functions (e.g., `campaignId.ts`, `utils.ts`).
- `src/pages/`: Top-level React components representing application routes (e.g., `CampaignDashboardPage`, `RoomPage`, `TavernPage`).
- `src/providers/`: Context providers encapsulating global contexts (e.g., `AppProviders.tsx`).
- `src/services/`: API interaction logic, socket configuration, and endpoint definitions (e.g., `api.ts`, `campaigns.ts`, `socket.ts`).
- `src/store/`: Global state management powered by Zustand.
- `src/types/`: TypeScript definitions for the application domain models (e.g., `campaign.ts`, `world.ts`).

> Note: The project does not currently use a dedicated `src/hooks/` directory. React Query hooks and custom logic are integrated directly within the `pages/` and `components/` files.

## State Management

RoomRoll utilizes a hybrid state management approach, combining **Zustand** for client-side state and **React Query** (TanStack Query) for server-side state caching and data synchronization.

### Zustand Stores
Zustand handles transient and persistent global UI state, as well as complex real-time states that require frequent client-side updates (e.g., WebSockets).
- **`authStore.ts`**: Manages the current authenticated user and JWT token. It synchronizes auth state with `localStorage` (storing `roomroll_token` and `roomroll_user`) and handles login/logout actions.
- **`roomStore.ts`**: Manages the live multiplayer session state when users are active in a campaign room. This store tracks socket connectivity, online participants, active map tokens, live dice rolls, narration feeds, and AI pending states. It effectively acts as the single source of truth for the real-time tabletop experience.
- **`useWorldStore.ts`**: Handles world-building states including lore, factions, discoveries, and world events. Distinct from the purely client-side stores, this store includes inline asynchronous actions (e.g., `fetchWorldData`) using the Axios API instance to load and manage world state.

### React Query (TanStack Query) Usage
React Query manages data fetching, caching, and server state mutations throughout the application. It is primarily consumed directly inside the page components.
- **Queries (`useQuery`)**: Used extensively to fetch and cache data such as active campaigns (`getActiveCampaign`), user campaign lists, campaign snapshots, tavern details, etc. It handles loading and error states natively.
- **Mutations (`useMutation`)**: Handles data modifying actions, such as `createCampaign`, `joinCampaign`, `chatWithNpc`, or `triggerTavernEvent`. On success, mutations invalidate relevant query keys (e.g., `queryClient.invalidateQueries({ queryKey: ["campaignTavern", id] })`) to trigger automatic refetches, keeping the UI in sync with the backend.

## API Services (`src/services/`)
API communication is encapsulated to separate data-fetching logic from the UI components.
- **`api.ts`**: Configures an Axios instance (`api`) that serves as the foundation for all HTTP requests. It uses interceptors to:
  - Automatically attach the JWT token (read from `localStorage`) to outgoing requests via the `Authorization` header.
  - Intercept responses to globally handle `401 Unauthorized` errors (e.g., `TokenExpiredError`, `MissingTokenError`), clearing out invalid auth states from `localStorage` gracefully.
- Specific domain files like `campaigns.ts`, `auth.ts`, and `rooms.ts` expose functions (e.g., `getCampaignSnapshot`, `joinCampaign`) that utilize this Axios instance and are subsequently consumed by React Query hooks.

## Component Hierarchy & Styling
- **Routing**: `react-router-dom` drives the page navigation, wrapping `pages/` components in routes.
- **Styling**: Uses Tailwind CSS with custom styling configurations via `index.css`. The UI emphasizes a premium design aesthetic (e.g., gradients, glassmorphism, glowing borders) aligned with a dark, immersive fantasy theme.
- **Micro-animations**: Uses `framer-motion` for fluid page transitions, component entry animations, and dynamic feedback (e.g., bouncy event splash banners).
