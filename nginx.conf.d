server {
    listen 80;
    server_name myapi.nestjs.aaa;
    server_tokens off;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name myapi.nestjs.aaa;
    server_tokens off;

    ssl_certificate /etc/letsencrypt/live/myapi.nestjs.aaa/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myapi.nestjs.aaa/privkey.pem;

    location / {
        proxy_pass  http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}