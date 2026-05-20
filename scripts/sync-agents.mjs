#!/usr/bin/env node
/**
 * Sync AGENTS.md (canonical) to tool-specific shims.
 *
 * Run after editing AGENTS.md so that every supported AI tool reads the same
 * conventions. Each target gets a small banner explaining it's a generated
 * copy, followed by the full canonical content.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const SOURCE = 'AGENTS.md'
const TARGETS = [
  { path: 'CLAUDE.md', label: 'Claude Code' },
  { path: '.cursorrules', label: 'Cursor (legacy single-file rules)' },
  { path: '.github/copilot-instructions.md', label: 'GitHub Copilot' },
]

const source = readFileSync(resolve(root, SOURCE), 'utf8')
if (!source.trim()) {
  console.error(`Refusing to sync — ${SOURCE} is empty.`)
  process.exit(1)
}

for (const target of TARGETS) {
  const banner =
    `<!--\n` +
    `  Generated from AGENTS.md — do not edit by hand.\n` +
    `  Run \`bun run agents:sync\` after editing AGENTS.md to regenerate.\n` +
    `  Tool target: ${target.label}.\n` +
    `-->\n\n`
  const full = resolve(root, target.path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, banner + source, 'utf8')
  console.log(`✓ ${target.path}`)
}

console.log(`Synced ${TARGETS.length} files from ${SOURCE}.`)
