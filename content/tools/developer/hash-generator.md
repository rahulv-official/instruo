---
title: SHA Hash Generator
description: Create SHA-256, SHA-384, SHA-512, or legacy SHA-1 digests from text.
category: Developer
tags: [sha, sha-256, sha-512, hash, digest, checksum, developer]
icon: i-tabler-hash
---

::HashGenerator
::

## Create a digest

Enter text and choose an algorithm. The lowercase hexadecimal digest updates as the input changes.

SHA-256 is a sensible general choice for checksums and content fingerprints. SHA-384 and SHA-512 produce longer digests. SHA-1 remains available for compatibility with older systems, but it should not be chosen for new security-sensitive designs.

## Hashing is not encryption

A cryptographic hash converts input into a fixed-length fingerprint. It is designed to be one-way, so there is no decode operation. Even a small input change produces a different digest.

Do not use a plain SHA digest to store passwords. Password storage needs a purpose-built, salted password hashing system such as Argon2, scrypt, bcrypt, or PBKDF2.

## Privacy

The tool uses the browser's Web Crypto API. Input and output stay on this device.
