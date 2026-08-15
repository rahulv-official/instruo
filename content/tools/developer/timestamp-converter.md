---
title: Unix Timestamp Converter
description: Convert Unix timestamps to readable dates and local dates back to timestamps.
category: Developer
tags: [unix, timestamp, epoch, date, time, developer]
icon: i-tabler-clock
---

::TimestampConverter
::

## Convert in either direction

Paste a Unix timestamp and select whether it uses seconds or milliseconds. The tool shows ISO 8601, local, and UTC representations. You can also choose a local date and time to produce both timestamp formats.

## Seconds or milliseconds?

A Unix timestamp counts time from 1 January 1970 at 00:00:00 UTC. Many server tools use seconds, while JavaScript and several APIs use milliseconds. A modern seconds timestamp has about 10 digits; its millisecond equivalent usually has 13.

ISO and UTC results describe the same instant independently of your location. The local result uses the time zone configured on this device.

## Privacy

Conversions use the browser's built-in `Date` support. No date or timestamp is sent to a server.
