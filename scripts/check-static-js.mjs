import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = 'public/static/js'

function walk(dir) {
  const entries = readdirSync(dir)
  const files = []
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...walk(fullPath))
      continue
    }
    if (entry.endsWith('.js')) files.push(fullPath)
  }
  return files
}

const files = walk(ROOT).sort()

if (files.length === 0) {
  console.log('No JS files found under', ROOT)
  process.exit(0)
}

let hasError = false
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' })
  if (result.status !== 0) {
    hasError = true
  }
}

if (hasError) {
  process.exit(1)
}

console.log(`Static JS syntax check passed (${files.length} files)`)
