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

> All endpoints except `POST /api/auth/signup` and `POST /api/auth/login` require:
>
> ```
> Authorization: Bearer <token>
> ```

### Health Check

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| GET    | `/api/health` | Server health check |

---

### Auth — `/api/auth`

| Method | Endpoint           | Auth | Description              |
| ------ | ------------------ | ---- | ------------------------ |
| POST   | `/api/auth/signup` | ❌   | Register new account     |
| POST   | `/api/auth/login`  | ❌   | Login, receive JWT token |
| GET    | `/api/auth/me`     | ✅   | Get current user info    |

---

### Workspaces — `/api/workspaces`

| Method | Endpoint              | Description                      |
| ------ | --------------------- | -------------------------------- |
| POST   | `/api/workspaces`     | Create workspace                 |
| GET    | `/api/workspaces`     | List workspaces (owned + member) |
| PUT    | `/api/workspaces/:id` | Rename workspace                 |
| DELETE | `/api/workspaces/:id` | Delete workspace                 |

---

### Boards — `/api/workspaces/:workspaceId/boards`

| Method | Endpoint                                  | Description              |
| ------ | ----------------------------------------- | ------------------------ |
| POST   | `/api/workspaces/:workspaceId/boards`     | Create board             |
| GET    | `/api/workspaces/:workspaceId/boards`     | List boards in workspace |
| GET    | `/api/workspaces/:workspaceId/boards/:id` | Get board detail         |
| PUT    | `/api/workspaces/:workspaceId/boards/:id` | Update board (name, bg)  |
| DELETE | `/api/workspaces/:workspaceId/boards/:id` | Delete board             |

---

### Lists — `/api/workspaces/:workspaceId/boards/:boardId/lists`

| Method | Endpoint                                 | Description                      |
| ------ | ---------------------------------------- | -------------------------------- |
| POST   | `.../boards/:boardId/lists`              | Create list                      |
| GET    | `.../boards/:boardId/lists`              | Get lists in board (sorted)      |
| PUT    | `.../boards/:boardId/lists/:id`          | Rename list                      |
| DELETE | `.../boards/:boardId/lists/:id`          | Delete list (reorders remaining) |
| PATCH  | `.../boards/:boardId/lists/:id/position` | Reorder list                     |

---

### Tasks — `.../lists/:listId/tasks`

Tasks are nested under Lists. Full path example:
`/api/workspaces/:workspaceId/boards/:boardId/lists/:listId/tasks`

| Method | Endpoint                               | Description                                                                    |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------ |
| POST   | `.../lists/:listId/tasks`              | Create task in list                                                            |
| GET    | `.../lists/:listId/tasks`              | Get tasks in list (non-archived)                                               |
| GET    | `.../lists/:listId/tasks/:id`          | Get task detail (all fields)                                                   |
| DELETE | `.../lists/:listId/tasks/:id`          | Delete task (hard delete, reorder)                                             |
| PATCH  | `.../lists/:listId/tasks/:id/details`  | Partial update (name, description, is_done, due_date, start_date, cover_color) |
| PATCH  | `.../lists/:listId/tasks/:id/archive`  | Toggle archive status                                                          |
| PATCH  | `.../lists/:listId/tasks/:id/position` | Reorder task within list                                                       |
| PATCH  | `.../lists/:listId/tasks/:id/move`     | Move task to another list                                                      |

---

### Task Members — `.../tasks/:id/members`

| Method | Endpoint                        | Body / Params      | Description                   |
| ------ | ------------------------------- | ------------------ | ----------------------------- |
| GET    | `.../tasks/:id/members`         | —                  | List members assigned to task |
| POST   | `.../tasks/:id/members`         | `{ targetUserId }` | Assign board member to task   |
| DELETE | `.../tasks/:id/members/:userId` | `:userId` in URL   | Remove member from task       |

> `POST /members` validates that `targetUserId` is already a member of the board before assigning.

---

## Architecture

This project follows a 3-layer **Model – Service – Controller** architecture:

- **Model** — Raw SQL only. No business logic.
- **Service** — Business logic, permission checks, transactions.
- **Controller** — Parse request, call service, return response.
