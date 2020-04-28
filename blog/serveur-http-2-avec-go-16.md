---
title: 'Serveur HTTP 2 avec Go 1.6'
date: 2016-03-02
tags: ['Golang']
---

Bonne nouvelle, depuis la version 1.6 de Go, il est possible d'implémenter le HTTP/2, autrement dit, le futur de HTTP/1.1 existant depuis plus d'une décennie (1994 pour la version 1 et de 1997 à 2014 pour la version 1.1). Cette nouvelle version siglée RFC 7540 propulse le chargement des fichiers en multiplexage avec des entêtes compressées. Autant vous dire que le temps de chargement est au rendez-vous pour la moyenne des sites actuels dont les pages pèsent environ 2 Mo avec 60 / 80 requêtes. Pas de panique, les methodes (GET, POST, PUT, DELETE, etc...) ne changent pas ainsi que les codes de statuts, les entêtes et la négociation.

![](./img/http1.1_vs_http2.jpg)

Pour pouvoir mettre en place HTTP/2, il faut exécuter le serveur avec le chiffrement TLS, autrement dit HTTPS.

## Préparation de la clef et du certificat

Pour que TLS fonctionne correctement, il faut générer un fichier qui va contenir la clef publique et un certificat. On utilise l'utilitaire "openssl" à la racine du projet pour générer nos 2 fichiers.
On commence par générer la clef privée : `openssl genrsa -out localhost.key 2048` afin de générer le certificat : `openssl req -new -x509 -key localhost.key -out localhost.pem -days 730`

- "-x509" : le cryptage utilisé ;
- "-key localhost.key" : le fichier de la clef publique ;
- "out localhost.pem" : le fichier du certificat ;
- "-days 365" : correspond au nombre de jour (ici 1 an) de validité du certificat.

## Configurer HTTP/2

Tout d'abord si votre version de Go (`go version`) est inférieur à la 1.6, il faut télécharger la librairie mise à disposition pour HTTP/2 : `go get golang.org/x/net/http2` pour l'importer avec les autres librairies dont nous aurons besoin par la suite.

```go
package main

import (
    "fmt"
    "log"
    "net/http"

    // Go < 1.6
    "golang.org/x/net/http2"
)
```

Si vous travaillez sur la version 1.6 ou +, vous n'avez pas besoin de suivre cette partie.  
Dans la fonction principale "main()", on déclare une variable "s" de type "http.Server". On active les logs dans le terminal du serveur en passant la valeur de "http2.VerboseLogs" à "true" sans oublier "http2.ConfigureServer" dans laquelle on met en premier paramètre l'expression "&s" et en second "nil".

```go
func main() {
    // Configuration de HTTP2 pour Go < 1.6
    var s http.Server
    http2.VerboseLogs = true
    http2.ConfigureServer(&s, nil)

    // Suite du code
)
```

## Création et appel d'une route

Pour afficher un résultat dans la route d'accueil, on créé une nouvelle fonction "indexHandler" avec les paramètres de la librairie http ("w http.ResponseWriter, r *http.Request").

```go
// Route d'accueil
func indexHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/plain; charset=UTF-8")
    fmt.Fprintln(w, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.")
}
```

Rien d'extraordinaire, on affiche seulement du texte au format UTF-8 via "fmt.Fprintln()". Puis dans notre fonction "main()", on appelle cette route dans la fonction "http.HandleFunc()".

```go
func main() {
    // Configuration de HTTP2 pour Go < 1.6
    var s http.Server
    http2.VerboseLogs = true
    http2.ConfigureServer(&s, nil)

    // Appel de la route d'accueil
    http.HandleFunc("/", indexHandler)

    // Suite du code
}
```

## ListenAndServeTLS

Maintenant que l'on a activé HTTP 2 et appelé notre unique route, il ne manque plus que le "démarreur" de notre serveur. Pour cela on utilise, la fonction "http.ListenAndServeTLS()" dans laquelle on indique le port (443 par défaut), le nom de notre certificat ("localhost.pem"), la clef publique ("localhost.key") et "nil".

```go
func main() {
    // Configuration de HTTP2 pour Go < 1.6
    var s http.Server
    http2.VerboseLogs = true
    http2.ConfigureServer(&s, nil)

    // Appel de la route d'accueil
    http.HandleFunc("/", indexHandler)

    // Lancement du serveur HTTPS
    err := http.ListenAndServeTLS(":443", "localhost.pem", "localhost.key", nil)
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}
```

S'il y a une erreur au lancement du serveur (mauvais paramètre, fichier manquant, etc..) elle s'affichera grâce à "log.Fatal()".

## Lancement du serveur

Lancez votre serveur avec `go run main.go`.

Dans votre navigateur Internet, accédez à votre serveur via [https://localhost](https://localhost) (et non [http://localhost](http://localhost) !!!). A la première connexion, vous devez accepter le certificat demandé par votre navigateur.

Remarque : votre navigateur vous informe que le certificat est dangereux. C'est tout à fait juste car ce dernier n'est pas signé par une autorité compétente.

### Linux

Sur Linux lorsque vous tentez de lancez le serveur avec le port 443 vous avez le droit à l'erreur suivante : `ListenAndServe: listen tcp :443: bind: permission denied`. En effet, il faut lancer la commande avec les privilèges de sudo.
Pour résoudre ce problème d'autorisation, ouvrez le fichier de configuration de l'utilitaire sudo : `sudo vim /etc/sudoers` et ajoutez les 2 lignes ci-dessous :

```bash
Defaults env_keep +="GOPATH"
Defaults env_keep +="GOROOT"
```

Puis enregistrez cette modification avec "wq!" et lancez le serveur avec `sudo go run main.go`.

## Sources

- Fonction ConfigureServer de golang.org/x/net/http2 : [https://godoc.org/golang.org/x/net/http2#ConfigureServer](https://godoc.org/golang.org/x/net/http2#ConfigureServer)
- Fonction ListenAndServeTLS : [https://golang.org/pkg/net/http/#ListenAndServeTLS](https://golang.org/pkg/net/http/#ListenAndServeTLS) ;
- A propos du fichier sudoers : [https://doc.ubuntu-fr.org/sudoers](https://doc.ubuntu-fr.org/sudoers) ;
- Des outils pour tester HTTP 2 : [https://blog.cloudflare.com/tools-for-debugging-testing-and-using-http-2](https://blog.cloudflare.com/tools-for-debugging-testing-and-using-http-2) ;
- "HTTP/2 : quels sont les nouveautés et les gains ?" : [https://devcentral.f5.com/articles/http2-est-l-quels-sont-les-gains-14945](https://devcentral.f5.com/articles/http2-est-l-quels-sont-les-gains-14945).
