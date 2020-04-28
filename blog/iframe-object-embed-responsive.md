---
title: Iframe, object et embed responsive 
date: 2012-05-27
demo: http://demo.etienner.fr/embed-responsive
---

Vous venez de finir de coder votre site mais vous vous rendez compte qu'une vidéo Youtube, Vimeo, Dailymotion, présentation Slideshare garde sa largeur fixe et casse la résolution minimale de votre smartphone ou de votre tablette. Il existe une astuce toute simple en CSS qui s'applique aux `iframes`, `object` et `embed`.

## Partie HTML

```html
<div class="video">
    <div class="embed-container">
        <iframe src="http://www.youtube.com/embed/id-youtube" frameborder="0" allowfullscreen></iframe>
    </div>
</div>
```

Le but l'astuce est de définir la largeur et la hauteur dans le css et non dans le code html.

## Partie CSS

```css
.video{
    max-width: /*Largeur de la video*/px;
}
.embed-container{
    height: 0;
    overflow: hidden;
    padding-bottom: 56.25%; /* 16/9 ratio */
    position: relative;
}
.embed-container iframe,
.embed-container object,
.embed-container embed{
    height: 100%;
    left: 0;
    top: 0;
    width: 100%;
}
```

Petit rappel le calcul du ratio se fait de cette façon :  
16/9 = 1,777777777777778 puis le pourcentage 100/1,777777777777778 = 56,2459%.  
Autre exemple avec le 16/10 :  
16/10 = 1,6 ce qui donne 100/1.6 = 62.5%.

## Aller plus loin

Pour que le rendu  soit responsive sur votre smartphone ou votre tablette pleine de traces de doigts, il ne faut pas oublier la meta suivante dans la balise `head` :

```html
<meta name="viewport" content="initial-scale=1.0" />
```

Il existe une autre méthode qui permet de rendre vos vidéos responsive, FITVIDS.JS. C'est un script qui tourne sur jQuery ce qui engendre du temps de chargement en plus... à vous de voir !
