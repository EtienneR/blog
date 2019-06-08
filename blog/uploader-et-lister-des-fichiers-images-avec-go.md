---
title: Uploader et lister des fichiers images avec Go
date: 2015-09-10
tags: ['Golang']
download: https://github.com/EtienneR/go_upload
---

Avec seulement des librairies natives de Go, il est possible de mettre en place un gestionnaire d'upload et une galerie d'images. À cela s'ajoute la lecture des images présentes dans le dossier. On va par la suite mettre en place une limitation de taille pour les fichiers mais aussi restreindre les fichiers qui ne sont pas au format image. En bonus, on mettra en place un système d'informations succès / erreurs ainsi que les dimensions des images.

## Structure du projet

On créé un dossier "tmp" (pour les futurs fichiers uploadés) et un autre dossier "views" comportant la vue du formulaire "form_upload" sans oublier le fichier "main.go" à la racine du projet.

```
/tmp
/views
    - form_upload.html
- main.go
```

## Un simple serveur web

On met en place un formulaire "multipart" dans l'unique vue de notre projet "form_upload.html".

```html
<!DOCTYPE html>
<html>
<meta charset="UTF-8" />
<title>Go upload</title>
<body>

    <form action="upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" />
        <input type="submit" value="Upload this file" />
    </form>

</body>
</html>
```

Puis, dans notre fichier "main.go", on met en place 2 routes.

```go
package main

import (
    "html/template"
    "log"
    "net/http"
)

func main() {
    port := ":3000"
    log.Println("Starting Web Server 127.0.0.1" + port)

    // Nos 2 routes
    http.HandleFunc("/", indexHandler)
    http.HandleFunc("/upload", uploadHandler)

    // Afficher le contenu du dossier "tmp"
    http.Handle("/tmp/", http.StripPrefix("/tmp/", http.FileServer(http.Dir("tmp"))))

    err := http.ListenAndServe(port, nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
    tmpl, err := template.ParseFiles("views/form_upload.html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    tmpl.Execute(w, nil)    // Affiche le contenu de "views/form_upload.html"
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
    // Récupère les informations de l'input file (name="file")
    file, fileheader, err := r.FormFile("file")

    if err != nil {
        log.Println(err)                 // Affiche "http: no such file" si pas de fichier
    } else {
        log.Println(file)                // Le contenu du fichier (en langage "robot")
        log.Println(fileheader.Filename) // Le nom du fichier
        log.Println(fileheader.Header)   // Données du header
    }

    defer file.Close()
}
```

Dans la première fonction "indexHandler", on affiche simplement notre vue.  
Ensuite, dans la seconde nommée "uploadHandler", on récupère les informations du fichier rentrées dans le formulaire d'upload via "r.Formfile".  
La variable "file" contient le contenu du fichier et "filheader" contient les informations du fichier comme son nom ("fileheader.Filename") et le type de son contenu ("fileheader.Header").

## Upload

Maintenant que l'on a récupéré les informations et le contenu du fichier, dans un second temps, on créé un fichier comportant le nom du fichier vide avec "os.Create" puis dans un troisième temps, on copie le contenu du fichier dans ce fichier avec "io.Copy", dans la fonction "uploadHandler".

```go
package main

import (
    "html/template"
    "io"
    "log"
    "net/http"
    "os"
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
    // Récupération des infos du fichier
    file, fileheader, err := r.FormFile("file")

    if err != nil {
        log.Println(err)
    }

    defer file.Close()

    // Création du fichier vide
    out, err := os.Create("tmp/" + fileheader.Filename)

    if err != nil {
        log.Println(err)
    }

    defer out.Close()

    // Copie du contenu dans le fichier précédement vide
    _, err = io.Copy(out, file)

    if err != nil {
        log.Println(err)
    }

    defer out.Close()

    // Redirection vers la page d'accueil
    http.Redirect(w, r, "/", http.StatusFound)
}
```

Faites le test et regardez dans votre dossier "tmp".

### Limiter la taille d'envoi

Par défaut, la taille n'est pas limitée. Au début de la fonction "uploadHandler", on ajoute une condition de taille maximale avec "r.ContentLength". Si le fichier est trop lourd, la fonction "http.MaxBytesReader" bloquera alors le transfert du fichier (d'oû l'intéret de mettre cette condition au début de notre fonction...).

La taille de limite est en octet... petit rappel :

- 1 Kilo-octet (Ko) = 10^3 = 1000 octets ;
- 1 Méga-octet (Mo) = 10^6 octets = 1 000 000 octets.


```go
var maxsize int64 = 2000000 // 2 Mo (2 * 10^6 octets)

// Contrôle si taille est supérieur à 2 Mo
if r.ContentLength > maxsize {
    r.Body = http.MaxBytesReader(w, r.Body, maxsize)
    // Retourne une erreur 413
    http.Error(w, "File too large", http.StatusRequestEntityTooLarge)
    return
}
```

Si le fichier est trop lourd, alors le serveur retournera une erreur HTTP 413 ("Request Entity Too Large") avec l'information: "File too large".

### Fichiers autorisés

Tout comme la limitation de taille, il n'y a pas de restriction par défaut, au niveau du format du fichier envoyé au serveur.  
Pour filter, on récupère l'extension du fichier avec la fonction "filepath.Ext" pour ensuite mettre en place une condition dans la fonction "uploadHandler".

```go
package main

import (
    "html/template"
    "io"
    "log"
    "net/http"
    "os"
    "path/filepath" // Pour l'extension de fichier
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
    file, fileheader, err := r.FormFile("file")

    if err != nil {
        log.Println(err)
        http.Redirect(w, r, "/", http.StatusFound)
        return
    }

    defer file.Close()

    var maxsize int64 = 2000000

    if r.ContentLength > maxsize {
        r.Body = http.MaxBytesReader(w, r.Body, maxsize)
        http.Error(w, "File too large", http.StatusRequestEntityTooLarge)
        return
    }

    // Récupération de l'extension du fichier
    extension := filepath.Ext(fileheader.Filename)

    // Si l'extension correspond à l'un de ces critères
    if extension == ".gif" || extension == ".jpg" || extension == ".png" {
        out, err := os.Create("tmp/" + fileheader.Filename)

        if err != nil {
            log.Println(err)
        }

        defer out.Close()

        _, err = io.Copy(out, file)

        if err != nil {
            log.Println(err)
        }

        defer out.Close()
    } else {
		http.Error(w, "Bad file format", http.StatusRequestEntityTooLarge)
		return
	}

    http.Redirect(w, r, "/", http.StatusFound)
}
```

Si le fichier n'est pas au bon format, alors le serveur retournera une erreur HTTP 413 ("Request Entity Too Large") avec l'information : Bad file format".

## Lister les fichiers

Pour lister les fichiers uploadés, on va utiliser la fonction "ioutil.ReadDir".  
Avant de continuer, on va se focaliser quelques instant sur ce que retourne cette fonction. En effet, dans le documentation officielle, elle est construire de la façon suivante.

`func ReadDir(dirname string) ([]os.FileInfo, error)`

Ce qui donne lieu à ce genre de code.

```go
entries, err := ioutil.ReadDir("tmp/")

if err != nil {
    log.Println(err)
}

for _, entry := range entries {
    log.Println(entry.Name())    // Nom du fichier ("myphoto.jpg")
    log.Println(entry.Size())    // Taille en octet (/1024 = Ko)
    log.Println(entry.Mode())    // Droits d'écritures "-rw-rw-rw-"
    log.Println(entry.ModTime()) // Date de dernière modification
    log.Println(entry.IsDir())   // "false" par défaut (car on ne liste pas des "directories" / répertoires)
}
```

Les informations sont lisibles sur une structure particulière de type "FileInfo" (http://golang.org/pkg/os/#FileInfo).  
Pour exploiter ces informations, on va donc mettre en place une structure "FileInfo" et éditer notre route concernée, "indexHandler".

```go
package main

import (
    "html/template"
    "io"
    "io/ioutil"
    "log"
    "net/http"
    "os"
    "path/filepath"
    "time"
)

type FileInfo struct {
    Name    string
    Size    int64
    Updated time.Time
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
    tmpl, err := template.ParseFiles("views/form_upload.html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Récupération des fichiers présents dans le dossier
    entries, err := ioutil.ReadDir("tmp/")

    if err == nil {
        // Création d'un tableau basé sur la structure "FileInfo"
        files := []FileInfo{}

        // Boucle sur chaque fichier
        for _, entry := range entries {
            // Récupération des données
            f := FileInfo{
                Name:    entry.Name(),
                Size:    entry.Size(),
                Updated: entry.ModTime(),
            }
            // Insertion des données dans le tableau
            files = append(files, f)
        }

        // Données pour le front
        data := map[string]interface{}{
            "Files": files,
        }

        tmpl.Execute(w, data)
    } else {
        // Le dossier "tmp/" n'existe pas
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}
```

Et, on affiche ces nouvelles données dans notre unique fichier HTML dans une boucle "range".

```html
<!DOCTYPE html>
<html>
<meta charset="UTF-8" />
<title>Go upload</title>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
<body class="container">

    <h1>Upload file with Go</h1>

    <form action="upload" method="post" enctype="multipart/form-data">
        <div class="form-group">
            <input type="file" name="file" />
            <button type="submit" class="btn btn-default">Submit</button>
        </div>
    </form>

    {{ if .Files }}
    <table class="table">
        <tr>
            <th>Name</th>
            <th>Size (octets)</th>
            <th>Last update</th>
        </tr>
        {{ range $FileInfo := .Files }}
        <tr>
            <td><a href="tmp/{{ $FileInfo.Name }}" target="_blank">{{ $FileInfo.Name }}</a></td>
            <td>{{ $FileInfo.Size }}</td>
            <td>{{ $FileInfo.Updated }}</td>
         </tr>
        {{ end }}
    </table>
    {{ else }}
    <p>No files</p>
    {{ end }}

</body>
</html>
```

Remarque : l'affichage se fait automatiquement par ordre alphabétique (nom du fichier).

### Supprimer un fichier

On récupère le nom du fichier dans l'URL de type GET avec la fonction "r.URL.Query().Get()" puis on le supprime avec la fonction "os.Remove".

```go
package main

import (
    "html/template"
    "io"
    "io/ioutil"
    "log"
    "net/http"
    "os"
    "path/filepath"
    "time"
)

func indexHandler(w http.ResponseWriter, r *http.Request) {
    file := r.URL.Query().Get("file")

    // Si le fichier est bien renseigné dans l'URL
    if file != "" {
        // Suppression du fichier
        err := os.Remove("tmp/" + file)

        if err != nil {
            log.Println(err)
            return
        }

        // Redirection vers la page d'accueil
        http.Redirect(w, r, "/", http.StatusFound)
    }

    tmpl, err := template.ParseFiles("views/form_upload.html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    entries, err := ioutil.ReadDir("tmp/")

    if err == nil {
        files := []FileInfo{}

        for _, entry := range entries {
            f := FileInfo{
                Name:    entry.Name(),
                Size:    entry.Size(),
                Updated: entry.ModTime(),
            }
            files = append(files, f)
        }

        data := map[string]interface{}{
            "Files": files,
        }

        tmpl.Execute(w, data)

    } else {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}
```

On édite le tableau de notre fichier HTML afin de récupérer le nom du fichier.

```html
<!DOCTYPE html>
<html>
<meta charset="UTF-8" />
<title>Go upload</title>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
<body class="container">

    <h1>Upload file with Go</h1>

    <form action="upload" method="post" enctype="multipart/form-data">
        <div class="form-group">
            <input type="file" name="file" />
            <button type="submit" class="btn btn-default">Submit</button>
        </div>
    </form>

    {{ if .Files }}
    <table class="table">
        <tr>
            <th>Name</th>
            <th>Size (octets)</th>
            <th>Last update</th>
            <th>Delete</th>
        </tr>
        {{ range $FileInfo := .Files }}
        <tr>
            <td>
                <a href="tmp/{{ $FileInfo.Name }}" target="_blank">
                    <img src="tmp/{{ $FileInfo.Name }}" height="120" alt="" />
                </a>
            </td>
            <td>{{ $FileInfo.Size }}</td>
            <td>{{ $FileInfo.Updated }}</td>
            <td><a href="/delete?file={{ $FileInfo.Name }}">Delete</a></td>
         </tr>
        {{ end }}
    </table>
    {{ else }}
    <p>No files</p>
    {{ end }}

</body>
</html>
```

## Bonus : messages d'informations et dimensions des images

On crée une fonction "setFlash" qui contiendra le message de succès ou d'erreur d'une action dans un cookie temporaire.
Quant aux dimensions des images présentes dans le dossier "tmp", on utilise la fonction "os.Open" pour ouvrir le fichier concerné puis "image.DecodeConfig" pour récupérer la largeur et la hauteur de l'image.

```go
package main

import (
    "html/template"
    "image"
    "image/gif"
    "image/jpeg"
    "image/png"
    "io"
    "io/ioutil"
    "log"
    "math"
    "net/http"
    "os"
    "path/filepath"
    "time"
)

type FileInfo struct {
    Name          string
    Size          float64
    Updated       time.Time
    Width, Height int
}

func init() {
    // Appel des dépendances "image/gif", "image/jpeg" and "image/png"
    image.RegisterFormat("jpeg", "jpeg", jpeg.Decode, jpeg.DecodeConfig)
    image.RegisterFormat("gif", "gif", gif.Decode, gif.DecodeConfig)
    image.RegisterFormat("png", "png", png.Decode, png.DecodeConfig)
}

func main() {
    port := ":3000"
    log.Println("Starting Web Server 127.0.0.1" + port)

    http.HandleFunc("/", indexHandler)
    http.HandleFunc("/upload", uploadHandler)

    http.Handle("/tmp/", http.StripPrefix("/tmp/", http.FileServer(http.Dir("tmp"))))

    err := http.ListenAndServe(port, nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
    fileFormUrlGet := r.URL.Query().Get("file")

    if fileFormUrlGet != "" {
        err := os.Remove("tmp/" + fileFormUrlGet)

        if err != nil {
            log.Println(err)
            setFlash(w, "warning", "The file '"+fileFormUrlGet+"' can't be remove")
            http.Redirect(w, r, "/", http.StatusFound)
            return
        }

        setFlash(w, "success", "The file '"+fileFormUrlGet+"' has been remove successul")
        http.Redirect(w, r, "/", http.StatusFound)
        return
    }

    tmpl, err := template.ParseFiles("views/form_upload.html")

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    entries, err := ioutil.ReadDir("tmp/")

    if err == nil {
        files := []FileInfo{}

        for _, entry := range entries {
            // On ouvre le fichier
            dimensions, err := os.Open("tmp/" + entry.Name())

            if err != nil {
                log.Println(err)
            }

            // Afin d'obtenir les dimensions
            imgConf, _, err := image.DecodeConfig(dimensions)

            if err != nil {
                log.Println(err)
            }

            // On modifie le tableau des informations pour y ajouter taille et largeur de l'image
            f := FileInfo{
                Name:    entry.Name(),
                Size:    math.Ceil(float64(entry.Size()) / 1024),
                Updated: entry.ModTime(),
                Width:   imgConf.Width,
                Height:  imgConf.Height,
            }

            // On pense à bien fermer
            dimensions.Close() // Sinon erreur avec "os.Remove"

            files = append(files, f)
        }

        // Récupération des données des cookies "success" et "warning"
        cookieSuccess, a := r.Cookie("success")
        cookieWarning, b := r.Cookie("warning")

        success := ""
        warning := ""

        if a == nil {
            success = cookieSuccess.Value
        }

        if b == nil {
            warning = cookieWarning.Value
        }

        data := map[string]interface{}{
            "Files":   files,
            "Success": success,
            "Warning": warning,
        }

        tmpl.Execute(w, data)

    } else {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }

}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
    file, fileheader, err := r.FormFile("file")

    if err != nil {
        log.Println(err)
        setFlash(w, "warning", "No file to upload")
        http.Redirect(w, r, "/", http.StatusFound)
        return
    }

    defer file.Close()

    var maxsize int64 = 2000000

    if r.ContentLength > maxsize {
        setFlash(w, "warning", "The file '"+fileheader.Filename+"' can't be uploaded: too heavy size")
        http.Redirect(w, r, "/", http.StatusFound)
        return
    }

    extension := filepath.Ext(fileheader.Filename)

    if extension == ".gif" || extension == ".jpg" || extension == ".png" {
        out, err := os.Create("tmp/" + fileheader.Filename)

        if err != nil {
            log.Println(err)
        }

        defer out.Close()

        _, err = io.Copy(out, file)

        if err != nil {
            log.Println(err)
        }

        defer out.Close()

        setFlash(w, "success", "The file '"+fileheader.Filename+"' has been upload successul")
    } else {
        setFlash(w, "warning", "Extension "+extension+" not accepted")
    }

    http.Redirect(w, r, "/", http.StatusFound)
}

// Fonction pour créer un cookie à durée limitée
func setFlash(w http.ResponseWriter, name string, value string) {
    cookie := &http.Cookie{Name: name, Value: value, Path: "/", MaxAge: 1}
    http.SetCookie(w, cookie)
}
```

On affiche le message retourné par les cookies.

```html
<!DOCTYPE html>
<html>
<meta charset="UTF-8" />
<title>Go upload</title>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
<body class="container">

    <h1>Upload file with Go</h1>

    <form action="upload" method="post" enctype="multipart/form-data">
        <div class="form-group">
            <input type="file" name="file" />
            <button type="submit" class="btn btn-default">Submit</button>
        </div>
    </form>

    {{ if .Success }}
    <div class="alert alert-success" role="alert">
        {{ .Success }}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>
    {{ end }}

    {{ if .Warning }}
    <div class="alert alert-warning" role="alert">
        {{ .Warning }}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>
    {{ end }}

    {{ if .Files }}
    <table class="table">
        <tr>
            <th>Preview</th>
            <th>Name</th>
            <th>Size (ko)</th>
            <th>Last update</th>
            <th>Width</th>
            <th>Height</th>
            <th>Delete</th>
        </tr>
        {{ range $FileInfo := .Files }}
        <tr>
            <td>
                <a href="tmp/{{ $FileInfo.Name }}" target="_blank">
                    <img src="tmp/{{ $FileInfo.Name }}" height="120" alt="" />
                </a>
            </td>
            <td>{{ $FileInfo.Name }}</td>
            <td>{{ $FileInfo.Size }}</td>
            <td>{{ $FileInfo.Updated }}</td>
            <td>{{ $FileInfo.Width }}px</td>
            <td>{{ $FileInfo.Height }}px</td>
            <td><a href="?file={{ $FileInfo.Name }}">Delete</a></td>
         </tr>
        {{ end }}
    </table>
    {{ else }}
    <p>No files</p>
    {{ end }}

    <script src="http://code.jquery.com/jquery-2.1.4.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>

</body>
</html>
```


## Conclusion

On a désormais un système d'upload d'images fonctionnel sans librairie externe. Pour aller plus loin, on pourrait imaginer un système de pagination pour alléger le chargement de la page, générer une miniature de l'image, etc...