---
title: Lazyload d'images avec Unveil.js
date: 2013-09-13
tags: ['jQuery']
---

Il peut vous arriver d'être amener à utiliser une page qui demande d'afficher beaucoup de photos. Force est de constater que la page prend du temps à charger (sans compter que sur mobile cela est plus lent via la 3G) même si le poids des images a été allégé au préalable.  
Pour cela, il existe quelques plugins en jQuery (via la fonction `scrollTop`) qui permettent d'optimiser le chargement de la page web. Cette méthode s'appelle le Lazy load que l'on peut littéralement traduire par "chargement paresseux". Lors du chargement de la page web, les images qui sont hors du champ de la page seront chargées au moment du scroll par le visiteur.

## Téléchargement et utilisation

Téléchargez le script à l'adresse suivante : https://github.com/luis-almeida/unveil  
Aperçu du code HTML :

```html
<img src="bg.png" data-src="img1.jpg" />
<img src="bg.png" data-src="img2.jpg" />
<img src="bg.png" data-src="img3.jpg" />

<script src="js/jquery.js"></script>
<script src="js/jquery.unveil.min.js"></script>
```

"bg.png" est l'image qui s'affiche par défaut avant le scroll (vous pouvez mettre un loader en gif ou laisser vide).  
"img1.jpg" est l'image finale.  
Vous n'êtes pas obligés de remplir le chemin src.

Remarque : vous pouvez entourer la balise `img` par une balise "noscript" afin d'afficher les images pour les internautes dont le Javascript est désactivé sur leur navigateur.

## Sources

* Site officiel : http://luis-almeida.github.io/unveil
* Compresser les images PNG : http://tinypng.org
* Compresser les images JPEG : https://kraken.io/web-interface ou http://www.smushit.com/ysmush.it
* Exemples de sites utilisant le lazy loading : http://pinterest.com/all, http://www.flickr.com