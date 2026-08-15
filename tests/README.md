# Verification fixtures

The test suite is intentionally split by responsibility:

- `pnpm test:unit` runs deterministic browser-tool primitives in Vitest.
- `pnpm test:e2e` runs Chromium smoke checks through Playwright. The config starts Nuxt on port 3000 and captures traces on retry.
- `pnpm typecheck`, `pnpm lint`, `pnpm format`, and `pnpm build` are the source and production gates.

Fixtures must stay local and deterministic. Do not depend on wall-clock time, random output, external icon endpoints, network APIs, or a running third-party service. Add route-specific interaction coverage before changing a high-churn tool or game host.
