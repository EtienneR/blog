---
title: 'Un vrai mot de passe'
date: 2015-11-30
tags: ['PHP']
---

Lorque vous développez un site web avec un dashboard (tableau de bord), vous devez mettre en place un système d'authentification. L'utilisateur devra rentrer un mot de passe que lui seul connait. Cette information est alors stockée dans une base de donnée. Hors si cette dernière se fait attaquée et les informations sont récupérées par une tiers personne, il faut que les mots de passe ne soient pas identifiables, autrement dit hachés. En PHP et dans de nombreux langages de programmations, il y a plusieurs façons de rendre ces mots de passe illisibles pour le commun des mortels.

![](https://i.giphy.com/X68QCGb5qx596.gif)

## MD5 et SHA1 au rebut

Encoder un mot de passe avec MD5 ou SHA-1 est une chose insignifiante pour un hacker. En effet, avec une liste de Rainbow Table (énorme table de base de données de MD5 ou SHA-1 et de leur équivalent en clair), attaque par force brute (test de toutes les combinaisons) ou attaque par dictionnaire, cela ne lui prendra pas beaucoup de temps pour déchiffrer les mots de passe de votre BDD.

```php
<?php
    $password = 'password';

    var_dump(md5($password));
    var_dump(sha1($password));
?>
```

![](https://i.giphy.com/uwm78X7lrvpdu.gif)

Cette méthode est décommendée de vive voix !

## Du salt avec SHA-512 : "cum grano salis"

L'intéret du salt (ou clef secrète), c'est de "casser" la Rainbow Table en y mettant son grain de sel ("cum grano salis"). En salant avant de hacher, cette méthode est loin d'être infaillible car si le hacker trouve la clef secrète alors il pourra modifier son attaque en prenant en compte cette dernière.

![](https://web.archive.org/web/20190509213043im_/http://i.giphy.com/11HOmFD2Fk1gaY.gif)

Depuis la version 5.1.2 de PHP, il existe une fonction hash_hmac() qui permet de générer ce genre de mot de passe rapidement :

```php
<?php
    function hashPassword($password) {
        $hash = 'sha512';
        $salt = 'clef secrete';
        return hash_hmac($hash, $password, $salt);
    }

    print_r(hashPassword('password')); // mot de passe haché

    // MDP stocké en BDD
    $passwordCrypted = 'f4368737ffe88088e26b19099b408b6d9e0af4f103807541ad472d7fbd644f3da41903aa55d5a29155649a84ec2b52e12957754c196b415901e1bb45d7533a10';

    function checkPassword($password, $passwordCrypted) {
        // MDP saisie par l'utilisateur == MDP en BDD
        if (hashPassword($password) == $passwordCrypted) {
            echo 'Le mot de passe est valide :)';
        } else {
            echo 'Mauvais mot de passe :(';
        }
    }

    print_r(checkPassword('password', $passwordCrypted));
?>
```

Pour le hachage, il existe d'autres méthodes que "sha512" comme "md5", "sha256", "haval160,4", etc... vous pouvez obtenir la liste complète avec la fonction `hash_algos()` :

```php
<?php
    var_dump(hash_algos());
?>
```

## Addition salée avec Bcrypt

Avec Bcrypt, le salt n'est plus statique comme vue précédement mais généré aléatoirement ce qui a pour effet de générer un hash aléatoire du mot de passe.

![](https://i.giphy.com/ph7prW5qPhrZC.gif)

L'algorithme utilisé par Bcrypt pour créer la clef de hachage est "CRYPT_BLOWFISH" via "PASSWORD_BCRYPT" à partir de la version 5.5.0 de PHP.

```php
<?php
    $options = [
        'cost' => 11,                                         // Cout algorithmique
        'salt' => mcrypt_create_iv(22, MCRYPT_DEV_URANDOM),    // Salt automatique
    ];

    // Génération du MDP
    $password = password_hash('password', PASSWORD_BCRYPT, $options);

    // Valeur aléatoire générée du MDP stocké en BDD
    $passwordCrypted = '$2y$11$pzXo0hIts06Tfcshew8HQeVmP8eY2bxcsChtslGLbzxrHbXDs0L9i';

    function checkPassword($password, $passwordCrypted) {
        // Récupération du MDP saisie par l'utilisateur
        if (password_verify('password', $passwordCrypted)) {
            echo 'Le mot de passe est valide :)';
        } else {
            echo 'Le mot de passe est invalide :(';
        }
    }

    print_r(checkPassword('password', $passwordCrypted));
?>
```

Quelques informations sur le mot de passe haché :

- "$2y" : identifiant de la clef de hachage standard de crypt()
- "$11" : niveau de difficulté (paramètre "cost" dans les options)
- "$pzXo0hIts06Tfcshew8HQeVmP8eY2bxcsChtslGLbzxrHbXDs0L9i" : le sel et le mot de passe en base6

Quant à la longueur totale du MDP haché, elle sera toujours de 60 caractères.

Remarque : pour utiliser Bcrypt, il faut que l'extension PHP "mcrypt" soit installée et activée sur votre serveur PHP.

## Conclusion

Avoir des données protégées est un gage de confiance vis à vis des internautes inscris. Pour plus de sécurité, vous pouvez appliquer des règles lors de la création du compte en demandant à l'utilisateur au moins une majuscule et un caractère spécial lors de la création de son mot de passe.

## Sources

- Inspiration pour cet article : [https://linuxfr.org/users/elyotna/journaux/l-art-de-stocker-des-mots-de-passe](https://linuxfr.org/users/elyotna/journaux/l-art-de-stocker-des-mots-de-passe) ;
- Fonction `hash_hmac` : [http://php.net/manual/fr/function.hash-hmac.php](http://php.net/manual/fr/function.hash-hmac.php) ;
- Fonction `password_hash` : [http://php.net/manual/fr/function.password-hash.php](http://php.net/manual/fr/function.password-hash.php) ;
- Fonction `password_verify` : [http://php.net/manual/fr/function.password-verify.php](http://php.net/manual/fr/function.password-verify.php) ;
- Rainbox table : [https://fr.wikipedia.org/wiki/Rainbow_table](https://fr.wikipedia.org/wiki/Rainbow_table) ;
- Attaque par dictionnaire : [https://fr.wikipedia.org/wiki/Attaque_par_dictionnaire](https://fr.wikipedia.org/wiki/Attaque_par_dictionnaire) ;
- Attaque par force brute : [https://fr.wikipedia.org/wiki/Attaque_par_force_brute](https://fr.wikipedia.org/wiki/Attaque_par_force_brute) ;
- Le salage en cryptographie : [https://fr.wikipedia.org/wiki/Salage_%28cryptographie%29](https://fr.wikipedia.org/wiki/Salage_%28cryptographie%29) ;
- Algorithme Blowfish : [https://fr.wikipedia.org/wiki/Blowfish](https://fr.wikipedia.org/wiki/Blowfish) ;
- La fin de SHA-1 : [http://www.silicon.fr/sha-1-algorithme-clef-chiffrement-https-plus-securise-129087.html] ;
- Sites qui vont vous faire oublier le MD5 et le SHA1 : [https://md5hashing.net](https://md5hashing.net) - [http://hashtoolkit.com](http://hashtoolkit.com) ;
- Mots de passe les plus utilisés en 2014 : [http://www.sudouest.fr/2015/01/21/internet-le-top-25-des-mots-de-passe-que-vous-devriez-eviter-1804735-5166.php](http://www.sudouest.fr/2015/01/21/internet-le-top-25-des-mots-de-passe-que-vous-devriez-eviter-1804735-5166.php).
