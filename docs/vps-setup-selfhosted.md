# 🚀 VPS Setup Guide

> **VPS Provider:** Hostinger (or similar)  
> **Created:** 2025-12-23  
> **Purpose:** Self-hosted Food Calories API with MongoDB & OAuth

---

## 📋 VPS Details

| Property        | Value                       |
| --------------- | --------------------------- |
| **IP Address**  | `<YOUR_VPS_IP>`             |
| **Hostname**    | `<YOUR_HOSTNAME>`           |
| **SSH User**    | `root`                      |
| **OS**          | Ubuntu 24.04 with Coolify   |
| **Location**    | Malaysia - Kuala Lumpur 🇲🇾  |
| **Plan**        | KVM 1 (1 CPU, 4GB RAM)      |
| **SSH Key**     | `~/.ssh/<YOUR_KEY_NAME>`    |
| **Coolify URL** | `http://<YOUR_VPS_IP>:8000` |

---

## 🔐 SSH Key Setup (Local Machine)

### 1. Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "your-email@domain.com" -f ~/.ssh/<YOUR_KEY_NAME>
```

### 2. View Your Public Key

```bash
cat ~/.ssh/<YOUR_KEY_NAME>.pub
```

### 3. Copy Public Key to VPS

```bash
ssh-copy-id -i ~/.ssh/<YOUR_KEY_NAME>.pub root@<YOUR_VPS_IP>
```

Or manually:

```bash
# First, connect with password
ssh root@<YOUR_VPS_IP>

# On the VPS, add your public key
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 4. Configure SSH Config (Recommended)

Edit `~/.ssh/config` on your local machine:

```
Host myvps
    HostName <YOUR_VPS_IP>
    User root
    IdentityFile ~/.ssh/<YOUR_KEY_NAME>
    IdentitiesOnly yes
```

Now you can connect simply with:

```bash
ssh myvps
```

---

## 🛠️ Initial VPS Setup

### Connect to VPS

```bash
ssh myvps
# or
ssh -i ~/.ssh/<YOUR_KEY_NAME> root@<YOUR_VPS_IP>
```

### Update System (If Plain Ubuntu)

```bash
apt update && apt upgrade -y
```

### Install Docker (If Plain Ubuntu)

```bash
curl -fsSL https://get.docker.com | sh
```

---

## 🎨 Install Coolify

If you selected Coolify from the OS panel, it should be pre-installed. Otherwise:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

After installation, access Coolify at:

```
http://<YOUR_VPS_IP>:8000
```

---

## 🏗️ Services to Deploy

### 1. MongoDB

- **Deploy via:** Coolify One-Click Template
- **Internal Port:** 27017
- **Connection String:** `mongodb://username:password@localhost:27017/calories_db`

### 2. Logto (OAuth)

- **Deploy via:** Coolify One-Click Template
- **Admin Console:** `https://auth.<YOUR_DOMAIN>/console`
- **Endpoint:** `https://auth.<YOUR_DOMAIN>`

### 3. Food Calories API (Backend)

- **Deploy via:** GitHub Integration
- **Framework:** Node.js / Express / tRPC
- **Endpoint:** `https://api.<YOUR_DOMAIN>`

### 4. Frontend

- **Deploy via:** GitHub Integration
- **Framework:** Next.js
- **URL:** `https://<YOUR_DOMAIN>`

---

## 🌐 Domain Setup

### DNS Records (Add to your domain registrar)

| Type | Name | Value           | TTL |
| ---- | ---- | --------------- | --- |
| A    | @    | `<YOUR_VPS_IP>` | 300 |
| A    | api  | `<YOUR_VPS_IP>` | 300 |
| A    | auth | `<YOUR_VPS_IP>` | 300 |
| A    | www  | `<YOUR_VPS_IP>` | 300 |

### Subdomains

- `<YOUR_DOMAIN>` → Frontend
- `api.<YOUR_DOMAIN>` → Backend API
- `auth.<YOUR_DOMAIN>` → Logto OAuth

---

## 🔒 Security Checklist

- [ ] Change default SSH port (optional)
- [ ] Disable root password login
- [ ] Enable UFW firewall
- [ ] Set up fail2ban
- [ ] Enable automatic security updates

### Secure SSH (Disable Password Login)

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Set these values:
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
systemctl restart sshd
```

### Setup Firewall

```bash
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw allow 8000    # Coolify (temporary, remove after setup)
ufw enable
```

---

## 📁 Project Structure

```
monorepo/
├── packages/
│   ├── kal-backend/       # Backend API
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── kal-frontend/      # Frontend App
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── kal-shared/        # Shared types
└── docker/
    └── docker-compose.yml # Local development
```

---

## 🔗 Quick Commands

```bash
# Connect to VPS
ssh myvps

# Check Docker containers
docker ps

# View Coolify logs
docker logs coolify -f

# Check disk space
df -h

# Check memory
free -h

# Check running services
systemctl status
```

---

## 📝 Notes

- **First login:** You'll need to use password authentication until SSH key is set up
- **Coolify default port:** 8000 (change to 443 after SSL setup)
- **MongoDB backups:** Set up automated backups via Coolify or cron job
- **SSL Certificates:** Coolify handles this automatically via Let's Encrypt

---

## 🆘 Troubleshooting

### Can't connect via SSH?

```bash
# Check if SSH is running on VPS
systemctl status sshd

# Check firewall
ufw status
```

### Coolify not accessible?

```bash
# Check if Coolify is running
docker ps | grep coolify

# Restart Coolify
docker restart coolify
```

### Port already in use?

```bash
# Find what's using the port
lsof -i :8000
netstat -tulpn | grep 8000
```

---

## 📅 Maintenance Schedule

| Task             | Frequency                 |
| ---------------- | ------------------------- |
| System updates   | Weekly                    |
| Database backups | Daily                     |
| Log rotation     | Automatic                 |
| SSL renewal      | Automatic (Let's Encrypt) |

---

_Last updated: 2025-12-23_
