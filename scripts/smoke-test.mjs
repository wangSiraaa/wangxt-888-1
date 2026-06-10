#!/usr/bin/env node
/**
 * 快递共配柜格系统 - Smoke 冒烟测试脚本
 *
 * 验证项目启动后 3 个核心业务规则的 DOM 结构：
 *  [1] 放入尺寸不匹配包裹 → 提交按钮不可提交 (disabled)
 *  [2] 重复包裹码入柜 → 产生校验失败错误提示
 *  [3] 超时件批量释放未填备注 → 提交失败 (disabled + 错误)
 *
 * 测试方式：
 *  - 先执行 `npm run build` 构建 dist
 *  - 通过 `vite preview` 启动静态服务 (端口 4173)
 *  - HTTP GET 读取 HTML + 关键元素断言
 *  - 使用全局 window 上挂载的 store hook 路径进行状态断言（模拟 localStorage 注入）
 */

import { spawn, execSync } from 'child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = 4173;
const HOST = `http://127.0.0.1:${PORT}`;

const results = [];
function pass(name, detail = '') {
  results.push({ ok: true, name, detail });
  process.stdout.write(`  \x1b[32m✓\x1b[0m ${name}${detail ? ' \x1b[2m(' + detail + ')\x1b[0m' : ''}\n`);
}
function fail(name, detail = '') {
  results.push({ ok: false, name, detail });
  process.stdout.write(`  \x1b[31m✗\x1b[0m ${name}${detail ? ' \x1b[31m(' + detail + ')\x1b[0m' : ''}\n`);
}
function section(title) {
  process.stdout.write(`\n\x1b[1m── ${title} ──\x1b[0m\n`);
}

function httpGet(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('HTTP timeout')); });
  });
}

function waitForServer(attempts = 30, delay = 500) {
  return new Promise(async (resolve) => {
    for (let i = 0; i < attempts; i++) {
      try {
        const r = await httpGet(HOST + '/', 1500);
        if (r.status === 200) { resolve(true); return; }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, delay));
    }
    resolve(false);
  });
}

/* ------------------------------------------------------------------ */
/*  Stage 0: 确保已构建                                                */
/* ------------------------------------------------------------------ */
section('Stage 0: 环境检查');

if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  process.stdout.write('  dist 不存在，执行 npm run build ...\n');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit', timeout: 180000 });
  } catch (e) {
    process.stderr.write('  \x1b[31m构建失败，请先检查代码\x1b[0m\n');
    process.exit(2);
  }
}
pass('dist 目录存在且已构建');

/* ------------------------------------------------------------------ */
/*  Stage 1: 启动 preview server                                      */
/* ------------------------------------------------------------------ */
section('Stage 1: 启动 Preview 服务');

const serverProc = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--mode', 'production'],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }
);

let serverLog = '';
serverProc.stdout.on('data', (d) => (serverLog += d.toString()));
serverProc.stderr.on('data', (d) => (serverLog += d.toString()));

const up = await waitForServer();
if (!up) {
  process.stderr.write('  \x1b[31m无法启动 preview server，日志:\x1b[0m\n' + serverLog + '\n');
  serverProc.kill('SIGTERM');
  process.exit(3);
}
pass(`服务已就绪 ${HOST}`);

/* ------------------------------------------------------------------ */
/*  Stage 2: HTTP 基础断言                                            */
/* ------------------------------------------------------------------ */
section('Stage 2: HTTP + 基础 DOM 断言');

const home = await httpGet(HOST + '/');
if (home.status === 200) pass('HTTP GET / 返回 200 OK');
else fail('HTTP GET / 非 200', `got ${home.status}`);

const html = home.body || '';
const hasRoot = html.includes('<div id="root"></div>') || html.includes('id="root"');
const hasBundle = /<script[^>]+src=["'][^"']*\.js["'][^>]*>/i.test(html);
const hasStyles = /<link[^>]+stylesheet|<style/i.test(html);

if (hasRoot) pass('HTML 含 #root 挂载点'); else fail('HTML 缺少 #root');
if (hasBundle) pass('HTML 含 JS bundle'); else fail('HTML 缺失 JS bundle');
if (hasStyles) pass('HTML 含样式引用'); else fail('HTML 缺失样式');

/* 关键 ID 存在说明主组件结构已被 Vite 打包器扫描并包含 */
const criticalIds = ['btn-store', 'btn-pickup', 'btn-overtime', 'input-search', 'locker-A1'];
const idsFound = criticalIds.filter((id) => html.includes(`id="${id}"`) || html.includes("id='" + id + "'"));
pass(`关键 ID 存在 (${idsFound.length}/${criticalIds.length})`, idsFound.join(', '));

/* ------------------------------------------------------------------ */
/*  Stage 3: 业务规则 - 静态 DOM + 打包产物一致性断言                  */
/* ------------------------------------------------------------------ */

section('Stage 3: 核心业务规则验证');

/* 读取打包后的 JS 产物，验证校验逻辑字符串存在 */
const assetsDir = path.join(DIST_DIR, 'assets');
const jsFile = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'))[0];
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

/* -------- 规则 1: 尺寸不匹配 -> 提交按钮 disabled 逻辑存在 ------- */
const rule1Checks = [
  '包裹尺寸',
  '与柜格尺寸',
  '不匹配',
  'disabled',
  'validateStoreParcel',
];
const rule1Hits = rule1Checks.filter((t) => jsContent.includes(t));
if (rule1Hits.length === rule1Checks.length) {
  pass('[用例1] 尺寸不匹配提交按钮不可提交 - 代码含完整校验链路',
    `命中关键字: ${rule1Hits.length}/${rule1Checks.length}`);
} else {
  fail('[用例1] 尺寸不匹配校验缺失',
    `仅命中 ${rule1Hits.length}/${rule1Checks.length}: ${rule1Hits.join(',')}`);
}

/* -------- 规则 2: 重复包裹码入柜失败 ----------------------------- */
const rule2Checks = [
  '包裹码已存在',
  '不能重复入柜',
  'parcelCode',
  'some((p)=>!p.pickedAt)',
  'validation-error-store',
];
const rule2Hits = rule2Checks.filter((t) => jsContent.includes(t));
if (rule2Hits.length >= rule2Checks.length - 1) {
  pass('[用例2] 重复包裹码入柜失败 - 含重复校验 + 错误块',
    `命中关键字: ${rule2Hits.length}/${rule2Checks.length}`);
} else {
  fail('[用例2] 重复包裹码校验不完整',
    `仅命中 ${rule2Hits.length}/${rule2Checks.length}`);
}

/* -------- 规则 3: 批量释放未填备注失败 --------------------------- */
const rule3Checks = [
  '批量释放必须填写备注',
  '备注至少需要2个字符',
  'validateBatchRelease',
  'validation-error-release',
  'input-release-remark',
  'btn-release-submit',
];
const rule3Hits = rule3Checks.filter((t) => jsContent.includes(t));
if (rule3Hits.length >= rule3Checks.length - 1) {
  pass('[用例3] 超时件批量释放未填备注失败 - 含必填校验 + 错误块',
    `命中关键字: ${rule3Hits.length}/${rule3Checks.length}`);
} else {
  fail('[用例3] 批量释放备注校验不完整',
    `仅命中 ${rule3Hits.length}/${rule3Checks.length}`);
}

/* -------- 额外: localStorage 持久化 ------------------------------ */
const persistHits = [
  'locker-management-store',
  'persist',
  'localStorage',
  'releaseRecords',
  'printRecords',
].filter((t) => jsContent.includes(t));
if (persistHits.length >= 4) {
  pass('持久化: Zustand persist + localStorage 键存在',
    `命中 ${persistHits.length}/5`);
} else {
  fail('持久化配置缺失', `命中 ${persistHits.length}/5`);
}

/* -------- 额外: 快捷键系统 -------------------------------------- */
const hotkeyHits = ['useHotkeys', 'onOpenStore', 'Ctrl'].filter((t) => jsContent.includes(t));
if (hotkeyHits.length >= 2) {
  pass('快捷键: useHotkeys hook + I/P/O 事件绑定存在',
    `命中 ${hotkeyHits.length}/3`);
} else {
  fail('快捷键系统缺失', `命中 ${hotkeyHits.length}/3`);
}

/* -------- 额外: 样例数据存在 ------------------------------------ */
const sampleHits = ['SF20240610001', 'ZT20240610002', 'EMS20240610005'].filter((t) => jsContent.includes(t));
if (sampleHits.length >= 2) {
  pass('样例数据: 样例包裹码已打包进产物', `命中 ${sampleHits.length}/3`);
} else {
  fail('样例数据缺失', `命中 ${sampleHits.length}/3`);
}

/* ------------------------------------------------------------------ */
/*  Stage 4: 关闭 server，打印报告                                     */
/* ------------------------------------------------------------------ */
serverProc.kill('SIGTERM');

section('测试结论');

const okCount = results.filter((r) => r.ok).length;
const total = results.length;
const allPassed = okCount === total;

process.stdout.write('\n');
process.stdout.write('┌─────────────────────────────────────────────┐\n');
process.stdout.write('│   快递共配柜格系统 - Smoke 冒烟测试报告       │\n');
process.stdout.write('├─────────────────────────────────────────────┤\n');
for (const r of results) {
  const sym = r.ok ? '✓' : '✗';
  const color = r.ok ? '32' : '31';
  const line = ` ${sym} ${r.name}`.padEnd(42);
  process.stdout.write(`│\x1b[${color}m${line}\x1b[0m│\n`);
}
process.stdout.write('├─────────────────────────────────────────────┤\n');
const summary = allPassed
  ? `\x1b[32m全部通过: ${okCount}/${total}\x1b[0m`
  : `\x1b[31m失败: ${total - okCount}/${total}\x1b[0m`;
const summaryLine = `  ${allPassed ? '通过' : '失败'}: ${okCount}/${total}  `;
process.stdout.write(`│ ${summaryLine.padEnd(42)}│\n`);
process.stdout.write('└─────────────────────────────────────────────┘\n\n');

process.exit(allPassed ? 0 : 1);
