---
title: "Une API REST avec Express et Mongo : Développement"
date: 2020-05-02
tags: ["API", "Mongo", "Docker"]
parts: 
  - title: 'Une API REST avec Express et Mongo : Préparatifs'
    href: 'une-api-rest-avec-express-et-mongo-preparatifs'
  - title: 'Une API REST avec Express et Mongo : Développement'
  - title: 'Une API REST avec Express et Mongo : Tests automatisés'
    href: 'une-api-rest-avec-express-et-mongo-tests-automatises'
---

## Modèle

Toutes les requêtes Mongo sont centralisées dans des modèles. Ces fichiers permettent de communiquer avec la base de données.

### Connexion à Mongo

Dans le répertoire **api**, créez un nouveau dossier **config** avec un fichier à l’intérieur **db.config.js**.

```javascript
// Appel des modules
const mongoose = require('mongoose')

// Chargement des variables d'environnement
const host = process.env.MONGO_HOST || '0.0.0.0'
const port = process.env.MONGO_PORT || 27017
const username = process.env.MONGO_INITDB_ROOT_USERNAME
const password = process.env.MONGO_INITDB_ROOT_PASSWORD
const database = process.env.MONGO_INITDB_DATABASE

const connect = () => {
  mongoose.connect(
    `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`,
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true
    },
    function(err) {
      if (err) {
        throw err
      }
    }
  )
}

module.exports = {
  connect
}
```

Dans ce fichier, on met en place une seule fonction exportable pour se connecter à Mongo.

Cette connexion s'effectue dans le fichier **index.js**.

```javascript
const db = require('./config/db.config')
db.connect()
```

### Schématisons

Nous allons utiliser la fonction **Schema** de Mongoose avec 5 champs listés dans le tableau ci-dessous.

| Nom | Type | Autres* |
| --- | ---- | ------- |
| email | string | **[required](https://mongoosejs.com/docs/api.html#schematype_SchemaType-required)**, **[unique](https://mongoosejs.com/docs/api.html#schematype_SchemaType-unique)** |
| nom | string | **[required](https://mongoosejs.com/docs/api.html#schematype_SchemaType-required)** |
| prenom | string | **[required](https://mongoosejs.com/docs/api.html#schematype_SchemaType-required)** |
| createdAt | date | [https://mongoosejs.com/docs/guide.html#timestamps](https://mongoosejs.com/docs/guide.html#timestamps) |
| updatedAt | date | [https://mongoosejs.com/docs/guide.html#timestamps](https://mongoosejs.com/docs/guide.html#timestamps) |

*Il existe d’autres options... [https://mongoosejs.com/docs/validation.html](https://mongoosejs.com/docs/validation.html)

ℹ️ Le champs email étant **unique**, il est considéré comme un **index**.

Créez un nouveau fichier dans **models/users.model.js**. Dans ce modèle, on définit le schéma de Mongoose.

```javascript
// Appel des modules
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    nom: {
      type: String,
      required: true
    },
    prenom: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
)

const User = mongoose.model('users', userSchema)

module.exports = {
  User
}
```

Ce schéma est exporté afin d'être utilisé dans un futur proche dans le fichier du contrôleur.

## Contrôleur

Créez un nouveau dossier **controllers** avec un fichier intitulé **users.ctrl.js**.

```javascript
// Chargement des dépendances
const User = require('../models/users.model.js').User
```

### Liste des requêtes

Avant de poursuivre, faisons le point sur nos futures requêtes de type **CRUD** (**C**reate **R**ead **U**pdate **D**elete).

| Méthode | Description | Endpoint | Fonction Mongoose |
| ------- | ----------- | -------- | -------------- |
| POST | Ajouter une ligne | /api/v1/users | **[save](https://mongoosejs.com/docs/api.html#document_Document-save)** |
| GET | Afficher toutes les lignes | /api/v1/users | **[find](https://mongoosejs.com/docs/api.html#model_Model.find)** |
| GET | Afficher une seule ligne via l'id | /api/v1/users/:id | **[findById](https://mongoosejs.com/docs/api.html#model_Model.findById)** |
| UPDATE | Modifier un ou plusieurs champs | /api/v1/users/:id | **[findByIdAndUpdate](https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate)** |
| DELETE | Supprimer une ligne | /api/v1/users/:id | **[findByIdAndRemove](https://mongoosejs.com/docs/api.html#model_Model.findByIdAndRemove)** |

Les 5 requêtes classiques d'une API REST.

### Récapitulatif

Avant de créer notre contrôleur, il faut garder à l'esprit les erreurs possibles dans chaque route.

| Action | Ok | Erreurs possibles | Modèle |
| ------ | -- | ----------------- | ------ |
| POST | 201 | 400 - 409 - 422 | **saveOne** |
| GET | 200 | 202 | **findAll** |
| GET (one) | 200 | 400 - 404 | **findById** |
| PUT | 200 | 400 - 404 - 409 - 422 | **updateById** |
| DELETE | 200 | 400 - 404 | **deleteById** |

Les erreurs 400 seront déclarées dans les middlewares, cela nous réduit un peu la charge. :p

Quant aux erreurs 409 et 422, elles concernent respectivement l'unicité de l'email de l'utilisateur et la non présence d'un ou plusieurs champs (de type **required** dans le modèle).

### Save (ajouter une ligne)

```javascript
/* Ajouter un utilisateur */
function saveOne(req, res) {
  // Stockage des données dans le constructeur
  const newUser = new User(req.body)

  // Requête Mongoose - https://mongoosejs.com/docs/api.html#document_Document-save
  return newUser
    .save()
    .then((result) => {
      res
        .status(201)
        .json({ message: `user ${result._id} created`, content: result })
    })
    .catch((err) => {
      if (err.code === 11000) {
        res.status(409).json({ message: 'this address email already existing' })
      } else if (
        err.errors &&
        Object.keys(err.errors).length > 0 &&
        err.name === 'ValidationError'
      ) {
        res.status(422).json({ message: err.message })
      } else {
        res.status(500).json(err)
      }
    })
}
```

Dans la fonction **saveOne**, on stocke les données dans un nouveau constructeur. Puis, on insère les données dans Mongo via la fonction **save**. Si tout va bien, le résultat est retourné dans le **then** avec un code HTTP 201 sinon l'erreur est gérée dans le **catch**.

Concernant les erreurs, il en existe plusieurs dans notre cas.

- 409 : si l'email est déjà utilisé ;
- 422 : si l'un des champs est mal renseigné ;
- 500 : par défaut.

### findAll (trouver toutes les lignes)

```javascript
/* Tous les utilisateurs */
function findAll(req, res) {
  // Requête Mongoose - https://mongoosejs.com/docs/api.html#model_Model.find
  return User.find()
    .exec()
    .then((result) => {
      if (result.length > 0) {
        res.json(result)
      } else {
        res.status(202).json({ message: 'no users available' })
      }
    })
    .catch((err) => {
      res.status(500).json(err)
    })
}
```

Dans la fonction **findAll**, on récupère les données présentent dans la collection Mongo via la fonction de Mongoose `find`. Puis dans le **then** on vérifie la longueur du tableau de données. En effet, si ce dernier a une longueur supérieur à 0, alors on renvoi un code HTTP 200. Sinon on renvoi un code HTTP 202 spécifiant qu'il n'y a pas de données.

### findById (trouver une seule ligne)

```javascript
/* Tous les utilisateurs */
function findAll(req, res) {
  // Requête Mongoose - https://mongoosejs.com/docs/api.html#model_Model.find
  return User.find()
    .exec()
    .then((result) => {
      if (result.length > 0) {
        res.json(result)
      } else {
        res.status(202).json({ message: 'no users available' })
      }
    })
    .catch((err) => {
      res.status(500).json(err)
    })
}
```

Dans la fonction **findAll**, on récupère les données présentent dans la collection Mongo via la fonction de Mongoose `find`. Puis dans le **then** on vérifie la longueur du tableau de données. En effet, si ce dernier a une longueur supérieur à 0, alors on renvoi un code HTTP 200. Sinon on renvoi un code HTTP 202 spécifiant qu'il n'y a pas de données.

### findByIdAndUpdate (modifier une ligne via son id)

```javascript
/* Modifier utilisateur via son id */
function updateById(req, res) {
  // Récupération de l'id
  const id = req.params.id

  // Requête Mongoose - https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
  return User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  })
    .then((result) => {
      if (result) {
        // Présence d'un objet de données
        res.json({ message: `user ${id} updated`, content: result })
      } else {
        // Ligne non existante
        res.status(404).json({ message: `user ${id} not found` })
      }
    })
    .catch((err) => {
      if (err.code === 11000) {
        res.status(409).json({ message: 'this address email already existing' })
      } else if (
        err.errors &&
        Object.keys(err.errors).length > 0 &&
        err.name === 'ValidationError'
      ) {
        res.status(422).json({ message: err.message })
      } else {
        res.status(500).json(err)
      }
    })
}
```

Dans la fonction **updateById**, on récupère l’id de l’utilisateur concerné. Puis on fourni en paramètre de la fonction Mongoose `findByIdAndUpdate`, l'id, les données saisies et en troisième les options `new`et `runValidators`. Le premier permet de retourner l'objet modifié et le second, comme son nom l'indique de prendre en compte les règles de validation du schéma. Ensuite dans le **then** on vérifie la présence du résultat. En effet, si ce dernier est présent, alors on renvoi un code HTTP 200 spécifiant que l'utilisateur a bien été modifié. Sinon on renvoi un code HTTP 404 spécifiant que cette utilisateur n’existe pas ou n’existe plus.

Concernant les erreurs, il en existe plusieurs dans notre cas.

- 409 : si l’email est déjà utilisé ;
- 422 : si l’un des champs est mal renseigné ;
- 500 : par défaut.

### deleteById (supprimer une ligne via son id)

```javascript
/* Supprimer un utilisateur */
function deleteById(req, res) {
  // Récupération de l'id
  const id = req.params.id

  // Requête Mongoose - https://mongoosejs.com/docs/api.html#model_Model.findByIdAndRemove
  return User.findByIdAndRemove({ _id: id })
    .then((result) => {
      if (result) {
        // Présence d'un objet de données
        res.json({ message: `user ${id} deleted` })
      } else {
        // Ligne non existante
        res.status(404).json({ message: `user ${id} not found` })
      }
    })
    .catch((err) => {
      res.status(500).json(err)
    })
}
```

Dans la fonction **deleteById**, on récupère l'id concernant afin de supprimer le document présent dans la collection Mongo via la fonction de Mongoose `findByIdAndRemove`. Puis dans le **then** on vérifie la présence du résultat. En effet, si ce dernier est présent, alors on renvoi un code HTTP 200 avec un message confirmant la suppression de l'utilisateur. Sinon on renvoi un code HTTP 404 spécifiant que cette utilisateur n’existe pas ou n’existe plus.

Chose importante, on n’oublie pas d’exporter nos 4 fonctions.

```javascript
module.exports = {
  saveOne,
  findAll,
  findById,
  updateById,
  deleteById
}
```

Maintenant, on peut passer à la suite :)

## Middlewares

Pour les routes nécessitant un id (GET, PUT et DELETE) ou pour celles nécessitant des données (POST et PUT), il est préférable de faire la vérification en amont afin de retourner une erreur de type 400. Pour se faire, créez un nouveau dossier **helpers** avec un fichier **middlewares.js** à l’intérieur.

### checkId (format de l’id)

```javascript
// Appel des modules
const mongoose = require('mongoose')

/* Vérification format de l'object id */
function checkId(req, res, next) {
  const id = req.params.id

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'id form is not good' })
  } else {
    next()
  }
}
```

Cette fonction permet de vérifier si l'id rentré est bien de type **ObjectId**. Si ce dernier n'est pas conforme, une erreur HTTP 400 est alors envoyée avec un message personnalisé.

### checkContent (présence du contenu)

```javascript
/* Vérification présence de contenu */
function checkContent(req, res, next) {
  const content = req.body

  if (Object.keys(content).length === 0) {
    res.status(400).json({ message: 'missing content' })
  } else {
    next()
  }
}
```

Cette fonction permet de vérifier la présence du contenu. Si ce dernier est manquant, une requête 400 est alors envoyée avec un message personnalisé.

Là aussi, on n’oublie pas d’exporter nos 2 fonctions avant de poursuivre.

```javascript
module.exports = {
  checkId,
  checkContent
}
```

## Routes

Après le modèle et les middlewares, passons enfin aux routes.

ℹ️ Après chaque route créée, nous utiliserons CURL pour les requêter. Libre à vous d’utiliser un logiciel tel que Postman ou Insomnia. Il est tout à fait possible de copier-coller les requêtes CURL dans ces 2 logiciels.

### Organisation

Dans le dossier **routes**, créez les routes **index.routes.js** et **users.routes.js**.

Puis, dans le fichier **index.routes.js**.

```javascript
// Appel des modules
const express = require('express')
const router = express.Router()

// Endpoint des utilisateurs
router.use('/api/v1/users', require('./users.routes'))

module.exports = router
```

Ensuite, dans le fichier **users.routes.js**.

```javascript
// Appel des modules
const express = require('express')
const router = express.Router()
const User = require('../controllers/users.ctrl')
const m = require('../helpers/middlewares')

/* Ici les futures routes */

module.exports = router
```

Dans lequel on importe le modèle et les middlewares.

Et dans le fichier **index.js**.

```javascript
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(require('./routes/index.routes'))
```

### Ajouter une ligne

```javascript
/* Ajouter un utilisateur - POST - /api/v1/users */
router.post('/', m.checkContent, User.saveOne)
```

On vérifie que la requête contient des données (`checkContent`). Si le middleware détecte une erreur alors on est bon pour une erreur 400.

On peut tester cette route avec la commande CURL ci-dessous.

```bash
curl -i -X POST \
  http://localhost:3000/api/v1/users \
  -H 'Content-Type: application/json' \
  -d '{ "email": "dardevil@marvel.com", "nom": "Murdoc", "prenom": "Matt" }'
```

### Afficher toutes les lignes

```javascript
/* Liste des utilisateurs - GET - /api/v1/users */
router.get('/', User.findAll)
```

On peut tester cette route avec la commande CURL ci-dessous.

```bash
curl -i http://localhost:3000/api/v1/users
```

### Afficher une ligne via son id

```javascript
/* Utilisateur via son ID - GET - /api/v1/users/:id */
router.get('/:id', m.checkId, User.findById)
```

On vérifie que la requête comporte un id au bon format (`checkId`). Si le middleware détecte une erreur alors on est bon pour une erreur 400.

On peut tester cette route avec la commande CURL ci-dessous.

```bash
curl -i http://localhost:3000/api/v1/users/:id
```

### Modifier une ligne via son id

```javascript
/* Modifier un utilisateur via son ID - PUT - /api/v1/users/:id */
router.put('/:id', m.checkId, m.checkContent, User.updateById)
```

On vérifie en amont si l'id est au bon format (`checkId`) et que la requête contient des données (`checkContent`).

On peut tester cette route avec la commande CURL ci-dessous.

```bash
curl -i -X PUT \
  http://localhost:3000/api/v1/users/:id \
  -H 'Content-Type: application/json' \
  -d '{ "email": "dardevil@marvel.com", "nom": "Murdoc", "prenom": "Matthew" }'
```

### Supprimer une ligne via son id

```javascript
/* Supprimer un utilisateur via son ID - DELETE - /api/v1/users/:id */
router.delete('/:id', m.checkId, User.deleteById)
```

On vérifie en amont si l’id est au bon format (`checkId`). Si le middleware détecte une erreur alors on est bon pour une erreur 400.

On peut tester cette route avec la commande CURL ci-dessous.

```bash
curl -i -X DELETE http://localhost:3000/api/v1/users/:id
```

## Refactoring

Avant de passer aux tests, il serait bien de revoir un peu ce code...

### Centraliser les messages

Nous allons ranger tous ces messages dans un seul fichier. Cela va nous permettre, lors de la rédaction des tests de ne pas avoir à les réécrire.

Dans le dossier **helpers**, créez un nouveau fichier **messages.js**.

```javascript
module.exports = {
  idNotAnObjectId: 'id form is not good',
  emptyFields: 'missing content',
  user: {
    nothing: 'no users available',
    notFound: (id) => `user ${id} not found`,
    created: (id) => `user ${id} created`,
    updated: (id) => `user ${id} updated`,
    deleted: (id) => `user ${id} deleted`,
    emailExisting: 'this address email already existing'
  }
}
```

Modifiez les fichiers **middlewares.js** et **users.ctrl.js** en conséquence après avoir chargé le fichier.

```javascript
// Appel des modules
const message = require('../helpers/messages')

// Ancienne syntaxe
res.status(404).json({ message: `user ${id} not found` })

// Nouvelle syntaxe
res.status(404).json({ message: message.user.notFound(id) })
```

Lors de l'ajout d'un utilisateur.

```javascript
message: message.user.created(result._id)
```

### Format de l'email

Par pure fainéantise, nous allons installer le plugin **validator** `npm install validator`.

| Nom | Description | Version |
| --- | ----------- | -------- |
| validator | Vérifie le format d'une adresse email | 13.0.0 |

Dans le fichier **users.model.js**, importez cette dépendance.

```javascript
const validator = require('validator')
```

Puis modifiez le schéma de la clef email.

```javascript
email: {
  type: String,
  required: true,
  unique: true,
  validate: [validator.isEmail, 'invalid email']
},
```

Testez avec une erreur d'email.

```bash
curl -i -X POST \
  http://localhost:3000/api/v1/users \
  -H 'Content-Type: application/json' \
  -d '{ "email": "dardevil@marvel", "nom": "Murdoc", "prenom": "Matthew" }'
```

Avec le message d'erreur correspondant.

```bash
HTTP/1.1 422 Unprocessable Entity

{"message":"users validation failed: email: invalid email"}
```

### Serveur

Pour le serveur, on va scinder l'actuel fichier **index.js** en 2.

A la racine du projet **api**, créez un nouveau fichier **app.js** qui contiendra l'appel des routes.

```javascript
// Appel des modules
const express = require('express')
const morgan = require('morgan')
const db = require('./config/db.config')
db.connect()

// Initialisation d'Express
const app = express()

// Activation du log des routes
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(require('./routes/index.routes'))

module.exports = app
```

Et le contenu allégé du fichier **index.js**.

```javascript
// Appel des modules
const app = require('./app')

// Variables d'environnement
const host = process.env.API_HOST || '0.0.0.0'
const port = process.env.API_PORT || 3000

// Démarrage du serveur
app.listen(port, host, () => {
  console.log(
    `Running on http://${host}:${port} - Environnement : ${process.env.NODE_ENV}`
  )
})

module.exports = app
```

Dans le fichier **index.routes.js**, avant le `module.exports`, ajoutez les 2 routes supprimées du fichier **index.js**.

```javascript
// Route d'accueil
router.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

// Routes non définies = 404
router.all('/*', (req, res) => {
  res.status(404).json({ message: 'page not found' })
})
```

On est paré pour passer aux tests :)
