# Trellone API

A RESTful backend API for a Trello-inspired project management application, built with Node.js, Express, and TypeScript.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Auth:** JWT (JSON Web Tokens) + bcrypt

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14

### Installation

```bash
# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file at the project root:

```env
PORT=3636
DATABASE_URL=postgresql://user:password@localhost:5432/trellone
JWT_SECRET=your_jwt_secret_here
```

### Run in development

```bash
npm run dev
```

The server runs at `http://localhost:3636`.

### Health check

```
GET /api/health
```

## API Endpoints

### Auth

| Method | Endpoint           | Description              |
| ------ | ------------------ | ------------------------ |
| POST   | `/api/auth/signup` | Register new account     |
| POST   | `/api/auth/login`  | Login, receive JWT token |
| GET    | `/api/auth/me`     | Get current user info    |

### Workspaces

| Method | Endpoint              | Description                      |
| ------ | --------------------- | -------------------------------- |
| POST   | `/api/workspaces`     | Create workspace                 |
| GET    | `/api/workspaces`     | List workspaces (owned + member) |
| PUT    | `/api/workspaces/:id` | Rename workspace                 |
| DELETE | `/api/workspaces/:id` | Delete workspace                 |

### Boards

| Method | Endpoint                                  | Description              |
| ------ | ----------------------------------------- | ------------------------ |
| POST   | `/api/workspaces/:workspaceId/boards`     | Create board             |
| GET    | `/api/workspaces/:workspaceId/boards`     | List boards in workspace |
| GET    | `/api/workspaces/:workspaceId/boards/:id` | Get board detail         |
| PUT    | `/api/workspaces/:workspaceId/boards/:id` | Update board             |
| DELETE | `/api/workspaces/:workspaceId/boards/:id` | Delete board             |

### Lists

| Method | Endpoint                  | Description                      |
| ------ | ------------------------- | -------------------------------- |
| POST   | `/api/lists?boardId=`     | Create list                      |
| GET    | `/api/lists?boardId=`     | Get lists in board               |
| PUT    | `/api/lists/:id`          | Rename list                      |
| DELETE | `/api/lists/:id`          | Delete list (reorders remaining) |
| PATCH  | `/api/lists/:id/position` | Reorder list                     |

### Tasks

| Method | Endpoint                  | Description                      |
| ------ | ------------------------- | -------------------------------- |
| POST   | `/api/tasks?listId=`      | Create task                      |
| GET    | `/api/tasks?listId=`      | Get tasks in list                |
| PUT    | `/api/tasks/:id`          | Rename task                      |
| DELETE | `/api/tasks/:id`          | Delete task (reorders remaining) |
| PATCH  | `/api/tasks/:id/position` | Reorder task within list         |
| PATCH  | `/api/tasks/:id/move`     | Move task to another list        |

> All endpoints except `/auth/signup` and `/auth/login` require `Authorization: Bearer <token>` header.

## Architecture

This project follows a 3-layer **Model – Service – Controller** architecture:

- **Model** — Raw SQL only. No business logic.
- **Service** — Business logic, permission checks, transactions.
- **Controller** — Parse request, call service, return response.
