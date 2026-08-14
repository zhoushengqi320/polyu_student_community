const state = {
  files: [],
  jobId: null,
  batchId: null,
  job: null,
  batch: null,
  selectedItemId: null,
  timer: null,
};

const els = {
  health: document.getElementById("health"),
  localPreview: document.getElementById("localPreview"),
  previewBtn: document.getElementById("previewBtn"),
  localStartBtn: document.getElementById("localStartBtn"),
  fileInput: document.getElementById("fileInput"),
  fileInputBtn: document.getElementById("fileInputBtn"),
  folderInput: document.getElementById("folderInput"),
  fileList: document.getElementById("fileList"),
  dropzone: document.getElementById("dropzone"),
  startBtn: document.getElementById("startBtn"),
  jobMeta: document.getElementById("jobMeta"),
  bar: document.getElementById("bar"),
  batchFolders: document.getElementById("batchFolders"),
  refreshBtn: document.getElementById("refreshBtn"),
  retryBtn: document.getElementById("retryBtn"),
  exportBtn: document.getElementById("exportBtn"),
  jobList: document.getElementById("jobList"),
  detail: document.getElementById("detail"),
};

async function loadHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.qwenConfigured) {
      els.health.className = "health ok";
      els.health.innerHTML = `
        <div><strong>Qwen 已配置</strong></div>
        <div>${escapeHtml(data.model)}</div>
        <div class="muted">自动保存 JSONL：${data.autoExport ? "开" : "关"}</div>
      `;
    } else {
      els.health.className = "health bad";
      els.health.innerHTML =
        "<div><strong>未配置 API Key</strong></div><div>请填写 .env 中的 QWEN_API_KEY</div>";
    }
  } catch {
    els.health.className = "health bad";
    els.health.textContent = "无法连接后端";
  }
}

async function loadLocalPreview() {
  els.localPreview.textContent = "读取本地目录预览…";
  els.localStartBtn.disabled = true;
  try {
    const res = await fetch("/api/local/preview");
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "预览失败");
    const top = data.folders
      .slice(0, 8)
      .map((f) => `${f.name}(${f.pdfCount})`)
      .join("、");
    const more = data.folders.length > 8 ? "…" : "";
    els.localPreview.innerHTML = `
      <div>根目录：<code>${escapeHtml(data.root)}</code></div>
      <div>共 <strong>${data.folderCount}</strong> 个文件夹 /
        <strong>${data.pdfCount}</strong> 个 PDF</div>
      <div class="muted">${escapeHtml(top)}${more}</div>
    `;
    els.localStartBtn.disabled = data.folderCount === 0;
  } catch (err) {
    els.localPreview.textContent = err.message || String(err);
  }
}

els.previewBtn.addEventListener("click", loadLocalPreview);
els.localStartBtn.addEventListener("click", async () => {
  els.localStartBtn.disabled = true;
  els.jobMeta.textContent = "创建本地串行扫描批次…";
  try {
    const res = await fetch("/api/batches/local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "创建失败");
    state.batchId = data.id;
    state.batch = data;
    const current = data.folders?.[data.current_index];
    state.jobId = current?.job_id || null;
    enableControls();
    startPolling();
    await refreshAll();
  } catch (err) {
    els.jobMeta.textContent = err.message || String(err);
    els.localStartBtn.disabled = false;
  }
});

function renderFiles() {
  els.fileList.innerHTML = state.files
    .map((f) => `<li>${escapeHtml(f.webkitRelativePath || f.name)} · ${formatBytes(f.size)}</li>`)
    .join("");
  els.startBtn.disabled = state.files.length === 0;
}

function setFiles(fileList) {
  state.files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
  renderFiles();
}

els.fileInput.addEventListener("change", (e) => setFiles(e.target.files || []));
els.fileInputBtn.addEventListener("change", (e) => setFiles(e.target.files || []));
els.folderInput.addEventListener("change", (e) => setFiles(e.target.files || []));

["dragenter", "dragover"].forEach((evt) => {
  els.dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    els.dropzone.classList.add("drag");
  });
});
["dragleave", "drop"].forEach((evt) => {
  els.dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    els.dropzone.classList.remove("drag");
  });
});
els.dropzone.addEventListener("drop", (e) => {
  if (e.dataTransfer?.files) setFiles(e.dataTransfer.files);
});

function enableControls() {
  els.refreshBtn.disabled = false;
  els.retryBtn.disabled = false;
  els.exportBtn.disabled = false;
}

els.startBtn.addEventListener("click", async () => {
  if (!state.files.length) return;
  els.startBtn.disabled = true;
  els.jobMeta.textContent = "上传并创建任务…";

  const form = new FormData();
  for (const file of state.files) {
    const name = file.webkitRelativePath || file.name;
    form.append("files", file, name);
  }

  try {
    const res = await fetch("/api/jobs", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(formatDetail(data.detail) || "创建失败");

    if (data.type === "batch" || data.batch_id) {
      state.batchId = data.batch_id || data.id;
      state.jobId = data.job_id || null;
    } else {
      state.batchId = null;
      state.jobId = data.job_id || data.id;
    }
    enableControls();
    startPolling();
    await refreshAll();
  } catch (err) {
    els.jobMeta.textContent = err.message || String(err);
    els.startBtn.disabled = false;
  }
});

els.refreshBtn.addEventListener("click", refreshAll);
els.retryBtn.addEventListener("click", async () => {
  if (!state.jobId) return;
  await fetch(`/api/jobs/${state.jobId}/retry-failed`, { method: "POST" });
  startPolling();
  await refreshAll();
});
els.exportBtn.addEventListener("click", () => {
  if (state.batchId) {
    window.location.href = `/api/batches/${state.batchId}/export`;
    return;
  }
  if (state.jobId) {
    window.location.href = `/api/jobs/${state.jobId}/export`;
  }
});

function startPolling() {
  if (state.timer) clearInterval(state.timer);
  state.timer = setInterval(async () => {
    await refreshAll();
    const batchDone =
      state.batch &&
      (state.batch.status === "completed" ||
        state.batch.status === "failed" ||
        state.batch.status === "cancelled");
    const jobDone =
      !state.batchId &&
      state.job &&
      (state.job.status === "completed" ||
        state.job.status === "failed" ||
        state.job.status === "cancelled");
    if (batchDone || jobDone) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }, 2000);
}

async function refreshAll() {
  if (state.batchId) {
    const res = await fetch(`/api/batches/${state.batchId}`);
    if (res.ok) {
      state.batch = await res.json();
      const current = state.batch.folders?.[state.batch.current_index];
      if (current?.job_id) state.jobId = current.job_id;
      // 若当前已完成，尝试切到正在 running 的 job
      const running = state.batch.folders?.find(
        (f) => f.status === "running" || f.status === "queued",
      );
      if (running?.job_id) state.jobId = running.job_id;
    }
  }

  if (state.jobId) {
    const res = await fetch(`/api/jobs/${state.jobId}`);
    if (!res.ok) {
      els.jobMeta.textContent = "读取任务失败";
      return;
    }
    state.job = await res.json();
  }
  renderProgress();
}

function renderProgress() {
  const job = state.job;
  const batch = state.batch;

  if (batch) {
    const doneFolders = batch.folders.filter((f) => f.status === "completed").length;
    const pct = batch.folders.length
      ? Math.round((doneFolders / batch.folders.length) * 100)
      : 0;
    els.bar.style.width = `${pct}%`;
    els.jobMeta.innerHTML = `
      批次 <code>${escapeHtml(batch.id)}</code> ·
      状态 <strong>${escapeHtml(batch.status)}</strong> ·
      文件夹 ${doneFolders}/${batch.folders.length}
      <div class="muted">${escapeHtml(batch.message || "")}</div>
      ${
        batch.merged_export_path
          ? `<div class="muted">合并 JSONL：<code>${escapeHtml(batch.merged_export_path)}</code></div>`
          : ""
      }
      ${
        job
          ? `<div class="muted">当前文件夹任务：${escapeHtml(job.folder_name || "")} · 成功 ${job.done} / 失败 ${job.failed} / 共 ${job.total}${
              job.export_path ? ` · 已保存 ${escapeHtml(job.export_path)}` : ""
            }</div>`
          : ""
      }
    `;

    els.batchFolders.innerHTML = batch.folders
      .map((f, idx) => {
        const active = idx === batch.current_index ? "active" : "";
        return `<span class="folder-chip ${active} ${f.status}">${escapeHtml(f.name)} · ${f.status}</span>`;
      })
      .join("");
  } else if (job) {
    const processed = job.done + job.failed;
    const pct = job.total ? Math.round((processed / job.total) * 100) : 0;
    els.bar.style.width = `${pct}%`;
    els.batchFolders.innerHTML = "";
    els.jobMeta.innerHTML = `
      任务 <code>${escapeHtml(job.id)}</code> ·
      状态 <strong>${escapeHtml(job.status)}</strong> ·
      成功 ${job.done} / 失败 ${job.failed} / 共 ${job.total}
      <div class="muted">${escapeHtml(job.message || "")}</div>
      ${
        job.export_path
          ? `<div class="muted">已自动保存：<code>${escapeHtml(job.export_path)}</code></div>`
          : ""
      }
    `;
  }

  if (!job) return;

  els.jobList.innerHTML = job.items
    .map((item) => {
      const active = item.id === state.selectedItemId ? "active" : "";
      return `
        <div class="item ${active}" data-id="${item.id}">
          <div class="row">
            <strong>${escapeHtml(item.filename)}</strong>
            <span class="status ${item.status}">${item.status}</span>
          </div>
          <div class="muted">${escapeHtml(item.relative_path)}</div>
          ${item.error ? `<div class="status error">${escapeHtml(item.error)}</div>` : ""}
        </div>
      `;
    })
    .join("");

  els.jobList.querySelectorAll(".item").forEach((node) => {
    node.addEventListener("click", () => {
      state.selectedItemId = node.getAttribute("data-id");
      renderProgress();
      renderDetail();
    });
  });

  if (!state.selectedItemId && job.items[0]) {
    state.selectedItemId = job.items[0].id;
  }
  renderDetail();
}

function renderDetail() {
  const item = state.job?.items?.find((i) => i.id === state.selectedItemId);
  if (!item) {
    els.detail.className = "detail muted";
    els.detail.textContent = "选择条目查看抽取结果";
    return;
  }

  if (!item.course) {
    els.detail.className = "detail";
    els.detail.innerHTML = `
      <div class="meta">
        <div class="chip"><b>文件</b>${escapeHtml(item.filename)}</div>
        <div class="chip"><b>状态</b>${escapeHtml(item.status)}</div>
        <div class="chip"><b>文本长度</b>${item.pdf_text_chars}</div>
      </div>
      ${item.error ? `<p class="status error">${escapeHtml(item.error)}</p>` : ""}
      <h3>PDF 文本预览</h3>
      <pre>${escapeHtml(item.pdf_text_preview || "（暂无）")}</pre>
    `;
    return;
  }

  const c = item.course;
  els.detail.className = "detail";
  els.detail.innerHTML = `
    <div class="meta">
      <div class="chip"><b>Code</b>${escapeHtml(c.code)}</div>
      <div class="chip"><b>Credits</b>${c.credits ?? "-"}</div>
      <div class="chip"><b>Department</b>${escapeHtml(c.department)}</div>
      <div class="chip"><b>Faculty</b>${escapeHtml(c.faculty || "-")}</div>
    </div>
    <h3>${escapeHtml(c.name)}</h3>
    <pre>${escapeHtml(JSON.stringify(c, null, 2))}</pre>
  `;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDetail(detail) {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  return JSON.stringify(detail);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

loadHealth();
loadLocalPreview();
