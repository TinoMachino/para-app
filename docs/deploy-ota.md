# OTA Deployments

This document describes the public constraints around OTA updates.

## What OTA Can And Cannot Do

OTA updates can replace JavaScript and other update-managed assets.

OTA updates cannot safely replace native code. If your change touches native modules, native dependencies, entitlements, or platform configuration, do a full store release instead of an OTA.

## Recommended Public Workflow

1. Start from the latest production release branch or tag.
2. Create a focused OTA branch, for example `1.x.0-ota-1`.
3. Cherry-pick only the JavaScript-safe fixes needed for the OTA.
4. Verify that the app version and runtime assumptions still match the currently shipped native client.
5. Run local validation before publishing.
6. Publish through your chosen EAS workflow or manual release process.
7. Verify the update on a real device or simulator build that matches the intended runtime.

## Validation Before Publishing

At minimum:

```sh
yarn lint
yarn typecheck
NODE_ENV=test yarn test --forceExit
```

If your OTA affects web output, also rebuild the web surface you plan to ship.

## Build Number Discipline

If your OTA tooling requires explicit build number or version code management, record the current values before changing them so you can restore them after the OTA completes.

## Verification

After publishing:

- launch the app on a device that should receive the update
- allow time for the update to download
- restart the app
- confirm the expected commit, version, or About-screen metadata is present

## Private Release Automation

This public repository intentionally does not document private Slack channels, internal deployment approvals, or internal-only GitHub Actions.

If maintainers use private release infrastructure, keep those operational details in a separate private runbook.
