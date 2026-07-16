#!/usr/bin/env node
/** 将 yao-system.vercel.app 指向最新 production 部署 */
import { execSync } from 'node:child_process'

const ALIAS = 'yao-system.vercel.app'

try {
  const out = execSync('npx vercel ls --prod --yes 2>/dev/null | head -5', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const match = out.match(/https:\/\/yao-system-[a-z0-9-]+\.vercel\.app/)
  if (!match) {
    console.warn('[alias] 未找到最新部署 URL，请手动: vercel alias set <url> yao-system.vercel.app')
    process.exit(0)
  }
  const deployUrl = match[0].replace('https://', '')
  execSync(`npx vercel alias set ${deployUrl} ${ALIAS}`, { stdio: 'inherit' })
  console.log(`[alias] ${ALIAS} → ${deployUrl}`)
} catch (err) {
  console.warn('[alias] 自动 alias 失败，请手动执行: vercel alias set <deploy-url> yao-system.vercel.app')
  console.warn(err instanceof Error ? err.message : err)
}
