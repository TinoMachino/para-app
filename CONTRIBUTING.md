# Contributing

## Scope

This repository is the public PARA app workspace. Contributions should improve:

- the PARA mobile and web clients
- the embedded web surfaces (`bskyweb`, `bskyembed`, `bskylink`, `bskyogcard`)
- developer experience and build reliability
- public documentation and contributor onboarding

Keep private infrastructure details, secrets, and one-off local runbooks out of the repository.

## Getting Started

Install dependencies:

```bash
yarn
```

Common development commands:

```bash
yarn web
yarn lint
yarn typecheck
NODE_ENV=test yarn test --forceExit
```

Additional setup details are in:

- [`README.md`](./README.md)
- [`docs/build.md`](./docs/build.md)
- [`docs/testing.md`](./docs/testing.md)

## Pull Request Expectations

Keep pull requests focused.

Include:

- a clear problem statement
- the concrete change made
- screenshots or recordings for visible UI work
- notes about build, migration, or rollout implications

Avoid combining unrelated cleanup with behavior changes.

## Safety Rules

Do not commit:

- secrets or tokens
- real Firebase or platform credential files
- signing certificates or provisioning artifacts
- generated build output
- local machine configuration

If a change depends on private infrastructure, document the boundary without publishing the sensitive detail.

## Validation

Before opening a PR, run the checks that match your change surface.

Typical app validation:

```bash
yarn lint
yarn typecheck
NODE_ENV=test yarn test --forceExit
```

If you touched `bskyweb`, also validate the Go side.

## Communication

- Prefer precise bug reports and narrowly scoped feature proposals.
- Mark incomplete or experimental work clearly.
- Keep docs aligned with actual product behavior.

## Sensitive Reports

Use [`SECURITY.md`](./SECURITY.md) for vulnerability reporting.
