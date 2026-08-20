# Releasing Next Job Kit

Each release is one immutable contract across `package.json`, npm, a Git tag, a GitHub Release, and `CHANGELOG.md`.

## Before merge

1. Update `package.json` and `CHANGELOG.md` in the release PR.
2. Run `npm test`.
3. Inspect `npm pack --dry-run --json` with an isolated cache.
4. Confirm the draft PR is green and ready for review.
5. Do not publish npm versions from a feature branch.

## First package bootstrap

The package name must be claimed manually with npm 2FA. Publish `0.1.0-beta.1` from clean, validated `main` with the `beta` dist-tag only after the release workflow is present:

```sh
npm publish --access public --tag beta
```

Then configure `.github/workflows/release.yml` as the npm trusted publisher with `npm publish` permission.

After trusted publishing works, disallow traditional automation tokens and keep provenance enabled.

## Registry rehearsal

1. Publish `0.1.0-beta.1` manually from `main` with the `beta` dist-tag.
2. Initialize a realistic local workspace from that version.
3. Customize `AGENTS.md`, one built-in skill, and the built-in template through a custom fork.
4. Bump the version and changelog to `0.1.0-beta.2`, merge it, and publish it through the tag-driven release workflow with the `beta` dist-tag.
5. Run a dry-run and apply the update.
6. Confirm local customizations survive, built-ins advance, history remains privacy-safe, validation passes, and rollback restores beta.1.
7. Publish stable `0.1.0` only after the rehearsal passes.

GitHub Packages is intentionally not used. npm is the executable distribution channel; GitHub hosts source, CI, tags, and release notes.
