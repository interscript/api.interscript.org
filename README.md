# api.interscript.org — deployment

This repository deploys the **Interscript API** to Cloudflare Workers for
the public endpoint `api.interscript.org`.

## Separation of software and deployment

The API **software** (GraphQL schema, engine wiring, bundled maps) lives
and is versioned separately. This repository contains **only our
deployment**: routes, environment, secrets, and the CI that deploys.

Anyone can deploy the same software for their own organization and
domain:

1. Copy this directory structure.
2. Point `package.json` at the software package (npm or a git pin).
3. Change `routes` in `wrangler.jsonc` to your own zone.
4. `wrangler deploy` with your own Cloudflare credentials.

No secrets, routes, or organizational specifics live in the software.

## Deploying (maintainers)

Deploys run in GitHub Actions using the `CLOUDFLARE_API_TOKEN` /
`CLOUDFLARE_ACCOUNT_ID` repository secrets (Actions → Secrets).

- pushes to `main` deploy to the staging route
- tags `v*` deploy to the production route `api.interscript.org/*`

Rollback: this stack does not touch the existing AWS Lambda; flip the
route back to the origin to fall back instantly.

## Configuration

- `routes` — production route on the `interscript.org` zone
- `vars.MAPS_MODE` / `vars.ML_INDEX_URL` — software knobs, documented
  in the software package README
