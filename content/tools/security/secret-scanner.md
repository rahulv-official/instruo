---
title: Secret Scanner
description: Find likely credentials and private keys in pasted code before sharing or committing it.
category: Security
tags: [secrets, scanner, api keys, security, code]
icon: i-tabler-scan
processing: local
capabilityStatus: partial
---

::SecretScanner
::

## How it works

Paste code or configuration to scan common token, private-key, and secret-assignment patterns. Matches are redacted in the result.

## Scope

This heuristic scanner cannot prove that code is safe. Review findings manually and use repository-aware scanners for CI.
