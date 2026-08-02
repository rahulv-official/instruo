---
title: Image Resizer & Compressor
description: Resize JPEG, PNG, or WebP images and adjust their output format and quality.
category: Image
tags: [image, resize, compress, jpeg, png, webp, photo]
icon: i-lucide-image-down
---

::ImageResizer
::

## Resize an image

1. Choose a JPEG, PNG, or WebP image from your device.
2. Enter the output width. Height changes proportionally, so the image is not stretched.
3. Choose WebP, JPEG, or PNG. For WebP and JPEG, adjust quality if a smaller file matters more than fine detail.
4. Create and download the result.

WebP often gives a useful balance of size and visual quality. JPEG suits photographs without transparency. PNG preserves transparency and uses lossless compression, so its quality control is intentionally disabled.

Very large images consume more browser memory while they are decoded and redrawn. Resize them in smaller batches if the device becomes slow.

## Privacy

The source is decoded with browser APIs and exported from a local canvas. It is not uploaded to Instruo.
