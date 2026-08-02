---
title: Password Generator
description: Create strong, customizable passwords with secure randomness from your browser.
category: Security
tags: [password, password-generator, security, random, privacy]
icon: i-lucide-key-round
---

::PasswordGenerator
::

## How to use it

1. Choose a length between 8 and 128 characters.
2. Keep the character sets you want: lowercase, uppercase, numbers, or symbols.
3. Copy the generated password, or create another one.

Longer passwords drawn from more character types are harder to guess. The strength label is an estimate based on length and the size of the selected character pool, not a guarantee against every attack.

## How generation works

Passwords use `crypto.getRandomValues`, the cryptographically secure random generator provided by modern browsers. The generator also ensures that every enabled character set appears at least once.

Use a password manager to save a unique password for each account. Do not reuse important passwords across websites.

## Privacy

Generation happens on this page. Passwords are not uploaded, stored, or added to browser history by Instruo.
