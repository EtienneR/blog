---
title: "Une API REST avec Express et Mongo : Tests automatisés"
date: 2020-05-04
tags: ["API", "Mongo", "Docker"]
download: https://github.com/EtienneR/api_rest_express_mongo_docker
parts: 
  - title: 'Une API REST avec Express et Mongo : Préparatifs'
    href: 'une-api-rest-avec-express-et-mongo-preparatifs'
  - title: 'Une API REST avec Express et Mongo : Développement'
    href: 'une-api-rest-avec-express-et-mongo-developpement'
  - title: 'Une API REST avec Express et Mongo : Tests automatisés'
---

Dans cette partie, nous allons automatiser nos tests. Cela permet de lancer une batterie de tests et de s'assurer de livrer du code fonctionnel. Pour ce faire, nous allons utiliser Jest et Supertest.

## Environnement de test

Créez un nouveau fichier d’environnement **.test.env** qui nous servira d’environnement de tests.

```bash
NODE_ENV=test

MONGO_HOST=mongo_test
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=password
MONGO_INITDB_DATABASE=mydatabase
```

En effet, nous allons utiliser une autre base de données Mongo afin de ne pas corrompre la base de données déjà utilisée en développement.

Dans le fichier **package.json**, remplacez la ligne `"test": "echo \"Error: no test specified\" && exit 1"` par `"test": "jest --color --coverage --runInBand --watchAll"`.

Quelques explications sur les options de cette commande d'exécution de Jest.

- `--color` : pour colorer Jest ;
- `--coverage` : pour afficher le coverage des tests sur l'ensemble de l'application ;
- `--runInBand` : pour effectuer les tests dans l'ordre ;
- `--watchAll`: pour surveiller les fichiers de l'application et relancer automatiquement les tests.

ℹ️ L'option `coverage` créée automatiquement un dossier **coverage** à spécifier dans le fichier **.gitignore** si vous utilisez Git.

Puis à la suite de `scripts`, ajoutez les 2 options de Jest ci-dessous.

```javascript
"jest": {
  "verbose": true,
  "testEnvironment": "node"
},
```

## Encore du Docker

On en profite également pour "dockeriser" nos tests unitaires. Pour ce faire, créez le fichier **docker-compose.test.yml** à la racine du projet (au même niveau que le fichier **docker-compose.yml**).

```yaml
version: '3'

services:
  mongo_test:
    container_name: mongo_test
    image: mongo:4.2.5-bionic
    env_file:
      - ./.test.env

  api_test:
    container_name: api_test
    build: ./services/api
    volumes:
      - ./services/api:/app
    depends_on:
      - mongo_test
    env_file:
      - ./.test.env
    command: npm test
```

Ainsi, on a notre base de données Mongo **mongo_test** et un serveur de tests **api_test** exécutant la commande `npm test`.

## 1ers tests

⚠️ Ces 2 services sont complètements isolés de votre machine, autrement dit, inaccessibles depuis l'extérieur (pas de ports ouverts).

Comment ça 18 tests ? En comptant les codes HTTP présents dans le tableau "récapitulatif", on arrive à ce nombre.

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| GET | / | 202 | Pas de données |
| POST | / | 400 | Formulaire vide |
| POST | / | 422 | Mauvais format de l'email |
| POST | / | 201 | OK |
| POST | / | 409 | Email unique |
| GET | / | 200 | OK |
| GET | /:id | 200 | OK |
| PUT | /:id | 400 | Formulaire vide |
| PUT | /:id | 400 | Mauvais format de l'id |
| PUT | /:id | 404 | Ligne non existante |
| PUT | /:id | 422 | Mauvais format de l'email |
| PUT | /:id | 200 | OK |
| PUT | /:id | 409 | Email unique |
| DELETE | /:id | 400 | Mauvais format de l'id |
| DELETE | /:id | 404 | Ligne non existante |
| DELETE | /:id | 200 | OK |
| GET | /:id | 400 | Mauvais format de l'id |
| GET | /:id | 404 | Ligne non existante |

Dans le dossier **routes**, créez un nouveau fichier de tests **users.routes.test.js**.

```javascript
// Appel des modules
const request = require('supertest')
const server = require('../index')
const message = require('../helpers/messages')
const md = require('../models/users.model.js').User

const url = '/api/v1/users'
```

On appel le modèle car on va créer une fonction pour supprimer tous les documents présents à la fin des tests.

```javascript
/* Supprimer touts les utilisateur */
function deleteAll() {
  // Requête Mongoose - https://mongoosejs.com/docs/api.html#query_Query-deleteMany
  return md.deleteMany({})
  .then(result => result)
  .catch(err => {
      console.error(err)
  })
}
```

```javascript
describe('Route Users', () => {

})
```

Avant d'écrire nos tests, on va avoir besoin d'écrire des fausses données comme un id erroné et des utilisateurs.

```javascript
const fakeId = '5bf8073813f82b022c2ac957'
let id
const user = {
  email: 'titi@toto.com',
  nom: 'toto',
  prenom: 'titi'
}

const user2 = {
  email: 'a@b.com',
  nom: 'a',
  prenom: 'b'
}

const newUser = {
  email: 'a@toto.com',
  nom: 'a',
  prenom: 'b'
}
```

Puis la fonction `beforeAll`.

```javascript
beforeAll(() => {
  deleteAll()
})
```

### Test 1

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| GET | / | 202 | Pas de données |

```javascript
test('#1 - GET / - Without data return 202', async () => {
  const response = await request(server).get(url)          // Exécution de la requète
  expect(response).toBeDefined()                           // Attend une réponse définit
  expect(response.statusCode).toBe(202)                    // Code HTTP 202 attendu
  expect(response.body.message).toBe(message.user.nothing) // Message attendu
})

```

Pas de données, pas de tableau..

### Test 2

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| POST | / | 400 | Formulaire vide |

```javascript
test('#2 - POST / - Empty form return 400', async () => {
  const response = await request(server).post(url)        // Exécution de la requète
  expect(response).toBeDefined()                          // Attend une réponse définit
  expect(response.statusCode).toBe(400)                   // Code HTTP 400 attendu
  expect(response.body.message).toBe(message.emptyFields) // Message attendu
})
```

Oups, on a oublié d'envoyer des données...

### Test 3

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| POST | / | 422 | Mauvais format de l'email |

```javascript
test('#3 - POST / - Bad email format', async () => {
  const response = await request(server).post(url).send({                             // Exécution de la requète
    email: 'a@a',   // Adresse email erronnée
    nom: user.nom,
    prenom: user.prenom
  })
  expect(response).toBeDefined()                                                      // Attend une réponse définit
  expect(response.statusCode).toBe(422)                                               // Code HTTP 422 attendu
  expect(response.body.message).toBe('User validation failed: email: invalid email')  // Message attendu
})
```

Oups, le champ email est mal saisie...

### Test 4  

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| POST | / | 201 | OK |

```javascript
test('#4 - POST / - Good form', async () => {
  const response = await request(server).post(url).send(user)  // Exécution de la requète
  id = response.body.content._id                               // Récupération de l'id
  expect(response).toBeDefined()                               // Attend une réponse définit
  expect(response.statusCode).toBe(201)                        // Code HTTP 201 attendu
  expect(response.body.message).toBeDefined()                  // Attend une réponse définit
  expect(response.body.content).toBeDefined()                  // Attend une réponse définit
  expect(response.body.message).toBe(message.user.created(id)) // Message attendu
})
```

On a enfin envoyé toutes les données. :)

### Test 5

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| POST | / | 409 | Email unique |

```javascript
test('#5 - POST / - Unique email', async () => {
  const response = await request(server).post(url).send(user)     // Exécution de la requète
  expect(response).toBeDefined()                                  // Attend une réponse définit
  expect(response.statusCode).toBe(409)                           // Code HTTP 409 attendu
  expect(response.body.message).toBe(message.user.emailExisting)  // Message attendu
})
```

Oh zut, l'email est déjà utilisé !

### Test 6

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| GET | / | 200 | OK |

```javascript
test('#6 - GET / - Good', async () => {
  const response = await request(server).get(`${url}`)            // Exécution de la requète
  expect(response).toBeDefined()                                  // Attend une réponse définit
  expect(response.statusCode).toBe(200)                           // Code HTTP 200 attendu
  expect(response.body[0].email).toBe(user.email)                 // Début vérification contenu
  expect(response.body[0].nom).toBe(user.nom)
  expect(response.body[0].prenom).toBe(user.prenom)
  expect(response.body[0].createdAt).toBeDefined()
  expect(response.body[0].updatedAt).toBeDefined()
  expect(response.body.createdAt).toBe(response.body.updatedAt)   // Fin vérification contenu
})

```

On récupère bien le tableau. :)

### Test 7

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| GET | /:id | 200 | OK |

```javascript
test('#7 - GET /:id - Good', async () => {
  const response = await request(server).get(`${url}/${id}`)      // Exécution de la requète
  expect(response).toBeDefined()                                  // Attend une réponse définit
  expect(response.statusCode).toBe(200)                           // Code HTTP 200 attendu
  expect(response.body.email).toBe(user.email)                    // Début vérification contenu
  expect(response.body.nom).toBe(user.nom)
  expect(response.body.prenom).toBe(user.prenom)
  expect(response.body.createdAt).toBeDefined()
  expect(response.body.updatedAt).toBeDefined()
  expect(response.body.createdAt).toBe(response.body.updatedAt)   // Fin vérification contenu
})
```

On récupère bien la ligne. :)

### Test 8

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| PUT | /:id | 400 | Formulaire vide |

```javascript
test('#8 - PUT /:id - Empty form', async () => {
  const response = await request(server).put(`${url}/${id}`)  // Exécution de la requète
  expect(response).toBeDefined()                              // Attend une réponse définit
  expect(response.statusCode).toBe(400)                       // Code HTTP 400 attendu
  expect(response.body.message).toBe(message.emptyFields)     // Message attendu
})
```

Oups, on a oublié d’envoyer des données…

### Test 9

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| PUT | /:id | 400 | Mauvais format de l'id |

```javascript
test('#9 - PUT /:id - Bad id format', async () => {
  const response = await request(server).put(`${url}/aaa`).send(newUser)  // Exécution de la requète
  expect(response).toBeDefined()                                          // Attend une réponse définit
  expect(response.statusCode).toBe(400)                                   // Code HTTP 400 attendu
  expect(response.body.message).toBe(message.idNotAnObjectId)             // Message attendu
})
```

Oups, le format de l'id n'est pas bon...

### Test 10

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| PUT | /:id | 404 | Ligne non existante |

```javascript
test('#10 - PUT /:id - 404 id', async () => {
  const response = await request(server).put(`${url}/${fakeId}`).send(newUser)    // Exécution de la requète
  expect(response).toBeDefined()                                                  // Attend une réponse définit
  expect(response.statusCode).toBe(404)                                           // Code HTTP 404 attendu
  expect(response.body.message).toBe(message.user.notFound(fakeId))               // Message attendu
})
```

On tente de modifier une ligne non existante...

### Test 11

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| PUT | /:id | 422 | Mauvais format de l'email |

```javascript
test('#11 - PUT /:id - Bad email format', async () => {
  const response = await request(server).put(`${url}/${id}`).send({               // Exécution de la requète
    email: 'a@a',   // Adresse email erronnée
    nom: newUser.nom,
    prenom: newUser.prenom
  })
  expect(response).toBeDefined()                                                  // Attend une réponse définit
  expect(response.statusCode).toBe(422)                                           // Code HTTP 422 attendu
  expect(response.body.message).toBe('Validation failed: email: invalid email')   // Message attendu
})
```

Oups, le champ email est mal saisie…

### Test 12

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| PUT | /:id | 200 | OK |

```javascript
test('#12 - PUT /:id - Good form', async () => {
  const response = await request(server).put(`${url}/${id}`).send(newUser)    // Exécution de la requète
  expect(response).toBeDefined()                                              // Attend une réponse définit
  expect(response.statusCode).toBe(200)                                       // Code HTTP 200 attendu
  expect(response.body.content.email).toBe(newUser.email)                     // Début vérification contenu
  expect(response.body.content.nom).toBe(newUser.nom)
  expect(response.body.content.prenom).toBe(newUser.prenom)                   // Fin vérification contenu
  expect(response.body.message).toBe(message.user.updated(id))                // Message attendu
})
```

La ligne est bien modifiée :)

### Test 13

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| PUT | /:id | 409 | Email unique |

```javascript
test('#13 - PUT /:id - Unique email', async () => {
  await request(server).post(url).send(user2)                             // Exécution de la requète (ajout d'un nouvel utilisateur)
  const response = await request(server).put(`${url}/${id}`).send(user2)  // Exécution de la requète
  expect(response).toBeDefined()                                          // Attend une réponse définit
  expect(response.statusCode).toBe(409)                                   // Code HTTP 409 attendu
  expect(response.body.message).toBe(message.user.emailExisting)          // Message attendu
})
```

Impossible de modifier cette ligne car l'adresse email existe déjà !

### Test 14

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| DELETE | /:id | 400 | Mauvais format de l'id |

```javascript
test('#14 - DELETE /:id - Bad id format', async () => {
  const response = await request(server).delete(`${url}/aaa`) // Exécution de la requète
  expect(response).toBeDefined()                              // Attend une réponse définit
  expect(response.statusCode).toBe(400)                       // Code HTTP 400 attendu
  expect(response.body.message).toBe(message.idNotAnObjectId) // Message attendu
})
```

Oups, le format de l'id n'est pas bon...

### Test 15

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| DELETE | /:id | 404 | Ligne non existante |

```javascript
test('#15 - DELETE /:id - 404 id', async () => {
  const response = await request(server).delete(`${url}/${fakeId}`)   // Exécution de la requète
  expect(response).toBeDefined()                                      // Attend une réponse définit
  expect(response.statusCode).toBe(404)                               // Code HTTP 404 attendu
  expect(response.body.message).toBe(message.user.notFound(fakeId))   // Message attendu
})
```

On tente de supprimer une ligne non existante…

### Test 16

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| DELETE | /:id | 200 | OK |

```javascript
test('#16 - DELETE /:id - Good', async () => {
  const response = await request(server).delete(`${url}/${id}`)   // Exécution de la requète
  expect(response).toBeDefined()                                  // Attend une réponse définit
  expect(response.statusCode).toBe(200)                           // Code HTTP 200 attendu
  expect(response.body.message).toBe(message.user.deleted(id))    // Message attendu
})
```

La suppression est bonne. :)

### Test 17

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| GET | /:id | 400 | Mauvais format de l'id |

```javascript
test('#17 - GET /:id - Bad id format', async () => {
  const response = await request(server).get(`${url}/aaa`)    // Exécution de la requète
  expect(response).toBeDefined()                              // Attend une réponse définit
  expect(response.statusCode).toBe(400)                       // Code HTTP 400 attendu
  expect(response.body.message).toBe(message.idNotAnObjectId) // Message attendu
})
```

Oups, le format de l'id n'est pas bon...

### Test 18

| Type | URL | Code HTTP | Raison |
| - | - | - | - |
| GET | /:id | 404 | Ligne non existante |

```javascript
test('#18 - GET /:id - 404 id', async () => {
  const response = await request(server).get(`${url}/${id}`)      // Exécution de la requète
  expect(response).toBeDefined()                                  // Attend une réponse définit
  expect(response.statusCode).toBe(404)                           // Code HTTP 400 attendu
  expect(response.body.message).toBe(message.user.notFound(id))   // Message attendu
})
```

Forcement cette ligne n'existe plus !

### Résultats

```bash
api_test      | ------------------|----------|----------|----------|----------|-------------------|
api_test      | File              |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
api_test      | ------------------|----------|----------|----------|----------|-------------------|
api_test      | All files         |    94.23 |    88.24 |    88.46 |    94.23 |                   |
api_test      |  app              |      100 |      100 |      100 |      100 |                   |
api_test      |   app.js          |      100 |      100 |      100 |      100 |                   |
api_test      |   index.js        |      100 |      100 |      100 |      100 |                   |
api_test      |  app/config       |    90.91 |       50 |      100 |    90.91 |                   |
api_test      |   db.config.js    |    90.91 |       50 |      100 |    90.91 |                18 |
api_test      |  app/controllers  |    86.84 |    90.91 |       80 |    86.84 |                   |
api_test      |   users.ctrl.js   |    86.84 |    90.91 |       80 |    86.84 |   21,39,59,85,107 |
api_test      |  app/helpers      |      100 |      100 |      100 |      100 |                   |
api_test      |   messages.js     |      100 |      100 |      100 |      100 |                   |
api_test      |   middlewares.js  |      100 |      100 |      100 |      100 |                   |
api_test      |  app/models       |      100 |      100 |      100 |      100 |                   |
api_test      |   users.model.js  |      100 |      100 |      100 |      100 |                   |
api_test      |  app/routes       |      100 |      100 |      100 |      100 |                   |
api_test      |   index.routes.js |      100 |      100 |      100 |      100 |                   |
api_test      |   users.routes.js |      100 |      100 |      100 |      100 |                   |
api_test      | ------------------|----------|----------|----------|----------|-------------------|
api_test      | Test Suites: 2 passed, 2 total
api_test      | Tests:       20 passed, 20 total
```

Tout est vert (dans le terminal) :)

La couverture du code atteint un peu plus de 90%. Restent certaines erreurs, en majorité de type 500 qui ne sont pas couvertes.
