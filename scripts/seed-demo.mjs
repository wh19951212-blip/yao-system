#!/usr/bin/env node
/**
 * 将 supabase/seed_demo.sql 写入 Supabase 数据库。
 *
 * 用法：
 *   1. 在 .env 中配置 DATABASE_URL（Supabase > Settings > Database > Connection string）
 *   2. npm i -D pg   # 首次需要
 *   3. node scripts/seed-demo.mjs
 *
 * 若无 DATABASE_URL，脚本会提示在 SQL Editor 中手动运行 seed_demo.sql。
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const sqlPath = join(root, 'supabase/seed_demo.sql')

function loadEnvFile() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile()

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!existsSync(sqlPath)) {
  console.error('找不到 supabase/seed_demo.sql')
  process.exit(1)
}

const sql = readFileSync(sqlPath, 'utf8')

if (!databaseUrl) {
  console.log(`
未设置 DATABASE_URL，无法自动执行 SQL。

请手动操作：
  1. 打开 Supabase Dashboard → SQL Editor
  2. 粘贴并运行：supabase/seed_demo.sql

或在 .env 中添加 DATABASE_URL 后重新运行本脚本。
`)
  process.exit(0)
}

try {
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: databaseUrl })
  await client.connect()
  console.log('正在写入演示数据…')
  await client.query(sql)
  await client.end()
  console.log('✓ seed_demo.sql 执行完成')
} catch (err) {
  if (err?.code === 'ERR_MODULE_NOT_FOUND') {
    console.error(`
需要安装 pg 才能通过 DATABASE_URL 执行 SQL：
  npm i -D pg

或手动在 Supabase SQL Editor 运行 supabase/seed_demo.sql
`)
    process.exit(1)
  }
  console.error('执行失败:', err.message ?? err)
  process.exit(1)
}
