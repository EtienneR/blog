---
title: 'Créer une API RESTful sur Go'
date: 2017-02-24
tags: ['Golang', 'API']
download: 'https://github.com/EtienneR/go_sqlite_api'
---

Une API (Application Programming Interface) permet de fournir des données brutes accessibles depuis une URL. En général, cela permet de faire le pont entre une application cliente et une base de données, dans notre cas depuis SQLite. Pourquoi le choix de cette base ? Car SQLite est un système de base de données en SQL qui a pour principal atout de fonctionner sans serveur car les données sont contenues dans un fichier. Avec certes moins d'options mais cela est suffisant dans notre cas.

Dans l'API que nous allons mettre en place, les données seront fournies à l'utilisateur final au format JSON (JavaScript Object Notation). Nous allons aussi réaliser des tests unitaires et configurer le serveur afin qu'il soit accessible pour les navigateurs Internet.

Prérequis nécessaires :

- Go et Git installés ;
- Avoir des bases en Go ;
- Notions de requêtes CRUD en SQL et en HTTP;

Prérequis optionnels :

- Avoir lu ce tutoriel : [http://zestedesavoir.com/tutoriels/299/la-theorie-rest-restful-et-hateoas](http://zestedesavoir.com/tutoriels/299/la-theorie-rest-restful-et-hateoas) ;
- L'application [Postman](https://www.getpostman.com) installée.

Objectifs :

- Créer une API RESTful sur Go avec des requêtes en SQL via un ORM ;
- Réaliser des tests fonctionnels et unitaires ;
- Configurer CORS, OPTIONS, ajouter un token d'authentification.

## Préparation du dossier de travail

Dans votre dossier "gopath" (`%gopath%` sur Windows, `$GOPATH` sur Linux et MacOS), dans le dossier "src" puis "github.com", votre nom d'utilisateur (dans ce tutoriel, ce sera "EtienneR") et créez un nouveau dossier ("go_sqlite_api" dans ce tutoriel). Le dossier de notre projet va comporter un fichier "main.go" contenant notre serveur et un dossier "api" avec les fichiers "api.go", "users.go" et le fichier de tests unitaires "users_test.go". Par la suite, le fichier SQLite "data.db" sera créé automatiquement.

```
gopath/
  src/
    github.com/
        EtienneR/
            go_sqlite_api/
                api/
                    api.go
                    users.go
                    users_test.go
                main.go
                data.db
```

### Les librairies

Pour mettre en place cette API, on a besoin des 3 librairies ci-dessous.

- Gin : le micro framework basé sur HttpRouter `go get github.com/gin-gonic/gin` ;
- go-sqlite3 : le "driver" (pilote en français) SQLite3 `go get github.com/mattn/go-sqlite3` ;
- Gorm : l'ORM (Object-Relational Mapping) `go get github.com/jinzhu/gorm`.

Dans le fichier "api.go", on appel ces librairies dans "import".

```golang
package api

import (
    "github.com/gin-gonic/gin"
    "github.com/jinzhu/gorm"
    _ "github.com/mattn/go-sqlite3"
)
```

Remarque : le pilote SQLite3 est indispensable pour faire fonctionner l'ORM. Gorm accepte également **MySQL** (et **MariaDB**), **Postgres** et **FoundationDB** à condition d'avoir à disposition le pilote correspondant.

### Préparation de la base de données

Pour créer notre futur fichier de base de donnée SQLite "data.db", on va avoir recours à l'ORM, Gorm.

#### Structure de données

Pour la structure dans notre fichier "users.go", on reprend le nom de la table concernée "users" ainsi que les 2 champs "id" et "name".

```golang
package api

import (
    "github.com/gin-gonic/gin"
)

type Users struct {
    Id   int    `gorm:"AUTO_INCREMENT" form:"id" json:"id"`
    Name string `gorm:"not null" form:"name" json:"name"`
}
```

On met en place le "databinding" pour les données rentrées (POST et PUT) avec `json:"id"` et `json:"name"`. Si cette notion vous parait abstraite, vous comprendrez son principe lors de l'utilisation des routes concernées. Concernant `form:"id"` et `form:"name"`, ils permettent de récupérer les données depuis "form-data" et "x-www-form-urlencoded" disponibles dans Postman. Quant à "gorm", ce sont des paramêtres de configuration dédiés à la création des champs concernés.`

#### Initialisation de la base de données

Pour se connecter à la base de données, dans le fichier "api.go", on indique le pilote utilisé "sqlite3" et le chemin du fichier "data.db".

```golang
func InitDb() *gorm.DB {
    // Ouverture du fichier
    db, err := gorm.Open("sqlite3", "./data.db")
    db.LogMode(true)

    // Création de la table
    if !db.HasTable(&Users{}) {
        db.CreateTable(&Users{})
        db.Set("gorm:table_options", "ENGINE=InnoDB").CreateTable(&Users{})
    }

    // Erreur de chargement
    if err != nil {
        panic(err)
    }

    return db
}
```

Dans la première condition, si la table "users" n'existe pas, alors on l'a créé avec les options déclarées dans la structure "Users" ainsi que le moteur SQL "InnoDB".  
La fonction facultative mais utile en phase de développement `db.LogMode(true)` permet d'afficher la ou les requête(s) effectuée(s) dans le terminal.

### Création du serveur

Dans le fichier "main.go", on déploit un serveur HTTP fonctionnant sur le port 3000 et dont les routes seront déclarées dans le package "api", dans le fichier "api.go".

```golang
package main

import (
    "log"
    "net/http"

    "github.com/EtienneR/go_sqlite_api/api"
)

func main() {
    err := http.ListenAndServe(":3000", api.Handlers())

    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}
```

Remarque : en production, il faudra remplacer le port 3000 par 80.

Vous l'avez compris, à ce stade, le serveur ne fonctionne pas car on n'a pas encore travaillé dans le fichier "api.go". On ne touchera plus au fichier "main.go".

## Le routage

Dans cette partie, on va faire le plus gros, c'est-à-dire déclarer nos routes avec les requêtes SQL correspondantes en prenant soin de prendre en compte les erreurs éventuelles qui surviennent lors de l'appelation et l'envoi des données. Nous testerons nos routes avec Postman sauf si vous préférez CURL et sa syntaxe...

### Objectifs

On va utiliser 5 routes basiques de CRUD (Create, Read, Update, Delete) listées ci-dessous.

| Verbe | URL | Action |
| - | - | - |
| GET | /api/v1/users | Lister tous les utilisateurs |
| GET | /api/v1/users/1 | Lister l'utilisateur #1 |
| POST | /api/v1/users | Poster un nouvel utilisateur |
| PUT | /api/v1/users/1 | Modifier l'utilisateur #1 |
| DELETE | /api/v1/users/1 | l'utilisateur #1 |

### Préparation

A la suite (dans le fichier "api.go"), dans une nouvelle fonction nommée `Handlers()`, on fait appel au micro-framework Gin pour déclarer nos routes.

```golang
func Handlers() *gin.Engine {
    r := gin.Default()

    v1Users := r.Group("api/v1/users")
    {
        v1Users.POST("", PostUser)
        v1Users.GET("", GetUsers)
        v1Users.GET(":id", GetUser)
        v1Users.PUT(":id", EditUser)
        v1Users.DELETE(":id", DeleteUser)
    }

    return r
}
```

Dans un premier temps, on instancie le serveur MUX dans une variable (r). Sachant que les URL de notre API commencent par le même chemin, le "endpoint" `api/v1/users`, on déclare un groupe pour nos routes dans une variable (`v1Users`). C'est dans cette fonction que l'on placera nos routes. Et on retourne les données de notre routeur MUX car on en a besoin dans notre fichier "main.go". Pour mieux organiser notre code, nous allons créer les fonctions de nos routes dans le fichier "users.go".

### Ajouter un nouvel utilisateur

Pour insérer des données, on veut effectuer la requête SQL semblable à celle ci-dessous.

```sql
INSERT INTO "users" (name) VALUES ("toto");
```

On met en place une route de type POST dans la fonction `PostUser`.

```golang
// Ajouter un utilisteur
func PostUser(c *gin.Context) {
    db := InitDb()
    defer db.Close()

    var json Users
    c.Bind(&json)

    // Si le champ est bien saisi
    if json.Name != "" {
        // INSERT INTO "users" (name) VALUES (json.Name);
        db.Create(&json)
        // Affichage des données saisies
        c.JSON(201, gin.H{"success": json})
    } else {
        // Affichage de l'erreur
        c.JSON(422, gin.H{"error": "Fields are empty"})
    }
}
```

Dans un premier temps, on récupère les données rentrées en JSON via la fonction `c.Bind()`. Puis on vérifie si le champ "name" n'est pas vide alors on envoie un message de succès avec le code HTTP "201". Sinon on renvoie le code "422" avec un message d'erreur.

Dans Postman, sélectionnez "POST" puis l'URL "http://localhost:3000/api/v1/users", cochez "Body" puis "raw", sélectionnez "JSON (application/json)" et copiez les données à rentrer `{ "name": "John Doe" }` et cliquez sur "Send".

Attention : pour que "form-data" et "x-www-form-urlencoded" fonctionnent correctement, il ne faut pas qu'il y'ait d'en-têtes HTTP dans "Headers".

### Lister tous les utilisateurs

On veut afficher dans un tableau JSON tous les utilisateurs présents dans la table "users" ce qui revient à faire en SQL.

```sql
SELECT * FROM users;
```

On met en place une route de type GET dans la fonction `GetUsers`.`

```golang
// Obtenir la liste de tous les utilisateurs
func GetUsers(c *gin.Context) {
    db := InitDb()
    defer db.Close()

    var users []Users
    // SELECT * FROM users
    db.Find(&users)
    // Affichage des données
    c.JSON(200, users)
}
```

On créé une variable `users` héritée de la structure du même nom en précisant que l'on souhaite un tableau (crochets ouvrant et fermant). Puis on effectue la requête SQL et on appel le résultat dans un appel au format JSON via la fonction `c.JSON()`.

### Lister un utilisateur

On veut afficher les données d'un utilisateur ce qui revient à faire en SQL.

```sql
SELECT * FROM users WHERE id = 1;
```

On met en place une route de type GET avec l'id en paramètre dans la fonction `GetUser`.

```golang
// Obtenir un utilisateur par son id
func GetUser(c *gin.Context) {
    db := InitDb()
    defer db.Close()

    id := c.Params.ByName("id")
    var user Users
    // SELECT * FROM users WHERE id = 1;
    db.First(&user, id)

    if user.Id != 0 {
        // Affichage des données
        c.JSON(200, user)
    } else {
        // Affichage de l'erreur
        c.JSON(404, gin.H{"error": "User not found"})
    }
}
```

Dans un premier temps, on stocke l'id concerné dans la variable `id` via la fonction `c.Params.ByName("id")`. Puis on vérifie que la requête SQL renvoie un résultat dans une ligne sinon on affiche une erreur 404 avec un message d'erreur personnalisé.`

### Modifier un utilisateur

Pour modifier des données, on veut effectuer la requête SQL.

```sql
UPDATE users SET name='toto2' WHERE id = 1;
```

On met en place une route de type PUT avec l'id en paramètre dans la fonction `EditUser`.

```golang
// Modifier un utilisateur
func EditUser(c *gin.Context) {
    db := InitDb()
    defer db.Close()

    id := c.Params.ByName("id")
    var user Users
    // SELECT * FROM users WHERE id = 1;
    db.First(&user, id)

    if user.Name != "" {
        if user.Id != 0 {
            var json Users
            c.Bind(&json)

            result := Users{
                Id:   user.Id,
                Name: json.Name,
            }
            // UPDATE users SET name='json.Name' WHERE id = user.Id;
            db.Model(&user).Update("name", result.Name)
            // Affichage des données modifiées
            c.JSON(200, gin.H{"success": result})
        } else {
            // Affichage de l'erreur
            c.JSON(404, gin.H{"error": "User not found"})
        }

    } else {
        // Affichage de l'erreur
        c.JSON(422, gin.H{"error": "Fields are empty"})
    }
}
```

Dans un premier temps, on stocke l'id concerné dans la variable `id` via la fonction `c.Params.ByName("id")`. Comme dans la fonction précédente, on vérifie si le champ "name" n'est pas vide alors on envoie les données avec un message de succès de code HTTP "201". Sinon on renvoie une erreur "422" avec un message d'erreur. Puis on vérifie que la requête SQL renvoie un résultat, sinon on affiche une erreur 404 avec un message d'erreur personnalisé. Et pour finir, on insère les données via `db.Model().Update()`.

Dans Postman, sélectionnez "PUT" puis l'URL "http://localhost:3000/api/v1/users/1", cochez "Body" puis "raw" et copiez les données à rentrer `{ "name": "John la Frite" }` et cliquez sur "Send".

### Supprimer un utilisateur

Pour supprimer un utilisateur, on veut effectuer la requête SQL ci-dessous.

```sql
DELETE FROM users WHERE id = 1;
```

On met en place une route de type DELETE avec l'id en paramètre dans la fonction `DeleteUser`.

```golang
// Supprimer un utilisateur
func DeleteUser(c *gin.Context) {
    db := InitDb()
    defer db.Close()

    // Récupération de l'id dans une variable
    id := c.Params.ByName("id")
    var user Users
    db.First(&user, id)

    if user.Id != 0 {
        // DELETE FROM users WHERE id = user.Id
        db.Delete(&user)
        // Affichage des données
        c.JSON(200, gin.H{"success": "User #" + id + " deleted"})
    } else {
        // Affichage de l'erreur
        c.JSON(404, gin.H{"error": "User not found"})
    }
}
```

Dans un premier temps, on stocke l'id concerné dans la variable `id` via la fonction `c.Params.ByName("id")`. Puis, comme pour la route précédente, on vérifie que l'utilisateur existe sinon on affiche une erreur 404 avec un message d'erreur personnalisé. Si l'utilisateur existe alors on le supprime avec `db.Delete()` et on affiche un message de succès.

Dans Postman, sélectionnez "DELETE" puis l'URL "http://localhost:3000/api/v1/users/1" et cliquez sur "Send".

## Tests unitaires

![](https://i.giphy.com/56LhCE2j6Uy2Y.gif)

Jusqu'ici, on a exécuté des tests fonctionnels avec Postman. Finalement, il est possible de s'en passer en effectuant une batterie de tests. Concretement, dans un fichier on va effectuer les mêmes taches que l'on a exécuté sur Postman mais de manière automatisées. Pour ce faire, on va donc travailler dans le fichier dédié, "users_test.go".

### Librairies et variables globales

On importe un certain nombre de librairies dont l'indispensable "testing" pour n'importe quel test sur Go ainsi que "net/http" et "net/http/httptest" pour des applications orientées Web. On déclare aussi des variables globales qui vont nous servir dans nos différentes fonctions.

```golang
package api_test

import (
    "io"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"

     "github.com/EtienneR/go_sqlite_api/api"
)

var (
    server               *httptest.Server
    reader               io.Reader
    usersUrl, usersUrlId string
    userId               int
)
```

### Initialisation

Lorsqu'on lance une batterie de tests, on se base sur une base de données vide afin d'éviter les problèmes avec l'auto-increment des id. Pour cela on supprime la table et on l'a créé avec des utilisateurs. Dans notre cas, ce sera un fichier "data.db" dans le dossier "api". Ensuite, on démarre un serveur HTTP de test basé sur nos routes. Dans 2 variables, on stocke les URL (la première sans le paramêtre "id" et la seconde avec).

```golang
func init() {
    // Ouverture de la connexion vers la BDD SQLite
    db := api.InitDb()
    // Fermeture de la connexion vers la BDD SQLite
    defer db.Close()

    var user api.Users

    // Suppression de la table
    db.DropTable(user)
    // Création de la table
    db.CreateTable(user)

    // Création d'utilisateurs
    db.Create(&api.Users{Name: "Pierre"})
    db.Create(&api.Users{Name: "Paul"})
    db.Create(&api.Users{Name: "Jacques"})
    db.Create(&api.Users{Name: "Marie Thérèse"})

    // Démarrage du serveur HTTP
    server = httptest.NewServer(api.Handlers())

    // URL sans paramêtre et avec
    usersUrl = server.URL + "/api/v1/users"
    usersUrlId = usersUrl + "/5"
}
```

### Fonctions de test

Comme dans notre test fonctionnel, on va tester chacune des routes de notre API.

#### Tester l'ajout d'une ligne

```golang
func TestPostUser(t *testing.T) {
    // Contenu à soumettre
    userJson := `{"name": "Donovan"}`

    // Contenu à soumettre au bon format
    reader = strings.NewReader(userJson)

    // Déclaration de la requête : type, URL, contenu
    request, err := http.NewRequest("POST", usersUrl, reader)
    // Requête de type JSON
    request.Header.Set("Content-Type", "application/json")

    // Exécution de la requête
    response, err := http.DefaultClient.Do(req)

    // Erreur si route inacessible
    if err != nil {
        t.Error(err)
    }

    // Erreur si code HTTP différent de 201
    if response.StatusCode != 201 {
        t.Errorf("Success expected: %d", response.StatusCode)
    }
}
```

1. On stocke dans une variable le contenu de la ligne que l'on souhaite ajouter ;
2. On modifie ce contenu pour le rendre lisible au format "NewReader" ;
3. On déclare la requête avec 3 paramètres :
    - le type de la route : "POST" ;
    - l'URL de la route ;
    - le contenu ;
4. On spécifie ce contenu au format JSON (afin d'éviter une erreur HTTP 422) ;
5. S'il y a une erreur pour contacter la route, alors le test affichera une erreur ;
6. Si le code HTTP n'est pas 201 alors le test affichera une erreur.

#### Tester la lecture des lignes

```golang
func TestGetUsers(t *testing.T) {
    // Contenu à soumettre vide
    reader = strings.NewReader("")

    // Déclaration de la reqûête : type, URL, contenu
    request, err := http.NewRequest("GET", usersUrl, reader)

    // Exécution de la requête
    response, err := http.DefaultClient.Do(request)

    // Erreur si route inacessible
    if err != nil {
        t.Error(err)
    }

    // Erreur si code HTTP différent de 200
    if response.StatusCode != 200 {
        t.Errorf("Success expected: %d", response.StatusCode)
    }
}
```

1. On stocke dans une variable aucun contenu;
2. On déclare la requête avec 3 paramètres :
    - le type de la route : "GET" ;
    - l'URL de la route ;
    - le contenu (aucun) ;
3. S'il y a une erreur pour contacter la route, alors le test affichera une erreur ;
4. Si le code HTTP n'est pas 200 alors le test affichera une erreur.

#### Tester la lecture d'une ligne

```golang
func TestGetUser(t *testing.T) {
    // Contenu à soumettre vide
    reader = strings.NewReader("")

    // Déclaration de la requête : type, URL, contenu
    request, err := http.NewRequest("GET", usersUrlId, reader)

    // Exécution de la requête
    response, err := http.DefaultClient.Do(request)

    // Erreur si route inacessible
    if err != nil {
        t.Error(err)
    }

    // Erreur si code HTTP différent de 200
    if response.StatusCode != 200 {
        t.Errorf("Success expected: %d", response.StatusCode)
    }
}
```

1. On stocke dans une variable aucun contenu;
2. On déclare la requête avec 3 paramètres :
    - le type de la route : "GET" ;
    - l'URL de la route avec l'id en paramètre ;
    - le contenu (aucun) ;
3. S'il y a une erreur pour contacter la route, alors le test affichera une erreur ;
4. Si le code HTTP n'est pas 200 alors le test affichera une erreur.

#### Tester la modification d'une ligne

```golang
func TestEditUser(t *testing.T) {
    // Contenu à soumettre
    userJson := `{"name": "Mark"}`

    // Contenu à soumettre au bon format
    reader = strings.NewReader(userJson)

    // Déclaration de la requête : type, URL, contenu
    request, err := http.NewRequest("PUT", usersUrlId, reader)
    // Requête de type JSON
    request.Header.Set("Content-Type", "application/json")

    // Exécution de la requête
    response, err := http.DefaultClient.Do(request)

    // Erreur si route inacessible
    if err != nil {
        t.Error(err)
    }

    // Erreur si code HTTP différent de 200
    if response.StatusCode != 200 {
        t.Errorf("Success expected: %d", response.StatusCode)
    }
}
```

1. On stocke dans une variable le contenu de la ligne que l'on souhaite ajouter ;
2. On modifie ce contenu pour le rendre lisible au format "NewReader" ;
3. On déclare la requête avec 3 paramètres :
    - le type de la route : "PUT" ;
    - l'URL de la route avec l'id en paramètre ;
    - le contenu ;
4. On spécifie ce contenu au format JSON (afin d'éviter une erreur HTTP 422) ;
5. S'il y a une erreur pour contacter la route, alors le test affichera une erreur ;
6. Si le code HTTP n'est pas 200 alors le test affichera une erreur.

#### Tester la suppression d'une ligne

```golang
func TestDeleteUser(t *testing.T) {
    // Contenu à soumettre vide
    reader = strings.NewReader("")

    // Déclaration de la requête : type, URL, contenu
    request, err := http.NewRequest("DELETE", usersUrlId, reader)

    // Exécution de la requête
    response, err := http.DefaultClient.Do(request)

    // Erreur si route inacessible
    if err != nil {
        t.Error(err)
    }

    // Erreur si code HTTP différent de 200
    if response.StatusCode != 200 {
        t.Errorf("Success expected: %d", response.StatusCode)
    }
}
```

1. On stocke dans une variable aucun contenu;
2. On déclare la requête avec 3 paramètres :
    - le type de la route : "DELETE" ;
    - l'URL de la route avec l'id en paramètre ;
    - le contenu (aucun) ;
3. S'il y a une erreur pour contacter la route, alors le test affichera une erreur ;
4. Si le code HTTP n'est pas 200 alors le test affichera une erreur.

### Lancer la série des tests

Dans votre terminal, allez dans le dossier "api" et lancez le test avec la commande `go test api_test.go`. Si tout est ok, vous devriez avoir un message de ce genre : `ok command-line-arguments 0.210s`.`

![](https://i.giphy.com/ZKf5OzdXdjtRu.gif)

Pour voir tout le processus des tests : `go test -bench=.`.

Dans le dossier "api" vous avez remarqué qu'un nouveau fichier a fait son apparition, il s'agit du fichier "data.db" dédié aux tests.

Remarque : si vous utilisez le protocole de versionning Git, n'oubliez pas d'ajouter le chemin du fichier de base de données de test dans le fichier ".gitignore".

## Options de configurations

Dans cette partie, nous allons utiliser la notion de "middleware". C'est une fonction qui permet d'être appelée depuis une ou plusieurs fonctions.

### CORS (Cross Origin Ressource Sharing)

Pour établir une communication interdomaine, il faut autoriser la connexion en activant le CORS sinon vous aurez un message explicite dans Firefox.

```
Blocage d’une requête multi-origines (Cross-Origin Request) : la politique « Same Origin » ne permet pas de consulter la ressource distante située sur http://localhost:3000/api/v1/users. Raison : l’en-tête CORS « Access-Control-Allow-Origin » est manquant.
```

Message d'erreur testé avec le code Javascript ci-dessous.

```javascript
var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://localhost:3000/api/v1/users', true);
xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == '200') {
        console.table(JSON.parse(xhr.responseText));
    }
}
xhr.send(null);
```

Au niveau local, dans la ou les route(s) concernée(s).

```golang
c.Writer.Header().Add("Access-Control-Allow-Origin", "*")
c.Next()
```

L'astérisque signifie que l'accès est autorisé pour n'importe quelle IP. Pour des raisons de sécurité, vous pouvez spécifier une adresse IP ou plusieurs, séparées par une virgule.

Au niveau global, à partir d'un middleware, on créé une fonction nommée `Cors()`.

```golang
func Cors() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Add("Access-Control-Allow-Origin", "*")
        c.Next()
    }
}
```

Puis on appel notre fonction `Cors()` dans la fonction `Handlers()` du fichier "api.go".

```golang
// Activation du CORS
r.Use(Cors())
```

Coté test unitaire, ça donne la vérification du header "Access-Control-Allow-Origin".

```golang
if response.Header.Get("Access-Control-Allow-Origin") != "*" {
    t.Error("No CORS")
}
```

### Activer OPTIONS

Par défaut, lorsque vous allez essayer de faire un requête vers une route de type POST, PUT ou DELETE, un exemple de message ci-dessous apparaitra sur Firefox.

```
Blocage d’une requête multi-origines (Cross-Origin Request) : la politique « Same Origin » ne permet pas de consulter la ressource distante située sur http://localhost:3000/api/v1/users. (Raison : échec du canal de pré-vérification des requêtes CORS.
```

Message d'erreur testé avec le code Javascript ci-dessous.

```javascript
var xhr = new XMLHttpRequest();
xhr.open('POST', 'http://localhost:3000/api/v1/users', true);
xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
xhr.send(JSON.stringify({ name: "Jo" }));
```

![](https://i.giphy.com/cAEm5rSuuBEGY.gif)

Alors oui ce message est ambigüe car on a activé le CORS pour toutes les routes. En fait, Firefox ou votre navigateur favori ne trouve pas la route de type "OPTIONS". En regardant de plus près dans le terminal de Gin, cette route est effectivement déclarée comme 404.  
Pour remédier à ce problème, on ajoute 2 routes de type "OPTIONS", la première pour POST et la seconde pour PUT et DELETE.

```golang
v1Users.OPTIONS("", OptionsUser)    // POST
v1Users.OPTIONS(":id", OptionsUser) // PUT, DELETE
```

Ces dernières pointent toutes les deux sur la même fonction, "OptionsUser".

```golang
func OptionsUser(c *gin.Context) {
    c.Writer.Header().Set("Access-Control-Allow-Methods", "DELETE, POST, PUT")
    c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
    c.Next()
}
```

Coté tests unitaires, ça donne la vérification du header "Access-Control-Allow-Methods" ainsi que "Access-Control-Allow-Headers"

```golang
if response.Header.Get("Access-Control-Allow-Methods") != "DELETE, POST, PUT" {
    t.Error("Access-Control-Allow-Methods is wrong :(")
}

if response.Header.Get("Access-Control-Allow-Headers") != "Content-Type" {
    t.Error("Access-Control-Allow-Headers is wrong :(")
}
```

### Authentification avec un token

Le but du token c'est de donner un identifiant généré aléatoirement depuis un formulaire d'inscription. Le serveur vérifie ensuite si le token existe bien dans la base de données.  
On met en place un middleware nommé `TokenAuthMiddleware()`.

```golang
func TokenAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Récupération du paramètre "token" dans une variable
        token := c.Request.FormValue("token")

        // Token vide
        if token == "" {
            c.JSON(403, gin.H{"error": "Access denied, API token required"})
            c.Abort()
            return
        }

        // Vérification de la valeur du token
        if token != "mon_super_token" {
            c.JSON(401, gin.H{"error": "Invalid API token"})
            c.Abort()
            return
        }

        c.Next()
    }
}
```

On récupère le champ token nommé "token" via la fonction `c.Request.FormValue()`. S'il est vide ou si le token n'est pas bon, on renvoit une erreur 403 ou une 401 en personnalisant le message d'erreur.

On peut utiliser le middleware en local.

```golang
v1Users.GET("", TokenAuthMiddleware(), GetUsers)
```

Ou en global dans la déclaration du groupe de routes.

```golang
v1Users := r.Group("api/v1/users", TokenAuthMiddleware())
```

Pour communiquer avec l'API, on met le token en paramètre dans l'URL concernée http://localhost:3000/api/v1/users?token=mon_super_token. Bien entendu, il existe d'autre solutions comme HTTP authentification (Basic ou Digest), Oauth, Auth, OpenID et d'autres selon vos besoins.

## Conclusion

Rapide à mettre en place une fois la structure définie en amont, les routes sont gérées en aval avec le micro framework accompagnées des requêtes SQL adéquates. Vous pouvez désormais vous concentrer sur vos applications SPA (Single Page Application) et mobiles (Android, IOS, Windows Phone, etc...). Pour aller plus loin, vous pouvez activer HTTPS ce qui activera HTTP 2 pour vous routes (seulement à partir de Go 1.6).

## Sources

- Espace de travail : [https://golang.org/doc/code.html#Workspaces](https://golang.org/doc/code.html#Workspaces)
- Gin : [https://github.com/gin-gonic/gin](https://github.com/gin-gonic/gin)
- Pilote SQLite : [https://github.com/mattn/go-sqlite3](https://github.com/mattn/go-sqlite3)
- Gorm : [http://jinzhu.me/gorm](http://jinzhu.me/gorm)
- S'en sortir avec SQL sur Go : [http://go-database-sql.org](http://go-database-sql.org)
