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
npm install
```

### Environment Variables

Create a `.env` file at the project root:

```env
PORT=3636
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trellone
DB_USER=your_db_user
DB_PASSWORD=your_db_password
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

---

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

### Workspace Members — `/api/workspaces/:id/members`

| Method | Endpoint                                    | Body                 | Description                     |
| ------ | ------------------------------------------- | -------------------- | ------------------------------- |
| POST   | `/api/workspaces/:id/members`               | `{ username }`       | Invite member by username       |
| GET    | `/api/workspaces/:id/members`               | —                    | List members of workspace       |
| PUT    | `/api/workspaces/:id/members/:userId`       | `{ role }`           | Update member role              |
| DELETE | `/api/workspaces/:id/members/:userId`       | —                    | Remove member (owner protected) |

> Owner cannot be removed or have their role changed.

---

### Boards — `/api/workspaces/:workspaceId/boards` & `/api/boards`

| Method | Endpoint                                  | Description              |
| ------ | ----------------------------------------- | ------------------------ |
| POST   | `/api/workspaces/:workspaceId/boards`     | Create board             |
| GET    | `/api/workspaces/:workspaceId/boards`     | List boards in workspace |
| GET    | `/api/boards/:id`                         | Get board detail         |
| PUT    | `/api/boards/:id`                         | Update board (name, bg)  |
| DELETE | `/api/boards/:id`                         | Delete board             |

---

### Board Members — `/api/boards/:id/members`

| Method | Endpoint                              | Body           | Description                  |
| ------ | ------------------------------------- | -------------- | ---------------------------- |
| POST   | `/api/boards/:id/members`             | `{ username }` | Invite member by username    |
| GET    | `/api/boards/:id/members`             | —              | List members of board        |
| PUT    | `/api/boards/:id/members/:userId`     | `{ role }`     | Update member role           |
| DELETE | `/api/boards/:id/members/:userId`     | —              | Remove member (owner protected) |

> Owner cannot be removed or have their role changed.

---

### Lists — `/api/boards/:boardId/lists`

| Method | Endpoint                                | Description                      |
| ------ | --------------------------------------- | -------------------------------- |
| POST   | `/api/boards/:boardId/lists`            | Create list                      |
| GET    | `/api/boards/:boardId/lists`            | Get lists in board (sorted)      |
| PUT    | `/api/boards/:boardId/lists/:id`        | Rename list                      |
| DELETE | `/api/boards/:boardId/lists/:id`        | Delete list (reorders remaining) |
| PATCH  | `/api/boards/:boardId/lists/:id/position` | Reorder list                   |

---

### Tasks — `/api/lists/:listId/tasks` & `/api/tasks`

| Method | Endpoint                             | Description                                                                    |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------ |
| POST   | `/api/lists/:listId/tasks`           | Create task in list                                                            |
| GET    | `/api/lists/:listId/tasks`           | Get tasks in list (non-archived)                                               |
| GET    | `/api/tasks/:id`                     | Get task detail (all fields)                                                   |
| DELETE | `/api/tasks/:id`                     | Delete task (hard delete, reorder)                                             |
| PATCH  | `/api/tasks/:id/details`             | Partial update (name, description, is_done, due_date, start_date, cover_color) |
| PATCH  | `/api/tasks/:id/archive`             | Toggle archive status                                                          |
| PATCH  | `/api/tasks/:id/position`            | Reorder task within list                                                       |
| PATCH  | `/api/tasks/:id/move`                | Move task to another list (`{ list_id, position }`)                           |

---

### Task Members — `/api/tasks/:id/members`

| Method | Endpoint                          | Body                 | Description                   |
| ------ | --------------------------------- | -------------------- | ----------------------------- |
| GET    | `/api/tasks/:id/members`          | —                    | List members assigned to task |
| POST   | `/api/tasks/:id/members`          | `{ targetUserId }`   | Assign board member to task   |
| DELETE | `/api/tasks/:id/members/:userId`  | —                    | Remove member from task       |

> `POST /members` validates that `targetUserId` is already a board member before assigning.

---

### Checklist Items — `/api/tasks/:id/checklists`

| Method | Endpoint                                          | Body                      | Description                         |
| ------ | ------------------------------------------------- | ------------------------- | ----------------------------------- |
| GET    | `/api/tasks/:id/checklists`                       | —                         | Get checklist items (sorted)        |
| POST   | `/api/tasks/:id/checklists`                       | `{ content }`             | Add checklist item                  |
| PATCH  | `/api/tasks/:id/checklists/:checklistId`          | `{ content, is_checked }` | Update item content or check status |
| DELETE | `/api/tasks/:id/checklists/:checklistId`          | —                         | Delete item (reorders remaining)    |
| PATCH  | `/api/tasks/:id/checklists/:checklistId/position` | `{ position }`            | Reorder item                        |

---

### Comments — `/api/tasks/:id/comments`

| Method | Endpoint                                   | Body          | Description                           |
| ------ | ------------------------------------------ | ------------- | ------------------------------------- |
| GET    | `/api/tasks/:id/comments`                  | —             | Get comments (newest first)           |
| POST   | `/api/tasks/:id/comments`                  | `{ content }` | Add comment                           |
| PUT    | `/api/tasks/:id/comments/:commentId`       | `{ content }` | Edit comment (owner only)             |
| DELETE | `/api/tasks/:id/comments/:commentId`       | —             | Delete comment (owner only)           |

---

### Labels — `/api/boards/:boardId/labels`

| Method | Endpoint                            | Body               | Description            |
| ------ | ----------------------------------- | ------------------ | ---------------------- |
| POST   | `/api/boards/:boardId/labels`       | `{ name, color }`  | Create label for board |
| GET    | `/api/boards/:boardId/labels`       | —                  | Get labels in board    |
| PUT    | `/api/boards/:boardId/labels/:id`   | `{ name }`         | Rename label           |
| DELETE | `/api/boards/:boardId/labels/:id`   | —                  | Delete label           |

---

### Task Labels — `/api/tasks/:id/labels`

| Method | Endpoint                              | Body          | Description              |
| ------ | ------------------------------------- | ------------- | ------------------------ |
| GET    | `/api/tasks/:id/labels`               | —             | Get labels on task       |
| POST   | `/api/tasks/:id/labels`               | `{ labelId }` | Attach label to task     |
| DELETE | `/api/tasks/:id/labels/:labelId`      | —             | Detach label from task   |

---

## Testing with Postman

An `endpoints` Postman collection is included at the project root.

1. Open Postman → **Import** → select the `endpoints` file.
2. Set the `access_token` environment variable to the JWT token returned from `POST /api/auth/login`.
3. All authenticated requests use `{{access_token}}` automatically.

---

## Architecture

This project follows a 3-layer **Model – Service – Controller** architecture:

- **Model** — Raw SQL only. No business logic.
- **Service** — Business logic, permission checks, transactions.
- **Controller** — Parse request, call service, return response.
