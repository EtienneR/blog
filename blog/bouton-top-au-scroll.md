---
title: "Bouton top au scroll"
date: 2013-02-18
tags: ["jQuery"]
---

Le principe consite lors du scroll de la page, de faire apparaître un bouton pour remonter en haut de la page via jQuery.  
Le code jQuery consiste dans un premier temps à mettre en place une condition d'affichage ou non pour le bouton lors du scroll en se servant des fonctions `.scroll()` et `.scrollTop()`.  
Puis, dans un second temps, utiliser la fonction `.animate()` pour instaurer un effet de "smooth scroll" (défilement fluide) lors du clic sur le bouton.

## Code HTML

```html
<a href="#" class="go_top">Remonter</a>
```

Le mot "Remonter" s'affichera si le CSS est désactivé sur le navigateur.

## Code CSS

```css
.go_top {
  background: url("votre_image.png") no-repeat;
  display: none;
  position: fixed;
  width: 128px; /* A régler selon votre image */
  height: 128px; /* A régler selon votre image */
  bottom: 0; /* A régler selon votre image */
  right: 0; /* A régler selon votre image */
  text-indent: -9999px;
}
```

## Code jQuery

```javascript
$(document).ready(function() {
  // Condition d'affichage du bouton
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $(".go_top").fadeIn();
    } else {
      $(".go_top").fadeOut();
    }
  });
  // Evenement au clic
  $(".go_top").click(function() {
    $("html, body").animate({ scrollTop: 0 }, 800);
    return false;
  });
});
```

La valeur `100` à la ligne `$(this).scrollTop() > 100` correspond au nombre de pixels scrollés.

## Sources

- `.scroll()` : [http://api.jquery.com/scroll](http://api.jquery.com/scroll) ;
- `.scrollTop()` : [http://api.jquery.com/scrollTop](http://api.jquery.com/scrollTop) ;
- `.animate()` : [http://api.jquery.com/animate](http://api.jquery.com/animate).
