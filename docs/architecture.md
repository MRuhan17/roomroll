# RoomRoll Architecture

## Overview
RoomRoll is a tabletop roleplaying game (TTRPG) platform powered by real-time collaborative features and AI assistance. It consists of a React frontend and a Node.js/Express backend that communicates with a Supabase PostgreSQL database.

## System Context Diagram
```mermaid
graph TD
    User([User / Player / DM])
    RoomRollUI[RoomRoll Frontend\nReact/Vite]
    RoomRollAPI[RoomRoll Backend API\nNode.js/Express]
    Supabase[(Supabase PostgreSQL)]
    AI[AI Service\nStory Engine]
    
    User -->|HTTPS| RoomRollUI
    RoomRollUI -->|REST / WebSocket| RoomRollAPI
    RoomRollAPI -->|Postgres Client| Supabase
    RoomRollAPI -->|HTTPS| AI
```

## Container Architecture
```mermaid
graph TD
    Client[Web Browser]
    
    subgraph Frontend [React Application]
        Router[React Router]
        State[Zustand Store]
        Components[UI Components]
        APIClient[Axios API Client]
        SocketClient[Socket.IO Client]
        
        Router --> Components
        Components --> State
        Components --> APIClient
        Components --> SocketClient
    end
    
    subgraph Backend [Node.js Express Server]
        AuthMW[Auth Middleware]
        ValidationMW[Zod Validation]
        RateLimiter[Rate Limiter]
        Controllers[Controllers]
        Services[Business Logic & AI Services]
        SocketIO[Socket.IO Server]
        
        AuthMW --> ValidationMW
        ValidationMW --> Controllers
        Controllers --> Services
        SocketIO --> Services
    end
    
    Client --> Frontend
    APIClient -->|HTTPS REST| AuthMW
    SocketClient -->|WebSocket| SocketIO
```

## Components and Data Flow

### Frontend
- **Framework**: React with Vite.
- **Routing**: React Router handles navigation (e.g., `/campaigns/:id`, `/rooms/:id`).
- **State Management**: Zustand manages real-time and global state (`authStore.ts`, `roomStore.ts`, `useWorldStore.ts`).
- **Real-time Engine**: Socket.IO client for live session synchronization.
- **API Communication**: Configured Axios instance with token interceptors.

### Backend
- **Framework**: Node.js with Express.
- **API Structure**: Controllers orchestrate request handling while Services contain core business logic (e.g., `campaignService.ts`, `aiService.ts`, `tavernService.ts`).
- **Real-Time Integration**: Socket.IO integrated with Express, handling real-time synchronization in `registerRealtimeHandlers`.
- **Database Connection**: Direct PostgreSQL interaction through the Supabase client library using the service role key (bypassing RLS for server-side logic).
- **Background Tasks**: Includes a simple polling scheduler using `setInterval` (e.g., Weekly Chronicles email dispatch).

### Data Persistence (Supabase)
- **Supabase Postgres**: Used solely for relational data persistence. 
- **Security model**: While the backend uses a service role to bypass RLS, strict Row Level Security (RLS) policies are active at the database level for defense-in-depth in case of direct access configurations.

## Flow Diagrams

### Campaign Interaction Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant RealTime
    participant DB
    
    User->>Frontend: Perform Action (e.g. Roll Dice)
    Frontend->>API: POST /api/campaigns/:id/action
    API->>DB: Update Campaign State
    DB-->>API: Acknowledge
    API->>RealTime: Broadcast Event (SESSION_UPDATE)
    RealTime-->>Frontend: WebSocket Push
    Frontend->>User: Update UI
```
