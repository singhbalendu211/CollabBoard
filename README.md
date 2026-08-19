# DeployBeforedawn

Lightweight real-time collaborative whiteboard with rooms, role-based access (owner / editor / viewer), per-room chat, live cursors, undo/redo, and persistent boards stored in MongoDB. Built with a React (Vite) frontend and an Express + Socket.IO backend.

## Features
- Real-time drawing sync across participants using Socket.IO
- Role-based access control: owner, editor, viewer
- Persistent board state per room (MongoDB + Mongoose)
- Live cursors for presence and participant count
- Per-room chat
- Autosave and manual save of board state
- Undo / redo (client-side history)
- Room management: create, join, rename, delete, leave, list users/roles
- Public room image/export endpoint

## Quickstart (development)
1. Clone
   ```bash
   git clone https://github.com/singhbalendu211/DeployBeforedawn.git
   cd DeployBeforedawn
   ```

2. Backend
   ```bash
   cd backend
   npm install
   cp .env.example .env      # set the required env vars (see below)
   npm run dev               # nodemon server.js
   # or start for production
   npm start
   ```

3. Frontend
   ```bash
   cd frontend
   npm install
   # in dev, point to your backend:
   export VITE_BACKEND_URL=http://localhost:5000
   npm run dev               # starts Vite dev server
   # build for production:
   npm run build
   ```

## Environment (minimum)
Backend (.env)
- PORT (optional, default 5000)
- MONGODB_URI — MongoDB connection string
- JWT_SECRET — secret for signing tokens
- CLIENT_URL — frontend origin for CORS (e.g., http://localhost:5173)

Frontend (env)
- VITE_BACKEND_URL — base URL of the backend (e.g., http://localhost:5000)

## Scripts (project)
Backend (backend/package.json)
- npm run dev — nodemon server.js (development)
- npm start — node server.js (production)

Frontend (frontend/package.json)
- npm run dev — start Vite dev server
- npm run build — build static assets
- npm run preview — preview built app (Vite)

## API & Socket (quick reference)
REST (examples)
- POST /api/auth/* — auth (signup/login)
- POST /api/rooms — create room
- GET /api/rooms — user rooms
- PUT /api/rooms/:roomId/join — join room
- GET /api/rooms/:roomId/board — get board (requires role)
- PUT /api/rooms/:roomId/board — save board (owner/editor)
- PUT /api/rooms/:roomId/leave — leave room
- GET /api/rooms/:roomId/image — public room image

Socket events
- Client -> Server:
  - joinRoom { roomId, user }
  - object:add / object:update / object:delete
  - canvas:clear, canvas:save, canvas:batch:update
  - cursor:move { x, y, email } (high-frequency)
  - chat:message
- Server -> Client:
  - room:load, object:add|update|delete, canvas:clear
  - cursors:update, chat:message, room:deleted

## Notable files
- backend/server.js — Express + Socket.IO server and socket handlers
- backend/routes/room.js — room-related REST routes
- backend/models/Board.js — board persistence model (Mongo)
- backend/utils/whiteboardSocket.js — in-memory cursor & room state helpers
- frontend/src/pages/Whiteboard.jsx — main whiteboard UI and socket integration
- frontend/src/App.jsx — routes and protected layout

## Deployment notes
- Socket.IO and CORS must be configured with the correct CLIENT_URL / VITE_BACKEND_URL.
- Autosave and many DB writes are done asynchronously; consider transactional integrity and backups for production.
- For multi-instance scaling, externalize presence tracking (Redis or similar) so cursors and room membership are consistent across instances.

## Troubleshooting
- Socket connection failing — check VITE_BACKEND_URL, backend CLIENT_URL, and that ports are reachable.
- Boards not persisting — verify MONGODB_URI and that backend can connect to MongoDB.
- Auth failing — ensure JWT_SECRET is set and clients send Authorization headers correctly.

## Contributing
PRs welcome. Please open issues for bugs/feature requests. Keep changes scoped, add tests where helpful, and follow the repo's JS/React/Tailwind patterns.

## License
Add a LICENSE file (suggest MIT if unsure).
