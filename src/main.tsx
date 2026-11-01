import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  LayoutDashboard,
  PanelsTopLeft,
  FileText,
  Palette,
  ArrowUpRight,
  Plus,
  Search,
  ArrowRight,
  MoreHorizontal,
  Leaf,
  Download,
  Upload,
  Check,
  X,
  ImagePlus,
  ChevronLeft,
  Menu,
  Save,
  Trash2,
  Copy,
} from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "./style.css";

type Category = "此刻有感" | "技术与实践" | "成长手记";
type Draft = {
  id: string;
  title: string;
  category: Category;
  date: string;
  author: string;
  body: string;
  image: string;
  updated: number;
};
type Page = "home" | "covers" | "article" | "guide";
const categories: Category[] = ["此刻有感", "技术与实践", "成长手记"];
const STORAGE = "mins-diary-v1";
const initialBody =
  "有时候，生活的答案，藏在那些不急着赶路的时刻里。\n\n## 把日子，过成自己的节奏\n\n清晨的光落在桌角，咖啡还温热。我开始相信，成长并不总是向前奔跑，也可以是停下来，好好看一看自己。\n\n> 允许自己慢一点，也是一种向前。\n\n我们记录生活，不是为了留下一个完美的版本，而是为了记得：那些微小的、真实的瞬间，曾经照亮过我们。\n\n---\n\n愿我们都能在自己的节奏里，慢慢生长。";
const sample = (title: string, category: Category, days: number): Draft => ({
  id: crypto.randomUUID(),
  title,
  category,
  date: `2026-10-${String(28 - days).padStart(2, "0")}`,
  author: "敏儿",
  body: initialBody,
  image: "",
  updated: Date.now() - days * 86400000,
});
const seeds = [
  sample("在不确定里，\n慢慢生长", "此刻有感", 0),
  sample("与 AI 一起，\n把想法变成日常", "技术与实践", 2),
  sample("允许自己，\n慢一点", "成长手记", 4),
];
function load(): Draft[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE) || "null");
    return Array.isArray(v) && v.every(validDraft) ? v : seeds;
  } catch {
    return seeds;
  }
}
function validDraft(v: unknown): v is Draft {
  if (!v || typeof v !== "object") return false;
  const d = v as Draft;
  return (
    ["id", "title", "date", "author", "body", "image"].every(
      (k) => typeof (d as unknown as Record<string, unknown>)[k] === "string",
    ) &&
    categories.includes(d.category) &&
    Number.isFinite(d.updated) &&
    (!d.image || /^data:image\/(png|jpeg|webp|gif);base64,/.test(d.image))
  );
}
function download(name: string, data: Blob) {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const safeName = (title: string) =>
  title.replace(/[\n\\/:*?"<>|]/g, " ").trim() || "未命名手记";
function renderMarkdown(body: string) {
  return DOMPurify.sanitize(marked.parse(body, { async: false }) as string);
}
const articleCss =
  'body{max-width:640px;margin:40px auto;padding:24px;color:#303734;background:#fff;font:16px/1.9 Georgia,"Songti SC",serif}h1{font-size:28px;line-height:1.5}h2{font-size:21px;margin-top:36px}blockquote{border-left:3px solid #acbfae;background:#f8f6f0;padding:12px 20px;margin:24px 0;color:#425f4d}img{max-width:100%;height:auto}hr{border:0;border-top:1px solid #dde8dc;margin:32px 0}pre{overflow:auto;background:#f8f6f0;padding:16px}a{color:#425f4d}';
async function drawCover(d: Draft, square = false) {
  const canvas = document.createElement("canvas");
  canvas.width = square ? 600 : 900;
  canvas.height = square ? 600 : 383;
  const c = canvas.getContext("2d");
  if (!c) throw Error("浏览器不支持画布");
  const w = canvas.width,
    h = canvas.height,
    ci = categories.indexOf(d.category);
  c.fillStyle = ["#DDE8DC", "#344E40", "#EBE7DC"][ci];
  c.fillRect(0, 0, w, h);
  let ink = ci === 1 ? "#f8f6f0" : "#303734";
  if (d.image) {
    const img = new Image();
    img.src = d.image;
    await img.decode();
    const scale = Math.max(w / img.width, h / img.height);
    c.drawImage(
      img,
      (w - img.width * scale) / 2,
      (h - img.height * scale) / 2,
      img.width * scale,
      img.height * scale,
    );
    c.fillStyle = "rgba(18,35,24,.45)";
    c.fillRect(0, 0, w, h);
    ink = "#fff";
  } else {
    c.save();
    c.translate(w * 0.91, h * 0.66);
    c.rotate(-0.4);
    c.strokeStyle = ci === 1 ? "#7B9680" : "#ACBFAE";
    c.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.ellipse(0, 0, 40 + i * 29, 70 + i * 40, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }
  c.fillStyle = ink;
  c.font = "12px Georgia";
  c.fillText("MIN’S DIARY", 40, 37);
  c.textAlign = "right";
  c.fillText("VOL. " + d.date.slice(5).replace("-", ""), w - 40, 37);
  c.textAlign = "left";
  c.font = "14px sans-serif";
  c.fillText(d.category + "  —", 40, square ? 140 : 100);
  const fontSize = square ? 42 : 46;
  c.font = `${fontSize}px "Songti SC", "Noto Serif CJK SC", serif`;
  const lines: string[] = [];
  for (const para of (d.title || "写下你的故事").split("\n")) {
    let line = "";
    for (const char of para) {
      if (c.measureText(line + char).width > w - 95) {
        lines.push(line);
        line = char;
      } else line += char;
    }
    lines.push(line);
  }
  const maxLines = square ? 6 : 3;
  lines
    .slice(0, maxLines)
    .forEach((line, i) =>
      c.fillText(line, 40, (square ? 200 : 160) + i * (fontSize + 14)),
    );
  c.font = "10px Arial";
  c.fillText(
    d.category === "技术与实践"
      ? "THINK. CREATE. EXPLORE."
      : "A LITTLE LIFE, A LITTLE THOUGHT.",
    40,
    h - 85,
  );
  c.globalAlpha = 0.35;
  c.fillRect(40, h - 57, w - 80, 1);
  c.globalAlpha = 1;
  c.font = "12px sans-serif";
  c.fillText(`敏儿手记  /  ${d.author}`, 40, h - 30);
  c.textAlign = "right";
  c.fillText(d.date.replaceAll("-", "."), w - 40, h - 30);
  return { canvas, tooLong: lines.length > maxLines };
}
function Cover({ draft, small = false }: { draft: Draft; small?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    drawCover(draft)
      .then(({ canvas }) => {
        if (!cancelled && ref.current) {
          ref.current.getContext("2d")?.drawImage(canvas, 0, 0);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [draft]);
  return (
    <div
      className={`cover category-${categories.indexOf(draft.category)} ${small ? "small" : ""}`}
    >
      <canvas
        ref={ref}
        width={900}
        height={383}
        role="img"
        aria-label={`${draft.category}封面：${draft.title}`}
      />
    </div>
  );
}
async function exportCover(d: Draft, square: boolean) {
  const { canvas, tooLong } = await drawCover(d, square);
  if (tooLong) throw Error("标题过长，请缩短标题后导出");
  await new Promise<void>((resolve, reject) =>
    canvas.toBlob((b) => {
      if (b) {
        download(
          `${safeName(d.title)}-${canvas.width}x${canvas.height}.png`,
          b,
        );
        resolve();
      } else reject(Error("导出失败"));
    }, "image/png"),
  );
}
function App() {
  const [drafts, setDrafts] = useState<Draft[]>(load);
  const [page, setPage] = useState<Page>("home");
  const [active, setActive] = useState(drafts[0]?.id || "");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("全部手记");
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const articlePhotoRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const d = drafts.find((x) => x.id === active);
  const notify = (s: string) => setToast(s);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(drafts));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [drafts]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  function update(patch: Partial<Draft>) {
    setDrafts((ds) =>
      ds.map((x) =>
        x.id === active ? { ...x, ...patch, updated: Date.now() } : x,
      ),
    );
  }
  function go(p: Page) {
    setPage(p);
    setMobileNav(false);
    setMenu(null);
  }
  function create(category: Category = "此刻有感", target: Page = "article") {
    const n: Draft = {
      id: crypto.randomUUID(),
      title: "未命名手记",
      category,
      date: new Date().toLocaleDateString("en-CA"),
      author: "敏儿",
      body: "",
      image: "",
      updated: Date.now(),
    };
    setDrafts((ds) => [n, ...ds]);
    setActive(n.id);
    go(target);
  }
  async function upload(file?: File, article = false) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      notify("请选择 JPG、PNG、WebP 或 GIF 图片");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      notify("图片需小于 8 MB");
      return;
    }
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement("canvas");
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      const image = c.toDataURL("image/jpeg", 0.85);
      if (article) {
        insert("\n\n![日常切片](" + image + ")\n\n");
      } else {
        update({ image });
      }
      notify(article ? "正文图片已添加" : "照片已添加");
    } catch {
      notify("无法读取这张图片");
    }
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      if (file.size > 30 * 1024 * 1024) throw Error();
      const parsed = JSON.parse(await file.text());
      const list = Array.isArray(parsed) ? parsed : parsed.drafts;
      if (!Array.isArray(list) || !list.every(validDraft)) throw Error();
      if (
        !window.confirm(
          `将合并导入 ${list.length} 篇手记；同 ID 的现有草稿将被备份覆盖。继续吗？`,
        )
      )
        return;
      setDrafts((ds) => {
        const map = new Map(ds.map((x) => [x.id, x]));
        list.forEach((x) => map.set(x.id, x));
        return [...map.values()];
      });
      notify(`已导入 ${list.length} 篇手记`);
    } catch {
      notify("备份格式无效，请选择工作台导出的 JSON");
    }
  }
  function insert(before: string, after = "") {
    const el = bodyRef.current;
    if (!el || !d) return;
    const start = el.selectionStart,
      end = el.selectionEnd;
    update({
      body:
        d.body.slice(0, start) +
        before +
        d.body.slice(start, end) +
        after +
        d.body.slice(end),
    });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  }
  const filtered = drafts.filter(
    (x) =>
      (filter === "全部手记" || x.category === filter) &&
      (x.title + x.body).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="app">
      <aside className={mobileNav ? "sidebar open" : "sidebar"}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span className="brand-symbol">
            m<span>•</span>
          </span>
          <span>
            Min’s Diary<span className="brand-sub">敏 儿 手 记</span>
          </span>
        </a>
        <div className="workspace-label">PERSONAL WORKSPACE</div>
        <nav>
          {(
            [
              { id: "home", label: "工作台", icon: LayoutDashboard },
              { id: "covers", label: "封面工坊", icon: PanelsTopLeft },
              { id: "article", label: "文章编辑", icon: FileText },
              { id: "guide", label: "视觉规范", icon: Palette },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "nav-item selected" : "nav-item"}
              onClick={() => {
                if ((n.id === "article" || n.id === "covers") && !d) {
                  create("此刻有感", n.id);
                } else go(n.id);
              }}
            >
              <n.icon size={18} />
              {n.label}
              {page === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Leaf size={21} />
          <p>
            记录微小，
            <br />
            也记录生长。
          </p>
          <span>A SPACE TO BE YOURSELF.</span>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">敏</span>
          <div>
            敏儿的创作空间<small>保持好奇，慢慢生长</small>
          </div>
          <span className="online" />
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-toggle icon-btn"
              aria-label="打开导航"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={20} />
            </button>
            <span>我的工作空间</span>
            <span className="breadcrumb"> / </span>
            <strong>
              {
                {
                  home: "工作台",
                  covers: "封面工坊",
                  article: "文章编辑",
                  guide: "视觉规范",
                }[page]
              }
            </strong>
          </div>
          <div className="top-right">
            <span className="local-badge">
              <span />
              {storageError ? "存储空间不足" : "草稿保存在此浏览器"}
            </span>
            <span className="avatar small-avatar">M</span>
          </div>
        </header>
        <main>
          {page === "home" ? (
            <>
              <section className="welcome">
                <div>
                  <div className="eyebrow">YOUR WORDS, YOUR WORLD</div>
                  <h1>
                    把日常，写成自己的故事<span>。</span>
                  </h1>
                  <p>
                    一些生活的切片，一些生长的痕迹。这里是你的安静创作角落。
                  </p>
                </div>
                <button className="button primary" onClick={() => create()}>
                  <Plus size={17} />
                  新建手记
                </button>
              </section>
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-kicker">
                    <span /> MIN’S DIARY STUDIO
                  </span>
                  <h2>
                    记录，是与自己
                    <br />
                    温柔地对话。
                  </h2>
                  <p>
                    让每一个值得记住的瞬间，
                    <br />
                    都有属于它的文字与模样。
                  </p>
                  <button onClick={() => create()}>
                    开始今天的记录 <ArrowRight size={16} />
                  </button>
                </div>
                <div className="hero-visual">
                  <div className="paper paper-back" />
                  <div className="paper paper-front">
                    <div className="paper-brand">
                      MIN’S DIARY <span>手记 / 01</span>
                    </div>
                    <div className="paper-photo">
                      <div className="sun" />
                      <div className="vase" />
                      <div className="stem s1" />
                      <div className="stem s2" />
                      <div className="stem s3" />
                    </div>
                    <div className="paper-caption">
                      在细碎的日常里
                      <br />
                      收集一些光。
                    </div>
                    <div className="paper-foot">
                      LIFE IS IN THE LITTLE THINGS. <span>敏儿手记</span>
                    </div>
                  </div>
                  <span className="hero-side">
                    A QUIET PLACE FOR YOUR THOUGHTS
                  </span>
                  <span className="hero-scribble">
                    a little life, a little thought.
                  </span>
                </div>
              </section>
              <section className="templates-section">
                <div className="section-heading">
                  <h2>
                    从一个灵感开始 <span>CHOOSE YOUR CANVAS</span>
                  </h2>
                  <button className="text-button" onClick={() => go("covers")}>
                    全部封面母版 <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="template-grid">
                  {categories.map((category, i) => (
                    <button
                      className={`template-tile tile-${i}`}
                      key={category}
                      onClick={() => create(category, "covers")}
                    >
                      <span className="tile-icon">
                        {i === 0 ? (
                          <Leaf size={21} />
                        ) : i === 1 ? (
                          <span className="code-symbol">⌘</span>
                        ) : (
                          <BookOpen size={21} />
                        )}
                      </span>
                      <div>
                        <h3>{category}</h3>
                        <p>
                          {
                            [
                              "生活碎片 · 灵感与感受",
                              "AI 探索 · 项目与实践",
                              "自我对话 · 成长与思考",
                            ][i]
                          }
                        </p>
                      </div>
                      <ArrowUpRight size={18} />
                    </button>
                  ))}
                </div>
              </section>
              <section className="drafts-section">
                <div className="section-heading">
                  <h2>
                    我的手记 <span className="count">{drafts.length}</span>
                  </h2>
                  <div className="draft-actions">
                    <button
                      className="text-button"
                      onClick={() => importRef.current?.click()}
                    >
                      <Upload size={14} />
                      导入备份
                    </button>
                    <button
                      className="text-button"
                      onClick={() =>
                        download(
                          "mins-diary-backup.json",
                          new Blob(
                            [JSON.stringify({ version: 1, drafts }, null, 2)],
                            { type: "application/json" },
                          ),
                        )
                      }
                    >
                      <Download size={14} />
                      导出备份
                    </button>
                  </div>
                </div>
                <div className="filter-bar">
                  <div className="tabs">
                    {["全部手记", ...categories].map((x) => (
                      <button
                        className={filter === x ? "active" : ""}
                        key={x}
                        onClick={() => setFilter(x)}
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                  <label className="search">
                    <Search size={16} />
                    <input
                      placeholder="搜索手记…"
                      aria-label="搜索手记"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                </div>
                <div className="draft-grid">
                  {filtered.map((x) => (
                    <article className="draft-card" key={x.id}>
                      <button
                        className="cover-link"
                        aria-label={`编辑 ${x.title}`}
                        onClick={() => {
                          setActive(x.id);
                          go("article");
                        }}
                      >
                        <Cover draft={x} small />
                      </button>
                      <div className="draft-info">
                        <div className="draft-meta">
                          <span
                            className={`category-tag tag-${categories.indexOf(x.category)}`}
                          >
                            {x.category}
                          </span>
                          <div className="menu-wrap">
                            <button
                              className="icon-btn"
                              aria-label={`管理 ${x.title}`}
                              onClick={() =>
                                setMenu(menu === x.id ? null : x.id)
                              }
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            {menu === x.id && (
                              <div className="dropdown">
                                <button
                                  onClick={() => {
                                    setActive(x.id);
                                    go("covers");
                                  }}
                                >
                                  <PanelsTopLeft size={14} />
                                  编辑封面
                                </button>
                                <button
                                  onClick={() => {
                                    setDrafts((ds) => [
                                      {
                                        ...x,
                                        id: crypto.randomUUID(),
                                        title: x.title + " · 副本",
                                        updated: Date.now(),
                                      },
                                      ...ds,
                                    ]);
                                    setMenu(null);
                                  }}
                                >
                                  <Copy size={14} />
                                  复制手记
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "确定删除这篇手记？建议先导出备份。",
                                      )
                                    )
                                      setDrafts((ds) =>
                                        ds.filter((a) => a.id !== x.id),
                                      );
                                    setMenu(null);
                                  }}
                                >
                                  <Trash2 size={14} />
                                  删除手记
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          className="draft-title"
                          onClick={() => {
                            setActive(x.id);
                            go("article");
                          }}
                        >
                          {x.title.replaceAll("\n", "")}
                        </button>
                        <div className="draft-bottom">
                          <span>
                            {x.date.replaceAll("-", ".")} <i>·</i>{" "}
                            {x.body.replace(/\s/g, "").length} 字
                          </span>
                          <span>
                            <span className="status-dot" />
                            草稿
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {!filtered.length && (
                  <div className="empty">
                    <BookOpen />
                    <p>这里还没有手记，让第一个灵感落在纸上。</p>
                    <button className="button" onClick={() => create()}>
                      新建手记
                    </button>
                  </div>
                )}
              </section>
              <footer className="main-footer">
                <span>用文字安放想法，让日常留下回响。</span>
                <span>
                  MADE FOR SLOW, THOUGHTFUL CREATION <Leaf size={13} />
                </span>
              </footer>
            </>
          ) : page === "guide" ? (
            <>
              <div className="page-heading">
                <div className="eyebrow">THE VISUAL LANGUAGE</div>
                <h1>安静，自有力量。</h1>
                <p>敏儿手记的视觉规范 · 在每一次表达中，保持自己的节奏。</p>
              </div>
              <section className="guide-panel">
                <h2>01 / 品牌色彩</h2>
                <div className="swatches">
                  {[
                    ["米白", "#F8F6F0"],
                    ["浅绿", "#DDE8DC"],
                    ["鼠尾草绿", "#ACBFAE"],
                    ["深绿", "#425F4D"],
                    ["深灰", "#303734"],
                  ].map(([name, color]) => (
                    <div key={color}>
                      <div style={{ background: color }} />
                      <strong>{name}</strong>
                      <code>{color}</code>
                    </div>
                  ))}
                </div>
                <h2>02 / 字体与表达</h2>
                <div className="type-sample">
                  <h1>把日常，写成自己的故事。</h1>
                  <p>
                    标题使用系统宋体衬线字，正文使用清晰的系统无衬线字。无需外部字体请求，适配
                    Chrome 与 Safari。
                  </p>
                  <small>
                    中文：Songti SC / Noto Serif CJK SC /
                    serif　·　英文：Georgia
                  </small>
                </div>
                <h2>03 / 阅读的节奏</h2>
                <div className="guide-reading article-content">
                  <h2>给想法一些呼吸的空间</h2>
                  <p>
                    正文 16px，行高
                    1.9。段落之间保留舒适距离，单栏阅读，用留白而非装饰建立秩序。
                  </p>
                  <blockquote>记录微小，也记录生长。</blockquote>
                  <hr />
                  <p>
                    封面主图 900 × 383 px，方形缩略图 600 × 600
                    px。发布前请检查微信后台的实际显示效果。
                  </p>
                </div>
              </section>
            </>
          ) : d ? (
            <>
              <div className="editor-heading">
                <div>
                  <button className="text-button" onClick={() => go("home")}>
                    <ChevronLeft size={14} />
                    返回工作台
                  </button>
                  <h1>
                    {page === "covers"
                      ? "让文字，有自己的模样。"
                      : "写下此刻，留给以后的自己。"}
                  </h1>
                </div>
                <span className="saved-label">
                  <Check size={14} />
                  {storageError ? "未能保存，请导出备份" : "已自动保存"}
                </span>
              </div>
              <div className="editor-tabs">
                <button
                  className={page === "covers" ? "active" : ""}
                  onClick={() => go("covers")}
                >
                  <PanelsTopLeft size={16} />
                  封面设计
                </button>
                <button
                  className={page === "article" ? "active" : ""}
                  onClick={() => go("article")}
                >
                  <FileText size={16} />
                  文章编辑
                </button>
              </div>
              {page === "covers" ? (
                <div className="cover-editor">
                  <section className="editor-panel">
                    <h2>
                      封面设置 <span>COVER SETTINGS</span>
                    </h2>
                    <div className="field-group">
                      <span>选择栏目</span>
                      <div className="category-options">
                        {categories.map((x) => (
                          <button
                            key={x}
                            className={d.category === x ? "chosen" : ""}
                            onClick={() => update({ category: x })}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label>
                      封面标题
                      <textarea
                        rows={3}
                        maxLength={64}
                        value={d.title}
                        onChange={(e) => update({ title: e.target.value })}
                      />
                      <small>建议 8–20 字，换行可控制标题节奏</small>
                    </label>
                    <div className="form-row">
                      <label>
                        日期
                        <input
                          type="date"
                          value={d.date}
                          onChange={(e) => update({ date: e.target.value })}
                        />
                      </label>
                      <label>
                        署名
                        <input
                          value={d.author}
                          maxLength={24}
                          onChange={(e) => update({ author: e.target.value })}
                        />
                      </label>
                    </div>
                    <div className="field-group">
                      <span>封面照片（可选）</span>
                      <button
                        className="upload-area"
                        onClick={() => photoRef.current?.click()}
                      >
                        <ImagePlus size={24} />
                        <span>
                          {d.image ? "替换照片" : "添加一张日常的切片"}
                        </span>
                        <small>JPG / PNG / WebP · 最大 8 MB</small>
                      </button>
                    </div>
                    {d.image && (
                      <button
                        className="text-button"
                        onClick={() => update({ image: "" })}
                      >
                        <X size={14} />
                        移除照片，使用母版底纹
                      </button>
                    )}
                    <p className="subtle-note">
                      上传的照片仅保存在当前浏览器，不会发送到服务器。
                    </p>
                  </section>
                  <section className="preview-panel">
                    <div className="preview-label">
                      <span>实时预览</span>
                      <span>900 × 383 PX</span>
                    </div>
                    <Cover draft={d} />
                    <div className="export-row">
                      <div>
                        <h3>为你的下一次发布准备好</h3>
                        <p>导出高清 PNG，可直接上传至微信公众号。</p>
                      </div>
                      <div className="export-buttons">
                        <button
                          className="button"
                          onClick={() =>
                            exportCover(d, true)
                              .then(() => notify("方形缩略图已导出"))
                              .catch((e) => notify(e.message))
                          }
                        >
                          <Download size={15} />
                          方形 600 × 600
                        </button>
                        <button
                          className="button primary"
                          onClick={() =>
                            exportCover(d, false)
                              .then(() => notify("主封面已导出"))
                              .catch((e) => notify(e.message))
                          }
                        >
                          <Download size={15} />
                          导出主封面
                        </button>
                      </div>
                    </div>
                    <div className="cover-tip">
                      <Leaf size={18} />
                      <p>让标题有呼吸感。少一点信息，多一点留白。</p>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="article-editor">
                  <section className="writing-panel">
                    <div className="writing-top">
                      <span>MARKDOWN 编辑器</span>
                      <span>{d.body.replace(/\s/g, "").length} 字</span>
                    </div>
                    <input
                      className="article-title-input"
                      aria-label="文章标题"
                      placeholder="为这篇手记起个名字"
                      value={d.title.replaceAll("\n", "")}
                      onChange={(e) => update({ title: e.target.value })}
                    />
                    <div className="toolbar">
                      <button title="二级标题" onClick={() => insert("\n## ")}>
                        H2
                      </button>
                      <button title="加粗" onClick={() => insert("**", "**")}>
                        <b>B</b>
                      </button>
                      <button title="引用" onClick={() => insert("\n> ")}>
                        ❞
                      </button>
                      <button
                        title="分割线"
                        onClick={() => insert("\n\n---\n\n")}
                      >
                        —
                      </button>
                      <button
                        title="上传正文图片"
                        aria-label="上传正文图片"
                        onClick={() => articlePhotoRef.current?.click()}
                      >
                        <Upload size={16} />
                      </button>
                      <button
                        title="图片链接"
                        onClick={() => insert("![图片说明](", ")")}
                      >
                        <ImagePlus size={17} />
                      </button>
                      <span>支持 Markdown · 本地图片或 HTTPS 链接</span>
                    </div>
                    <textarea
                      ref={bodyRef}
                      className="body-editor"
                      aria-label="Markdown 正文"
                      placeholder="从一个念头开始…\n\n支持 Markdown 标题、引用、列表、分割线和图片。"
                      value={d.body}
                      onChange={(e) => update({ body: e.target.value })}
                    />
                    <div className="article-export">
                      <button
                        className="button"
                        onClick={() =>
                          download(
                            safeName(d.title) + ".md",
                            new Blob(["# " + d.title + "\n\n" + d.body], {
                              type: "text/markdown;charset=utf-8",
                            }),
                          )
                        }
                      >
                        <Download size={15} />
                        Markdown
                      </button>
                      <button
                        className="button primary"
                        onClick={() => {
                          const title = DOMPurify.sanitize(d.title, {
                            ALLOWED_TAGS: [],
                          });
                          download(
                            safeName(d.title) + ".html",
                            new Blob(
                              [
                                `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${title}</title><style>${articleCss}</style><body><h1>${title}</h1>${renderMarkdown(d.body)}</body></html>`,
                              ],
                              { type: "text/html;charset=utf-8" },
                            ),
                          );
                          notify("HTML 已导出，微信后台可能过滤部分样式");
                        }}
                      >
                        <Download size={15} />
                        导出 HTML
                      </button>
                    </div>
                    <p className="subtle-note">
                      微信后台可能过滤部分 HTML
                      和样式，请粘贴后检查排版，并重新上传图片。
                    </p>
                  </section>
                  <section className="phone-preview">
                    <div className="preview-label">
                      <span>手机阅读预览</span>
                      <span>LIVE PREVIEW</span>
                    </div>
                    <div className="phone">
                      <div className="phone-top">
                        9:41 <span>••• ▰</span>
                      </div>
                      <div className="phone-scroll">
                        <h1>{d.title || "未命名手记"}</h1>
                        <div className="wechat-meta">
                          <span>{d.author || "敏儿"}</span> 敏儿手记{" "}
                          <span>{d.date}</span>
                        </div>
                        <div
                          className="article-content"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(d.body),
                          }}
                        />
                        <div className="article-end">
                          — 敏儿手记 —<small>记录微小，也记录生长。</small>
                        </div>
                      </div>
                      <div className="phone-home" />
                    </div>
                  </section>
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <p>选择一篇手记，或开始新的记录。</p>
              <button className="button primary" onClick={() => create()}>
                新建手记
              </button>
            </div>
          )}
        </main>
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        ref={articlePhotoRef}
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0], true);
          e.target.value = "";
        }}
      />
      <input
        type="file"
        accept="application/json,.json"
        ref={importRef}
        hidden
        onChange={(e) => {
          importBackup(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        ref={photoRef}
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {storageError && (
        <div className="storage-warning">
          <Save size={16} />
          浏览器存储空间不足，最新修改尚未保存。请返回工作台导出 JSON 备份。
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
