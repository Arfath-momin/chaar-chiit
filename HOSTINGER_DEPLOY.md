# Deploy Chaar Chitti to Hostinger VPS

## Prerequisites
- Hostinger VPS plan (not shared hosting)
- SSH access to your VPS
- Domain (optional)

## Step-by-Step Deployment

### 1. Connect to Your VPS
```bash
ssh root@your-vps-ip
# Enter your password
```

### 2. Install Node.js (if not installed)
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify
node -v
npm -v
```

### 3. Install Git (if not installed)
```bash
apt install git -y
```

### 4. Clone Your Repository
```bash
cd /var/www
git clone https://github.com/Arfath-momin/chaar-chiit.git
cd chaar-chiit
```

### 5. Install Dependencies & Build
```bash
npm install
npm run build
```

### 6. Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 7. Start the Server
```bash
# Start with PM2
pm2 start server.js --name chaar-chitti

# Make it restart on reboot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs chaar-chitti
```

### 8. Configure Firewall
```bash
# Allow port 3000
ufw allow 3000

# Or use port 80 with nginx (recommended)
ufw allow 80
ufw allow 443
```

### 9. Setup Nginx Reverse Proxy (Recommended)
```bash
# Install nginx
apt install nginx -y

# Create config
nano /etc/nginx/sites-available/chaar-chitti
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your VPS IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
# Create symlink
ln -s /etc/nginx/sites-available/chaar-chitti /etc/nginx/sites-enabled/

# Test config
nginx -t

# Restart nginx
systemctl restart nginx
```

### 10. Setup SSL (Optional but Recommended)
```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Access Your Game
- Without domain: `http://your-vps-ip`
- With domain: `http://your-domain.com`
- With SSL: `https://your-domain.com`

## Update Your Game
```bash
cd /var/www/chaar-chiit
git pull
npm install
npm run build
pm2 restart chaar-chitti
```

## Useful PM2 Commands
```bash
pm2 list              # List all processes
pm2 logs chaar-chitti # View logs
pm2 restart chaar-chitti  # Restart
pm2 stop chaar-chitti     # Stop
pm2 delete chaar-chitti   # Remove from PM2
pm2 monit             # Monitor resources
```

## Troubleshooting

### Port already in use
```bash
# Find what's using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Check logs
```bash
pm2 logs chaar-chitti --lines 100
```

### Restart everything
```bash
pm2 restart chaar-chitti
systemctl restart nginx
```

## Important Notes
- ✅ Works on Hostinger VPS
- ❌ Won't work on Hostinger shared hosting
- Keep your VPS updated: `apt update && apt upgrade`
- Monitor with `pm2 monit`
- Backup your data regularly

## Cost
- Hostinger VPS starts at ~$4-6/month
- Includes full Node.js and WebSocket support
- Perfect for this multiplayer game!
