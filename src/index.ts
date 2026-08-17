// Deployment entry: re-exports the versioned software's worker handler.
// This file intentionally contains no logic — organizations deploying
// their own endpoint change only this dependency pin and wrangler.jsonc.
export * from "@interscript/api-worker";
