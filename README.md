# DeployBeforedawn

A lightweight real-time collaborative whiteboard with rooms, role-based access (owner/editor/viewer), chat, live cursors, and persistent boards via MongoDB.

## Quick overview
- Real-time sync using Socket.IO
- REST API + JWT auth (Express + Mongoose)
- Frontend: React (Vite)

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
   cp .env.example .env # set MONGODB_URI, JWT_SECRET, CLIENT_URL
   npm run dev
   ```
3. Frontend
   ```bash
   cd frontend
   npm install
   export VITE_BACKEND_URL=http://localhost:5000
   npm run dev
   ```

## Environment (minimum)
- BACKEND: PORT, MONGODB_URI, JWT_SECRET, CLIENT_URL
- FRONTEND: VITE_BACKEND_URL

## Tech
- Node.js, Express, Socket.IO, MongoDB (Mongoose)
- React (Vite), TailwindCSS, socket.io-client

## Contributing
PRs welcome. Please open issues for bugs or feature requests.

## License
Add a LICENSE file to specify the project license.
