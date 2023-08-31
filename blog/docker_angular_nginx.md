---
title: "Dockeriser son application Angular avec Nginx en multi-stage"
date: 2023-08-31
tags: ["Docker", "Angular", "Nginx"]
---

## Introduction

Arrive le moment où vous devez déployer votre application Angular sur Docker. Pour ce faire, on va décomposer notre Dockerfile en 2 parties. La première partie va comprendre la génération de l'application et la seconde partie, un serveur Nginx avec un fichier de configuration associé et le dossier de build de l'application.

> Cette notion de découpage sur Docker se nomme le **multi-stage**.

NB : il ne s'agit pas d'un environnement de développement mais bien d'un environnement de production.

## Prérequis

Pour concevoir une image Docker, il faut comprendre comment fonctionne le build d'une application sur Angular et rédiger un fichier de configuration Nginx Concernant Angular, l'application est générée à la racine du projet dans un répertoire "dist".

### Script d'exécution

Dans le fichier "package.json", assurez-vous d'avoir la présence d'une commande dans la partie "scripts". Par exemple sur Angular CLI `npm run build` ou sur Nx `"myapp:ci-build": "nx build myapp"`.

### Script de configuration Nginx

On a besoin de mettre en place un fichier de configuration Nginx. À la racine de votre projet Angular ou Nx, créez un nouveau dossier que vous nommez "docker" avec un fichier "nginx.conf" basique avec le contenu ci-dessous.

```conf
events { }
http {
  include /etc/nginx/mime.types;
  server {
    client_max_body_size 50M;
    listen 80 default_server;
    listen [::]:80 default_server;
    root /usr/share/nginx/html;
    server_name _;
    index index.html;

    location / {
      try_files $uri $uri/ /index.html;
    }
  }
}
```

## Création du Dockerfile

Toujours dans le dossier "docker" créez un fichier "myapp_build".

### Build de l'application

Pour la première partie de ce Dockerfile, on a besoin d'une image de NodeJS. On va donc partir sur une image légère de la distribution Linux Alpine. De préférence une version LTS (Long Term Support) de NodeJS, c'est-à-dire une version paire (exemple: 16, 18, 20, etc...). Ci-dessous, on utilise la version de NodeJS 20.5.1 de Alpine 3.18.

```dockerfile
FROM node:20.5.1-alpine3.18 as builder
```

Ensuite, on souhaite copier le contenu des fichiers "package.json" et "package-lock.json" à la racine du container.

```dockerfile
COPY package.json package-lock.json ./
```

Ainsi, on peut éxecuter la commande d'installation des paquets dédiées (et non `npm install`).

```dockerfile
RUN npm ci && mkdir /ng-app && mv ./node_modules ./ng-app
```

Et déplacer le dossier "node_modules" dans un nouveau dossier "ng-app" que l'on définit comme le dossier d'entrée.

```dockerfile
WORKDIR /ng-app
```

Puis on copie le contenu du dossier d'entrée ("ng-app") à la racine du container.

```dockerfile
COPY . .
```

Et on construit l'application avec la commande spécifiée dans le fichier "package.json".

```dockerfile
RUN npm run myapp:ci-build
```

### Serveur de l'application

À la suite du Dockerfile, on passe à l'étape du serveur avec Nginx. On part donc sur image Nginx officielle sous Alpine. Ci-dessous, la version 1.25.2 de Nginx sur Alpine 3.18.

```dockerfile
FROM nginx:1.25.2-alpine3.18
```

Puis on ajoute le bon fuseau horaire (utile pour l'horodatage des logs).

```dockerfile
ENV TZ=Europe/Paris
```

On copie le fichier de configuration de Nginx ("nginx.conf" présent dans le dossier "docker").

```dockerfile
COPY docker/nginx.conf /etc/nginx/nginx.conf
```

On check la syntaxe du fichier "nginx.conf" et on supprime le contenu répertoire par défaut de Nginx.

```dockerfile
RUN nginx -c /etc/nginx/nginx.conf -t && rm -rf /usr/share/nginx/html/*
```

Afin de le remplacer par le dossier de build que l'on va chercher dans le "builder". Vérifier bien le chemin (sur Angular CLI, il n'y a pas de répertoire "apps").

```dockerfile
COPY --from=builder /ng-app/dist/apps/myapp /usr/share/nginx/html
```

Il nous manque la gestion de la sécurité. Par défaut, l'utilisateur utilisé est "root". Hors, si Docker est compromis, il faut donner moins de privilèges sur l'utilisateur courant du container.

```dockerfile
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid
USER nginx
```

Dans notre cas, on utilise l'utilisateur "nginx".

### Dockerfile complet

Ci-dessous le Dockerfile complet.

```dockerfile
FROM node:20.5.1-alpine3.18 as builder
COPY package.json package-lock.json ./
RUN npm ci && mkdir /ng-app && mv ./node_modules ./ng-app
WORKDIR /ng-app
COPY . .
RUN npm run myapp:ci-build

FROM nginx:1.25.2-alpine3.18
ENV TZ=Europe/Paris
ENV nginx_folder=/usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
RUN nginx -c /etc/nginx/nginx.conf -t && rm -rf $nginx_folder/*
COPY --from=builder /ng-app/dist/apps/myapp $nginx_folder
RUN chown -R nginx:nginx $nginx_folder && chmod -R 755 $nginx_folder && \
  chown -R nginx:nginx /var/cache/nginx && \
  chown -R nginx:nginx /var/log/nginx && \
  chown -R nginx:nginx /etc/nginx/conf.d && \
  touch /var/run/nginx.pid && \
  chown -R nginx:nginx /var/run/nginx.pid
USER nginx
```

## Tester localement

Avant d'envoyer directement en production, il est fortement recommandé de vérifier que le container tourne bien en local.

### Création de l'image

On créé une image Docker que l'on nomme "mynodeimage" via le paramètre `-t` et qui va chercher le bon fichier via le paramètre `-f` dans le dossier "docker".

`docker build -t mynodeimage -f docker/myapp_build .`

À la première exécution de cette commande, Docker va récupérer les 2 images Alpine, cela peut prendre un certains temps.

### Création du conteneur

Par défaut, le port entrant de Nginx est le 80 (coté Docker). En sortie, on veut le port 1234.

`docker run -d -p 1234:80 --name my_container mynodeimage`

On vérifie que le container s'est bien lancé (statut "up") et tourne sur le port 80 vers le port 1234.

```bash
docker ps
372136f252e1   mynodeimage            "/docker-entrypoint.…"   9 minutes ago   Up 9 minutes    0.0.0.0:1234->80/tcp, :::1234->80/tcp            my_container
```

Et normalement, l'application est accessible sur [http://localhost:1234](http://localhost:1234).

```bash
curl -i http://localhost:1234
HTTP/1.1 200 OK
Server: nginx/1.25.2
[...]
```

On peut également vérifier la présence des logs (avec le bon timezone).

```bash
docker logs -f my_container
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
/docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
172.17.0.1 - - [24/Aug/2023:15:24:37 +0200] "GET / HTTP/1.1" 200 579 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0"
172.17.0.1 - - [24/Aug/2023:15:24:37 +0200] "GET /styles.ef46db3751d8e999.css HTTP/1.1" 200 0 "http://localhost:1234/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0"
172.17.0.1 - - [24/Aug/2023:15:24:37 +0200] "GET /polyfills.f0c7e92599cba58e.js HTTP/1.1" 200 33827 "http://localhost:1234/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0"
172.17.0.1 - - [24/Aug/2023:15:24:37 +0200] "GET /main.c8da166aa81518c1.js HTTP/1.1" 200 128722 "http://localhost:1234/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0"
172.17.0.1 - - [24/Aug/2023:15:24:37 +0200] "GET /runtime.4a60012eff6e45d5.js HTTP/1.1" 200 916 "http://localhost:1234/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0"
172.17.0.1 - - [24/Aug/2023:15:24:37 +0200] "GET /favicon.ico HTTP/1.1" 200 948 "http://localhost:1234/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0"
```

Ainsi que de la taille de l'image.

```bash
docker images
REPOSITORY                      TAG                    IMAGE ID       CREATED         SIZE
mynodeimage                     latest                 db844b2a8abb   5 minutes ago   42.9MB
```

Sans oublier l'utilisateur courant du container.

```bash
docker exec -it my_container ash
/ $ whoami
nginx
/ $ id
uid=101(nginx) gid=101(nginx) groups=101(nginx)
/ $ exit
```

## Conclusion

Avec un Dockerfile clair (versions spécifiques des images utilisées), images légères (Alpine), on arrive à un container léger et sécurisé (utilisateur non root). Bien entendu, selon vos préférences, vous pouvez utiliser un autre proxy que Nginx comme Apache ou Caddy.

## Sources

- Calendrier des LTS de NodeJS : [https://nodejs.org/en/about/releases](https://nodejs.org/en/about/releases) ;
- Image NodeJS officielle : [https://hub.docker.com/_/node](https://hub.docker.com/_/node) ;
- Image Nginx officielle: [https://hub.docker.com/_/nginx](https://hub.docker.com/_/nginx).
