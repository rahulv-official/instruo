# Contributing Guidelines for Instruo

Thanks for your interest in contributing to Instruo — contributions (code, docs, issues, and reviews) are very welcome. This document explains how to get started, where things live in the repo, and the expectations we have for contributions.

## Quick start

1. Fork the repository on GitHub and clone your fork:

   ```bash
   git clone git@github.com:<your-username>/instruo.git
   cd instruo-v2
   git checkout -b feature/your-short-description
   ```

2. Install dependencies (we use pnpm):

   ```bash
   pnpm install
   ```

3. Start the dev server (Nuxt):

   ```bash
   pnpm dev
   ```

Notes: these commands assume the repository root. If your environment differs, adjust accordingly.

## Code of Conduct

All contributors are expected to follow the project's [Code of Conduct](./CODE_OF_CONDUCT.md).

## How to contribute

Common contribution types:

- Bug reports / issues: open an issue with reproduction steps and expected behavior.
- Documentation: improvements to `content/` markdown files and component docs.
- New tools or UI components: add the component(s) plus content documentation.
- Tests and bug fixes: submit a PR with tests where appropriate.

When opening a pull request:

- Use a short, descriptive title and link any related issues.
- Keep PRs focused — smaller PRs are easier to review.
- Use Conventional Commits for the commit history (see below).

## Project layout (key directories)

- `app/` – main Nuxt/ Vue application code
  - `app/components/` – Vue components (shared and tool components)
  - `app/composables/` – composable utilities (Vue useX hooks)
  - `app/lib/` – general utility modules (for example `app/lib/utils`)
  - `app/pages/` – route pages and dynamic routes
  - `app/layouts/` – application layouts

- `content/` – markdown content and documentation for tools and games
  - `content/tools/<category>/<tool>.md` – tool documentation and front matter
  - `content/games/` – game documentation

- `public/` – static assets

This repository uses Nuxt + content-driven pages: adding a markdown file to `content/tools/...` and a matching component under `app/components/tools/...` will generally integrate your tool into the site UI (follow existing conventions in the repo).

## Adding a new tool

1. Create the Vue UI component(s) under `app/components/tools/<category>/<ToolName>/`.
   - Use `PascalCase` for component filenames and the component name.
   - Prefer TypeScript (`<script setup lang="ts">`) and composition API.

2. Add a content file to `content/tools/<category>/<tool-name>.md`.
   - Include YAML front matter at the top with `title`, `description`, `category` and `tags`.
   - Use the repo's content component invocation to embed the tool if applicable (see existing examples).

Example front matter:

```yaml
---
title: Base64 Encoder / Decoder
description: Encode and decode Base64 strings.
category: Encoder Decoder
tags: [encoder, decoder, base64-to-text, text-to-base64, base64]
---
```

Then include your component via the content rendering pattern used in the repo (look at existing files in `content/tools/` for the exact syntax used by the content renderer).

3. Add unit tests where appropriate (see Testing below).

## Style & tooling

- Language: TypeScript is preferred for new code.
- Styling: Tailwind CSS is used across the app.
- Formatting: Prettier and the repo's `prettier.config.js` should be respected.
- Linting: ESLint is configured (`eslint.config.mjs`). Fix lint errors before opening a PR where possible.

Assumption: this repo uses pnpm, TypeScript, Tailwind, Prettier and ESLint (these configs are present in the repository). If your change needs additional tooling, mention it in the PR and add required config files.

## Documentation: content file format

When writing documentation for a tool, use a consistent structure so the site renderer and readers get a predictable experience. A recommended pattern:

1. YAML front matter with `title`, `description`, `category` and `tags`.
2. Short description / "What is this tool?" section.
3. Features and use cases (bullet lists).
4. How to use (step-by-step).
5. Example input/output.
6. Error handling / limitations.

Also include the content invocation used by the project to mount/render the tool component — check existing tool docs in `content/tools/` for the exact syntax.

## Commit messages

Follow Conventional Commits. Examples:

- feat: add Base64 encoder tool
- fix: correct URL encoder edge case
- docs: update how-to-use for Text Sorter

This makes changelogs and automated tooling easier to maintain.

## Testing

- If the change touches logic, add unit tests. The project may not have a test runner configured by default; if it does, follow existing patterns (look for `vitest`, `jest`, or test scripts in `package.json`).
- Manual testing: run `pnpm dev` and verify the UI/tool works in the browser.

If you want help adding a test runner or CI for tests, open an issue describing preferred tooling and I can help scaffold it.

## CI, hooks and release process

If this project integrates CI or automated releases, please follow the project's PR templates and branch protection rules. If no CI exists yet, propose one in an issue and include example workflows.

## Filing issues

When filing an issue, be concise and include:

- A short, descriptive title.
- Steps to reproduce.
- Expected vs actual behavior.
- Browser/OS and any console errors (if relevant).
- A minimal reproduction if possible (link to code sandbox or screenshots).

## Licensing

By contributing, you agree that your contributions will be licensed under the project's MIT License (see `LICENSE`).

---

If you'd like this guide expanded (commit hooks, stricter CI checks, PR templates, or a contributor checklist) I can add those — tell me which pieces you'd like next.
