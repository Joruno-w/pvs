import { fileURLToPath } from 'node:url'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const pkgPath = resolve(fileURLToPath(import.meta.url), '../../package.json')
const readmePath = resolve(fileURLToPath(import.meta.url), '../../README.md')
const { version } = JSON.parse(await readFile(pkgPath, 'utf-8'))
const result = (await readFile(readmePath, 'utf-8')).replace(/(\d+\.\d+\.\d+)/g, version)
await writeFile(readmePath, result, 'utf-8')
