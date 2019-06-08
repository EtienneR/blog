---
title: Connexion MySQL avec Beego (Partie 2)
date: 2015-01-17
tags: ['Golang', 'Beego']
---

Nous allons dans cet article, connecter le framework à une BDD (Base De Données) de type MySQL via l'ORM (Object-Relational Mapping) fournis par Beego. Il est tout à fait possible de se servir d'un autre type de BDD comme PostgreSQL et SQlite3 (officiellement supportées, mais vous pouvez tester avec d'autres drivers de BDD).

## Création du premier modèle
	
Dans le répertoire "models", on crée un fichier que l'on nomme "models.go" :
```go
package models
```

Puis, on importe la bibliothèque "Time" :
```go
import(
	"time"
)
```

Ensuite, on déclare la structure basique de notre future table "articles" :
```go
type Articles struct {
	Id      int       `form:"-"`
	Title   string    `form:"title" required`
	Content string    `orm:";type(text)" form:"content,textarea"`
	Created time.Time `orm:"auto_now_add;type(datetime)"`
	Updated time.Time `orm:"auto_now;type(datetime)"`
}
```

On précise à l'ORM que l'on veut un champ de type texte et non un champ de type "varchar" pour le champ "content".  
Avec l'aide de la librairie "Time" native de Go, on implémente 2 champs de type "datetime". 

Puis on renvoie notre structure à travers une fonction :

```go
func (a *Articles) TableName() string {
	return "articles"
}
```

Et c'est tout pour notre unique modèle !

## Connexion à la base de données

Dans cette partie, on va utiliser le fichier de configuration de Beego. Pour cela, ouvrez le fichier "app.conf" présent dans le dossier "conf".  
On va ajouter 5 variables dont les valeurs seront :

* Le type de base de données ("mysql", "sqlite3", etc…).
* Le nom d'utilisateur de la BDD
* Le mot de passe de l'utilisateur
* L'URL du serveur de la BDD
* Le nom de la base utilisée pour ce projet

```
data_type = "mysql"
data_user = "root"
data_pass = ""
data_urls = "127.0.0.1"
data_db   = "beego_test"
```

Sur votre BDD MySQL, créez une nouvelle base que vous nommez "beego_test".

Les cinq variables ci-dessus vont être utilisées dans le fichier "main.go" (présent à la racine de votre projet). Ouvrez ce fichier.

```go
import (
	"github.com/astaxie/beego"
	_ "myapp/routers"
	models "myapp/models"
	"github.com/astaxie/beego/orm"
	_ "github.com/go-sql-driver/mysql"
)
```

Comme vous pouvez le constater, on importe le modèle, les bibliothèques pour l'ORM de Beego et le driver de MySQL.

Attention : le driver de MySQL en Go doit être présent dans le dossier "%gopath%/src/github.com/go-sql-driver/mysql".  
Si ce n'est pas le cas (par défaut), lancez la commande pour l'installer :  
`go get github.com/go-sql-driver/mysql`

Puis, on passe à la fonction "init" :

```go
func init() {
	orm.RegisterDriver(beego.AppConfig.String("data_type"), orm.DR_MySQL)
	orm.RegisterDataBase("default", beego.AppConfig.String("data_type"), beego.AppConfig.String("mysqluser")+":"+beego.AppConfig.String("password")+"@/"+beego.AppConfig.String("mysqldb")+"?charset=utf8&loc=Europe%2FParis")
	orm.RegisterModel(new(models.Articles))
}
```

Sur la première ligne, on précise l'utilisation du driver de MySQL à l'ORM puis sur la seconde, on lui indique le DSN (Data Source Name) pour pouvoir se connecter sur notre serveur de BDD et sur la troisième et dernière ligne, on charge notre modèle.

A noter : il est notamment possible de créer plusieurs connexions sur différentes BDD avec Beego.

## Gestion des erreurs de connexion

Lors du démarrage de votre serveur, on exécute une fonction qui permet d'afficher une erreur, si le serveur de BDD n'est pas lancé mais aussi de générer la table présente dans le modèle si cette dernière n'existe pas. Dans notre cas, la table "articles".
Pour ce faire, dans la fonction suivante ("main"), du fichier "main.go" ajoutez avant "beego.Run()" :

```go
func main() {
	name    := "default"
	force   := false
	verbose := true

	err := orm.RunSyncdb(name, force, verbose)

	if err != nil {
	    beego.Debug(err)
	}

	beego.Run()
}
```

* "name" : on utilise la connexion "default" définit dans la fonction "init"
* "force" : si vaut "true", alors l'ORM écrase (sans sommation) la table.
* "verbose" : affiche la connexion dans la console du serveur.

Ci-dessous, les 3 types de messages possibles renvoyés dans la console du serveur (si "verbose" vaut "true").  
Le serveur de BDD n'est pas démarré / non accessible : 

```
[ORM]register db Ping `default`, dial tcp 127.0.0.1:3306: ConnectEx tcp: Aucune connexion n'a pu être établie car l'ordinateur cible l'a expressément refusée.
must have one register DataBase alias named `default`
```

La table "articles" n'existe pas :

```sql
create table `articles`
	-- --------------------------------------------------
    --  Table Structure for `myapp/models.Articles`
    -- --------------------------------------------------
    CREATE TABLE IF NOT EXISTS `articles` (
        `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
        `title` varchar(255) NOT NULL,
        `content` longtext NOT NULL,
        `created` datetime NOT NULL,
        `updated` datetime NOT NULL
    ) ENGINE=InnoDB;
```

La table "articles" existe : 

```
table `articles` already exists, skip
```

Remarque : si vous ajoutez un nouveau champ après avoir déjà généré la table, Beego se charge de mettre à jour la structure de votre table.

## Sources

* Driver MySQL : https://github.com/go-sql-driver/mysql
* Driver Postgres : https://github.com/lib/pq
* Driver Sqlite3 : https://github.com/mattn/go-sqlite3
* Liste des types de champs: http://beego.me/docs/mvc/model/models.md#model-fields-mapping-with-database-type
* Le site officiel de Beego : http://beego.me