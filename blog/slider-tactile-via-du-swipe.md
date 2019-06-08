---
title: Slider tactile via du swipe
date: 2014-06-09
tags: ['jQuery']
demo: 'http://demo.etienner.fr/slider-jquery-swipe'
---

Nous allons réaliser un slider ne marchant que sur tactile. Pour ce faire nous allons utiliser en plus de  jQuery, la librairie de jQuery Mobile. Bien entendu, nous allons nous servir des fonctions qui nous serons utiles, c'est-à-dire `swiperight` et `swipeleft`, c'est pour cela que l'on ne chargera pas la librairie complète de jQuery Mobile. On appelle cette méthode de navigation "swipe" car ce mot signifie en anglais "faire glisser".  
NB : Avant de commencer, sachez que ce tutoriel ne traitera pas des boutons de navigation, ni des raccourcis clavier.

## Téléchargement de la librairie

Pour télécharger la version customisée de jQuery Mobile, allez sur la page de téléchargement "custom" officielle : http://jquerymobile.com/download-builder  
Dans "Select branch", sélectionnez la dernière version ("1.4.2"  à l'heure actuelle), plus bas dans la partie "Events" cochez "Touch" puis cliquez sur le bouton "Build My download".

## Arborescence de ce projet

```
│    index.html
│
├─── css
│       style.css
│
├─── img
│       image1.jpg
│       image2.jpg
│       image3.jpg
│       image4.jpg
│
├─── js
│       jquery-min.js
│       jquery.mobile.custom.min.js
│       slider.js
```

## Contenu du fichier index.html

```html
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport"content="width=device-width, maximum-scale=1"/>
	<title>Slider jQuery Swipe</title>
	<link rel="stylesheet"href="css/style.css">
</head>
<body>

	<div id="slider" data-ride="slider">

		<ul>
			<li>
				<img src="img/image1.jpg"alt="image 1"/>
			</li>
			<li>
				<img src="img/image2.jpg"alt="image 2"/>
			</li>
			<li>
				<img src="img/image3.jpg"alt="image 3"/>
			</li>
			<li>
				<img src="img/image4.jpg"alt="image 4"/>
			</li>
		</ul>

		<span id="legend"></span>

	</div>


	<script src="js/jquery-2.1.0.min.js"></script>
	<script src="js/jquery.mobile.custom.min.js"></script>
	<script src="js/slider.js"></script>

</body>
</html>
```

On charge les images dans une liste à puce sans oublier d'appeler nos fichiers javascript.

## Contenu du fichier style.css

```css
body{
	margin: 0;
	padding: 0;
}

#slider{
	margin: 0 auto;
	width: 480px;
}

#slider ul{
	list-style-type: none;
	margin: 0;
	padding: 0;
}

#slider ul li{
	display: none;
}

span#legend{
	display: block;
	text-align: center;
}
```

Comme pour un carrousel classique, le principe consiste à cacher toutes les images, c'est-à-dire toutes les puces présentes dans la DIV "slider".

## Contenu du fichier slider.js

```javascript
$( document ).ready(function() {

	// On compte le nombre d'images
	var count = $('#slider ul li').length;

	// On affiche la 1ère image
	$('#slider ul li:eq(0)').show().addClass('active');
	$('#legend').append( $('#slider ul li.active img').attr('alt') );

	// Image suivante
	$('#slider ul').swipeleft(function(){
		var current = $('#slider ul li.active').index();
		var next = current + 1;
		$('#slider ul li').hide().removeClass('active');
		if (current == (count - 1)) {
			$('#slider ul li:eq(0)').show().addClass('active');
		} else {
			$('#slider ul li:eq(' + next + ')').show().addClass('active');
		}
		$('#legend').html('').append( $('#slider ul li.active img').attr('alt') );
	});

	// Image précédente
	$('#slider ul').swiperight(function(){
		var current = $('#slider ul li.active').index();
		var prev = current - 1;
		$('#slider ul li').hide().removeClass('active');
		if (current < count) {
			$('#slider ul li:eq(' + prev + ')').show().addClass('active');
		}
		$('#legend').html('').append( $('#slider ul li.active img').attr('alt') );
	});

});
```

Dans un premier temps, on affiche la 1ère image de la liste ainsi que sa légende.  
Puis, dès que l'on glisse le doigt à gauche ou à droite on affiche l'image précédente ou suivante. Pour cela on attribue une classe CSS  "active" sur l'image demandée et l'image précédente ou suivante se voit retirer cette classe.