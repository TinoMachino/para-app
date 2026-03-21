# @atproto/bsky: Bluesky AppView Service

TypeScript implementation of the `app.bsky` Lexicons backing the https://bsky.app microblogging application.

[![NPM](https://img.shields.io/npm/v/@atproto/bsky)](https://www.npmjs.com/package/@atproto/bsky)
[![Github CI Status](https://github.com/bluesky-social/atproto/actions/workflows/repo.yaml/badge.svg)](https://github.com/bluesky-social/atproto/actions/workflows/repo.yaml)

## PARA public-figure notes

PARA currently uses the existing profile verification view returned by AppView to decide whether a profile should render with the `f/` public-figure prefix.

That means seeded or manually created `app.bsky.graph.verification` records are only surfaced as valid when the issuer account is marked as a trusted verifier in AppView data.

Current operational model:

- manual approval happens outside this package
- PARA stores product-level approval in `com.para.identity`
- AppView exposes the user as verified when a trusted verifier has issued `app.bsky.graph.verification`

Future plan:

- keep AppView as the renderer of trusted verification state
- let PARA's identity workflow move from manual review to Instituto Nacional Electoral-backed, zero-knowledge proof verification in Mexico
- preserve privacy by validating eligibility without requiring full public identity disclosure

## License

This project is dual-licensed under MIT and Apache 2.0 terms:

- MIT license ([LICENSE-MIT.txt](https://github.com/bluesky-social/atproto/blob/main/LICENSE-MIT.txt) or http://opensource.org/licenses/MIT)
- Apache License, Version 2.0, ([LICENSE-APACHE.txt](https://github.com/bluesky-social/atproto/blob/main/LICENSE-APACHE.txt) or http://www.apache.org/licenses/LICENSE-2.0)

Downstream projects and end users may chose either license individually, or both together, at their discretion. The motivation for this dual-licensing is the additional software patent assurance provided by Apache 2.0.
