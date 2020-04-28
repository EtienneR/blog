---
title: 'Formulaire de contact HTML5 / PHP & AJAX'
date: 2013-01-06
tags: ['PHP']
---

Mettre en place un formulaire de contact est devenu simple avec l'arrivée de nouvelles balises HTML et de l'AJAX couplé avec du jQuery. Cela va permettre d'appeler une page de vérification que l'utilisateur final ne verra pas apparaitre à l'écran.

Attention : vous ne pourrez pas tester ce formulaire en local.

## Création du formulaire

Formulaire simple en HTML5 avec les nouvelles balises de formulaires tels que `required` et `email` dans un fichier "contact.html"

- `required` : cet attribut défini un champ obligatoire à remplir.
- `email` : ou plus précisément `type= email` permet de vérifier si l'adresse email rentrée dans le input est valide (exit les REGEX...)

Ce qui donne un formulaire assez simple.

```html
<div id="form_contact">
    <form action="process.php" id="contact" method="POST">
        <p>
            <label for="nom" class="nom">Nom</label>
            <br /><input id="nom" name="nom" type="text">
            <span id="msg_nom"></span>
        </p>
        <p>
            <label for="sujet" class="sujet">Sujet</label>
            <br /><input id="sujet" name="sujet" type="text">
            <span id="msg_sujet"></span>
        </p>
        <p>
            <label for="email">Email</label>
            <br /><input id="email" name="email" type="email">
            <span id="msg_email"></span>
        </p>
        <p>
            <label for="message">Message</label>
            <br /><textarea id="message" name="message" rows="10" cols="80"></textarea>
           <span id="msg_message"></span>
        </p>
        <p>
            <input type="submit" value="Envoyer" />
        </p>
    </form>
    <span id="msg_all"></span>
</div><!-- end of #form_contact -->
```

## Ajout de jQuery et Ajax

A la suite du fichier "contact.html" (de préférence dans le footer), vient s'implémenter l'AJAX mais qui ne sera exécutable que si la librairie jQuery est appelée.  
On va récupérer les valeurs saisies en jQuery dans les champs du formulaire ("nom", "sujet", "email" et "message").

```html
<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>
<script>
    $(function(){
        $("#contact").submit(function(event){
            var nom        = $("#nom").val();
            var sujet      = $("#sujet").val();
            var email      = $("#email").val();
            var message    = $("#message").val();
            var dataString = nom + sujet + email + message;
            var msg_all    = "Merci de remplir tous les champs";
            var msg_alert  = "Merci de remplir ce champs";

            if (dataString  == "") {
                $("#msg_all").html(msg_all);
            } else if (nom == "") {
                $("#msg_nom").html(msg_alert);
            } else if (sujet == "") {
                $("#msg_sujet").html(msg_alert);
            } else if (email == "") {
                $("#msg_email").html(msg_alert);
            } else if (message == "") {
                $("#msg_message").html(msg_alert);
            } else {
                $.ajax({
                    type : "POST",
                    url: $(this).attr("action"),
                    data: $(this).serialize(),
                    success : function() {
                        $("#contact").html("<p>Formulaire bien envoyé</p>");
                    },
                    error: function() {
                        $("#contact").html("<p>Erreur d'appel, le formulaire ne peut pas fonctionner</p>");
                    }
                });
            }

            return false;
        });
    });
</script>
```

## Création de la page de vérification

Créez un nouveau fichier "process.php".

```php
<?php
    header('Content-Type: text/html; charset=utf-8');

    // CONDITIONS NOM
    if ( (isset($_POST["nom"])) && (strlen(trim($_POST["nom"])) > 0) ) {
        $nom = stripslashes(strip_tags($_POST["nom"]));
    } else {
        echo "Merci d'écrire un nom <br />";
        $nom = "";
    }

    // CONDITIONS SUJET
    if ( (isset($_POST["sujet"])) && (strlen(trim($_POST["sujet"])) > 0) ) {
        $sujet = stripslashes(strip_tags($_POST["sujet"]));
    } else {
        echo "Merci d'écrire un sujet <br />";
        $sujet = "";
    }

    // CONDITIONS EMAIL
    if ( (isset($_POST["email"])) && (strlen(trim($_POST["email"])) > 0) && (filter_var($_POST["email"], FILTER_VALIDATE_EMAIL)) ) {
        $email = stripslashes(strip_tags($_POST["email"]));
    } elseif (empty($_POST["email"])) {
        echo "Merci d'écrire une adresse email <br />";
        $email = "";
    } else {
        echo "Email invalide :(<br />";
        $email = "";
    }

    // CONDITIONS MESSAGE
    if ( (isset($_POST["message"])) && (strlen(trim($_POST["message"])) > 0) ) {
        $message = stripslashes(strip_tags($_POST["message"]));
    } else {
        echo "Merci d'écrire un message<br />";
        $message = "";
    }

    // Les messages d'erreurs ci-dessus s'afficheront si Javascript est désactivé

    // PREPARATION DES DONNEES
    $ip           = $_SERVER["REMOTE_ADDR"];
    $hostname     = gethostbyaddr($_SERVER["REMOTE_ADDR"]);
    $destinataire = "monadresse@example.com";
    $objet        = "[Site Web] " . $sujet;
    $contenu      = "Nom de l'expéditeur : " . $nom . "\r\n";
    $contenu     .= $message . "\r\n\n";
    $contenu     .= "Adresse IP de l'expéditeur : " . $ip . "\r\n";
    $contenu     .= "DLSAM : " . $hostname;

    $headers  = "CC: " . $email . " \r\n"; // ici l'expediteur du mail
    $headers .= "Content-Type: text/plain; charset=\"ISO-8859-1\"; DelSp=\"Yes\"; format=flowed /r/n";
    $headers .= "Content-Disposition: inline \r\n";
    $headers .= "Content-Transfer-Encoding: 7bit \r\n";
    $headers .= "MIME-Version: 1.0";


    // SI LES CHAMPS SONT MAL REMPLIS
    if ( (empty($nom)) && (empty($sujet)) && (empty($email)) && (!filter_var($email, FILTER_VALIDATE_EMAIL)) && (empty($message)) ) {
        echo 'echec :( <br /><a href="contact.html">Retour au formulaire</a>';
    } else {
        // ENCAPSULATION DES DONNEES
        mail($destinataire, $objet, utf8_decode($contenu), $headers);
        echo 'Formulaire envoyé';
    }

    // Les messages d'erreurs ci-dessus s'afficheront si Javascript est désactivé
?>
```

On vérifie la véracité des valeurs du formulaire stockées dans des variables dans un premier temps puis on met en place les données à envoyer par email grâce à la fonction php `mail` en prenant bien soin d'encapsuler les données aux format UTF-8 afin de lire correctement les caractères spéciaux tels que les accents.

Si vous souhaitez mettre plusieurs destinataires, il suffit de mettre une virgule suivie d'un espace. Exemple : `"contact@contact.com, toto@toto.com"`

## Test avec Maildev

MailDev est une application tournant sur NodeJS qui permet de simuler un serveur SMTP (Simple Mail Transfer Protocal) et fournit également un webmail à des fins de tests en local. Les instructions d'installation sont disponibles à l'adresse suivante [http://djfarrelly.github.io/MailDev](http://djfarrelly.github.io/MailDev).

Le port SMTP par défaut de MailDev est "1025" alors que celui de PHP est "25". Dans votre fichier "php.ini" à la ligne "smtp_port = 25", remplacez cette valeur par "1025". Redémarrez votre serveur afin de prendre en compte cette modification.

Une fois MailDev lancé, envoyez un email depuis votre formulaire de contact puis à l'adresse [http://localhost:1080](http://localhost:1080) vous pouvez consulté ce message comme dans un webmail classique.

Sur WAMP c'est dans le répertoire "wamp\bin\apache\apacheX\bin"
