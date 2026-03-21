# PARA web monorepo

This workspace contains two SvelteKit apps:

- `apps/docs`: the canonical public site, with the landing page at `/` and the reference docs at `/docs`
- `apps/landing`: a standalone landing variant kept in the workspace so branding, links, and typechecks do not drift

Shared packages:

- `packages/content-schema`: versioned content contract, validation, and generated schema fixtures
- `packages/ui`: shared brand tokens and typography

## Commands

```bash
pnpm install
pnpm dev
pnpm dev:landing
pnpm check
pnpm lint
pnpm test
pnpm build
```

`pnpm dev` runs the same-origin public site in `apps/docs`. `pnpm dev:landing` runs the standalone landing variant.
