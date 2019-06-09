---
title: 'Une API RESTful sans serveur de base de données'
date: 2016-03-14
tags: ['PHP', 'API']
---

Créer une API RESTful en PHP c'est tout à fait possible. Pour cela on utilise traditionnellement une base de donnée en SQL comme MySQL ou MariaDB ou en NoSQL avec MongoDB, Redis... Mais utiliser les données directement dans un fichier JSON est également possible. En partant du principe que les données sont stockées dans un tableau, il est tout à fait possible de manipuler ce dernier par la suite.

![](https://media.giphy.com/media/8FNlmNPDTo2wE/giphy.gif)

Ci-dessous, le contenu du fichier "db.json".

```javascript
[
    {
        "id": 1,
        "title": "Interstellar",
        "releaseYear" : 2014
    },
    {
        "id": 2,
        "title": "The Revenant",
        "releaseYear": 2016
    },
    {
        "id": 3,
        "title": "Snowpiercer",
        "releaseYear": 2013
    },
    {
        "id": 4,
        "title": "The Host",
        "releaseYear": 2006
    },
    {
        "id": 5,
        "title": "Sicario",
        "releaseYear": 2015
    }
]
```

Coté serveur, on va mettre en place un design pattern ("patron de conception") de type singleton. Concrètement, on instancie l'ouverture du fichier JSON dans le constructeur de notre classe. On évite ainsi de l'appeler dans les 4 fonctions destinées au CRUD (Create Read, Update, Delete) :

- `FetchAll` : récupère toutes les lignes sous forme d'un tableau ;
- `FetchOne` : récupère une ligne en particulier ;
- `Create` : créé une nouvelle ligne ;
- `Update` : modifie une ligne en fonction de l'id ;
- `Delete` : supprime une ligne en fonction de l'id.

## Préparation de la classe

```php
<?php

class Api {
    private $file_json = 'db.json';

    function __construct()
    {
        // Ouverture du fichier
        $this->json = file_get_contents($this->file_json);
        // Tableau des données en PHP
        $this->get  = json_decode($this->json, true);
    }

    // Affichage des messages / données JSON
    private function Display($data)
    {
       echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    // Modification du fichier JSON
    private function Set($data)
    {
        file_put_contents($this->file_json, json_encode($data));
    }

    // Id du tableau PHP
    private function CurrentRow($id)
    {
        return $id - 1;
    }

    // Nos futures fonctions destinées au CRUD
}
```

Dans le constructeur, on instancie 2 variables :

- `$this->json` : ouverture du fichier JSON avec `file_get_contents()` ;
- `$this->get` : décode le JSON avec `json_decode()` sous la forme d'un tableau.

Puis on prépare 2 fonctions privées :

- `Display()` afficher des messages / données au format JSON avec `json_encode()` ;
- `Set()` modifier le fichier JSON avec `file_put_contents()` ;
- `CurrentRow()` l'id du tableau PHP (et non JSON) qui commence à partir de 0 (et non 1).

### Toutes les données

```php
// Lecture de tous le tableau JSON
public function FetchAll()
{
    foreach ($this->get as $row) {
        // Récupération du tableau de données
        $rows[] = $row;
    }

    $this->Display($rows);
}
```

Dans la première fonction publique `FetchAll()`, on récupère toutes les données présentes dans le fichier JSON que l'on affiche sous la forme d'un tableau.

### Une seule ligne

```php
// Lecture d'une ligne à partir de son "id"
public function FetchOne($id)
{
    // Récupération du tableau de données
    $data = $this->get;

    // Vérification de l'existence de la ligne
    if (isset($data[$this->CurrentRow($id)])) {
        $this->Display($data[$this->CurrentRow($id)]);
    } else {
        $this->Display(array("error" => "the row #$id doesn't exists"));
        header("HTTP/1.0 404 Not Found");
    }
}
```

Avec comme paramètre dans la fonction `FetchOne()`, l'id d'une ligne, on récupère la ligne correspondante. Si elle n'existe pas, on affiche un message d'erreur.

### Création d'une ligne

```php
// Création d'une nouvelle ligne 
public function Create($data_input = array())
{
    if (!empty($data_input)) {
        // Récupération du tableau de données
        $data = $this->get;
        // Ajout d'un nouveau champ id
        $id = array('id' => count($data) + 1);
        // Fusion des données dans cette nouvelle ligne
        $row = array_merge($id, $datas_input);
        // Ajout de la nouvelle ligne dans le tableau général
        $all_data = array_merge($data, array($row));
        // Modification du fichier JSON
        $this->Set($all_data);
        // Message de succès
        $this->Display(array("success" =>"posted new row ", "data" => $row));
        header("HTTP/1.0 201 Created");
    }
}
```

Dans la fonction `Create()`, on passe en paramètre les données à ajouter sous forme d'un tableau. Dans un premier temps, on récupère toutes les données présentes dans le fichier JSON. On adjoint dans ce tableau une nouvelle ligne dans laquelle on fusionne les données ajoutées en paramètre avec un nouvel id. Puis on sauvegarde ce nouveau tableau avec `$this->Set()`.

### Modification d'une ligne

```php
// Modification d'une ligne
public function Update($id, $data_input = array())
{
    // Récupération du tableau de données
    $data = $this->get;

    // Vérification de l'existence de la ligne
    if (isset($data[$this->CurrentRow($id)])) {
        // MAJ de la ligne concernée
        $update = array_merge(array('id' => $id), $data_input);
        // Vérification de modification
        $diff   = array_diff($update, $data[$this->CurrentRow($id)]);

        if (empty($diff)) {
            $this->Display(array("warning" => "no change"));
        } else {
            // Remplacement de la ligne
            $data[$this->CurrentRow($id)] = $update;
            // Modification du fichier JSON
            $this->Set($data);
            $this->Display(array("success" => "row updated", "data" => $update));
        }

    } else {
        $this->Display(array("error" => "the row #$id doesn't exists"));
        header("HTTP/1.0 404 Not Found");
    }
}
```

Pour modifier une ligne, dans la fonction `Update()` on récupère toutes les données du fichier JSON. On vérifie que la ligne concernée existe. Puis comme pour créer une nouvelle ligne, on fusionne avec l'id, les données à modifier spécifiées en paramètre. On en profite également pour vérifier que ces dernières sont bien différentes que celles déja existantes. Si c'est le cas, alors on met à jour le fichier JSON avec la ligne modifiée.

### Suppression d'une ligne

```php
// Suppression d'une ligne
public function Delete($id)
{
    // Récupération du tableau de données
    $data = $this->get;

    // Vérification de l'existence de la ligne
    if (isset($data[$this->CurrentRow($id)])) {
        // Suppression de la ligne concernée dans le tableau
        unset($data[$this->CurrentRow($id)]);
        // Modification du fichier JSON
        $this->Set($data);
        $this->Display(array("success" => "row #$id deleted"));
    } else {
        $this->Display(array("error" => "the row #$id doesn't exists"));
        header("HTTP/1.0 404 Not Found");
    }
}
```

Pour supprimer une ligne, dans la fonction `Delete()` on récupère toutes les données du tableau. On vérifie que la ligne existe bien pour la supprimer et modifier le fichier JSON avec le tableau modifié.

## Test

Dans le même fichier, après la fermeture de la classe, on appel cette dernière dans une variable.

```php
header('Content-Type: application/json; charset=utf-8');

// Appel de la classe "Api"
$api = new Api();
```

Puis, on peut afficher toutes les données.

```php
$api->FetchAll();
```

Afficher uniquement la ligne ayant l'id 4.

```php
$api->FetchOne(4);
```

Créer une nouvelle ligne.

```php
$api->Create(array('title' => 'Prisonners', 'releaseYear' => 2012));
```

Modifier la ligne ayant l'id 6.

```php
$api->Update(6, array('title' => 'Prisoners', 'releaseYear' => 2013));
```

Supprimer la ligne ayant l'id 6.

```php
$api->Delete(6);
```

## Refactoring

Dans notre classe, on met en place 2 fonctions privées pour alléger nos 3 dernières fonctions publiques :

- `CheckFound()` : vérifier que la ligne existe ;
- `CheckData()` : verifier qu'il y a bien des données fournies en paramètre.

### Gestion des erreurs 404

```php
// Vérification de l'existence de la ligne
private function CheckFound($id)
{
    // Récupération du tableau de données
    $data = $this->get;

    if (!isset($data[$this->CurrentRow($id)])) {
        $this->Display(array("error" => "the row #$id doesn't exists"));
        header("HTTP/1.0 404 Not Found");
    }
}
```

Si la ligne n'existe pas, on affiche une erreur de type 404.

### Gestion des données manquantes

```php
private function CheckData($data_input = array())
{
    if (empty($data_input)) {
        $this->Display(array("error" => "missing data"));
        header("HTTP/1.0 400 Bad Request");
    }
}
```

Si le paramètre `$data_input` est vide, on affiche une erreur de type 400.

### Réécritures des fonctions CRUD concernées

On peut ainsi réécrire les fonctions `FetchOne()`, `Create()`, `Update()` et `Delete()`.

```php
// Lecture d'une ligne à partir de son "id"
public function FetchOne($id)
{
    if ($this->CheckFound($id)) {
        // Récupération du tableau de données
        $data = $this->get;
        $this->Display($data[$this->CurrentRow($id)]);
    }
}

// Création d'une nouvelle ligne 
public function Create($data_input = array())
{
    if ($this->CheckData($data_input)) {
        // Récupération du tableau de données
        $data = $this->get;
        // Ajout d'un nouveau champ id
        $id = array('id' => count($data) + 1);
        // Fusion des données dans cette nouvelle ligne
        $row = array_merge($id, $data_input);
        // Ajout de la nouvelle ligne dans le tableau général
        $all_data = array_merge($data, array($row));
        // Modification du fichier JSON
        $this->Set($all_data);
        // Message de succès
        $this->Display(array("success" => "posted new row ", "data" => $row));
        header("HTTP/1.0 201 Created");
    }
}

// Modification d'une ligne
public function Update($id, $data_input = array())
{
    // Vérification de l'existence de la ligne
    if ($this->CheckFound($id) && $this->CheckData($data_input)) {
        // Récupération du tableau de données
        $data = $this->get;
        // MAJ de la ligne concernée
        $update = array_merge(array('id' => $id), $data_input);
        // Vérification de modification
        $diff   = array_diff($update, $data[$this->CurrentRow($id)]);

        if (empty($diff)) {
            $this->Display(array("warning" => "no change"));
        } else {
            // Remplacement de la ligne
            $data[$this->CurrentRow($id)] = $update;
            // Modification du fichier JSON
            $this->Set($data);
            $this->Display(array("success" => "row updated", "data" => $update));
        }
    }
}

// Suppression d'une ligne
public function Delete($id)
{
    // Vérification de l'existence de la ligne
    if ($this->CheckFound($id)) {
        // Récupération du tableau de données
        $data = $this->get;
        // Suppression de la ligne concernée dans le tableau
        unset($data[$this->CurrentRow($id)]);
        // Modification du fichier JSON
        $this->Set($data);
        $this->Display(array("success" => "row #$id deleted"));
    }
}
```

## Conclusion

Avec des conditions, des boucles et des fonctions natives de manipulation de tableau, il est finalement simple de mettre en place une classe pour manipuler une API en JSON sans serveur de base de données derière. D'autant plus qu'il est possible par la suite, d'imaginer la mise en place dans cette même classe d'un contrôle sur la structure de l'API (type de champ, champ obligatoire, unicité d'un champ, etc...).