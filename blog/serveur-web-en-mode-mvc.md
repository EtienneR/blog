---
title: Serveur web en mode MVC
date: 2015-03-04
tags: ['Golang']
---

Avec Golang, on peut déployer rapidement mettre en place un serveur HTTP "from scratch" grâce à la librarie de base **net/http**. On pourra par la suite, l'améliorer en ajoutant un système de templating avec la librairies **html/template**. On va mettre en place ce serveur sur une architecture basée sur le modèle MVC (Modèle Vue Contrôleur).

## Création d'un serveur basique

Dans un nouveau dossier (je l'ai appelé "myserver"), créez un fichier "main.go".

```go
// main.go

package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", homeHandler)
    http.ListenAndServe(":3000", nil)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "home page")
}
```

Quelques explications à propos de **net/http** :

* `http.HandleFunc` : correspond à une route.
* `http.ListenAndServe` : correspond au port d'écoute. Ici "3000", donc le serveur est accessible via l'URL suivante : [http://localhost:3000](http://localhost:3000).
* `w http.ResponseWriter` : paramètre d'écriture ("write").
* `r *http.Request` : paramètre de lecture ("read").

De cette façon, il est simple de rajouter une nouvelle route.

```go
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    port := ":3000"
    log.Println("Starting Web Server 127.0.0.1" + port)

    http.HandleFunc("/", homeHandler)
    http.HandleFunc("/about", aboutHandler)

    err := http.ListenAndServe(port, nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "home page")
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "about page")
}
```

Lancez le serveur dans votre console `go run main.go`.

Remarque: si vous tentez d'accéder à une page non définie dans les routes comme [http://localhost:3000/42](http://localhost:3000/42), vous êtes automatiquement redirigé vers la page d'accueil mais avec un code 200.

## Mise en place du templating

### Templating simple

Dans le répertoire de votre projet, créez un nouveau dossier que vous nommez "views" et ajoutez-y les deux fichiers de templating suivant "home.html".

```html
<!-- views/home.html -->

<!DOCTYPE html>
<html>
<head>
    <title>{{ .Name }}</title>
</head>
<body>

    <h1>{{ .Name }}</h1>
    <ul>
    {{ range $content := .Content }}
        <li>{{ $content }}</li>
    {{end}}
    </ul>
    <p><a href="about">About</a></p>

</body>
</html>
```

Et "about.html".

```html
<!-- views/about.html -->

<!DOCTYPE html>
<html>
<head>
    <title>{{ .Name }}</title>
</head>
<body>

    <h1>{{ .Name }}</h1>
    <p> Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
        consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
        cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
        proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <p><a href="/">Retour sur la home</a></p>

</body>
</html>
```

On va devoir utiliser la librairie dédiée au templating **html/template** et ajouter une structure "Info" dans le fichier "main.go".

```go
// main.go

package main

import (
    "html/template"
    "log"
    "net/http"
)

type Info struct {
    Name    string
    Content []string
}

func main() {
    port := ":3000"
    log.Println("Starting Web Server 127.0.0.1" + port)

    http.HandleFunc("/", IndexHandler)
    http.HandleFunc("/about", AboutHandler)

    err := http.ListenAndServe(port, nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
    info := Info{"Welcome", []string{"a content", "another content"}}

    tmpl, err := template.ParseFiles("views/home.html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        log.Printf(err.Error())
    }

    tmpl.Execute(w, info)

    log.Printf("Connection to %v%v - %v \n", r.Host, r.URL, http.StatusOK)
}

func AboutHandler(w http.ResponseWriter, r *http.Request) {
    info := Info{"About", nil}

    tmpl, err := template.ParseFiles("views/about.html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        log.Printf(err.Error())
    }

    tmpl.Execute(w, info)

    log.Printf("Connection to %v%v - %v \n", r.Host, r.URL, http.StatusOK)
}
```

La gestion des erreurs permet d'afficher une erreur sur le navigateur (mais aussi dans la console du serveur).  
Si le dossier n'existe pas:  
`open views/home.html: Le chemin d’accès spécifié est introuvable.`  
Si le fichier renseigné n'est pas bon:  
`open views/home.html: Le fichier spécifié est introuvable.`

Pour éviter de répéter du code, on met en place une fonction **TemplateMe** pour générer le templating en appelant en paramètres le fichier de la vue et les informations correspondant à la page concernée.

```go
// main.go

package main

import (
    "html/template"
    "log"
    "net/http"
)

type Info struct {
    Name    string
    Content []string
}

func main() {
    port := ":3000"
    log.Println("Starting Web Server 127.0.0.1" + port)

    http.HandleFunc("/", IndexHandler)
    http.HandleFunc("/about", AboutHandler)
    http.ListenAndServe(":3000", nil)

    err := http.ListenAndServe(port, nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
    info := Info{"Welcome", []string{"a content", "another content"}}

    TemplateMe(w, r, "views/home", info)
}

func AboutHandler(w http.ResponseWriter, r *http.Request) {
    info := Info{"About", nil}

    TemplateMe(w, r, "views/about", info)
}

func TemplateMe(w http.ResponseWriter, r *http.Request, page string, info interface{}) {
    tmpl, err := template.ParseFiles(page+".html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        log.Printf(err.Error())
    }

    tmpl.Execute(w, info)

    log.Printf("Connection to %v%v - %v \n", r.Host, r.URL, http.StatusOK)
}
```

On en profite également pour ne pas avoir à mettre l'extension "html" à chaque appel de la fonction **TemplateMe**.

### Templating avec layout

Toujours dans l'optique de gagner du temps et de la flexibilité dans le code des vues, on met en place un système de templating.  
Dans le dossier "views", créez un nouveau fichier "layout.html" :

```html
<!-- views/layout.html -->

{{ define "layout" }}

<!DOCTYPE html>
<html>
<head>
    <title>{{ .Name }}</title>
</head>
<body>

    <h1>{{ .Name }}</h1>

    {{ template "content" . }}

    <p>Powered by Golang</p>

</body>
</html>

{{ end }}
```

`{{ template "content" . }}` va chercher directement dans les fichiers templates concernés (ci-dessous).

Editez vos deux fichiers de vue "home.html".

```html
<!-- views/home.html -->

{{ define "content" }}

<ul>
{{ range $content := .Content }}
    <li>{{ $content }}</li>
{{ end }}
</ul>
<p><a href="/">About</a></p>

{{ end }}
```

Et "about.html".

```html
<!-- views/about.html -->

{{ define "content" }}

<p>
    Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
    proident, sunt in culpa qui officia deserunt mollit anim id est laborum.a
</p>
<p><a href="">Retour sur la home</a></p>

{{ end }}
```

On va également en profiter pour ajouter un dossier "static" à la racine de notre projet. Celui-ci contiendra les éléments tels que les fichiers CSS, Javascript, images, etc... Pour cela, on va lister ce dossier dans le fichier "main.go". On modifie également la fonction `IndexHandler` pour activer une erreur 404 (et non un code 200).

```go
// main.go

package main

import (
    "html/template"
    "log"
    "net/http"
)

type Info struct {
    Name    string
    Content []string
}

func main() {
    port := ":3000"
    log.Println("Starting Web Server 127.0.0.1" + port)

    http.HandleFunc("/", IndexHandler)
    http.HandleFunc("/about", AboutHandler)

    static_folder := http.FileServer(http.Dir("static"))
    http.Handle("/static/", http.StripPrefix("/static/", static_folder))

    err := http.ListenAndServe(port, nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
    if r.URL.Path == "/" {
        info := Info{"Welcome", []string{"a content", "another content"}}
        
        TemplateMe(w, r, "views/home", 200, info)
    } else {
        info := Info{"Welcome", nil}

        TemplateMe(w, r, "views/home", 404, info)
    }
}

func AboutHandler(w http.ResponseWriter, r *http.Request) {
    info := Info{"About", nil}

    TemplateMe(w, r, "views/about", 200, info)
}

func TemplateMe(w http.ResponseWriter, r *http.Request, page string, status int, info interface{}) {
    tmpl, err := template.ParseFiles("views/layout.html", page+".html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        log.Printf(err.Error())
    }

    if status == 200 {
        w.WriteHeader(http.StatusOK)
        log.Printf("Connection to %v%v - %v \n", r.Host, r.URL, http.StatusOK)
    } else {
        w.WriteHeader(http.StatusNotFound)
        log.Printf("Connection to %v%v - %v \n", r.Host, r.URL, http.StatusNotFound)
    }

    tmpl.ExecuteTemplate(w, "layout", info)
}
```

Dans le dossier "views", ajoutez le fichier "404.html".

```html
    <!-- views/404.html -->

    {{ define "content" }}
    <p><a href="/">Back to the home</a></p>
    {{ end }}
```

## Création d'un serveur avec un contrôleur global

On va libérer de la place dans le fichier "main.go" en créant un contrôleur correspondant à nos deux routes.  
Pour cela créez, à la racine du projet, un nouveau dossier intitulé "controllers" accompagné à l'intérieur d'un nouveau fichier (provisoire par la suite) "controller.go".

```go
// controllers/controller.go

package controller

import (
    "html/template"
    "log"
    "net/http"
)

type Info struct {
    Name    string
    Content []string
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
    if r.URL.Path == "/" {
        info := Info{"Welcome", []string{"a content", "another content"}}

        TemplateMe(w, r, "views/home", 200, info)
    } else {
        info := Info{"404", nil}

        TemplateMe(w, r, "views/404", 404, info)
    }
}

func AboutHandler(w http.ResponseWriter, r *http.Request) {
    info := Info{"About", nil}

    TemplateMe(w, r, "views/about", 200, info)
}

func TemplateMe(w http.ResponseWriter, r *http.Request, page string, status int, info interface{}) {
    tmpl, err := template.ParseFiles("views/layout.html", page+".html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        log.Printf(err.Error())
    }

    if status == 200 {
        w.WriteHeader(http.StatusOK)
        log.Printf("Connection to %v%v - %v \n", r.Host, r.URL, http.StatusOK)
    } else {
        w.WriteHeader(http.StatusNotFound)
        log.Printf("Connection to %v%v - %v \n", r.Host, r.URL, http.StatusNotFound)
    }

    tmpl.ExecuteTemplate(w, "layout", info)
}
```

Remarque: il est important de nommer les fonctions avec une majuscule au début, sinon la fonction ne pourra pas être lu depuis un autre fichier ("main.go" dans notre cas).

Revenons à notre fichier "main.go".

``` go
// main.go

package main

import (
    "log"
    "net/http"

    "myserver/controllers"
)

type Info struct {
    Name    string
    Content []string
}

func main() {
    port := ":3000"
    log.Println("Starting Web Server 127.0.0.1" + port)

    http.HandleFunc("/", indexHandler)
    http.HandleFunc("/about", aboutHandler)

    static_folder := http.FileServer(http.Dir("static"))
    http.Handle("/static/", http.StripPrefix("/static/", static_folder))

    err := http.ListenAndServe(port, nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
    controller.IndexHandler(w, r)
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
    controller.AboutHandler(w, r)
}
```

On y voit déjà plus clair dans ce fichier :)

![](http://i.giphy.com/Qyrja9VbIgOre.gif)

## Notre 1er modèle et réforme du contrôleur global

Le modèle va contenir la structure "Info" qui sera ensuite appelée dans nos deux contrôleurs.
Oui car on va on également, diviser ~~pour mieux régner~~ en deux notre controleur en restant sur `package controller` (et par la même occasion, se débarasser du fichier "controller.go").

Dans le dossier de votre projet, créez à la racine un nouveau dossier que vous nommez "models" puis un nouveau fichier "info.go".

```go
// models/info.go

package models

type Info struct {
    Name string
    Content []string
}
```

Dans un nouveau dossier "helpers", créez un fichier "helper.go" pour y stocker notre fonction de templating **TemplateMe**.

```go
// helpers/helper.go

package helpers

import (
    "html/template"
    "log"
    "net/http"
)

func TemplateMe(w http.ResponseWriter, r *http.Request, page string, status int, info interface{}) {
    tmpl, err := template.ParseFiles("views/layout.html", page+".html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        log.Printf(err.Error())
    }

    if status == 200 {
        w.WriteHeader(http.StatusOK)
        log.Printf("Connection to %v%v - %v \n", r.Host, r.URL, http.StatusOK)
    } else {
        w.WriteHeader(http.StatusNotFound)
        log.Printf("Connection to %v%v - %v \n", r.Host, r.URL, http.StatusNotFound)
    }

    tmpl.ExecuteTemplate(w, "layout", info)
}
```

Ensuite, nos deux contrôleurs en commencant par "home.go".

```go
// controllers/home.go

package controller

import (
    "net/http"

    "myserver/helper"
    "myserver/models"
)

func IndexHandler(w http.ResponseWriter, r *http.Request) {
    info := &models.Info{}

    if r.URL.Path == "/" {
        info.Name = "Welcome"
        info.Content = []string{"a content", "another content"}

        helpers.TemplateMe(w, r, "views/home", 200, info)
    } else {
        info.Name = "404"

        helpers.TemplateMe(w, r, "views/404", 404, info)
    }
}
```

Et en terminant par "about.go".

```go
// controllers/about.go

package controller

import (
    "net/http"

    "myserver/helpers"
    "myserver/models"
)

func AboutHandler(w http.ResponseWriter, r *http.Request) {
    info := &models.Info{}
    info.Name = "About"

    helpers.TemplateMe(w, r, "views/about", 200, info)
}
```

Sans oublier notre fichier "main.go" version allégée.

```go
// main.go

package main

import (
    "log"
    "net/http"

    "myserver/controllers"
)

type Info struct {
    Name    string
    Content []string
}

func main() {
    port := ":3000"
    log.Println("Starting Web Server 127.0.0.1" + port)

    http.HandleFunc("/", indexHandler)
    http.HandleFunc("/about", aboutHandler)

    static_folder := http.FileServer(http.Dir("static"))
    http.Handle("/static/", http.StripPrefix("/static/", static_folder))

    err := http.ListenAndServe(port, nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
    controller.IndexHandler(w, r)
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
    controller.AboutHandler(w, r)
}
```

N'oubliez pas de supprimer le fichier "controller.go" avant de redémarrer votre serveur.

## Conclusion

A ce stade, malgré notre structure MVC fonctionnelle, il n'est pas possible de déclarer des routes dynamiques. En revanche, il existe une multitude de micro framework de routage tels que Gin, Gorilla/mux, etc... qui existent pour combler cette fonctionnalité (mais aussi la gestion des erreurs HTTP) et permettent également d'alléger le code (un bon point pour les yeux).

![](http://i.giphy.com/ZQbON1Fr2Ada0.gif)

## Sources

* Documentation officielle: [https://golang.org/doc/articles/wiki](https://golang.org/doc/articles/wiki) ;
* Différents types de serveur: [http://www.alexedwards.net/blog/golang-response-snippets](http://www.alexedwards.net/blog/golang-response-snippets) ;
* Codes HTTP sur Golang: [http://www.sergiotapia.me/return-http-status-codes-using-go](http://www.sergiotapia.me/return-http-status-codes-using-go) ;
* Définition de "Handler": [http://fr.wiktionary.org/wiki/handler](http://fr.wiktionary.org/wiki/handler) ;
* GoSublime, extension indispensable sur SublimeText: [https://github.com/DisposaBoy/GoSublime](https://github.com/DisposaBoy/GoSublime) ;
* Changer les délimiteurs par défaut: [https://medium.com/@etiennerouzeaud/change-default-delimiters-templating-with-template-delims-857938a0b661](https://medium.com/@etiennerouzeaud/change-default-delimiters-templating-with-template-delims-857938a0b661).
