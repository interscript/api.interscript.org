#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createWriteStream, mkdirSync, rmSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { spawnSync } from "node:child_process";

const version = process.argv[2] ?? process.env.INTERSCRIPT_MAPS_VERSION;
const outDir = resolve(
  process.argv[3] ?? process.env.INTERSCRIPT_MAPS_DIR ?? "maps",
);
if (!version) {
  console.error("usage: fetch-maps-artifact.mjs <version> [out-dir]");
  process.exit(2);
}

const base = `https://github.com/interscript/maps/releases/download/v${version}`;
const tarball = `interscript-maps-ir-${version}.tar.gz`;
const tmp = resolve(`.tmp-${tarball}`);
const checksumFile = `${tmp}.sha256`;

async function download(url, path) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url}: HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(path));
}

await download(`${base}/${tarball}`, tmp);
await download(`${base}/${tarball}.sha256`, checksumFile);

const expected = (await readFile(checksumFile, "utf8")).trim().split(/\s+/)[0];
const actual = createHash("sha256")
  .update(await readFile(tmp))
  .digest("hex");
if (actual !== expected) {
  throw new Error(
    `${tarball}: sha256 mismatch; expected ${expected}, got ${actual}`,
  );
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const result = spawnSync("tar", ["-xzf", tmp, "-C", outDir], {
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status ?? 1);

const manifest = JSON.parse(
  await readFile(resolve(outDir, "manifest.json"), "utf8"),
);
if (manifest.schema !== "interscript.maps.ir.v1")
  throw new Error(`unexpected artifact schema ${manifest.schema}`);
if (manifest.count !== 289)
  throw new Error(`expected 289 maps, got ${manifest.count}`);

await writeFile(resolve(outDir, ".artifact-version"), `${version}\n`);
console.log(
  `fetched ${manifest.count} compiled maps (${version}) into ${outDir}`,
);
