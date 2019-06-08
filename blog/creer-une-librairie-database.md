---
title: 'Créer une librairie "Database"'
date: 2015-11-23
tags: ['PHP', 'MySQL']
---

On va concevoir une librairie en POO (Programmation Orienté Objet) pour pouvoir se connecter à la base de données avec PDO (PHP Data Objects). En plus de concevoir cette librairie, on va également créer un modèle contenant des requêtes SQL de type CRUD (Create Read Update Delete). Vous pourrez par la suite, réutiliser cette librairie dans un "microframework" PHP tel que Slim, Silex ou Lumen et ainsi profiter du modèle MVC.

## Préparation

Pour faire ce tutoriel, il nous faut pour commencer, une base de donnée MySQL / MariaDB.

```sql
CREATE DATABASE IF NOT EXISTS test;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;


INSERT INTO `users` (`id`, `name`) VALUES
(1, 'Macon'),
(2, 'Kalia'),
(3, 'Damian'),
(4, 'Nash'),
(5, 'Keefe'),
(6, 'Octavius'),
(7, 'Wendy'),
(8, 'Maggy'),
(9, 'Walter'),
(10, 'Cherokee');
```

## Classe "Database"

Créez un fichier "Database.php" dans le dossier "config".

```php
<?php // config/Database.php

class Database 
{
	// Code à venir
}
```

Cette classe va contenir la connexion à PDO puis différents types de requêtes SQL possibles en PDO.

### Connexion à PDO

Pour se connecter à notre serveur via PDO, on a besoin des 5 informations obligatoires ci-dessous.

- Le nom de la base ;
- Le nom utilisateur ("root" par défaut) ;
- Le mot de passe ;
- L'adresse du serveur ;
- Le port du serveur ("3306" par défaut).

On créé donc ces 5 variables instanciées dans le constructeur de notre classe.

```php
<?php // config/Database.php

class Database 
{
	private $pdo = null;

	public function __construct()
	{
		$this->db_name = "test";
		$this->db_user = "root";
		$this->db_pass = "";
		$this->db_host = "localhost";
		$this->db_port = 3306;
	}

	// Autres fonctions à venir
}
```

Maintenant que l'on a ces données, on va pouvoir créer notre fonction de connexion PDO, que l'on nomme `getPDO()`.

```php
<?php // config/Database.php

class Database 
{
	private $pdo = null;

	public function __construct()
	{
		$this->db_name = "test";
		$this->db_user = "root";
		$this->db_pass = "";
		$this->db_host = "localhost";
		$this->db_port = 3306;
	}

	// Connexion à la BDD
	private function getPDO()
	{
		if ($this->pdo === null) {

			try {
				// DSN
				$pdo = new PDO("mysql:dbname=" . $this->db_name . ";host=" . $this->db_host . ";port=". $this->db_port, $this->db_user, $this->db_pass);
				$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
				$pdo->exec("SET CHARACTER SET utf8");

				$this->pdo = $pdo;

			} catch (PDOException $e) {
				echo 'Pas de connexion avec la BDD : ' . $e->getMessage();
				die();
			}

		}

		return $this->pdo;
	}
}
```

Avec `PDO::setAttribute`, on configure 2 attributs PDO :

- `PDO::ATTR_ERRMODE` : affiche les rapports d'erreur ;
- `PDO::ERRMODE_EXCEPTION` : émet une exception pour les erreurs.

Désormais, la connexion établie, on va pouvoir gérer 3 types de requêtes SQL dans 3 fonctions distinctes :

- Simple ("query") ;
- Préparéé ("prepare") ;
- Une seule ligne ("row").

### Requête simple

```php
// Requête simple
public function query($statement)
{
	$req  = $this->getPDO()->query($statement);
	$data = $req->fetchAll(PDO::FETCH_OBJ);

	return $data;
}
```

Avec `PDOStatement::fetchAll`, on renvoi tous les résultat sous la forme d'un tableau d'objet de type "stdClass" avec les noms de propriétés qui correspondent aux noms des colonnes retournés dans le jeu de résultats via `PDO::FETCH_OBJ`. Exemple avec notre table :

```php
Array ( [0] => stdClass Object ( [id] => 1 [name] => Macon ) [1] => stdClass Object ( [id] => 2 [name] => Kalia ) [2] => stdClass Object ( [id] => 3 [name] => Damian ) [3] => stdClass Object ( [id] => 4 [name] => Nash ) [4] => stdClass Object ( [id] => 5 [name] => Keefe ) [5] => stdClass Object ( [id] => 6 [name] => Octavius ) [6] => stdClass Object ( [id] => 7 [name] => Wendy ) [7] => stdClass Object ( [id] => 8 [name] => Maggy ) [8] => stdClass Object ( [id] => 9 [name] => Walter ) [9] => stdClass Object ( [id] => 10 [name] => Cherokee ) ) 
```

Si vous voulez un tableau de type "array", remplacez `PDO::FETCH_OBJ` par `PDO::FETCH_ASSOC`. Ce qui donne avec nos données :

```php
Array ( [0] => Array ( [id] => 1 [name] => Macon ) [1] => Array ( [id] => 2 [name] => Kalia ) [2] => Array ( [id] => 3 [name] => Damian ) [3] => Array ( [id] => 4 [name] => Nash ) [4] => Array ( [id] => 5 [name] => Keefe ) [5] => Array ( [id] => 6 [name] => Octavius ) [6] => Array ( [id] => 7 [name] => Wendy ) [7] => Array ( [id] => 8 [name] => Maggy ) [8] => Array ( [id] => 9 [name] => Walter ) [9] => Array ( [id] => 10 [name] => Cherokee ) ) 
```

### Requête préparée

```php
// Requête préparée
public function prepare($statement, $attributes = array())
{
	$query  = explode(" ", $statement);
	// Récupération du 1èr mot
	$option = strtolower(array_shift($query));

	$req = $this->getPDO()->prepare($statement);
	$req->execute($attributes);

	if ($option == "select" || $option == "show") {

		if ($req->rowCount() > 0) {
			$data = $req->fetchAll(PDO::FETCH_CLASS);
			return $data;
		}

	} elseif ($option == "insert" || $option == "update" || $option == "delete") {

		if ($option == "insert") {
			// Valeur id inséré
			return $this->getPDO()->lastInsertId();
		} else {
			return $req->rowCount();
		}

	}
}
```

Si c'est une requête de type `SELECT` ou `SHOW`, on affiche tous les objets. Si elle est du type `INSERT`, on retourne l'id retourné via `lastInsertId()`. Sinon pour celles du type `UPDATE` ou `DELETE`, on affiche le résultat sous formes d'un entier via `PDOStatement::rowCount` (0 = contenu non modifié, X = nombre de contenu modifié(s)).

### Une seule ligne

```php
// Une seule ligne
public function row($statement, $attributes = array())
{
	$req = $this->getPDO()->prepare($statement);
	$req->execute($attributes);
	$data = $req->fetch(PDO::FETCH_ASSOC);

	return $data;
}
```

Avec `fetch`, on retourne une seule ligne sous la forme d'un tableau indexé par le nom de la colonne comme retourné dans le jeu de résultats. Dans notre cas pour la 1ère ligne de notre table.

```php
Array ( [id] => 1 [name] => Macon )
```

## Le modèle

Créez une nouveau fichier "Users.php" dans le dossier "models" dont la classe "Users" est héritée de la classe "Database".

```php
<?php // models/Users.php

require_once "./config/Database.php";

class Users extends Database
{
	private $table;
	private $db;

	public function __construct($table = "users")
	{
		$this->table = $table;
		$this->db = new Database();
	}

	// Ici la suite du code
}
```

On ajoute à la suite, les 4 requètes CRUD (Create Read Update Delete) génériques.

### Sélectionner tous les éléments

```php
// Sélectionner tous les éléments
public function findAll()
{
	return $this->db->query("SELECT id, name 
							 FROM $this->table");
}
```

On utilise "query" car ce n'est pas une requète spécifique.

### Sélectionner un élément par son id

```php
// Sélectionner un élément par son id
public function find($id = "")
{
	if ($id) {
		return $this->db->row("SELECT id, name 
							   FROM $this->table 
							   WHERE id = :id 
							   LIMIT 1",
							   array("id" => $id));
	}
}
```

On utilise "row" car on attend une seule ligne.

### Ajouter un élément

```php
// Ajouter un élément
public function add($name = "")
{
	if ($name) {
		return $this->db->prepare("INSERT INTO $this->table (name) 
								   VALUES (:name)",
								   array("name" => $name));
	}
}
```

On utilise "prepare" car on spécifie la valeur du champ "name".

### Modifier un élément

```php
// Modifier un élément
public function edit($name = "", $id = "")
{
	if ($name && $id) {
		return $this->db->prepare("UPDATE $this->table 
								   SET name = :name 
								   WHERE id = :id",
								   array("name" => $name, "id" => $id));
	}
}
```

On utilise "prepare" car on spécifie la valeur du champ "name" et de l'id.

### Supprimer un élément

```php
// Supprimer un élément
public function delete($id = "") {
	if ($id) {
		return $this->db->prepare("DELETE FROM $this->table 
								   WHERE id=:id",
								   array("id" => $id));
	}
}
```

On utilise "prepare" car on spécifie la valeur du champ "id".


## Tester

Depuis un fichier "index.php", on charge le fichier du modèle "Users" avec `require_once` pour pouvoir l'instancier dans une variable avec `new Nom_de_ma_classe()`.

```php
<?php
header('Content-Type: text/html; charset=UTF-8');

require_once "models/Users.php";
$users = new Users();
```

De cette façon, on peut exécuter nos requêtes écrites dans notre modèle "Users".

```php
<?php
header('Content-Type: text/html; charset=UTF-8');

require_once "models/Users.php";
$users = new Users();

print_r($users->findAll()); // Tous les utilisateurs
print_r($users->find(1));   // Un seul utilisateur, celui avec l'id 1
//print_r($users->add("toto"));	  // Ajoute l'utilisateur "toto" et affiche l'id correspondant à cette nouvelle entrée
//print_r($users->edit("aa", 1)); // Modifie l'utilisateur avec l'id 1 (et affiche 1 pour signaler une vraie modification)
//print_r($users->delete(1));	  // Supprime l'utilsateur avec l'id 1 (et affiche 1)
```

Pour afficher les "stdClass Object" proprement.

```php
<?php
header('Content-Type: text/html; charset=UTF-8');

require_once "models/Users.php";
$users = new Users();

$rows = $users->findAll();

if (!empty($rows)):
?>

<table>
	<tr>
		<th>Id</th>
		<th>Name</th>
	</tr>
	<?php foreach ($rows as $user): ?>
	<tr>
		<td><?= $user->id; ?></td>
		<td><?= $user->name; ?></td>
	</tr>
	<?php endforeach; ?>
</table>

<?php else: ?>
<p>Pas d'utilisateurs dans la BDD :(</p>
<?php endif; ?>
```

## Conclusion

En mettant en place une classe Database, on gagne du temps dans le développement et sur la lisibilité du code. En effet, on instancie seulement une fois la connexion à PDO puis on écrit les requêtes dans le modèle concerné.