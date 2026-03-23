## Cloudflare Pages Deployment

Use `apps/docs` for the production public site on `paramx.social`.

Why:
- `apps/docs` builds the marketing homepage and the `/docs` tree together.
- `apps/landing` is a narrower landing variant and does not include `/docs`.

Verified locally:
- `pnpm --filter @parasocial/site build`
- static output written to `apps/docs/build`

### Recommended Pages project settings

Repository root:
- `website`

Framework preset:
- `None`

Build command:
- `pnpm build:site`

Build output directory:
- `apps/docs/build`

Root directory:
- `website`

Node / package manager:
- `pnpm` from `website/package.json`

### Domain plan

Primary production domain:
- `paramx.social`

Optional aliases:
- `www.paramx.social`
- `docs.paramx.social`

### Important DNS note

If you want the apex domain `paramx.social` on Cloudflare Pages, move the zone to
Cloudflare nameservers from Porkbun first. Keeping Porkbun as the registrar is fine;
the nameservers are the part that should point to Cloudflare.

### First deploy checklist

1. Create a Cloudflare Pages project from the GitHub repo.
2. Point the project at the `website` directory in the monorepo.
3. Set build command to `pnpm build:site`.
4. Set output directory to `apps/docs/build`.
5. Deploy once and verify:
   - `/`
   - `/about`
   - `/docs`
   - `/docs/product`
   - `/try-app`
6. Add `paramx.social` as the custom domain.
7. Add `www.paramx.social` and redirect it to the apex if desired.
