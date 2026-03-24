# PARA App

Public source repository for the PARA client workspace.

PARA is a civic social product built on top of the AT Protocol stack. This repository contains the app code, web-facing client surfaces, supporting modules, and public developer documentation needed to run and improve the product in the open.

## What Is In This Repo

Primary surfaces:

- the React Native app for iOS, Android, and web
- `bskyweb`, the Go-based web client surface
- `bskyembed`, `bskylink`, and `bskyogcard`
- developer tooling, test helpers, and public build docs

## What Is Intentionally Not In This Repo

This public repository should not contain:

- secrets, tokens, or real `.env` files
- real Firebase config files
- signing certificates or provisioning material
- local machine configuration or session databases
- private deployment and sync automation

See [`docs/OPEN_SOURCE_SCOPE.md`](./docs/OPEN_SOURCE_SCOPE.md).

## Requirements

- Node.js 20+
- Yarn 1.22.x
- Go 1.25+ for `bskyweb`
- Xcode for iOS work
- Android Studio / Android SDK for Android work

## Quick Start

Install JavaScript dependencies:

```bash
yarn
```

Run the web app:

```bash
yarn web
```

Run core validation:

```bash
yarn lint
yarn typecheck
NODE_ENV=test yarn test --forceExit
```

## Native Setup

Native builds need a little more setup than the web path.

Start here:

- [`docs/build.md`](./docs/build.md)
- [`docs/testing.md`](./docs/testing.md)

Useful bootstrap files:

- copy [`.env.example`](./.env.example) to `.env` if you need local overrides
- copy [`google-services.json.example`](./google-services.json.example) to `google-services.json` for local Android-native setup

## Repository Layout

High-level structure:

```text
.
├── src/            # React Native app source
├── modules/        # native modules and extensions
├── bskyweb/        # Go-based web client
├── bskyembed/      # embed surface
├── bskylink/       # link resolver surface
├── bskyogcard/     # OG card renderer
├── docs/           # public developer docs
└── scripts/        # maintenance and seed scripts
```

## Contributing

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request.

Also relevant:

- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- [`SECURITY.md`](./SECURITY.md)

## License

This repository is licensed under MIT. See [`LICENSE`](./LICENSE).
