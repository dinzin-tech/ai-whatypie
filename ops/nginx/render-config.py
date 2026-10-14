#!/usr/bin/env python3
"""
Nginx Configuration Renderer for WhatyPie
Dynamically substitutes domain names and injects Let's Encrypt SSL blocks.
"""
import argparse
import os
import re
import sys

def parse_args():
    parser = argparse.ArgumentParser(description="Render WhatyPie Nginx configuration")
    parser.add_argument("--template", default="ops/nginx/whatypie.conf", help="Path to base whatypie.conf")
    parser.add_argument("--api-domain", default=None, help="API Domain (e.g., api.whatypie.com)")
    parser.add_argument("--frontend-domain", default=None, help="Tenant Frontend Domain (e.g., chat.whatypie.com)")
    parser.add_argument("--admin-domain", default=None, help="Admin Domain (e.g., admin.whatypie.com)")
    parser.add_argument("--app-dir", default="/var/www/whatypie", help="Root application directory")
    parser.add_argument("--ssl-mode", choices=["auto", "force", "off"], default="auto", help="SSL mode")
    parser.add_argument("--output", default=None, help="Output file path (default stdout)")
    return parser.parse_args()

def extract_domain(val):
    if not val:
        return None
    val = val.strip().strip("'\"")
    m = re.match(r"^https?://([^/:]+)", val)
    return m.group(1) if m else val

def get_domains_from_env(app_dir):
    domains = {
        "api": None,
        "frontend": None,
        "admin": None
    }
    # Check Wapto-api/.env
    api_env = os.path.join(app_dir, "Wapto-api", ".env")
    if os.path.isfile(api_env):
        with open(api_env, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if line.startswith("#") or "=" not in line:
                    continue
                k, v = line.strip().split("=", 1)
                k = k.strip()
                if k in ["APP_URL", "SERVER_ADDR", "API_URL"] and not domains["api"]:
                    d = extract_domain(v)
                    if d and d not in ["localhost", "127.0.0.1"]:
                        domains["api"] = d
                elif k in ["FRONTEND_URL", "CLIENT_URL"] and not domains["frontend"]:
                    d = extract_domain(v)
                    if d and d not in ["localhost", "127.0.0.1"]:
                        domains["frontend"] = d

    # Check Wapto-frontend/.env
    fe_env = os.path.join(app_dir, "Wapto-frontend", ".env")
    if os.path.isfile(fe_env):
        with open(fe_env, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "NEXT_PUBLIC_APP_URL=" in line or "NEXT_PUBLIC_FRONTEND_URL=" in line:
                    v = line.split("=", 1)[1]
                    domains["frontend"] = extract_domain(v)

    # Check Wapto-admin/.env
    adm_env = os.path.join(app_dir, "Wapto-admin", ".env")
    if os.path.isfile(adm_env):
        with open(adm_env, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "NEXT_PUBLIC_ADMIN_URL=" in line or "NEXT_PUBLIC_APP_URL=" in line:
                    v = line.split("=", 1)[1]
                    domains["admin"] = extract_domain(v)

    return domains

def render_ssl_server_block(domain, webroot, proxy_pass, is_api=False):
    ssl_cert = f"/etc/letsencrypt/live/{domain}/fullchain.pem"
    ssl_key = f"/etc/letsencrypt/live/{domain}/privkey.pem"
    max_body = "50M" if is_api else "25M"

    ws_block = ""
    if is_api:
        ws_block = """
    # Socket.io & WebSocket connections
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
"""

    return f"""# ==============================================================================
# {domain} (HTTP -> HTTPS Redirect)
# ==============================================================================
server {{
    listen 80;
    listen [::]:80;
    server_name {domain};

    location = /healthz {{
        access_log off;
        return 200 "OK\\n";
    }}

    location ^~ /.well-known/acme-challenge/ {{
        allow all;
        root {webroot};
    }}

    location / {{
        return 301 https://$host$request_uri;
    }}
}}

# ==============================================================================
# {domain} (HTTPS Secure Reverse Proxy)
# ==============================================================================
server {{
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name {domain};

    ssl_certificate {ssl_cert};
    ssl_certificate_key {ssl_key};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL_{domain.replace('.', '_')}:10m;
    ssl_session_timeout 1d;

    client_max_body_size {max_body};

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
{ws_block}
    location / {{
        proxy_pass {proxy_pass};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 120s;
    }}
}}
"""

def main():
    args = parse_args()
    env_domains = get_domains_from_env(args.app_dir)

    api_domain = args.api_domain or env_domains["api"] or "api.yourdomain.com"
    fe_domain = args.frontend_domain or env_domains["frontend"] or "chat.yourdomain.com"
    adm_domain = args.admin_domain or env_domains["admin"] or "admin.yourdomain.com"

    domain_map = [
        {"domain": api_domain, "proxy": "http://127.0.0.1:5000", "webroot": f"{args.app_dir}/Wapto-api/public", "is_api": True},
        {"domain": fe_domain, "proxy": "http://127.0.0.1:3000", "webroot": f"{args.app_dir}/Wapto-frontend/public", "is_api": False},
        {"domain": adm_domain, "proxy": "http://127.0.0.1:3001", "webroot": f"{args.app_dir}/Wapto-admin/public", "is_api": False},
    ]

    # Check SSL availability
    rendered_blocks = []
    for item in domain_map:
        d = item["domain"]
        cert = f"/etc/letsencrypt/live/{d}/fullchain.pem"
        key = f"/etc/letsencrypt/live/{d}/privkey.pem"
        has_ssl = (args.ssl_mode == "force") or (args.ssl_mode == "auto" and os.path.isfile(cert) and os.path.isfile(key))

        if has_ssl:
            rendered_blocks.append(render_ssl_server_block(d, item["webroot"], item["proxy"], item["is_api"]))
        else:
            # Render standard HTTP block
            ws = ""
            if item["is_api"]:
                ws = """
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }
"""
            max_b = "50M" if item["is_api"] else "25M"
            block = f"""server {{
    listen 80;
    listen [::]:80;
    server_name {d};

    client_max_body_size {max_b};

    location = /healthz {{
        access_log off;
        return 200 "OK\\n";
    }}

    location ^~ /.well-known/acme-challenge/ {{
        allow all;
        root {item["webroot"]};
    }}
{ws}
    location / {{
        proxy_pass {item["proxy"]};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
"""
            rendered_blocks.append(block)

    full_config = "\n".join(rendered_blocks)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(full_config)
    else:
        sys.stdout.write(full_config)

if __name__ == "__main__":
    main()
