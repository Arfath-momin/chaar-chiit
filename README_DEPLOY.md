# Deployment Guide for Chaar Chitti

## ⚠️ Important: Socket.IO Compatibility

This app uses Socket.IO for real-time multiplayer, which **does NOT work on Vercel** due to serverless limitations.

## ✅ Recommended Deployment Options

### Option 1: Railway (Easiest)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```
- Free tier available
- Automatic HTTPS
- Easy deployment

### Option 2: Render.com
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo: `Arfath-momin/chaar-chiit`
4. Settings:
   - Build: `npm install && npm run build`
   - Start: `node server.js`
   - Port: `3000`
5. Deploy!

### Option 3: DigitalOcean App Platform
1. Go to https://cloud.digitalocean.com/apps
2. Create → GitHub repo
3. Detected as Node.js
4. Run command: `node server.js`
5. Deploy

### Option 4: Heroku
```bash
# Install Heroku CLI
npm i -g heroku

# Deploy
heroku login
heroku create chaar-chitti
git push heroku main
```

### Option 5: VPS (Advanced)
Deploy to any VPS (AWS EC2, DigitalOcean Droplet, etc.):
```bash
# SSH into your server
ssh user@your-server-ip

# Clone repo
git clone https://github.com/Arfath-momin/chaar-chiit.git
cd chaar-chiit

# Install dependencies
npm install

# Build
npm run build

# Install PM2 for process management
npm install -g pm2

# Start server
pm2 start server.js --name chaar-chitti
pm2 startup
pm2 save

# Setup nginx reverse proxy (optional)
```

## ❌ Won't Work
- ❌ Vercel (serverless, no WebSocket support)
- ❌ Netlify (same issue)
- ❌ GitHub Pages (static only)

## Current Status
- GitHub: ✅ Code pushed
- Vercel: ❌ Won't work (Socket.IO incompatible)
- Need: Deploy to Railway/Render/Heroku

## Quick Deploy (Railway - 2 minutes)
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

Done! Your game will be live with full Socket.IO support.
