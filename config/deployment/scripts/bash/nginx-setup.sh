#!/usr/bin/env bash

# =============================================================================
# DenoGenesis Nginx Configuration Generator
# =============================================================================
# Interactive script using dialog to create site-specific Nginx configurations
# =============================================================================

set -euo pipefail

# Check if dialog is installed
if ! command -v dialog &> /dev/null; then
    echo "ERROR: 'dialog' is not installed."
    echo "Install it with: sudo apt-get install dialog (Debian/Ubuntu)"
    echo "               or: sudo yum install dialog (RHEL/CentOS)"
    exit 1
fi

# Temporary file for dialog output
TEMP_FILE=$(mktemp)
trap 'rm -f $TEMP_FILE' EXIT

# =============================================================================
# Gather Site Information
# =============================================================================

# Site Name (domain without www)
dialog --title "DenoGenesis Nginx Config Generator" \
       --inputbox "Enter the site name (e.g., denogenesis.com):" \
       8 60 2> "$TEMP_FILE"

if [ $? -ne 0 ]; then
    clear
    echo "Configuration cancelled."
    exit 0
fi

SITE_NAME=$(cat "$TEMP_FILE")

if [ -z "$SITE_NAME" ]; then
    clear
    echo "ERROR: Site name cannot be empty."
    exit 1
fi

# Backend Port
dialog --title "Backend Configuration" \
       --inputbox "Enter the backend port (default: 3000):" \
       8 60 "3000" 2> "$TEMP_FILE"

BACKEND_PORT=$(cat "$TEMP_FILE")
BACKEND_PORT=${BACKEND_PORT:-3000}

# Max Upload Size
dialog --title "Upload Configuration" \
       --inputbox "Enter max file upload size (e.g., 25M, 100M):" \
       8 60 "25M" 2> "$TEMP_FILE"

MAX_UPLOAD_SIZE=$(cat "$TEMP_FILE")
MAX_UPLOAD_SIZE=${MAX_UPLOAD_SIZE:-25M}

# API Rate Limit
dialog --title "Rate Limiting" \
       --inputbox "Enter API rate limit (requests per second, e.g., 10):" \
       8 60 "10" 2> "$TEMP_FILE"

API_RATE_LIMIT=$(cat "$TEMP_FILE")
API_RATE_LIMIT=${API_RATE_LIMIT:-10}

# Quote/Contact Rate Limit
dialog --title "Rate Limiting" \
       --inputbox "Enter quote/contact form rate limit (requests per second, e.g., 2):" \
       8 60 "2" 2> "$TEMP_FILE"

QUOTE_RATE_LIMIT=$(cat "$TEMP_FILE")
QUOTE_RATE_LIMIT=${QUOTE_RATE_LIMIT:-2}

# Derive variables
SITE_NAME_UNDERSCORE=$(echo "$SITE_NAME" | tr '.' '_' | tr '-' '_')
OUTPUT_FILE="${SITE_NAME}.nginx.conf"

# =============================================================================
# Confirmation Dialog
# =============================================================================

dialog --title "Confirm Configuration" \
       --yesno "Generate Nginx config with these settings?\n\n\
Site Name: $SITE_NAME\n\
Backend Port: $BACKEND_PORT\n\
Max Upload: $MAX_UPLOAD_SIZE\n\
API Rate: ${API_RATE_LIMIT}r/s\n\
Quote Rate: ${QUOTE_RATE_LIMIT}r/s\n\n\
Output: $OUTPUT_FILE" \
       15 70

if [ $? -ne 0 ]; then
    clear
    echo "Configuration cancelled."
    exit 0
fi

# =============================================================================
# Generate Nginx Configuration
# =============================================================================

cat > "$OUTPUT_FILE" << EOF
# =============================================================================
# DenoGenesis Framework - Main Site Configuration
# =============================================================================
# Nginx configuration for the primary $SITE_NAME site
# Backend service running on port $BACKEND_PORT
# 
# File: $OUTPUT_FILE
# Location: /etc/nginx/sites-available/$OUTPUT_FILE
# =============================================================================

# =============================================================================
# Rate Limiting Zones
# =============================================================================
limit_req_zone \$binary_remote_addr zone=${SITE_NAME_UNDERSCORE}_api_limit:10m rate=${API_RATE_LIMIT}r/s;
limit_req_zone \$binary_remote_addr zone=${SITE_NAME_UNDERSCORE}_quote_limit:10m rate=${QUOTE_RATE_LIMIT}r/s;

# =============================================================================
# HTTPS Server Configuration
# =============================================================================
server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name www.$SITE_NAME $SITE_NAME;

    # SSL Configuration using Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/$SITE_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$SITE_NAME/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ==========================================================================
    # Security Headers (DenoGenesis Standard)
    # ==========================================================================
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Content Security Policy (adjust per site needs)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss:; font-src 'self'; object-src 'none'; base-uri 'self'";

    # File upload limit (adjust per business needs)
    client_max_body_size $MAX_UPLOAD_SIZE;

    # ==========================================================================
    # Main Application Proxy
    # ==========================================================================
    location / {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Standard timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # ==========================================================================
    # Static Asset Optimization
    # ==========================================================================
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;

        # Cache static assets
        expires 7d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;

        # Enable compression
        gzip on;
        gzip_types text/css application/javascript image/svg+xml;
    }

    # ==========================================================================
    # API Rate Limiting
    # ==========================================================================
    location /api/ {
        limit_req zone=${SITE_NAME_UNDERSCORE}_api_limit burst=15 nodelay;
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # ==========================================================================
    # WebSocket Support (if needed)
    # ==========================================================================
    location /ws {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Extended timeouts for WebSocket connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # ==========================================================================
    # File Upload Handling
    # ==========================================================================
    location /uploads/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Extended timeouts for file uploads
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # ==========================================================================
    # Quote/Contact Form with Strict Rate Limiting
    # ==========================================================================
    location /api/quote {
        limit_req zone=${SITE_NAME_UNDERSCORE}_quote_limit burst=3 nodelay;
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/contact {
        limit_req zone=${SITE_NAME_UNDERSCORE}_quote_limit burst=3 nodelay;
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # ==========================================================================
    # Security - deny access to sensitive files
    # ==========================================================================
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ /(?:\.git|\.htaccess|\.env|config\.json|package\.json|deno\.lock)\$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # ==========================================================================
    # Health Check Endpoint
    # ==========================================================================
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # ==========================================================================
    # Framework Documentation and Admin Routes
    # ==========================================================================
    location /docs/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Optional: Add basic auth for documentation in production
        # auth_basic "DenoGenesis Documentation";
        # auth_basic_user_file /etc/nginx/.htpasswd;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Consider adding IP restrictions for admin routes
        # allow 192.168.1.0/24;
        # deny all;
    }

    # ==========================================================================
    # Logging Configuration
    # ==========================================================================
    error_log /var/log/nginx/${SITE_NAME_UNDERSCORE}_error.log;
    access_log /var/log/nginx/${SITE_NAME_UNDERSCORE}_access.log;
}

# =============================================================================
# HTTP to HTTPS Redirect
# =============================================================================
server {
    listen 80;
    listen [::]:80;

    server_name www.$SITE_NAME $SITE_NAME;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$host\$request_uri;
}
EOF

# =============================================================================
# Success Message
# =============================================================================

dialog --title "Success" \
       --msgbox "Nginx configuration generated successfully!\n\n\
File: $OUTPUT_FILE\n\n\
Next steps:\n\
1. Review the configuration file\n\
2. Copy to: /etc/nginx/sites-available/\n\
3. Create symlink: sudo ln -s /etc/nginx/sites-available/$OUTPUT_FILE /etc/nginx/sites-enabled/\n\
4. Test config: sudo nginx -t\n\
5. Reload nginx: sudo systemctl reload nginx" \
       16 70

clear
echo "========================================="
echo "Configuration generated: $OUTPUT_FILE"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review: cat $OUTPUT_FILE"
echo "2. Copy: sudo cp $OUTPUT_FILE /etc/nginx/sites-available/"
echo "3. Enable: sudo ln -s /etc/nginx/sites-available/$OUTPUT_FILE /etc/nginx/sites-enabled/"
echo "4. Test: sudo nginx -t"
echo "5. Reload: sudo systemctl reload nginx"
echo ""