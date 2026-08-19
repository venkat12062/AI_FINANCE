# Deployment Guide

The AI Finance Manager is built to be easily deployed across standard PaaS providers or self-hosted VPS environments using Docker.

## 1. Deploying on Render (PaaS)

Render natively supports both Docker and Node.js Web Services.

### Backend Deployment (Node Service)
1. Link your GitHub repository to Render.
2. Create a **New Web Service**.
3. Environment: `Node`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables from `.env.example`.
7. Add a MySQL Database URL (you can spin up a Render MySQL instance or use Aiven/PlanetScale).

### Backend Deployment (Docker)
1. Select Docker as the environment.
2. Render will automatically detect the `Dockerfile` at the root and build the image.

## 2. Deploying on Railway.app

Railway simplifies deployment significantly by offering integrated MySQL databases.

1. Connect your GitHub Repo to Railway.
2. Provision a **MySQL Database** from the Railway dashboard.
3. Railway will inject `DATABASE_URL` or individual `DB_HOST`, `DB_USER` into your environment.
4. Add the remaining variables (`JWT_SECRET`, `PORT`).
5. Deploy. Railway detects the `package.json` `start` script automatically.

## 3. Deploying on a VPS (DigitalOcean / AWS EC2 / Linode)

The easiest way to deploy to a blank Linux server is via Docker Compose.

1. SSH into your VPS.
2. Clone the repository: `git clone <your-repo> && cd AI_FINANCE_MANAGER`
3. Install Docker and Docker Compose: `sudo apt install docker-compose`
4. Configure your environment: `nano .env` (copy values from `.env.example`).
5. Build and run in detached mode:
   ```bash
   sudo docker-compose up -d --build
   ```
6. The application is now running on port `5000`. You can configure an Nginx reverse proxy to route port 80/443 traffic to `localhost:5000` and attach an SSL certificate using Let's Encrypt (`certbot`).

## File Persistence Warning
By default, uploaded receipts (`/uploads`) and logs (`/logs`) are stored locally. If deploying to stateless PaaS (Render/Heroku/Railway), these files will be wiped on restart. 
*Recommendation for Production:* Update the `multer` configuration in `uploadMiddleware.js` to upload directly to an AWS S3 bucket instead of the local filesystem.
