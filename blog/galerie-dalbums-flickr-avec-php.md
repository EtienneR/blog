---
title: Galerie d'albums Flickr avec PHP
date: 2012-09-06
tags: ['PHP', 'jQuery']
---

Dans un précédent billet, je vous expliquais comment se servir de l'API Flickr avec Jquery & JSON. Avec PHP, vous pouvez faire un système de galerie d'album. Cela consiste à afficher le titre et la vignette de chaque album sur une page. De là, il est possible sur la vignette pour afficher toutes les images de l'album. Vous aurez besoin d'une clef d'API générée à la demande par Flickr via votre compte.

## galerie.php

Dans un 1er temps, on stocke dans un tableau les données servant à se connecter à l'API Flickr qui sont :

* `api key` : fournie par Flickr
* `user_id` : vous le récupéré sur ce site [http://idgettr.com](http://idgettr.com)
* `method` : `flickr.photosets.getList` permet de récupérer la liste des photoset d'un utlisateur, c'est-à-dire la liste des albums
* `format` : `php_serial` correspond au format PHP

```php
<?php
$params = array(
'api_key' => 'api_key_donnée_par_flickr',
'user_id' => 'votre_user_id',
'method'  => 'flickr.photosets.getList',
'format'  => 'php_serial'
);
?>
```

Puis, dans un second temps, la suite du code avec vérification de la connexion à l'API :

```php
<?php
$encoded_params = array();

foreach ($params as $k => $v){
    $encoded_params[] = urlencode($k).'='.urlencode($v);
}


#
# appeler l'API et décoder la réponse
#

$url = "http://api.flickr.com/services/rest/?".implode('&amp;', $encoded_params);

$rsp = file_get_contents($url);

$rsp_obj = unserialize($rsp);


if ($rsp_obj['stat'] == 'ok') {
echo '<ul>';
    foreach ($rsp_obj['photosets']['photoset'] as $photo) {  // Début de la boucle
        $id      = $photo['id'];                // ID du photoset
        $primary = $photo['primary'];           // première photo
        $secret  = $photo['secret'];            // identifiant secret de la photo
        $server  = $photo['server'];            // ID du serveur
        $farm    = $photo['farm'];              // Numéro du sous domaine
        $title   = $photo['title']['_content']; // Titre de l'album
        $nb      = $photo['photos'];            // Nombre de photos
    ?>

    <li>
    <a href="album.php?id=<?php echo $id; ?>">
        <img src="http://farm<?php echo $farm; ?>.static.flickr.com/<?php echo $server; ?>/<?php echo $primary ?>_<?php echo $secret; ?>_q.jpg" alt="<?php echo $title; ?>" />
        <h5><?php echo $title; ?></h5>
        <?php echo $nb; ?> photos
    </a>
    </li>

    <?php
    }  // Fin de la boucle FOREACH
        echo '</ul>';
    }
    else {
        echo "Echec de l'appel !";
    }
?>
```

## album.php

Dans le header du fichier (1ère ligne), on récupère la valeur de l'id de l'album qui n'est autre que le photoset de l'album (méthode permettant de récupérer les informations d'un album) :

```php
<?php $id = $_GET['id']; ?>
```

Pour l'authentification de l'album, le principe est le même excepté que `method` devient `flickr.photosets.getPhotos` et le `user_id` est remplacé par `photoset_id` :

```php
<?php
#
# créer l'URL API à appeler
#

$params = array(
    'api_key'       => 'c632b4c956418475df8a75d42ce24ed1', // A remplacer par votre clef
    'method'        => 'flickr.photosets.getPhotos',
    'photoset_id'   => $id,
    'format'        => 'php_serial'
);


$encoded_params = array();

foreach ($params as $k => $v) {
    $encoded_params[] = urlencode($k).'='.urlencode($v);
}


#
# appeler l'API et décoder la réponse
#

$url = "http://api.flickr.com/services/rest/?".implode('&amp;', $encoded_params);

$rsp = file_get_contents($url);

$rsp_obj = unserialize($rsp);

if ($rsp_obj['stat'] == 'ok') {
    echo '<ul>';
    foreach ($rsp_obj['photoset']['photo'] as $photo) { // Début de la boucle
        $id      = $photo['id'];     // ID photo
        $secret  = $photo['secret']; // Identifiant secret de la photo
        $server  = $photo['server']; // ID du serveur
        $farm    = $photo['farm'];   // Numéro du sous domaine
        $title   = $photo['title'];  // Titre de la photo
?>
<li>
    <a href="http://farm<?php echo $farm; ?>.static.flickr.com/<?php echo $server; ?>/<?php echo $id; ?>_<?php echo $secret; ?>_b.jpg">
        <img src="http://farm<?php echo $farm; ?>.static.flickr.com/<?php echo $server; ?>/<?php echo $id; ?>_<?php echo $secret; ?>_s.jpg" alt="<?php echo $titre; ?>">
        <h5><?php echo $title; ?></h5>
    </a>
</li>
<?php
    }   // Fin de la boucle FOREACH
    echo '</ul>';
}
else {
    echo "échec de l'appel !";
}
?>
```

## Sources

* Documentation API Flickr : [http://www.flickr.com/services/api](http://www.flickr.com/services/api)
* Format de réponse PHP en série : [http://www.flickr.com/services/api/response.php.html](http://www.flickr.com/services/api/response.php.html)
