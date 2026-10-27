# Deploy spider-hub-dashboard on the VPS

Everything listens on 127.0.0.1 except nginx on **:8443** (self-signed TLS + Basic Auth for every path).

```
browser --HTTPS + password--> nginx :8443
                                /        -> this dashboard (next start 127.0.0.1:3001)
                                /api/    -> cinemark-api 127.0.0.1:8000 (prefix stripped, websockets)
                                /novnc/  -> noVNC 127.0.0.1:6080 -> x11vnc -> Xvfb :99 (manual-login browser)
```

1. **Login display + nginx** (spider-hub repo, as root):
   ```bash
   cd /opt/spider-hub && sudo -u app git pull
   bash deploy/login-display/install.sh admin      # asks for the password of user "admin"
   ```
2. **Dashboard** (as root):
   ```bash
   cd /opt && sudo -u app git clone <dashboard repo> spider-hub-dashboard   # deploy key like the other repos
   cd /opt/spider-hub-dashboard
   sudo -u app tee .env.production <<'ENV'
   NEXT_PUBLIC_API_BASE_URL=https://160.191.54.31:8443/api
   NEXT_PUBLIC_MANUAL_LOGIN_VIEWER_URL=/novnc/vnc.html?path=novnc/websockify&autoconnect=1&resize=scale&reconnect=1
   ENV
   sudo -u app npm ci && sudo -u app npm run build
   cp deploy/spider-hub-dashboard.service /etc/systemd/system/ && systemctl daemon-reload
   systemctl enable --now spider-hub-dashboard
   ```
   `NEXT_PUBLIC_*` values are baked in at build time - rebuild after changing them.
3. Open **https://160.191.54.31:8443**, accept the certificate warning once (self-signed), enter the Basic Auth
   password, then the dashboard's own API key as before.

Add another person: `htpasswd /etc/nginx/spider-hub.htpasswd <name>`.
Update later: `cd /opt/spider-hub-dashboard && sudo -u app git pull && sudo -u app npm ci && sudo -u app npm run build && systemctl restart spider-hub-dashboard`.
