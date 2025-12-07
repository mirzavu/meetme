
- Read this file and remember it for every task request

### Common Info for both Local and Prod
- **Frontend**: React with Vite, TailwindCSS, Ant Design
- **Backend**: Node.js/Express with PocketBase (Database, Auth, Files)
- **Language**: JavaScript
- **Node Version**: >=20.0.0

### Local Development
- **Frontend**: `cd react && npm run dev` (starts Vite on port **3006** - this is the ONLY frontend port)
- **Backend**: `cd server && npm run dev` (uses pm2, runs on port 3016)
- **PocketBase**: `./pocketbase serve --http=127.0.0.1:8096` (must run before frontend - **8096** is the ONLY PocketBase port)
- **PM2 Development server name**: `meetme-local` (with file watching)

**IMPORTANT**: 
- Frontend MUST run on port **3006** (no other port)
- PocketBase MUST run on port **8096** (no other port)









