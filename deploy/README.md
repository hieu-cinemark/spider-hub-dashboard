# Deploy spider-hub-dashboard on the VPS

Everything listens on 127.0.0.1 except nginx, which serves **https://spider-hub.id.vn** (Let's Encrypt, via
spider-hub `deploy/login-display/install-domain.sh`) - or **:8443** with a self-signed certificate when there is no
domain. Access = the dashboard's own API-key login (cinemark-api enforces the key - make sure API_AUTH_KEY is set
in cinemark-api's .env).

```
browser --HTTPS--> nginx (spider-hub.id.vn:443)
                                /        -> this dashboard (next start 127.0.0.1:3001)
                                /api/    -> cinemark-api 127.0.0.1:8000 (prefix stripped, websockets)
```

1. **nginx** (spider-hub repo, as root):
   ```bash
   cd /opt/spider-hub && sudo -u app git pull
   bash deploy/login-display/install.sh
   bash deploy/login-display/install-domain.sh spider-hub.id.vn   # domain with its certbot certificate
   ```
2. **Dashboard** (as root):
   ```bash
   cd /opt && sudo -u app git clone <dashboard repo> spider-hub-dashboard   # deploy key like the other repos
   cd /opt/spider-hub-dashboard
   sudo -u app tee .env.production <<'ENV'
   NEXT_PUBLIC_API_BASE_URL=https://spider-hub.id.vn/api
   ENV
   sudo -u app npm ci && sudo -u app npm run build
   cp deploy/spider-hub-dashboard.service /etc/systemd/system/ && systemctl daemon-reload
   systemctl enable --now spider-hub-dashboard
   ```
   `NEXT_PUBLIC_*` values are baked in at build time - rebuild after changing them.
3. Open **https://spider-hub.id.vn** and log in with the dashboard's API key.
   (Without a domain: https://<VPS-IP>:8443 and accept the self-signed certificate warning once.)

Update later: `cd /opt/spider-hub-dashboard && sudo -u app git pull && sudo -u app npm ci && sudo -u app npm run build && systemctl restart spider-hub-dashboard`.
