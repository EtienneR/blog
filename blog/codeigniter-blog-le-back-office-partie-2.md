---
title: "CodeIgniter Blog : le back office"
date: 2014-01-20
tags: ["CodeIgniter"]
parts: 
  - title: 'CodeIgniter Blog : le front'
    href: 'code-igniter-blog-le-front'
  - title: 'CodeIgniter Blog : le back office'
  - title: 'CodeIgniter Blog : le flux RSS'
    href: 'code-igniter-blog-le-flux-rss'
---

Après, s'être attaqué à la partie "front" du blog, la partie "back office" s'annonce plus longue mais semée de curiosités. En effet, il faudra dans un premier temps créer un système d'identification simple puis dans un second temps, mettre en place un système de CRUD (Create Read Update Delete) pour les articles et les rubriques dans le dashboard.

## Objectif

Faire la partie back office d'un blog via une interface de connexion : [http://mon-blog.com/admin](http://mon-blog.com/admin) avec :

- 2 contrôleurs
- 2 modèles
- 6 vues
- 1 helper (cf : le front)
- Modification du fichier routes.php
- 1 table de données (MySQL) (cf : le front)

## Préparation

Créez 3 dossiers "admin" dans les répertoires ci-dessous :

- `application/controllers`
- `application/models`
- `application/views`

Dans le helper (`application/helpers`) functions.php, à la suite de la fonction `css_url()`, on va ajoutez la fonction `js_url()` nous aurons besoin d'appeler du javascript :

```php
if ( ! function_exists('js_url'))
{
   function js_url($nom)
   {
       return '<script src="' . base_url() . 'assets/js/' . $nom . '.js"></script>
';
   }
}
```

Allez dans le répertoire `assets` créez un nouveau dossier "js" et déposez les fichiers jquery.min.js ([http://jquery.com/download](http://jquery.com/download)) et bootstrap.min.js.
Au niveau de la base de données, rajoutez une table "user" avec la structure et les données suivante :

```sql
CREATE TABLE IF NOT EXISTS `user` (
 `u_id` int(11) NOT NULL AUTO_INCREMENT,
 `u_login` varchar(255) NOT NULL,
 `u_pass` varchar(255) NOT NULL,
 PRIMARY KEY (`u_id`)
);

INSERT INTO `user` (`u_id`, `u_login`, `u_pass`) VALUES
(1, 'admin', '1a1dc91c907325c69271ddf0c944bc72 ');
```

Ci-dessus, le mot de passe en MD5 est "pass".  
Encore une fois, il s'agit pour les besoins du tutoriel, d'un système d'utilisateur basique (sans niveau d'accréditation, sans table de log&hellip;)

## La connexion

Avant de démarrer dans l'authentification sur CodeIgniter, il faut mettre une clef de chiffrement dans le fichier de configuration (application/config/config.php) afin que les sessions puissent fonctionner correctement (à défaut d'avoir le message suivant :
`In order to use the Session class you are required to set an encryption key in your config file.`).  
A la ligne 227 :

```php
$config['encryption_key'] = '';
```

Copiez coller votre clef de chiffrement (ou bien collez en une générée sur ce site : [http://jeffreybarke.net/tools/codeigniter-encryption-key-generator](http://jeffreybarke.net/tools/codeigniter-encryption-key-generator)).  
Concrètement, on veut, dans un 1er temps diriger l'utilisateur sur le formulaire d'authentification comprenant 2 champs : "login" et "password".  
Si le login et le mot de passe correspondent (via une fonction callback) alors on laisse l'utilisateur accéder à son dashboard et de ce fait, sa session est ouverte, sinon on l'invite à réessayer.  
On met aussi une fonction logout qui détruira la session lorsque l'utilisateur voudra se déconnecter du dashboard.  
L'url vers le formulaire (après configuration des routes) sera : [http://localhost/blog/admin](http://localhost/blog/admin).

### Contrôleur "Admin"

Dans le dossier `application/controllers/admin`, créez un contrôleur que vous nommez "admin.php".

```php
<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Admin extends CI_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->database();
        $this->load->model('admin/model_user');
        $this->load->library(array('encrypt','session'));
        $this->load->helper(array('functions', 'url'));

        session_start();
    }

    function index()
    {
        if(!$this->session->userdata('logged_in')):
            $this->load->library('form_validation');

            // Mise en place du formulaire
            $this->form_validation->set_rules('username', 'Username', 'trim|required|xss_clean');
            $this->form_validation->set_rules('password', 'Password', 'trim|required|xss_clean|callback_check_database');

            // Si le formulaira n'est pas bon
            if($this->form_validation->run() == FALSE):
                $data['title'] = 'Connexion';
                $this->load->view('admin/view_form_login', $data);
            else:
                $this->session->set_flashdata('success', 'Bienvenue sur votre dashboard.');
                // Redirection vers le dashboard
                redirect(base_url('admin/dashboard'));

            endif;

        elseif($this->session->userdata('logged_in')):
            redirect(base_url('admin/dashboard'));
            echo 'ok';

        endif;
    }

    // Vérification login / mot de passe dans la BDD
    function check_database($password)
    {

        $login = $this->input->post('username');
        $query = $this->model_user->login($login, $password);

        if($query):
            $sess_array = array();
            foreach($query as $row):
                $sess_array = array(
                    'id'    => $row->u_id,
                    'login' => $row->u_login
                );
                $u_id = $row->u_id;
                // Création de la session
                $this->session->set_userdata('logged_in', $sess_array);
            endforeach;
            return TRUE;

        else:
            $this->form_validation->set_message('check_database', 'Login ou mot de passe incorrect');
            return FALSE;

        endif;
    }

    // Déconnexion du dashboard
    public function logout()
    {
        $this->session->unset_userdata('logged_in');
        $this->session->set_flashdata('success', 'Vous êtes désormais déconnecté(e).');
        session_destroy();
        redirect(base_url('admin'), 'refresh');
    }

}


/* End of file admin.php */
/* Location: ./application/controllers/admin/admin.php */
```

Attention : dans ce contrôleur, nous utilisons le helper "functions" (`application/helpers/functions_helper.php`) créé dans le précédent tuto.

### Modèle "Model_user"

Dans le dossier `application/models/admin`, créez un modèle que vous nommez "model_user.php".  
Nous n'utiliserons qu'une seule fonction afin de déterminer si le login et le mot de passe correspondent aux champs rentrés par l'utilisateur.

```php
<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Model_user extends CI_Model {

    function login($login, $password)
    {
        $this->db->select('*')
                 ->from('user')
                 ->where('u_login', $login)
                 ->where('u_pass', MD5($password))
                 ->limit(1);
        $query = $this->db->get();

        if($query->num_rows() == 1):
            return $query->result();
        else:
            return false;
        endif;
    }

}


/* End of file model_user.php */
/* Location: ./application/models/admin/model_user.php */
```

### Vue view_form_login

Dans le dossier `application/views/admin`, créez une vue que vous nommez "view_form_login.php".

```html
<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <title><?php echo $title; ?></title>
        <meta name="description" content="<?php echo $title; ?>" />
        <?php echo css_url('bootstrap.min'); ?>
    </head>
    <body>

        <div class="container">
            <div class="row">

                <div class="col-md-7 col-md-offset-2 panel panel-default">

                    <?php if($this->session->flashdata('success')): ?>
                    <div class="alert alert-success">
                        <?php echo $this->session->flashdata('success'); ?> <a class="close" data-dismiss="alert" href="#">&times;</a>
                    </div>
                    <?php endif; ?>

                    <?php if(validation_errors()): ?>
                    <?php echo validation_errors('<div class="alert alert-danger">', ' <a class="close" data-dismiss="alert" href="#">&times;</a></div>'); ?>
                    <?php endif; ?>

                    <h1 class="text-center"><?php echo $title; ?></h1>


                    <?php echo form_open(base_url('admin')); ?>
                        <div class="input-prepend">
                            <label class="col-sm-1 control-label" for="username">
                                <i class="glyphicon glyphicon-user" style="font-size: 43px;"></i>
                            </label>
                            <div class="col-sm-11">
                                <input type="text" class="form-control input-lg" placeholder="Username" name="username" id="username" required />
                            </div>
                            <br/>
                            <br/>
                            <br/>
                            <label class="col-sm-1 control-label" for="password">
                                <i class="glyphicon glyphicon-lock" style="font-size: 43px;"></i>
                            </label>
                            <div class="col-sm-11">
                                <input type="password" class="form-control input-lg" placeholder="Password" name="password" id="password" required />
                            </div>
                            <br/>
                            <br/>
                            <br/>
                            <div class="row">
                                <div class="col-md-4 col-md-offset-10">
                                    <input type="submit" value="Login" class="col-md-4 btn btn-lg btn-primary" />
                                </div>
                            </div>
                            <br/>
                        </div>
                    </form>

                </div><!-- end .main content -->
            </div><!-- end .row -->
        </div><!-- end .container -->

    <?php
        echo js_url('jquery.min');
        echo js_url('bootstrap.min');
    ?>

    </body>

</html>
```

## Le Dashboard

Le dashboard va permettre de gérer le contenu présent sur le blog, c'est-à-dire les articles et les rubriques. Ainsi, dans le dashboard on aura la liste des articles, des rubriques, l'ajout, la modification ou la suppression du contenu.

### Contrôleur "Dashboard"

Dans le dossier `application/controllers/admin`, créez un contrôleur que vous nommez "dashboard.php".

```php
<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Dashboard extends CI_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->database();
        $this->load->model('admin/model_admin');
        $this->load->library(array('form_validation', 'session'));
        $this->load->helper(array('functions', 'text', 'url'));
        define('URL_LAYOUT'      , 'admin/view_dashboard');
        define('URL_HOME_CONTENT', 'admin/dashboard');
        define('URL_HOME_RUBRIC' , 'admin/dashboard/rubric');
        session_start();
    }

    // Obtenir le login
    private function get_login()
    {
        $data = $this->session->userdata('logged_in');

        return $data['login'];
    }

    // Obtenir la redirection
    private function get_redirect()
    {
        $data = $this->session->set_flashdata('alert', 'Cette page est protégée par un mot de passe.').redirect(base_url('admin'));

        return $data;
    }
```

Attention : dans ce contrôleur, nous utilisons le helper "functions" (`application/helpers/functions_helper.php`) créé dans le précédent tuto.

#### Afficher tous les articles (page d'accueil)

```php
// Afficher tous les articles
function index()
{
    if ($this->session->userdata('logged_in')):
        // Pour afficher le login
        $data['login'] = $this->get_login();

        $data['page']  = 'home';
        $data['title'] = 'Ma dashboard';
        $data['query'] = $this->model_admin->read_content();

        $this->load->view(URL_LAYOUT, $data);

    else:
        $this->get_redirect();
    endif;
}
```

#### Ajouter / modifier un article

```php
// Ajouter ou éditer un article
function edit($c_id = '')
{
    if ($this->session->userdata('logged_in')):

        // Pour afficher le login
        $data['login'] = $this->get_login();

        // Chargement des rubriques
        $data['rubrics'] = $this->model_admin->read_rubric();

        // Mise en place du formulaire
        $this->form_validation->set_rules('c_title', 'Titre', 'trim|required');
        $this->form_validation->set_rules('c_content', 'Contenu', 'trim|required');
        $this->form_validation->set_rules('rubric', 'Rubrique', 'required');

        // Assignations du formulaire
        $c_title   = $this->input->post('c_title');
        $c_content = $this->input->post('c_content');
        $r_id      = $this->input->post('rubric');

        // On vérifie si c'est pour ajouter ou modifier via l'URI
        if ($this->uri->total_segments() == 3):
            $data['page']  = 'add_content';
            $data['title'] = 'Ajouter un article';

            // Réécriture du titre pour la future URL de l'article
            $c_url_rw = url_title(convert_accented_characters($c_title), '-', TRUE);

            if ($this->form_validation->run() !== FALSE):
                $this->model_admin->create_content($r_id, $c_title, $c_content, $c_url_rw);
                $this->session->set_flashdata('success', 'Article "' . $c_title . '" ajouté.');
                redirect(URL_HOME_CONTENT);
            endif;

        else:
            $data['page']      = 'edit_content';
            $row               = $this->model_admin->get_content($c_id)->row();
            $data['r_id']      = $row->r_id;
            $data['c_title']   = $row->c_title;
            $data['c_content'] = $row->c_content;
            $data['title']     = 'Modifer la rubrique ' . $data['c_title'];

            if ($this->form_validation->run() !== FALSE):
                $this->model_admin->update_content($r_id, $c_title, $c_content, $c_id);
                $this->session->set_flashdata('success', 'Article "' . $c_title . '" modifié.');
                redirect(URL_HOME_CONTENT);
            endif;

        endif;

        $this->load->view(URL_LAYOUT, $data);

    else:
        $this->get_redirect();
    endif;
}
```

#### Supprimer un article

```php
// Supprimer un article
function delete($id = '')
{
    if ($this->session->userdata('logged_in')):

        // Si l'utilisateur existe, on peut le supprimer
        if ($this->model_admin->get_content($id)->num_rows() == 1):
            $this->model_admin->delete_content($id);
            $this->session->set_flashdata('success', 'L\'article a bien été supprimé');
            redirect(base_url('admin'));

        // Sinon on affiche le message ci-dessous :
        else:
            $this->session->set_flashdata('alert', 'Cette article n\'existe pour ou n\'a jamais existé');
            redirect(base_url(URL_HOME_CONTENT));
        endif;

    else:
        $this->get_redirect();
    endif;
}
```

#### Afficher toutes les catégories

```php
// Afficher toutes les rubriques
function rubric()
{
    if ($this->session->userdata('logged_in')):

        // Pour afficher le login
        $data['login'] = $this->get_login();

        $data['page']  = 'rubric';
        $data['title'] = 'Rubriques';

        $data['query'] = $this->model_admin->read_rubric();

        $this->load->view(URL_LAYOUT, $data);

    else:
        $this->get_redirect();
    endif;
}
```

#### Ajouter / modifier une catégorie

```php
// Ajouter ou modifier une rubrique
function edit_rubric($r_id = '')
{
    if ($this->session->userdata('logged_in')):

        // Pour afficher le login
        $data['login'] = $this->get_login();

        // Mise en place du formulaire via form-validation
        $this->form_validation->set_rules('r_title', 'Titre', 'trim|required');
        $this->form_validation->set_rules('r_description', 'Description', 'trim|required');

        // Assignations du formulaire
        $r_title       = $this->input->post('r_title');
        $r_description = $this->input->post('r_description');

        // On vérifie si c'est pour ajouter ou modifier via l'URI
        if ($this->uri->total_segments() == 3):
            $data['page']  = 'add_rubric';
            $data['title'] = 'Ajouter une rubrique';

            // Réécriture du titre pour la future URL de la rubrique
            $r_url_rw = url_title(convert_accented_characters($r_title), '-', TRUE);

            if ($this->form_validation->run() !== FALSE):
                $this->model_admin->create_rubric($r_title, $r_description, $r_url_rw);
                $this->session->set_flashdata('success', 'Rubrique "' . $r_title . '" ajoutée');
                redirect(base_url(URL_HOME_RUBRIC));
            endif;

        else:
            $data['page']          = 'edit_rubric';
            $row                   = $this->model_admin->get_rubric($r_id)->row();
            $data['r_title']       = $row->r_title;
            $data['r_description'] = $row->r_description;
            $data['title']         = 'Mofidifer la rubrique ' . $data['r_title'];

            if($this->form_validation->run() !== FALSE):
                $this->model_admin->update_rubric($r_title, $r_description, $r_id);
                $this->session->set_flashdata('success', 'Catégorie "' . $r_title . '" modifiée.');
                redirect(base_url(URL_HOME_RUBRIC));
            endif;

        endif;

        $this->load->view(URL_LAYOUT, $data);

    else:
        $this->get_redirect();
    endif;
}
```

#### Supprimer une catégorie

```php
// Supprimer une catégorie
function delete_rubric($r_id)
{
    if ($this->session->userdata('logged_in')):

        // On vérifie si la rubrique existe toujours
        if ($this->model_admin->get_rubric($r_id)->num_rows() == 1):

            // On vérifie si il y a des articles rattachés à cette rubrique
            if ($this->model_admin->get_content_by_rubric($r_id)->num_rows() == 0):
                $this->model_admin->delete_rubric($r_id);
                $this->session->set_flashdata('success', 'Rubrique supprimée.');
            else:
                $this->session->set_flashdata('alert', 'Impossible de supprimer cette rubrique car il y a un ou plusieurs article(s) rattaché(s).');
            endif;

        else:
            $this->session->set_flashdata('alert', 'Cette rubrique n'existe pas ou n'a jamais existé.');
        endif;

        redirect(base_url(URL_HOME_RUBRIC));

    else:
        $this->get_redirect();
    endif;
}
```

Et on ferme le contrôleur :

```php
}


/* End of file dashboard.php */
/* Location: ./application/controllers/admin/dashboard.php */
```

### Modèle Model_admin

Dans le dossier `application/models/admin`, créez un modèle "model_admin.php".

```php
<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Model_admin extends CI_Model {
```

#### Requêtes pour les articles CREATE

##### Create : Créer un article

```php
// Create : Créer un article
function create_content($r_id, $c_title, $c_content, $c_url_rw)
{
    $date = new DateTime(null, new DateTimeZone('Europe/Paris'));
    $data = array(
        'r_id'      => $r_id,
        'c_title'   => $c_title,
        'c_content' => $c_content,
        'c_cdate'   => $date->format('Y-m-d H:i:s'),
        'c_udate'   => $date->format('Y-m-d H:i:s'),
        'c_url_rw'  => $c_url_rw,
    );

    $this->db->insert('content', $data);
}
```

##### Read : Lire tous les articles

```php
// Read : Lire tous les articles
function read_content()
{
    $this->db->select('c_id, c_title, c_content, c_cdate, c_udate, c_url_rw, r_title, r_url_rw')
            ->from('content')
            ->join('rubric', 'rubric.r_id = content.r_id')
            ->order_by('c_id', 'DESC');

    $query = $this->db->get();
    return $query;
}
```

##### Lire un article en particulier

```php
// Lire un article en particulier :
function get_content($id)
{
    $this->db->select('c_id, content.r_id, c_title, c_content')
            ->from('content')
            ->join('rubric', 'content.r_id = rubric.r_id')
            ->where('c_id', $id)
            ->limit(1);

    $query = $this->db->get();
    return $query;
}
```

##### Le contenu dans une rubrique spécifique

```php
// Le contenu dans une rubrique spécifique :
function get_content_by_rubric($id)
{
    $this->db->select('c_id')
            ->from('content')
            ->join('rubric', 'content.r_id = rubric.r_id')
            ->where('rubric.r_id', $id);

    $query = $this->db->get();
    return $query;
}
```

##### Update : mettre à jour un article

```php
// Update : mettre à jour un article
function update_content($r_id, $c_title, $c_content, $c_id)
{
    $date = new DateTime(null, new DateTimeZone('Europe/Paris'));
    $data = array(
        'r_id'      => $r_id,
        'c_title'   => $c_title,
        'c_content' => $c_content,
        'c_udate'   => $date->format('Y-m-d H:i:s'),
    );

    $this->db->where('c_id', $c_id);
    $this->db->update('content', $data);
}
```

##### Delete : supprimer un article

```php
// Delete : supprimer un article :
function delete_content($id)
{
    $this->db->where('c_id', $id)
            ->delete('content');
}
```

#### Requêtes pour les catégories

##### Create : créer une rubrique

```php
// Create : créer une rubrique
function create_rubric($r_title, $r_description, $r_url_rw)
{
    $data = array(
        'r_title'       => $r_title,
        'r_description' => $r_description,
        'r_url_rw'      => $r_url_rw
    );

    $this->db->insert('rubric', $data);
}
```

##### Read : Lire toutes les rubriques

```php
// Read : Lire toutes les rubriques
function read_rubric()
{
    $this->db->select('r_id, r_title, r_description')
            ->from('rubric')
            ->order_by('r_id', 'DESC');

    $query = $this->db->get();
    return $query;
}
```

##### Lire une rubrique en particulier

```php
// Lire une rubrique en particulier
function get_rubric($id)
{
    $this->db->select('r_title, r_description')
            ->from('rubric')
            ->where('r_id', $id)
            ->limit(1);

    $query = $this->db->get();
    return $query;
}
```

##### Update : mettre à jour une rubrique

```php
// Update : mettre à jour une rubrique
function update_rubric($r_title, $r_description, $r_id)
{
    $data = array(
        'r_title'       => $r_title,
        'r_description' => $r_description
    );

    $this->db->where('r_id', $r_id);
    $this->db->update('rubric', $data);
}
```

##### Delete : supprimer une rubrique

```php
// Delete :  supprimer une rubrique
function delete_rubric($id)
{
    $this->db->where('r_id', $id)
             ->delete('rubric');
}
```

#### Et on ferme le modèle

```php
}

/* End of file model_admin.php */
/* Location: ./application/models/admin/model_admin.php */
```

### Vues

#### Mise en place d'un layout

Dans le dossier `application/views/admin`.

- "view_dashboard.php" : contiendra le header et le footer

Créez un dossier et nommez-le "dashboard", puis créez les 5 fichiers suivant :

- "view_admin_article_home.php" : affichera tous les articles
- "view_admin_article_edit.php" : affichera l'édition d'un article (insertion / modification)
- "view_admin_categorie_home.php" : affichera toutes les rubriques
- "view_admin_categorie_edit.php" : affichera l'édition d'une rubrique (insertion / modification)

#### "view_dashboard.php"

```html
<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <title><?php echo $title; ?></title>
        <meta name="description" content="<?php echo $title ; ?>" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <?php echo css_url('bootstrap.min'); ?>
    </head>

    <body class="container">


        <nav class="navbar navbar-default" role="navigation">

            <div class="navbar-header">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button><!-- end .navbar-toggle -->
                <a class="navbar-brand" href="<?php echo base_url('admin/dashboard'); ?>">Dashboard</a>
            </div><!-- end .navbar-header -->

            <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul class="nav navbar-nav">
                    <li <?php if ($page == 'home' or $page == 'add_content' or $page == 'edit_content'){ echo "class='active'"; }; ?>>
                        <a href="<?php echo base_url('admin/dashboard'); ?>">
                            Articles
                        </a>
                    </li>
                    <li <?php if ($page == 'rubric' or $page == 'add_rubric' or $page == 'edit_rubric'){ echo "class='active'"; }; ?>>
                        <a href="<?php echo base_url('admin/dashboard/rubric'); ?>">
                            Rubriques
                        </a>
                    </li>
                <!-- end .nav navbar-nav -->
                <ul class="nav navbar-nav navbar-right">
                    <li>
                        <a href="<?php echo base_url(); ?>" target="_blank">Le blog</a>
                    </li>
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown"><?php echo $login; ?> <b class="caret"></b></a>
                        <ul class="dropdown-menu">
                            <li>
                                <a href="<?php echo base_url('admin/logout'); ?>">
                                    Se déconnecter
                                </a>
                            </li>
                        <!-- end .dropdown-menu-->
                    <!-- end .dropdown -->
                <!-- end .nav .navbar-nav .navbar-right -->
            </div><!-- end .collapse .navbar-collapse #bs-example-navbar-collapse-1 -->

        </nav><!-- end .navbar .navbar-default -->

    <?php if ($this->session->flashdata('success')): ?>
        <div class="alert alert-success">
            <?php echo $this->session->flashdata('success'); ?> <a class="close" data-dismiss="alert" href="#">&times;</a>
        </div>
    <?php endif; ?>

    <?php if ($this->session->flashdata('alert')): ?>
        <div class="alert alert-danger">
            <?php echo $this->session->flashdata('alert'); ?> <a class="close" data-dismiss="alert" href="#">&times;</a>
        </div>
    <?php endif; ?>


    <div class="row">

        <div class="col-md-2">
            <ul class="nav nav-pills nav-stacked">
                <li>
                    <button onClick="window.location.href='<?php echo base_url('admin/dashboard/edit'); ?>'" class="btn btn-danger">
                        <i class="glyphicon glyphicon-plus"></i> Ajouter un article
                    </button>
                </li>
                <li>
                    <button onClick="window.location.href='<?php echo base_url('admin/dashboard/edit_rubric'); ?>'" class="btn btn-primary">
                        <i class="glyphicon glyphicon-plus"></i> Ajouter une rubrique
                    </button>
                </li>
            <!-- end of .col-md-2 .nav-stacked -->
        </div><!-- end of .col-md-2 -->

        <div class="col-md-10">
        <?php switch ($page) {
            case 'home':
                $this->load->view('admin/dashboard/view_listing_content');
                break;

            case 'add_content':
            case 'edit_content':
                $this->load->view('admin/dashboard/view_edit_content');
                break;

            case 'rubric':
                $this->load->view('admin/dashboard/view_listing_rubric');
                break;

            case 'add_rubric':
            case 'edit_rubric':
                $this->load->view('admin/dashboard/view_edit_rubric');
                break;

            default:

                break;
        }
        ?>
        </div><!-- end .col-md-10 -->

    </div><!-- end .row -->

    <footer>
        <footer data-role="footer">
            <p class="footer" style="text-align: center">Propulsé par CodeIgniter - Temps d'exécution : <strong>0.0610</strong> seconds
        </footer>
    </footer>

    <?php
        echo js_url('jquery.min');
        echo js_url('bootstrap.min');
    ?>

    </body>

</html>
```

#### "view_listing_content.php"

```html
<?php if($query->num_rows() > 0): ?>
<div class="table-responsive">
  <table class="table table-hover">
    <tr>
      <th>ID</th>
      <th>Titre</th>
      <th>Description</th>
      <th>Rubrique</th>
      <th>Date</th>
      <th>MAJ</th>
      <th></th>
      <th></th>
    </tr>
    <?php foreach($query->result() as $row): ?>
    <tr>
      <td><?php echo $row->c_id; ?></td>
      <td><?php echo $row->c_title; ?></td>
      <td><?php echo character_limiter($row->c_content, 64); ?></td>
      <td><?php echo $row->r_title; ?></td>
      <td><?php echo date("d/m/Y à H:i:s", strtotime($row->c_cdate)); ?></td>
      <td><?php echo date("d/m/Y à H:i:s", strtotime($row->c_udate)); ?></td>
      <td>
        <a
          href="<?php echo base_url('admin/dashboard/edit/' . $row->c_id); ?>"
          title="Modifier"
          ><i class="glyphicon glyphicon-pencil"></i
        ></a>
      </td>
      <td>
        <a
          href="<?php echo base_url('admin/dashboard/delete/' . $row->c_id); ?>"
          onclick="return deleteConfirm()"
          title="Supprimer"
          ><i class="glyphicon glyphicon-trash"></i
        ></a>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>

  <!-- end .table .table-hover -->
</div>
<!-- end .table-responsive -->

<script>
  function deleteConfirm() {
    var a = confirm("Etes-vous sur de vouloir supprimer cet article ?!");
    if (a) {
      return true;
    } else {
      return false;
    }
  }
</script>

<?php endif; ?>
```

#### "view_edit_content.php"

```html
<?php
    if (validation_errors()):
        echo validation_errors('<div class="alert alert-danger">', ' <a class="close" data-dismiss="alert" href="#">&times;</a></div>');
    endif;
    echo form_open(current_url()); // $config['index_page'] = ''; dans config/config.php
?>

    <div class="form-group">
        <label for="c_title">Titre de l'article:</label>
        <input type="text" class="form-control" id="c_title" name="c_title" value="<?php if(isset($c_title)): echo $c_title; else: echo set_value('c_title'); endif; ?>" required />
    </div><!-- end .form-group -->

    <div class="form-group">
        <label for="c_content">Contenu de l'article :</label>
        <textarea id="c_content" class="form-control" name="c_content" required><?php if(isset($c_content)): echo $c_content; else: echo set_value('c_content'); endif; ?></textarea>
    </div><!-- end .form-group -->

    Rubriques :
    <?php foreach ($rubrics->result() as $row): ?>
    <div class="radio">
        <label>
            <input type="radio" name="rubric" id="<?php echo $row->r_title ;?>" value="<?php echo $row->r_id ;?>" <?php if( $page == 'edit_content' and isset($rubrics) and $row->r_id == $r_id or set_value('rubrique') == $row->r_id ){ echo 'checked="checked"'; } ?> required />
            <?php echo $row->r_title; ?>
        </label>
    </div><!-- end .radio -->
    <?php endforeach; ?>

    <input type="submit" class="btn btn-default" value="<?php if ($page == 'add_content'){ echo 'Ajouter';} else{ echo 'Modifier'; }; ?>" />

</form>
```

#### "view_listing_rubric.php"

```html
<?php if($query->num_rows() > 0): ?>
<div class="table-responsive">
  <table class="table table-hover">
    <tr>
      <th>ID</th>
      <th>Titre</th>
      <th>Description</th>
      <th></th>
      <th></th>
    </tr>
    <?php foreach($query->result() as $row): ?>
    <tr>
      <td><?php echo $row->r_id; ?></td>
      <td><?php echo $row->r_title; ?></td>
      <td><?php echo character_limiter($row->r_description, 64); ?></td>
      <td>
        <a
          href="<?php echo base_url('admin/dashboard/edit_rubric/' . $row->r_id); ?>"
          title="Modifier"
          ><i class="glyphicon glyphicon-pencil"></i
        ></a>
      </td>
      <td>
        <a
          href="<?php echo base_url('admin/dashboard/delete_rubric/' . $row->r_id); ?>"
          onclick="return deleteConfirm()"
          title="Supprimer"
          ><i class="glyphicon glyphicon-trash"></i
        ></a>
      </td>
    </tr>
    <?php endforeach; ?>
  </table>

  <!-- end .table .table-hover -->
</div>
<!-- end .table-responsive -->

<script>
  function deleteConfirm() {
    var a = confirm("Etes-vous sur de vouloir supprimer cette catégorie ?!");
    if (a) {
      return true;
    } else {
      return false;
    }
  }
</script>

<?php endif; ?>
```

#### "view_edit_rubric.php"

```html
<?php
    if (validation_errors()):
        echo validation_errors('<div class="alert alert-danger">', ' <a class="close" data-dismiss="alert" href="#">&times;</a></div>');
    endif;

    echo form_open(base_url(uri_string()));
?>

    <div class="form-group">
        <label for="r_title">Titre de la rubrique:</label>
        <input type="text" class="form-control" id="r_title" name="r_title" value="<?php if(isset($r_title)): echo $r_title; else: echo set_value('r_title'); endif; ?>" required />
    </div><!-- end .form-group -->

    <div class="form-group">
        <label for="r_description">Description (256 caractères) de la rubrique :</label>
        <input type="text" id="r_description" class="form-control" name="r_description" value="<?php if(isset($r_description)): echo $r_description; else: echo set_value('r_description'); endif; ?>" required />
    </div><!-- end .form-group -->

    <input type="submit" class="btn btn-default" value="<?php if ($page == 'add_rubric'){ echo 'Ajouter';} else{ echo 'Modifier'; }; ?>" />

</form>
```

## Le routage

Dans le fichier de routage (`application/config/routes.php`) ajoutez après la route du default_controller :

```php
#admin
$route['admin']           = 'admin/admin';
$route['admin/logout']    = 'admin/admin/logout';
$route['admin/dashboard'] = 'admin/dashboard';

# ADMIN content
$route['admin/dashboard/edit']          = 'admin/dashboard/edit';
$route['admin/dashboard/edit/(:num)']   = 'admin/dashboard/edit/$1';
$route['admin/dashboard/delete/(:num)'] = 'admin/dashboard/delete/$1';

# ADMIN rubric
$route['admin/dashboard/rubric']               = 'admin/dashboard/rubric';
$route['admin/dashboard/edit_rubric']          = 'admin/dashboard/edit_rubric';
$route['admin/dashboard/edit_rubric/(:num)']   = 'admin/dashboard/edit_rubric/$1';
$route['admin/dashboard/delete_rubric/(:num)'] = 'admin/dashboard/delete_rubric/$1';
```

## Conclusion

L'interface de gestion est opérationnelle. Il ne manque plus qu'à rajouter des vérificateurs d'unicité pour éviter les doublons dans la création d'article ou de catégorie.  
Vous pouvez faire évoluer ce blog en mettant en place la gestion des utilisateurs plus poussée et un historique de log pour améliorer la sécurité de l'application. Mais aussi un formulaire de création d'utilisateur avec niveau d'accréditation, etc...
