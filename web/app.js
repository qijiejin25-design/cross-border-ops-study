const storageKey = "crossBorderOpsStudy.v1";

const state = loadState();
const data = window.KB_DATA;
let currentDay = state.currentDay || getSuggestedDay();
let activeChapterId = data.chapters[0]?.id;
let currentView = "dashboard";

const els = {
  pageTitle: document.querySelector("#pageTitle"),
  progressText: document.querySelector("#progressText"),
  progressFill: document.querySelector("#progressFill"),
  streakText: document.querySelector("#streakText"),
  todayTitle: document.querySelector("#todayTitle"),
  todaySubtitle: document.querySelector("#todaySubtitle"),
  todayDone: document.querySelector("#todayDone"),
  todayPhase: document.querySelector("#todayPhase"),
  todayTasks: document.querySelector("#todayTasks"),
  dailyNote: document.querySelector("#dailyNote"),
  saveState: document.querySelector("#saveState"),
  readingPreview: document.querySelector("#readingPreview"),
  chapterList: document.querySelector("#chapterList"),
  chapterReader: document.querySelector("#chapterReader"),
  planGrid: document.querySelector("#planGrid"),
  interviewReader: document.querySelector("#interviewReader"),
  termsReader: document.querySelector("#termsReader"),
  searchInput: document.querySelector("#searchInput"),
  searchResults: document.querySelector("#searchResults"),
  searchCount: document.querySelector("#searchCount"),
};

init();

function init() {
  bindNavigation();
  bindActions();
  renderAll();
}

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  els.searchInput.addEventListener("input", () => {
    const query = els.searchInput.value.trim();
    if (!query) {
      showView(currentView === "search" ? "dashboard" : currentView);
      return;
    }
    renderSearch(query);
    activateView("search");
  });
}

function bindActions() {
  document.querySelector("#resetTodayBtn").addEventListener("click", () => {
    currentDay = getSuggestedDay();
    state.currentDay = currentDay;
    saveState();
    renderAll();
    showView("dashboard");
  });

  document.querySelector("#completeDayBtn").addEventListener("click", () => {
    const day = getDay(currentDay);
    const progress = getDayProgress(currentDay);
    day.tasks.forEach((_, index) => {
      progress.tasks[index] = true;
    });
    progress.completed = true;
    progress.date = todayString();
    saveState();
    renderAll();
  });

  document.querySelector("#openReadingBtn").addEventListener("click", () => {
    const chapter = getRecommendedChapter(currentDay);
    activeChapterId = chapter.id;
    renderChapters();
    showView("chapters");
  });

  document.querySelector("#exportBtn").addEventListener("click", exportRecords);

  els.dailyNote.addEventListener("input", () => {
    const progress = getDayProgress(currentDay);
    progress.note = els.dailyNote.value;
    els.saveState.textContent = "保存中";
    saveState();
    window.setTimeout(() => {
      els.saveState.textContent = "已自动保存";
    }, 180);
  });
}

function renderAll() {
  renderProgress();
  renderDashboard();
  renderChapters();
  renderPlan();
  renderFocusReaders();
}

function showView(view) {
  currentView = view;
  activateView(view);
  els.pageTitle.textContent = {
    dashboard: "今日学习",
    chapters: "知识章节",
    plan: "30 天计划",
    interview: "面试速背",
    terms: "术语表",
    search: "搜索结果",
  }[view];
}

function activateView(view) {
  document.querySelectorAll(".view").forEach((node) => node.classList.remove("active-view"));
  document.querySelector(`#${view}View`).classList.add("active-view");
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  if (view !== "search") {
    els.searchInput.value = "";
  }
}

function renderProgress() {
  const completed = data.days.filter((day) => getDayProgress(day.day).completed).length;
  const percent = Math.round((completed / data.days.length) * 100);
  els.progressText.textContent = `${completed}/${data.days.length}`;
  els.progressFill.style.width = `${percent}%`;
  els.streakText.textContent = `${getStreak()} 天`;
}

function renderDashboard() {
  const day = getDay(currentDay);
  const progress = getDayProgress(currentDay);
  const doneCount = day.tasks.filter((_, index) => progress.tasks[index]).length;

  els.todayTitle.textContent = `Day ${day.day}`;
  els.todaySubtitle.textContent = day.title;
  els.todayDone.textContent = `${doneCount}/${day.tasks.length}`;
  els.todayPhase.textContent = day.title;
  els.dailyNote.value = progress.note || "";

  els.todayTasks.innerHTML = day.tasks
    .map((task, index) => {
      const checked = progress.tasks[index] ? "checked" : "";
      const done = progress.tasks[index] ? " done" : "";
      return `<label class="task-item${done}">
        <input type="checkbox" data-task="${index}" ${checked} />
        <span>${escapeHtml(task)}</span>
      </label>`;
    })
    .join("");

  els.todayTasks.querySelectorAll("input").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const progress = getDayProgress(currentDay);
      progress.tasks[checkbox.dataset.task] = checkbox.checked;
      progress.completed = day.tasks.length > 0 && day.tasks.every((_, index) => progress.tasks[index]);
      progress.date = todayString();
      saveState();
      renderAll();
    });
  });

  const chapter = getRecommendedChapter(currentDay);
  els.readingPreview.innerHTML = `<strong>${escapeHtml(chapter.title)}</strong><p>${escapeHtml(makeExcerpt(chapter.markdown, 180))}</p>`;
}

function renderChapters() {
  els.chapterList.innerHTML = data.chapters
    .map((chapter) => `<button class="chapter-btn${chapter.id === activeChapterId ? " active" : ""}" data-id="${chapter.id}">${escapeHtml(chapter.title)}</button>`)
    .join("");

  els.chapterList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeChapterId = button.dataset.id;
      renderChapters();
    });
  });

  const chapter = data.chapters.find((item) => item.id === activeChapterId) || data.chapters[0];
  els.chapterReader.innerHTML = renderMarkdown(chapter.markdown);
}

function renderPlan() {
  els.planGrid.innerHTML = data.days
    .map((day) => {
      const progress = getDayProgress(day.day);
      const taskItems = day.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("");
      return `<article class="day-card${progress.completed ? " done" : ""}">
        <h3>Day ${day.day}</h3>
        <p>${escapeHtml(day.title)}</p>
        <ul>${taskItems}</ul>
        <button class="small-btn" data-day="${day.day}" type="button">${progress.completed ? "查看记录" : "去打卡"}</button>
      </article>`;
    })
    .join("");

  els.planGrid.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      currentDay = Number(button.dataset.day);
      state.currentDay = currentDay;
      saveState();
      renderAll();
      showView("dashboard");
    });
  });
}

function renderFocusReaders() {
  const interview = data.chapters.find((chapter) => chapter.file.includes("面试题库"));
  const terms = data.chapters.find((chapter) => chapter.file.includes("术语表"));
  els.interviewReader.innerHTML = renderMarkdown(interview?.markdown || "");
  els.termsReader.innerHTML = renderMarkdown(terms?.markdown || "");
}

function renderSearch(query) {
  const normalized = query.toLowerCase();
  const results = data.chapters
    .map((chapter) => {
      const text = chapter.markdown.replace(/[#|*\-`]/g, " ");
      const index = text.toLowerCase().indexOf(normalized);
      if (index === -1) return null;
      const start = Math.max(0, index - 70);
      const end = Math.min(text.length, index + 170);
      return {
        chapter,
        excerpt: text.slice(start, end).replace(/\s+/g, " ").trim(),
      };
    })
    .filter(Boolean);

  els.searchCount.textContent = `${results.length} 条`;
  els.searchResults.innerHTML =
    results
      .map(
        (result) => `<button class="result-card" data-id="${result.chapter.id}">
          <h3>${escapeHtml(result.chapter.title)}</h3>
          <p>${highlight(escapeHtml(result.excerpt), query)}</p>
        </button>`,
      )
      .join("") || `<p class="reading-preview">没有找到相关内容。换一个关键词试试，比如“转化率”“达人”“Amazon”。</p>`;

  els.searchResults.querySelectorAll(".result-card").forEach((button) => {
    button.addEventListener("click", () => {
      activeChapterId = button.dataset.id;
      renderChapters();
      showView("chapters");
    });
  });
}

function getRecommendedChapter(day) {
  if (day <= 3) return findChapter("基础框架") || data.chapters[1];
  if (day <= 7) return findChapter("数据分析") || data.chapters[2];
  if (day <= 14) return findChapter("TikTok") || data.chapters[3];
  if (day <= 21) return findChapter("平台经营") || data.chapters[4];
  return findChapter("面试题库") || data.chapters[8];
}

function findChapter(keyword) {
  return data.chapters.find((chapter) => chapter.title.includes(keyword) || chapter.file.includes(keyword));
}

function getDay(dayNumber) {
  return data.days.find((day) => day.day === dayNumber) || data.days[0];
}

function getDayProgress(dayNumber) {
  state.days[dayNumber] ||= { tasks: {}, note: "", completed: false, date: "" };
  return state.days[dayNumber];
}

function getSuggestedDay() {
  const firstIncomplete = data?.days?.find((day) => !state.days?.[day.day]?.completed);
  return firstIncomplete?.day || 30;
}

function getStreak() {
  const completedDates = new Set(
    Object.values(state.days)
      .filter((item) => item.completed && item.date)
      .map((item) => item.date),
  );
  let streak = 0;
  const cursor = new Date();
  while (completedDates.has(formatDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function exportRecords() {
  const lines = ["# 跨境运营学习打卡记录", "", `导出时间：${new Date().toLocaleString()}`, ""];
  data.days.forEach((day) => {
    const progress = getDayProgress(day.day);
    lines.push(`## Day ${day.day} ${day.title}`);
    lines.push(`状态：${progress.completed ? "已完成" : "未完成"}`);
    lines.push(`日期：${progress.date || "未记录"}`);
    lines.push("");
    lines.push("任务：");
    day.tasks.forEach((task, index) => {
      lines.push(`- [${progress.tasks[index] ? "x" : " "}] ${task}`);
    });
    lines.push("");
    lines.push("笔记：");
    lines.push(progress.note || "无");
    lines.push("");
  });

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `跨境运营学习记录-${todayString()}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = "";
  let inList = false;
  let inTable = false;
  let tableRows = [];

  const flushList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  const flushTable = () => {
    if (!inTable) return;
    const rows = tableRows.filter((row) => !/^\|\s*-+/.test(row));
    html += "<table>";
    rows.forEach((row, index) => {
      const cells = row
        .split("|")
        .slice(1, -1)
        .map((cell) => `<${index === 0 ? "th" : "td"}>${inlineMarkdown(cell.trim())}</${index === 0 ? "th" : "td"}>`)
        .join("");
      html += `<tr>${cells}</tr>`;
    });
    html += "</table>";
    tableRows = [];
    inTable = false;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (line.includes("|") && /^\|.+\|$/.test(line.trim())) {
      flushList();
      inTable = true;
      tableRows.push(line.trim());
      return;
    }

    flushTable();

    if (!line.trim()) {
      flushList();
      return;
    }

    if (line.startsWith("# ")) {
      flushList();
      html += `<h1>${inlineMarkdown(line.slice(2))}</h1>`;
    } else if (line.startsWith("## ")) {
      flushList();
      html += `<h2>${inlineMarkdown(line.slice(3))}</h2>`;
    } else if (line.startsWith("### ")) {
      flushList();
      html += `<h3>${inlineMarkdown(line.slice(4))}</h3>`;
    } else if (/^\d+\.\s+/.test(line)) {
      flushList();
      html += `<p>${inlineMarkdown(line)}</p>`;
    } else if (line.trim().startsWith("- ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inlineMarkdown(line.trim().slice(2))}</li>`;
    } else {
      flushList();
      html += `<p>${inlineMarkdown(line)}</p>`;
    }
  });

  flushList();
  flushTable();
  return html;
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span>$1</span>');
}

function highlight(text, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "gi"), (match) => `<strong>${match}</strong>`);
}

function makeExcerpt(markdown, length) {
  return markdown
    .replace(/^#+\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/[-*`#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey));
    return { days: {}, ...parsed };
  } catch {
    return { days: {}, currentDay: 1 };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function todayString() {
  return formatDate(new Date());
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

