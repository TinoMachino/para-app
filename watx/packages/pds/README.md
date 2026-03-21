# @atproto/pds: Personal Data Server (PDS)

TypeScript reference implementation of an atproto PDS.

[![NPM](https://img.shields.io/npm/v/@atproto/pds)](https://www.npmjs.com/package/@atproto/pds)
[![Github CI Status](https://github.com/bluesky-social/atproto/actions/workflows/repo.yaml/badge.svg)](https://github.com/bluesky-social/atproto/actions/workflows/repo.yaml)

If you are interested in self-hosting a PDS, you probably want this repository instead, which has a thin service wrapper, documentation, a Dockerfile, etc: https://github.com/bluesky-social/pds

## PARA public-figure notes

PARA stores public-figure approval as a repo record in `com.para.identity`.

Current intended fields:

- `isVerifiedPublicFigure`: whether PARA approved the account for `f/`
- `verifiedAt`: when the approval was granted
- `proofBlob`: optional pointer to the approval artifact or review payload

Current rollout model is manual:

- a reviewer approves the account manually
- the subject repo receives `com.para.identity`
- a trusted verifier later issues `app.bsky.graph.verification` so AppView can expose the verified state to clients

Future plan for Mexico:

- replace manual review with Instituto Nacional Electoral-backed checks
- use zero-knowledge proofs so users can prove eligibility from their ID without revealing their full identity to the application or to the public

## License

This project is dual-licensed under MIT and Apache 2.0 terms:

- MIT license ([LICENSE-MIT.txt](https://github.com/bluesky-social/atproto/blob/main/LICENSE-MIT.txt) or http://opensource.org/licenses/MIT)
- Apache License, Version 2.0, ([LICENSE-APACHE.txt](https://github.com/bluesky-social/atproto/blob/main/LICENSE-APACHE.txt) or http://www.apache.org/licenses/LICENSE-2.0)

Downstream projects and end users may chose either license individually, or both together, at their discretion. The motivation for this dual-licensing is the additional software patent assurance provided by Apache 2.0.
