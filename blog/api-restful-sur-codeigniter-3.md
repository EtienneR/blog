---
title: API Restful sur Codeigniter 3
date: 2015-04-15
tags: ["CodeIgniter", "API"]
download: https://github.com/EtienneR/codeigniter-api
---

Après trois RC (Release Candidate), Codeigniter 3 est sorti ! Parmi les nouveautés qu'il compte, la possibilité de travailler avec les méthodes HTTP GET, POST mais également PUT et DELETE. Cela rend plus facile à mettre en place une API Restful par rapport à la version précédente du framework. Quant à la base de données, on va rester sur une base SQL.

## Schéma simplifié

On va uniquement travailler sur un contrôleur "Product.php" accompagné de son modèle "Model_product.php". Et on finira par configurer les routes dans le fichier "routes.php".

```bash
├───controllers
│   │
│   └───api
│       └───v1
│               Product.php
├───config
│       routes.php
├───models
│       Model_product.php
```

## Préparation de la base de données

Avant de commencer à construire l'API, on prépare notre BDD sur MySQL ou MariaDB.

```sql
CREATE DATABASE IF NOT EXISTS `codeigniter3_api` DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;
USE `codeigniter3_api`;

CREATE TABLE IF NOT EXISTS `product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` text,
  PRIMARY KEY (`id`)
);
```

Puis, on configure l'accès à la BDD dans le fichier "config/database.php".

```php
'hostname' => 'localhost',
'username' => 'root',
'password' => '',
'database' => 'codeigniter_api',
```

## Création du modèle

Dans notre modèle "Model_product.php", on va déclarer les 5 fonctions comportant les requêtes SQL CRUD ayant pour mission :

1. Obtenir tous les produits ;
2. Obtenir un produit en particulier ;
3. Créer un nouveau produit ;
4. Modifier un produit ;
5. Supprimer un produit.

```php
<?php defined('BASEPATH') OR exit('No direct script access allowed');

class Model_product extends CI_Model {

    function __construct()
    {
        parent::__construct();
        $this->table = "product";
    }

    function get_all()
    {
        return $this->db->get($this->table);
    }

    function get_one($id)
    {
        $this->db->select("id, title")
                 ->from($this->table)
                 ->where("id", $id)
                 ->limit(1);

        return $this->db->get();
    }

    function post($title)
    {
        $data = array(
            "title" => $title,
        );

        $this->db->insert($this->table, $data);
    }

    function put($id, $title)
    {
        $data = array(
            "title" => $title
        );

        $this->db->where("id", $id)
                 ->update($this->table, $data);
    }

    function delete($id)
    {
        $this->db->where_in("id", $id)
                 ->delete($this->table);
    }

}

/* End of file Model_product.php */
/* Location: ./application/models/Model_product.php */
```

## Création du contrôleur

Dans notre contrôleur, on va retrouver les 5 fonctions que l'on a créé précédemment dans notre modèle et que l'on ajoutera dans notre fichier routes. Ces fonctions retourneront des valeurs aux formats Json et dans le bon code HTTP.

```php
<?php defined('BASEPATH') OR exit('No direct script access allowed');

class Product extends CI_Controller {

    function __construct()
    {
        parent::__construct();
        $this->load->database();
        $this->load->model("Model_product");
    }

    public function index()
    {
        $data = $this->Model_product->get_all();

        if ($data->num_rows() > 0) {
            foreach ($data->result() as $row) {
                $result[] = array("id" => intval($row->id), "title" => $row->title);
            }
            echo json_encode($result);
        } else {
            header("HTTP/1.0 204 No Content");
            echo json_encode("204: no products in the database");
        }
    }

    public function view($id)
    {
        $data = $this->Model_product->get_one($id);

        if ($data->num_rows() > 0) {
            foreach ($data->result() as $row) {
                $result[] = array("id" => intval($row->id), "title" => $row->title);
            }
            echo json_encode($result);
        } else {
            header("HTTP/1.0 404 Not Found");
            echo json_encode("404 : Product #$id not found");
        }
    }

    public function create()
    {
        $title = $this->input->post('title', TRUE);

        if (!empty($title)) {
            $this->Model_product->post($title);
            echo json_encode('Product created');
        } else {
            header("HTTP/1.0 400 Bad Request");
            echo json_encode("400: Empty value");
        }
    }

    public function update($id)
    {
        $title = utf8_encode($this->input->input_stream('title', TRUE));

        if ($this->Model_product->get_one($id)->num_rows() == 1) {

            if (!empty($title)) {
                $this->Model_product->put($id, $title);
                echo json_encode("200: Product #$id updated");
            } else {
                header("HTTP/1.0 400 Bad Request");
                echo json_encode("400: Empty value");
            }

        } else {
            header("HTTP/1.0 404 Not Found");
            echo json_encode("404: Product #$id not found");
        }
    }

    public function delete($id)
    {
        if ($this->Model_product->get_one($id)->num_rows() == 1) {
            $this->Model_product->delete($id);
            echo json_encode("200: Product #$id deleted");
        } else {
            header("HTTP/1.0 404 Not Found");
            echo json_encode("404: Product $id not found");
        }
    }
}

/* End of file Product.php */
/* Location: ./application/controllers/Product.php */
```

Dans le constructeur, on charge la connexion à la BDD et le modèle.
Pour les 2 dernières fonctions (modification et suppression), on vérifie que le produit existe.  
Dans la fonction `update`, on récupère les informations rentrées par l'utilisateur via la fonction `$this->input->input_stream`.

Important : on active la protection contre les injections XSS avec le paramêtre "TRUE" pour les fonctions `input->post` et `input->input_stream`.

Remarque : on convertit la valeur de l'id du ou des produit(s) en entier car par défaut, Codeigniter renvoit au format "string" (chaine de caractères) les données supposées être des "int" (entiers).

## Préparation des routes

Pour finir, éditez le fichier "application/config/routes.php" et ajoutez les routes ci-dessous correspondant aux fonctions présentes dans notre contrôleur.

```php
$route["api/v1/product"]["get"]           = "api/v1/product";
$route["api/v1/product/(:num)"]["get"]    = "api/v1/product/view/$1";
$route["api/v1/product"]["post"]          = "api/v1/product/create";
$route["api/v1/product/(:num)"]["put"]    = "api/v1/product/update/$1";
$route["api/v1/product/(:num)"]["delete"] = "api/v1/product/delete/$1";
```

On suffixe dans chaque route, la méthode HTTP concernée (GET, POST, PUT ou DELETE).

## Testons avec l'ami CURL

### GET

`curl http://localhost/codeigniter-api/api/v1/product`  
`curl http://localhost/codeigniter-api/api/v1/product/1`

Remarque : vous pouvez aussi tester les requêtes HTTP de type GET sur votre navigateur Web...

### POST

`curl -d title="product title" http://localhost/codeigniter-api/api/v1/product`  
`curl -d title="<script src='alert'>alert</script>" http://localhost/codeigniter-api/api/v1/product`

### PUT

`curl -X PUT -d title="edit product title" http://localhost/codeigniter-api/api/v1/product/1`  
`curl -X PUT -d title="<script src='alert'>alert</script>" http://localhost/codeigniter-api/api/v1/product/1`

### DELETE

`curl -X DELETE http://localhost/codeigniter-api/api/v1/product/1`

## CORS

Par défaut, si vous souhaitez travailler sur une application tournant sur un autre port autre que celui de votre serveur Apache, Nginx, etc... vous aurez un message d'erreur car le CORS restreint l'accès à votre API.  
Dans le constructeur du contrôleur, ajoutez la ligne suivante.

```php
header("Access-Control-Allow-Origin: *");
```

## Conclusion

Codeigniter 3 permet de créer rapidement une API Restful grâce aux nouvelles fonctionnalitées telles que `$this->input->valeur` et la possibilité de déclarer les méthodes HTTP dans les routes. Vous pouvez également rajouter un système de vérification de token pour ajouter de la sécurité à votre API. Dans ce cas, il faudra rajouter une condition sur les fonctions concernées dans le contrôleur.

## Sources

- php://input stream : [http://www.codeigniter.com/userguide3/libraries/input.html#using-the-php-input-stream](http://www.codeigniter.com/userguide3/libraries/input.html#using-the-php-input-stream) ;
- Les routes avec leur méthode HTTP : [http://www.codeigniter.com/userguide3/general/routing.html#using-http-verbs-in-routes](http://www.codeigniter.com/userguide3/general/routing.html#using-http-verbs-in-routes)
