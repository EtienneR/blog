---
title: "CodeIgniter Blog : le flux RSS"
date: 2014-02-05
tags: ["CodeIgniter"]
parts: 
  - title: 'CodeIgniter Blog : le front'
    href: 'code-igniter-blog-le-front'
  - title: 'CodeIgniter Blog : le back office'
    href: 'code-igniter-blog-le-back-office'
  - title: 'CodeIgniter Blog : le flux RSS'
---

Le flux RSS (Really Simple Syndication) permet à vos visiteurs de garder le contact avec votre blog.  
Vous pouvez aussi diffuser votre flux RSS de syndication sur des services Web comme Facebook, Linkedin, etc...

## Objectif

Afficher le flux RSS des 10 derniers articles, à l'adresse suivante : [http://mon-blog.com/feed](http://mon-blog.com/feed)

- 1 contrôleur
- 1 modèle
- 1 vue
- modification du fichier routes.php

## Le contrôleur "Feed"

Dans le dossier `application/controllers/front`, créez un nouveau contrôleur "feed.php".

```php
<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Feed extends CI_Controller{

    function __construct()
    {
        parent::__construct();
        // Chargement des ressources pour ce controller
        $this->load->database();
        $this->load->model('front/model_feed');
        $this->load->helper(array('url', 'xml'));
    }

    public function index()
    {
        $data['site_name']        = 'Mon blog';
        $data['site_link']        = base_url();
        $data['site_description'] = 'Les flux RSS de mes articles';
        $data['encoding']         = 'utf-8';
        $data['feed_url']         = base_url() . '/feed';
        $data['page_language']    = 'fr-fr';
        $data['posts']            = $this->model_feed->getRecentPosts();
        header("Content-Type: application/rss+xml");

        $this->load->view('front/view_feed', $data);
    }

}

/* End of file feed.php */
/* Location: ./application/controllers/front/feed.php */
```

On met en place les variables que l'on placera dans le header du flux RSS :

- le nom du site
- l'encodage
- l'url du flux rss
- la description du flux

Puis on récupère les données dans le modèle et on précise le content type du header (ou MIME) avec pour type "application" et en sous type "rss+xml".

## Le modèle "Model_feed"

Dans le dossier `application/models/front`, créez un nouveau modèle "model_feed.php".

```php
<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Model_feed extends CI_Model{

    function getRecentPosts()
    {
        $this->db->select('c_title, c_content, c_cdate, c_url_rw, r_title, r_description, r_url_rw')
                 ->from('content')
                 ->join('rubric', 'rubric.r_id = content.r_id')
                 ->order_by('c_id', 'DESC')
                 ->limit(10);

        $query = $this->db->get();
        return $query;
    }

}


/* End of file model_feed.php */
/* Location: ./application/models/front/model_feed.php */
```

## La vue "view_feed"

Dans le dossier `application/views/front` créez un nouvelle vue "view_rss.php".

```php
<?php echo '<?xml version="1.0" encoding="' . $encoding . '"?>' . ""; ?>
<rss version="2.0"
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
   xmlns:admin="http://webns.net/mvcb/"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:content="http://purl.org/rss/1.0/modules/content/">

    <channel>

        <description><?php echo $site_description; ?></description>
        <link><?php echo $site_link; ?></link>
        <title><?php echo $site_name; ?></title>
        <dc:language><?php echo $page_language; ?></dc:language>
        <dc:rights>Copyright <?php echo gmdate("Y", time()); ?></dc:rights>

        <?php foreach($posts->result() as $post): ?>
        <item>
            <title><?php echo xml_convert($post->c_title); ?></title>
            <link><?php echo base_url($post->r_url_rw . '/' . $post->c_url_rw); ?></link>
            <guid><?php echo base_url($post->r_url_rw . '/' . $post->c_url_rw); ?></guid>
            <?php $post->c_content = strip_tags($post->c_content); ?>
            <description>
                <?php echo $post->c_content; ?>
            </description>
            <?php $date = strtotime($post->c_cdate); // Conversion date to timestamp ?>
            <pubDate><?php echo date('r', $date);?></pubDate>
        </item>
        <?php endforeach; ?>

    </channel>

</rss>
```

On se base sur la version RSS 2 qui est au format XML.

Si vous souhaitez afficher uniquement les 256 premiers caractères de l'article, remplacez la ligne suivante :

```php
<description>
    <?php echo $post->c_content; ?>
</description>
```

Par le code ci-dessous :

```php
<description>
    <?php echo character_limiter($post->c_content, 256); ?>
</description>
```

Il faudra alors appeler le helper "text" dans le constructeur du contrôleur "Feed" dans le contrôleur pour que la fonction "character_limiter" fonctionne.

## Routage

Dans le fichier de routage (`application/config/routes.php`) ajoutez après la route du "default_controller" :

```php
# RSS
$route['feed'] = 'front/feed';
```
