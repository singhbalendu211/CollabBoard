# DeployBeforedawn

A collaborative, real-time whiteboard application with rooms, role-based access (owner/editor/viewer), chat, live cursors, and auto-save. Built for teams to draw, annotate, and collaborate synchronously in rooms persisted to MongoDB and synchronized via Socket.IO.

## What this is
A realtime collaborative whiteboard that supports rooms, role-based permissions, live cursor presence, chat, and persistent board state. The frontend is a Vite + React app and the backend is an Express + Socket.IO API that persists board state in MongoDB.

### Stack
- Language(s): JavaScript (frontend + backend), CSS, HTML
- Framework / runtime:
  - Frontend: React (Vite)
  - Backend: Node.js + Express, Socket.IO
- Notable libraries:
  - Backend: express, socket.io, mongoose, jsonwebtoken, bcryptjs, dotenv
  - Frontend: react, react-router-dom, socket.io-client, tailwindcss (postcss), axios

## Features
- Create / join rooms
- Real-time drawing and object updates across participants
- Live cursors for presence
- Chat per room
- Role-based permissions: owner, editor, viewer (controls drawing & admin actions)
- Auto-save and manual save of canvas state to MongoDB
- Undo/redo support (history maintained in the client)
- Room management: rename, delete, leave, get users & roles
- Endpoint for generating/getting a room image (thumbnail/export)

## How it's organized
Top-level structure (important directories only):
```
backend/         API server, Socket.IO, DB models, routes, controllers
frontend/        Vite + React app: pages, components, contexts, services
```

How it fits together:
- The React frontend (frontend/) uses REST endpoints and Socket.IO to interact with the backend. It requests room data, user/role operations, and sends/receives high-frequency events over Socket.IO (drawing operations, cursor movement, chat). The backend (backend/) persists board state (Board documents) to MongoDB and performs authorization via JWT-protected routes.

## Notable files
- backend/server.js — Express server + Socket.IO event handlers and room state persistence hooks
- backend/routes/room.js — room management REST routes (join, board, save, users, role changes)
- backend/models/Board.js — MongoDB model for storing room board state (objects)
- backend/utils/whiteboardSocket.js — helpers for cursor & room state tracking (in-memory trackers)
- frontend/src/App.jsx — routing and protected routes configuration
- frontend/src/pages/Whiteboard.jsx — main whiteboard UI, socket integration, history, and autosave
- frontend/package.json — frontend build & dev scripts
- backend/package.json — backend start & dev scripts

## How to run it
The shortest path from a fresh clone to a running development environment.

1. Clone the repo
   ```bash
   git clone https://github.com/singhbalendu211/DeployBeforedawn.git
   cd DeployBeforedawn
   ```

2. Backend
   ```bash
   cd backend
   npm install
   # run in development with nodemon
   npm run dev
   # or production
   npm start
   ```
   The backend listens on PORT (default 5000). It exposes REST endpoints under `/api/*` and a Socket.IO server.

3. Frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend dev server (Vite) runs (default port 5173). It uses `VITE_BACKEND_URL` to connect to the backend socket/API.

## Environment variables
Create a `.env` file in backend/ with at least:
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/dbname
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

And a `.env` (or environment var) for the frontend:
```
VITE_BACKEND_URL=http://localhost:5000
```

Notes:
- `CLIENT_URL` is used by the backend CORS/Socket.IO config.
- `VITE_BACKEND_URL` is how the frontend connects to the backend (both REST and sockets in dev).

## API & Socket overview (developer quick reference)

REST highlights (backend routes):
- POST /api/auth/* — auth (login/signup) endpoints
- POST /api/rooms — create room
- GET /api/rooms — get user's rooms
- PUT /api/rooms/:roomId/join — join a room
- GET /api/rooms/:roomId/board — get board state (requires role)
- PUT /api/rooms/:roomId/board — save board state (requires owner/editor)
- PUT /api/rooms/:roomId/leave — leave a room
- GET /api/rooms/:roomId/image — public room image endpoint
- GET /api/rooms/:roomId/users — list users in a room (requires role)
- PATCH /api/rooms/:roomId/role — change a user's role (owner only)
- DELETE /api/rooms/:roomId — delete a room (owner only)

Socket events (client ↔ server):
- Client -> Server:
  - joinRoom: { roomId, user } — join a room
  - object:add: { roomId, data } — add a drawing object
  - object:update: { roomId, data } — update an object
  - object:delete: { roomId, data } — delete object(s)
  - canvas:clear: { roomId } — clear canvas
  - canvas:save: { roomId, objects } — autosave
  - canvas:batch:update: { roomId, updates } — batched operations
  - cursor:move: { roomId, x, y, email } — high-frequency cursor presence
  - chat:message: { roomId, messageData } — chat messages
- Server -> Client:
  - room:load — initial board state payload
  - object:add / object:update / object:delete — broadcast object operations
  - canvas:clear — broadcast
  - cursors:update — broadcast all cursors in the room
  - chat:message — broadcast chat messages
  - room:deleted — notify room deletion

## Development notes & conventions
- Frontend maintains a local history array for undo/redo; many operations push a new history entry and emit corresponding socket events.
- Backend stores board objects inside a Board document per room (MongoDB).
- High-frequency cursor updates are kept in-memory and broadcast frequently (ephemeral).
- Many DB writes (object add/update/delete/save) are done asynchronously (non-blocking) so real-time experience is fast; ensure DB writes are robust in production.

## Running a production build (suggested)
- Build frontend:
  ```bash
  cd frontend
  npm run build
  ```
- Serve the built frontend from a static host (Netlify/Vercel) or serve static files from the backend (if you plan to serve both from a single host).
- Ensure environment variables are set for the deployed environment, including correct `CLIENT_URL` and `VITE_BACKEND_URL` (or reverse proxy configuration).

## Troubleshooting
- Socket connection issues: verify `VITE_BACKEND_URL`, backend `CLIENT_URL` CORS setting, and ports.
- Board not persisting: confirm `MONGODB_URI` is correct and backend can connect to MongoDB.
- Auth errors: ensure `JWT_SECRET` is set consistently between backend instances.

## Contributing
- Fork, create a branch, open a PR.
- Keep code style consistent with project (ES modules, modern JS, tailwind classes).
- If adding high-frequency features, be mindful of network and server load (debounce/throttle where appropriate).

## Try asking
- How is room thumbnail generation implemented in `backend/routes/room.js` and `controllers/roomController.js`? (I saw a `/:roomId/image` route — is it server-side rendering or an external service?)
- The Whiteboard uses an in-memory cursor tracker — would you like cursor presence to be sharded/persisted for multi-instance production deployments (see `backend/utils/whiteboardSocket.js`)?
- Do you want a single-server deployment (serve frontend static from Express) or separate deployments for frontend and backend (Vite + Node behind a reverse proxy)?

## License
Add a LICENSE file or replace this section with the appropriate license.

---

If you’d like, I can:
- Create this README.md in the repository for you.
- Add a minimal `.env.example` and a CONTRIBUTING.md.
- Generate a short GitHub Actions workflow for running linters/builds on PRs.
