/**
 * 课程概览翻译进度看板（本地可视化）
 *
 * 读取 tmp/translate-progress.json、tmp/translate-log.jsonl、
 * tmp/courses-need-translate.json（或 export）并每几秒刷新。
 *
 * 用法：
 *   node scripts/translate-progress-dashboard.mjs
 *   npm run translate:progress
 *
 * 默认打开 http://127.0.0.1:3765
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { exec } from "node:child_process";

const PROJECT_ROOT = process.cwd();
const PORT = Number(process.env.TRANSLATE_DASHBOARD_PORT || 3765);
const TMP = path.join(PROJECT_ROOT, "tmp");

const FILES = {
  progress: path.join(TMP, "translate-progress.json"),
  log: path.join(TMP, "translate-log.jsonl"),
  need: path.join(TMP, "courses-need-translate.json"),
  export: path.join(TMP, "courses-overview-export.json"),
  questions: path.join(TMP, "translate-questions.jsonl"),
  runLog: path.join(TMP, "translate-run.log"),
};

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function readJsonl(filePath, limit = 0) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    const lines = text.split("\n").filter(Boolean);
    const sliced = limit > 0 ? lines.slice(-limit) : lines;
    return sliced.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

async function isWorkerRunning() {
  return new Promise((resolve) => {
    exec(
      "pgrep -fl translate-course-overview || true",
      { timeout: 2000 },
      (err, stdout) => {
        if (err) return resolve(false);
        resolve(/node\s+scripts\/translate-course-overview\.mjs/.test(stdout));
      },
    );
  });
}

async function buildSnapshot() {
  const [progress, need, exported, logEntries, questions, running] =
    await Promise.all([
      readJson(FILES.progress, {
        done: {},
        failed: {},
        stats: { ok: 0, fail: 0, skip: 0 },
        updatedAt: null,
      }),
      readJson(FILES.need, null),
      readJson(FILES.export, []),
      readJsonl(FILES.log, 0),
      readJsonl(FILES.questions, 50),
      isWorkerRunning(),
    ]);

  const byId = new Map(
    (Array.isArray(exported) ? exported : []).map((r) => [r.id, r]),
  );
  const needRows = Array.isArray(need)
    ? need
    : (Array.isArray(exported) ? exported : []).filter((r) => {
        const fields = [
          "description",
          "objectives",
          "prerequisites",
          "teaching_pattern",
        ];
        return fields.some((f) => {
          const v = r[f];
          if (!v || !String(v).trim()) return false;
          const t = String(v);
          const cn = (t.match(/[\u4e00-\u9fff]/g) || []).length;
          const letters = (t.match(/[A-Za-z]/g) || []).length;
          return !(cn >= 3 && cn >= letters * 0.15);
        });
      });

  const total = needRows.length || Object.keys(progress.done || {}).length;
  const doneEntries = Object.entries(progress.done || {});
  const doneCount = doneEntries.length;
  const failedEntries = Object.entries(progress.failed || {});
  const failCount = failedEntries.length;
  const remaining = Math.max(0, total - doneCount);
  const pct = total > 0 ? (doneCount / total) * 100 : 0;

  const deptDone = {};
  const deptTotal = {};
  for (const row of needRows) {
    const d = row.department || "?";
    deptTotal[d] = (deptTotal[d] || 0) + 1;
  }
  for (const [id] of doneEntries) {
    const row = byId.get(id);
    const d = row?.department || "?";
    deptDone[d] = (deptDone[d] || 0) + 1;
    if (!deptTotal[d]) deptTotal[d] = deptDone[d];
  }

  const deptRows = Object.keys({ ...deptTotal, ...deptDone })
    .map((dept) => {
      const t = deptTotal[dept] || 0;
      const d = deptDone[dept] || 0;
      return {
        dept,
        done: d,
        total: t,
        remaining: Math.max(0, t - d),
        pct: t > 0 ? Math.round((d / t) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  const successLogs = logEntries.filter((e) => e.ms && !e.error);
  const recent = successLogs.slice(-40).reverse();
  const window = successLogs.slice(-30);
  const avgMs =
    window.length > 0
      ? Math.round(window.reduce((s, e) => s + e.ms, 0) / window.length)
      : 0;

  // Infer parallel workers from the *latest* log slice (ignore older 3-way runs)
  const parallelWindow = successLogs.filter((e) => e.workerId != null).slice(-60);
  let concurrency = 1;
  if (parallelWindow.length) {
    const last = parallelWindow[parallelWindow.length - 1];
    concurrency = Math.max(
      1,
      Number(last.concurrency) || Number(last.workerId) + 1 || 1,
    );
  }

  // Only use entries from the current concurrency era for rate/ETA
  const rateWindow = parallelWindow
    .filter((e) => {
      const c = Number(e.concurrency) || Number(e.workerId) + 1 || 1;
      return c === concurrency;
    })
    .slice(-20);

  let coursesPerHour = null;
  let etaSec = null;
  if (rateWindow.length >= 4) {
    const first = Date.parse(rateWindow[0].at);
    const last = Date.parse(rateWindow[rateWindow.length - 1].at);
    const secs = Math.max(1, (last - first) / 1000);
    const n = rateWindow.length - 1;
    coursesPerHour = (n / secs) * 3600;
    etaSec = Math.round((remaining / coursesPerHour) * 3600);
  } else if (avgMs > 0) {
    coursesPerHour = 3600000 / (avgMs / concurrency);
    etaSec = Math.round((remaining * avgMs) / concurrency / 1000);
  }

  const timeline = [];
  for (const e of successLogs) {
    if (!e.at) continue;
    const minute = e.at.slice(0, 16); // YYYY-MM-DDTHH:MM
    const hit = timeline.find((x) => x.minute === minute);
    if (hit) hit.count += 1;
    else timeline.push({ minute, count: 1 });
  }
  const timelineTail = timeline.slice(-48);

  const recentCodes = doneEntries
    .map(([id, v]) => ({
      id,
      code: v.code,
      at: v.at || null,
      fields: v.fields || [],
      skipped: Boolean(v.skipped),
    }))
    .filter((x) => x.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 25);

  const failed = failedEntries.map(([id, v]) => ({
    id,
    code: v.code,
    error: v.error,
    at: v.at,
  }));

  return {
    generatedAt: new Date().toISOString(),
    running,
    updatedAt: progress.updatedAt,
    stats: progress.stats || { ok: 0, fail: 0, skip: 0 },
    totals: {
      total,
      done: doneCount,
      remaining,
      fail: failCount,
      pct: Math.round(pct * 10) / 10,
      avgMs,
      concurrency,
      coursesPerHour: coursesPerHour ? Math.round(coursesPerHour * 10) / 10 : null,
      etaSec,
    },
    departments: deptRows,
    timeline: timelineTail,
    recent,
    recentCodes,
    failed,
    questions: questions.slice(-20).reverse(),
  };
}

const HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>课程概览翻译进度 · PolyUHub</title>
  <style>
    :root {
      --bg: #f4f6f4;
      --panel: #ffffff;
      --ink: #1a2420;
      --muted: #5c6b63;
      --line: #d9e0db;
      --accent: #0f6b4c;
      --accent-soft: #e5f3ec;
      --warn: #9a5b00;
      --danger: #a12828;
      --ok: #0f6b4c;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --sans: "IBM Plex Sans", "Noto Sans SC", "PingFang SC", "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--sans);
      color: var(--ink);
      background:
        radial-gradient(1200px 500px at 10% -10%, #e8f2ec 0%, transparent 55%),
        radial-gradient(900px 400px at 100% 0%, #eef1ea 0%, transparent 50%),
        var(--bg);
      min-height: 100vh;
    }
    .wrap { max-width: 1120px; margin: 0 auto; padding: 28px 20px 48px; }
    header { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: end; justify-content: space-between; margin-bottom: 22px; }
    h1 { margin: 0; font-size: 1.55rem; letter-spacing: -0.02em; font-weight: 650; }
    .sub { color: var(--muted); font-size: 0.92rem; margin-top: 6px; }
    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      border: 1px solid var(--line); background: var(--panel);
      padding: 8px 12px; border-radius: 999px; font-size: 0.85rem;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); }
    .dot.on { background: var(--ok); box-shadow: 0 0 0 3px rgba(15,107,76,.15); }
    .dot.off { background: #9aa59e; }
    .grid { display: grid; gap: 14px; grid-template-columns: repeat(4, minmax(0,1fr)); }
    @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
    .stat {
      background: var(--panel); border: 1px solid var(--line);
      border-radius: 14px; padding: 14px 16px;
    }
    .stat .label { color: var(--muted); font-size: 0.8rem; }
    .stat .value { font-size: 1.55rem; font-weight: 650; margin-top: 4px; letter-spacing: -0.03em; }
    .stat .hint { color: var(--muted); font-size: 0.78rem; margin-top: 4px; }
    .panel {
      background: var(--panel); border: 1px solid var(--line);
      border-radius: 16px; padding: 16px 18px; margin-top: 14px;
    }
    .panel h2 { margin: 0 0 12px; font-size: 1rem; font-weight: 650; }
    .bar {
      height: 14px; border-radius: 999px; background: #e8eee9; overflow: hidden;
      border: 1px solid var(--line);
    }
    .bar > i {
      display: block; height: 100%; width: 0%;
      background: var(--accent);
      transition: width .5s ease;
    }
    .meta { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; color: var(--muted); font-size: 0.85rem; margin-top: 8px; }
    .dept { display: grid; gap: 8px; }
    .dept-row { display: grid; grid-template-columns: 72px 1fr 64px; gap: 10px; align-items: center; font-size: 0.85rem; }
    .dept-row .name { font-family: var(--mono); text-transform: uppercase; color: var(--muted); }
    .dept-row .nums { text-align: right; font-variant-numeric: tabular-nums; color: var(--muted); }
    .mini { height: 8px; border-radius: 999px; background: #e8eee9; overflow: hidden; }
    .mini > i { display:block; height:100%; background: var(--accent); }
    .cols { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; }
    @media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--line); vertical-align: top; }
    th { color: var(--muted); font-weight: 550; font-size: 0.78rem; }
    code { font-family: var(--mono); font-size: 0.82rem; }
    .muted { color: var(--muted); }
    .spark {
      display: flex; align-items: end; gap: 3px; height: 72px;
      padding-top: 8px;
    }
    .spark span {
      flex: 1; min-width: 4px; background: var(--accent-soft);
      border-radius: 3px 3px 0 0; position: relative;
    }
    .spark span::after {
      content: ""; position: absolute; left: 0; right: 0; bottom: 0;
      height: var(--h, 10%); background: var(--accent); border-radius: 3px 3px 0 0;
    }
    .err { color: var(--danger); }
    .footer { margin-top: 18px; color: var(--muted); font-size: 0.78rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>课程概览翻译进度</h1>
        <div class="sub">description / objectives / prerequisites / teaching_pattern → 简体中文</div>
      </div>
      <div class="badge" id="statusBadge">
        <span class="dot" id="statusDot"></span>
        <span id="statusText">检测中…</span>
      </div>
    </header>

    <div class="grid" id="stats"></div>

    <section class="panel">
      <h2>总进度</h2>
      <div class="bar"><i id="progressFill"></i></div>
      <div class="meta">
        <span id="progressLabel">—</span>
        <span id="etaLabel">—</span>
      </div>
    </section>

    <div class="cols">
      <section class="panel">
        <h2>近 48 分钟完成量</h2>
        <div class="spark" id="spark"></div>
        <div class="meta"><span>每柱 = 1 分钟内完成门数</span><span id="rateLabel"></span></div>
      </section>
      <section class="panel">
        <h2>学系进度（按总量排序）</h2>
        <div class="dept" id="dept"></div>
      </section>
    </div>

    <div class="cols">
      <section class="panel">
        <h2>最近完成</h2>
        <table>
          <thead><tr><th>课号</th><th>耗时</th><th>时间</th></tr></thead>
          <tbody id="recentBody"></tbody>
        </table>
      </section>
      <section class="panel">
        <h2>失败 / 待人工核对</h2>
        <div id="issues"></div>
      </section>
    </div>

    <div class="footer" id="footer"></div>
  </div>
  <script>
    const fmt = {
      num: (n) => new Intl.NumberFormat('zh-CN').format(n ?? 0),
      pct: (n) => (n ?? 0).toFixed(1) + '%',
      dur: (sec) => {
        if (sec == null) return '估算中';
        if (sec < 60) return sec + ' 秒';
        if (sec < 3600) return Math.round(sec / 60) + ' 分钟';
        const h = Math.floor(sec / 3600);
        const m = Math.round((sec % 3600) / 60);
        return h + ' 小时 ' + m + ' 分';
      },
      ms: (ms) => ms ? (ms / 1000).toFixed(1) + 's' : '—',
      time: (iso) => iso ? new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—',
    };

    function render(data) {
      const t = data.totals;
      document.getElementById('statusDot').className = 'dot ' + (data.running ? 'on' : 'off');
      document.getElementById('statusText').textContent = data.running
        ? '翻译进程运行中'
        : '翻译进程未运行（可断点续跑）';

      document.getElementById('stats').innerHTML = [
        ['已完成', fmt.num(t.done), '共 ' + fmt.num(t.total) + ' 门需译'],
        ['剩余', fmt.num(t.remaining), '失败 ' + fmt.num(t.fail)],
        ['完成率', fmt.pct(t.pct), (t.concurrency || 1) + ' 路并行'],
        ['吞吐', t.coursesPerHour ? t.coursesPerHour + ' 门/时' : '—', t.avgMs ? '单门约 ' + (t.avgMs/1000).toFixed(1) + 's' : ''],
      ].map(([label, value, hint]) =>
        '<div class="stat"><div class="label">'+label+'</div><div class="value">'+value+'</div><div class="hint">'+hint+'</div></div>'
      ).join('');

      document.getElementById('progressFill').style.width = Math.min(100, t.pct) + '%';
      document.getElementById('progressLabel').textContent =
        fmt.num(t.done) + ' / ' + fmt.num(t.total) + '（' + fmt.pct(t.pct) + '）';
      document.getElementById('etaLabel').textContent =
        '预计剩余 ' + fmt.dur(t.etaSec) +
        (t.concurrency > 1 ? '（已按 ' + t.concurrency + ' 路并行）' : '');

      const max = Math.max(1, ...data.timeline.map(x => x.count));
      document.getElementById('spark').innerHTML = data.timeline.length
        ? data.timeline.map(x => '<span title="'+x.minute.slice(11)+' · '+x.count+' 门" style="--h:'+Math.max(8, Math.round(x.count/max*100))+'%"></span>').join('')
        : '<span class="muted">暂无速率样本</span>';
      document.getElementById('rateLabel').textContent = t.coursesPerHour
        ? '约 ' + t.coursesPerHour + ' 门/小时'
        : '';

      document.getElementById('dept').innerHTML = data.departments.slice(0, 16).map(d =>
        '<div class="dept-row"><div class="name">'+d.dept+'</div><div class="mini"><i style="width:'+d.pct+'%"></i></div><div class="nums">'+d.done+'/'+d.total+'</div></div>'
      ).join('') || '<div class="muted">暂无学系数据</div>';

      document.getElementById('recentBody').innerHTML = data.recent.slice(0, 18).map(r =>
        '<tr><td><code>'+r.code+'</code></td><td>'+fmt.ms(r.ms)+'</td><td class="muted">'+fmt.time(r.at)+'</td></tr>'
      ).join('') || '<tr><td colspan="3" class="muted">暂无记录</td></tr>';

      const failHtml = (data.failed || []).slice(0, 8).map(f =>
        '<div style="margin-bottom:8px"><code>'+f.code+'</code><div class="err" style="font-size:0.8rem;margin-top:2px">'+escapeHtml(f.error||'')+'</div></div>'
      ).join('');
      const qHtml = (data.questions || []).slice(0, 8).map(q =>
        '<div style="margin-bottom:8px"><code>'+q.code+'</code> · '+q.field+'<div class="muted" style="font-size:0.8rem;margin-top:2px">'+escapeHtml(q.reason||'')+'</div></div>'
      ).join('');
      document.getElementById('issues').innerHTML =
        (failHtml || qHtml)
          ? (failHtml + (failHtml && qHtml ? '<hr style="border:none;border-top:1px solid var(--line);margin:12px 0">' : '') + qHtml)
          : '<div class="muted">暂无失败或待核对项</div>';

      document.getElementById('footer').textContent =
        '刷新于 ' + new Date(data.generatedAt).toLocaleString('zh-CN') +
        (data.updatedAt ? ' · 进度文件更新 ' + new Date(data.updatedAt).toLocaleString('zh-CN') : '') +
        ' · 源: tmp/translate-*.json';
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    async function tick() {
      try {
        const res = await fetch('/api/progress?ts=' + Date.now());
        const data = await res.json();
        render(data);
      } catch (e) {
        document.getElementById('statusText').textContent = '无法读取进度: ' + e.message;
      }
    }
    tick();
    setInterval(tick, 3000);
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  try {
    if (url.pathname === "/api/progress") {
      const snapshot = await buildSnapshot();
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(snapshot));
      return;
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(HTML);
      return;
    }
    res.writeHead(404).end("Not found");
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(error.message || error) }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const href = `http://127.0.0.1:${PORT}`;
  console.log(`翻译进度看板已启动：${href}`);
  const openCmd =
    process.platform === "darwin"
      ? `open ${href}`
      : process.platform === "win32"
        ? `start ${href}`
        : `xdg-open ${href}`;
  exec(openCmd, () => {});
});
