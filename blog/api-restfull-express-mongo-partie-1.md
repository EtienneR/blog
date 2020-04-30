---
title: "Une API REST avec Express et Mongo : Préparatifs"
date: 2020-04-30
tags: ["API", "Mongo", "Docker"]
parts: 
  - title: 'Une API REST avec Express et Mongo : Préparatifs'
  - title: 'Une API REST avec Express et Mongo : Développement'
    href: 'none'
  - title: 'Une API REST avec Express et Mongo : Tests automatisés'
    href: 'none'
---

Ensemble, nous allons construire une API REST propulsée par Express.js et Mongo. Cette API communiquera uniquement au format JSON. Ce tutoriel est destiné à un public connaissant les bases en JavaScript et en HTTP. Express est un framework (un des plus connu) sur Node.js. Il permet de créer des applications Web de façon simplifiée. Quant à Mongo, c’est une base de données dite “nosql”. Pas de panique, nous allons voir ensemble, les requêtes basiques (créer, lire, modifier et supprimer des données) via Mongoose. De plus cette API sera encapsulée dans Docker afin de faciliter son intégration continue. Libre à vous ne pas utiliser cet outil de virtualisation.

Avant de se lancer à bras ouverts dans la création de notre API REST, mettons en place notre stack technique. Pour cela on aura 2 services distincts :

- La base de données : Mongo ;
- L'application back-end : l'API.

## Installation des modules

En premier lieu, assurez-vous d’avoir Node et NPM installés sur votre machine.  
`node -v && npm -v`

Si ce n’est pas le cas, rendez-vous sur le site officiel [https://nodejs.org/en/download](https://nodejs.org/en/download).

ℹ️ Ce tutoriel a été rédigé avec la version de 12.16.3 de Node et 6.14.4 de NPM.

Créez un nouveau dossier **services** puis à l’intérieur, un nouveau dossier **api**.

`mkdir services && cd services && mkdir api && cd api`

Lancez la commande ci-dessous pour initialiser l’application.

`npm init -y`

Outre Express, nous allons utiliser un ensemble de modules référencés dans le tableau ci-dessous.

| Nom | Description | Version |
| --- | ----------- | -------- |
| Express | Framework Web | 4.17.1 |
| Mongoose | Connecteur MongoDB et ODM (Object Document Mapper : équivalent d’un ORM pour BDD no-sql) | 5.7.1 |

`npm install express mongoose morgan supertest`

Ces paquets apparaîtront dans la catégorie **dependencies** (dépendances utiles à un fonctionnement en production).

Si vous utilisez une version de NPM inférieure à la 5, utilisez le flag `--save` pour avoir ces modules dans le manifeste.

| Nom | Description | Version |
| --- | ----------- | -------- |
| Jest | Tests automatisés | 25.3.0 |
| Morgan |Afficher les logs dans le terminal | 1.10.0 |
| Nodemon | Service de redémarrage automatique | 2.0.3 |
| Supertest | Effectuer des tests avec HTTP | 4.0.2 |

`npm install jest morgan nodemon supertest --save-dev`

Ces paquets apparaîtront dans la catégorie **devDependencies** (dépendances utiles uniquement dans le cadre du développement).

Vous pouvez retrouver toutes ces informations dans le manifeste **package.json**.

Modifiez ce fichier en ajoutant une commande pour exécuter Nodemon.

```javascript
"scripts": {
  "dev": "node_modules/.bin/nodemon",
  "test": "echo \"Error: no test specified\" && exit 1"
},
```

## Environnement de développement

A la racine du projet, créez un fichier **.dev.env**. Comme son nom l’indique, ce fichier ne servira que pour l’environnement de développement.

```bash
NODE_ENV=development

API_HOST=0.0.0.0
API_PORT=3000

MONGO_HOST=mongo
MONGO_PORT=27017
MONGO_INITDB_DATABASE=mydatabase
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=password
```

Dans un premier temps, on déclare l’URL et le port du serveur de notre API. Et dans un second temps, les informations relatives à notre BDD (adresse, port, nom de la base, nom de l’utilisateur et mot de passe).

## Première route

A la racine du dossier **api**, créez le fichier **index.js**.

```javascript
// Appel des modules
const express = require('express')
const morgan = require('morgan')

// Variables d'environnement
const host = process.env.API_HOST || '0.0.0.0'
const port = process.env.API_PORT || 3000

// Initialisation d'Express
const app = express()

// Activation du log des routes
app.use(morgan('tiny'))

// Route d'accueil
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

// Routes non définies = 404
app.all('/*', (req, res) => {
  res.status(404).json({ message: 'page not found' })
})

// Démarrage du serveur
app.listen(port, host, () => {
  console.log(
    `Running on http://${host}:${port} - Environnement : ${process.env.NODE_ENV}`
  )
})
```

**req** est le diminutif de **request** et **res** de **response**. Le 1^er^ concerne tout ce qui rentre (données saisies par l’utilisateur par exemple) et le second tout ce que retourne le serveur. Ici, une réponse (en 200 par défaut) au format JSON.

ℹ️ Les lignes concernant l’adresse et le port (6 et 7), la condition “ou” (symbolisée par les doubles pipes) permet de définir une valeur si le fichier d’environnement est inexistant.

Vous pouvez lancer le serveur Nodemon en allant dans le répertoire API afin de lancer la commande ci-dessous.

`npm run dev`

Extrait de la console.

```bash
> nodemon

[nodemon] 2.0.3
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
Running on http://0.0.0.0:3000 - Environnement : undefined
GET / 200 26 - 4.811 ms
GET /fake 404 28 - 0.802 ms
```

Puis l’arrêter avec la combinaison des touches CTRL + C car nous allons utiliser Docker.

## Dockerisons

Cette étape de configuration des containers nécessite du temps. Pour autant, elle n’est pas négligeable car elle permettra par la suite, à n’importe quel développeur souhaitant participer à ce projet d’en gagner. Pour ce faire, nous allons créer 2 containers distincts à partir de 2 images distinctes. Le premier pour la BDD et le second, pour l’API.
Avant de poursuivre, vérifiez que Docker et Docker Compose sont installés sur votre machine.  

`docker version && docker-compose version`

Si ce n’est pas le cas, rendez-vous sur le site officiel [https://docs.docker.com/install/#releases](https://docs.docker.com/install/#releases) et [https://docs.docker.com/compose/install/#install-compose](https://docs.docker.com/compose/install/#install-compose)

ℹ️ Ce tutoriel a été rédigé avec la version 19.03.8 de Docker et 1.17.1 de Docker Compose.

A la racine de votre application, créez un fichier nommé **docker-compose.yml**.

### Service Mongo

Pour la base de données, c’est relativement rapide car il existe déjà une image officielle toute prête pour MongoDB.

```yml
version: '3'

services:
  mongo:
    image: mongo:4.2.5-bionic
    restart: always
    env_file:
      - ./.dev.env
    volumes:
      - ./services/mongo/data:/data/db
    ports:
      - 27017:27017
```

Nous utiliserons la version 4 de Mongo. On veut que le container redémarre à chaque démarrage de Docker (donc à chaque redémarrage de votre machine). On veut que le fichier d’environnement **.dev.env** soit pris en compte. On utilise le port par défaut de Mongo 27017. On veut aussi stocker les données de la BDD dans le dossier **services/mongo/data**.

ℹ️ Ce dossier sera créé automatiquement lors de la première construction du container.

### Service API

Quant à l’API il existe également une image officielle pour Node.js (de préférence, la version Alpine pour avoir une image légère). Dans le dossier **api**, créez un nouveau fichier **Dockerfile**.

```dockerfile
FROM node:12.16.3-alpine
COPY . /app
WORKDIR /app
RUN npm install
VOLUME /app
```

Puis dans le fichier **docker-compose.yml**, à la suite, en tant que service (en respectant bien l’indentation) et dépendant du service “mongo”.

```yml
api:
  build: ./services/api
  restart: always
  volumes:
    - ./services/api:/app
  ports:
    - 3000:3000
  env_file:
    - ./.dev.env
  depends_on:
    - mongo
  command: npm run dev
```

Nos 2 containers étant déclarés dans le fichier d’instructions, lancez la commande ci-dessous.

`docker-compose up -d`

Cette commande va télécharger les 2 images depuis le Docker Hub puis créer nos 2 containers.  
Vous pouvez également accéder au serveur Mongo depuis votre terminal.

`docker-compose exec mongo bash`

Puis l'authentification.

`mongo -u root -p password --authenticationDatabase admin`

C'est bon, vous y êtes même si dans ce tutoriel, on n'aura pas vocation à toucher à cette partie.  
Et le plus important étant d'afficher les logs.

`docker-compose logs -f`

ℹ️ Si vous n’utilisez pas Docker, vous pouvez vous servir du package [Dotenv](https://www.npmjs.com/package/dotenv) pour lire le fichier d’environnement.

## Conclusion

On est paré au développement pour la seconde partie de ce tutoriel.
