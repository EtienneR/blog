---
title: 'API JSON Web Token Authentication (JWT) sur Express.js'
date: 2019-08-27
tags: ['API']
parts: 
  - title: 'API JSON Web Token Authentication (JWT) sur Express.js'
  - title: 'Authentification avec JWT sur Nuxt.js'
    href: 'authentification-avec-jwt-sur-nuxt-js'
---

Ce tutoriel a pour but de vous montrer comment utiliser JWT. Pour des raisons pratiques, il n'y aura pas de connexion à une base de données quelconques et cela afin d'avoir un guide court et concis sur le sujet principal.

Vient le moment dans votre développement qui nécessite une authentification de la part de l'utilisateur. Pour ce faire soit vous passez par une API d'un service comme Google, Facebook, Twitter, etc... ou bien vous gérez vous même. Rien de bien compliquer à mettre en place. Pour ce faire, l'utilisateur doit pouvoir s'enregistrer puis se connecter. Il faut donc passer par un système sécurisé. Mais comment faire me direz-vous. Avec un jeton ou token en anglais. Le principe repose sur le fait de vérifier qu'un utilisateur existe. Si c'est le cas, un token lui est fournit. C'est via ce dernier que le serveur d'API autorise l'accès à certaines routes.

## Explications rapides du JWT

Un JWT est donc un token. Il est composé de 3 parties séparées par un point :

- Le **header** ;
- Le **payload** ;
- La **signature**.

Le **header** détermine le type de token : JWT et l'algorithme de chiffrement **HS256** (HMAC avec du SHA-256) ou **RS256** (signature RSA avec du SHA-256).

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

Le **payload** concerne la partie informations de l'utilisateur comme son id, son nom d'utilisateur, etc...  
Quant à **signature**, c'est la partie la plus complexe car elle prend en compte un mot secret.

Il existe un debugger en ligne [https://jwt.io](https://jwt.io) (ou sur [https://oauth.tools](https://oauth.tools)).

Dans notre API, l'utilisateur devra posséder un token pour accéder aux routes protégées. Pour se connecter, il devra saisir ses identifiants (login et mot de passe) sur une route de type POST. Cette dernière retournera un jeton, le fameux JWT. Celui-ci devra être renseigné dans le header de la requête pour accéder aux routes protégées.

## Préparatifs

Dans un nouveau dossier que vous nommez "api", initialisez votre projet avec la commande `npm init -y`. Puis installez les modules `npm i express jsonwebtoken cors` et `npm i -D morgan`.

- **express** (version XX) : le framework HTTP ;
- **jsonwebtoken** (version XX) : générer un JWT ;
- **cors** (version XX) : activer le CORS ;
- **morgan** (version XX) : avoir des logs dans le terminal.

```javascript
// Chargement des modules
const express = require('express')
const morgan = require('morgan')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const PORT = 1234
const SECRET = 'mykey'

// Initialisation de Express 4
const app = express()

app.use(cors())                                 // Activation de CORS
app.use(morgan('tiny'))                         // Activation de Morgan
app.use(express.json())                         // Activation du raw (json)
app.use(express.urlencoded({ extended: true })) // Activation de x-wwww-form-urlencoded

// Liste des utilisateurs
const users = [
    { id: 1, username: 'admin', password: 'password123' }
]

/* Ici les futures routes */

app.get('*', (req, res) => {
    return res.status(404).json({ message: 'Page not found' })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`)
})
```

Le serveur est prêt sauf qu'il manque les routes...

Remarque : dans l'idéal, c'est mieux de stocker la valeur `SECRET` dans un fichier de configuration.

## Obtention du token

Dans la route `/login`, on invite l'utilisateur à se connecter avec son login et son mot de passe.

```javascript
/* Formulaire de connexion */
app.post('/login', (req, res) => {
    // Pas d'information à traiter
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'Error. Please enter the correct username and password' })
    }

    // Checking
    const user = users.find(u => u.username === req.body.username && u.password === req.body.password)

    // Pas bon
    if (!user) {
        return res.status(400).json({ message: 'Error. Wrong login or password' })
    }

    const token = jwt.sign({
        id: user.id,
        username: user.username
    }, SECRET, { expiresIn: '3 hours' })

    return res.json({ access_token: token })
})
```

Lancez le serveur avec la commande `node index.js` (pensez à redémarrer votre serveur lors de la modification de ce dernier).

Dans un premier temps, on vérifie que l'utilisateur a bien saisi les 2 champs obligatoires. Si ce n'est pas le cas, on retourne une erreur 400 l'invitant à les saisir.

```bash
curl -X POST \
  http://localhost:1234/login
```

![Postman 400 : Pas d'information à traiter](./img/api_jwt_express/api_jwt_login_empty.png)

Puis dans un second temps, on vérifie dans le tableau des utilisateurs que le nom et le mot de passe correspondent via la fonction `find`. Si ce n'est pas le cas, alors une erreur 400 informe l'utilisateur sur l'échec de son authenfication.

```bash
curl -X POST \
  'http://localhost:1234/login' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin&password=123'
```

![Postman 400 : Mauvais identifiants](./img/api_jwt_express/api_jwt_login_bad.png)

En revanche, si c'est le cas, alors le token est donné à l'utilisateur final qui pourra l'utiliser pour se connecter sur les routes nécésitant d'une authentification.

```bash
curl -X POST \
  'http://localhost:1234/login' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin&password=password123'
```

![Postman 400 : Identification réussi](./img/api_jwt_express/api_jwt_login_good.png)

## Middleware d'authentification

On va mettre en place un middleware pour chaque page protégée. Pour ce faire, on vérifie la présence du token dans le header de la requête ainsi que sa véracité.

```javascript
/* Récupération du header bearer */
const extractBearerToken = headerValue => {
    if (typeof headerValue !== 'string') {
        return false
    }

    const matches = headerValue.match(/(bearer)\s+(\S+)/i)
    return matches && matches[2]
}

/* Vérification du token */
const checkTokenMiddleware = (req, res, next) => {
    // Récupération du token
    const token = req.headers.authorization && extractBearerToken(req.headers.authorization)

    // Présence d'un token
    if (!token) {
        return res.status(401).json({ message: 'Error. Need a token' })
    }

    // Véracité du token
    jwt.verify(token, SECRET, (err, decodedToken) => {
        if (err) {
            res.status(401).json({ message: 'Error. Bad token' })
        } else {
            return next()
        }
    })
}
```

## Page protégée

Ainsi, on peut insérer facilement ce middleware pour gérér l'authentification des pages protégées par ce dernier.

```javascript
app.get('/me', checkTokenMiddleware, (req, res) => {
    // Récupération du token
    const token = req.headers.authorization && extractBearerToken(req.headers.authorization)
    // Décodage du token
    const decoded = jwt.decode(token, { complete: false })

    return res.json({ content: decoded })
})
```

## 1ers tests avec Postman

### Pas de token

```bash
curl -X GET \
  http://localhost:1234/me
```

![Postman 401 : Pas de token](./img/api_jwt_express/api_jwt_me_empty.png)

### Le token n'est pas bon

```bash
curl -X GET \
  http://localhost:1234/me \
  -H 'Authorization: Bearer fake_token'
```

[ Postman 401 : Le token n'est pas bon ]

### Le token est bon

```bash
curl -X GET \
  http://localhost:1234/me \
  -H 'Authorization: Bearer ici_le_token_valide_obtenu_lors_du_login'
```

![Postman 200 : Le token est bon](./img/api_jwt_express/api_jwt_me_good.png)

## Page d'enregistrement

On ne va pas se contenter d'une route de login, on veut également mettre en place une route d'inscription.

```javascript
app.post('/register', (req, res) => {
    // Aucune information à traiter
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'Error. Please enter username and password' })
    }

    // Checking
    const userExisting = users.find(u => u.username === req.body.username)

    // Pas bon
    if (userExisting) {
        return res.status(400).json({ message: `Error. User ${req.body.username} already existing` })
    }

    // Données du nouvel utilisateur
    const id = users[users.length - 1].id + 1
    const newUser = {
        id: id,
        username: req.body.username,
        password: req.body.password
    }

    // Insertion dans le tableau des utilisateurs
    users.push(newUser)

    return res.status(201).json({ message: `User ${id} created` })
})
```

### Pas d'informations à traiter

Dans un premier temps, on vérifie que l'utilisateur a bien saisi les 2 champs obligatoires. Si ce n'est pas le cas, on retourne une erreur 400 l'invitant à les saisir.

```bash
curl -X POST \
  http://localhost:1234/register
```

![Postman 400 : Pas d'information à traiter](./img/api_jwt_express/api_jwt_register_empty.png)

### Mauvais identifiants

Puis dans un second temps, on vérifie dans le tableau des utilisateurs si le nom d'utilisateur correspond via la fonction `find`. Si c'est le cas, alors une erreur 400 informe l'utilisateur sur l'échec de son inscription.

```bash
curl -X POST \
  http://localhost:1234/register \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=admin&password=admin123'
```

![Postman 400 : Mauvais identifiants](./img/api_jwt_express/api_jwt_register_bad.png)

### Enregistrement réussi

Dans le cas contraire, on ajoute la nouvelle ligne dans le tableau des utilisateurs via la fonction `filter` et on renvoie une 201.

```bash
curl -X POST \
  http://localhost:1234/register \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=toto&password=xoxo'
```

![Postman 201 : Identification réussie](./img/api_jwt_express/api_jwt_register_bad.png)

## Conclusion

Il y a encore pas mal de choses à faire pour mettre cette API comme chiffer le mot de passe en Bcrypt, stocker les données de l'utilisateur dans une base de données, envoyer un email de confirmation lors de l'inscription d'un nouvel utilisateur, stocker les logs de connexion, etc...
