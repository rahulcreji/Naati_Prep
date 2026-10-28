// Home page: every domain (category) from manifest.json, with a search over all dialogues.
// Domain page (#/<category>): the dialogues in that domain.
// Conversation page (#/<category>/<conversation>): every segment's question audio, with its answer
// audio hidden behind a "Show answer" button.

const app = document.getElementById("app");
let conversations = [];

// Line icons (24x24) for each domain, by lowercase folder name
const DOMAIN_ICONS = {
  "business": '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  "community": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "consumer affairs": '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  "education": '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  "employment": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/>',
  "finance": '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/>',
  "health": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  "housing": '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  "immigration": '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  "insurance": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  "legal": '<path d="M12 3v18"/><path d="M7 21h10"/><path d="M4 7h16"/><path d="m7 7-3 7a3 3 0 0 0 6 0z"/><path d="m17 7-3 7a3 3 0 0 0 6 0z"/>',
  "social service": '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>',
};
const DEFAULT_ICON = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>';

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';

// Words kept lowercase when an ALL-CAPS title is turned into Title Case
const SMALL_WORDS = new Set(["a", "an", "and", "at", "for", "in", "of", "on", "or", "the", "to", "with"]);

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function icon(markup, className = "icon") {
  const span = el("span", { class: className, "aria-hidden": "true" });
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`;
  return span;
}

function domainIcon(category) {
  return icon(DOMAIN_ICONS[category.toLowerCase()] || DEFAULT_ICON, "domain-icon");
}

function audioUrl(conversation, file) {
  return [...conversation.path.split("/"), ...file.split("/")].map(encodeURIComponent).join("/");
}

function link(path) {
  return "#/" + encodeURIComponent(path);
}

// "business" -> "Business", so every domain name starts with a capital letter
function domainTitle(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// Folder name -> dialogue number and a tidy title, e.g. "83. .CAR ACCIDENT IN LAWYERS CHAMBER" ->
// 83, "Car Accident in Lawyers Chamber"; "17. Fallen_Tree_Due_to_Storm_Edited" -> 17, "Fallen Tree Due to Storm"
function parseTitle(name) {
  const match = name.match(/^(\d+)[\s.]*(.*)$/);
  let title = match ? match[2] : name;
  title = title
    .replace(/_s\b/g, "’s")
    .replace(/_/g, " ")
    .replace(/\s+(new\s+)?edite?d$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (/[A-Z]/.test(title) && title === title.toUpperCase()) {
    title = title.toLowerCase().split(" ")
      .map((word, i) => (i > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join(" ");
  }
  title = title.charAt(0).toUpperCase() + title.slice(1);
  return { number: match ? match[1] : "", title: title || name };
}

// Domains in manifest order (build_manifest.py sorts them by name)
function categories() {
  return [...new Set(conversations.map((c) => c.category))];
}

function inCategory(category) {
  return conversations.filter((c) => c.category === category);
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function breadcrumb(...items) {
  // items: [label, href] pairs, the last one is the current page and has no link
  const nav = el("nav", { class: "breadcrumb", "aria-label": "Breadcrumb" });
  items.forEach(([label, href], i) => {
    if (i > 0) nav.append(el("span", { class: "sep", "aria-hidden": "true" }, "/"));
    nav.append(href ? el("a", { href }, label) : el("span", { "aria-current": "page" }, label));
  });
  return nav;
}

function searchBox(placeholder, onSearch) {
  const input = el("input", { type: "search", placeholder, "aria-label": placeholder, autocomplete: "off" });
  input.addEventListener("input", () => onSearch(input.value.trim().toLowerCase()));
  return el("label", { class: "search" },
    icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    input);
}

function conversationList(list, showDomain) {
  const ul = el("ul", { class: "conversation-list" });
  for (const conversation of list) {
    const { number, title } = parseTitle(conversation.title);
    const meta = [plural(conversation.segments.length, "segment")];
    if (showDomain) meta.unshift(domainTitle(conversation.category));
    ul.append(el("li", {},
      el("a", { href: link(conversation.path) },
        el("span", { class: "dialogue-number" }, number || "–"),
        el("span", { class: "dialogue-text" },
          el("span", { class: "dialogue-title" }, title),
          el("span", { class: "meta" }, meta.join(" · "))),
        icon('<path d="m9 18 6-6-6-6"/>', "chevron"))));
  }
  return ul;
}

function matches(conversation, query) {
  const text = `${parseTitle(conversation.title).title} ${conversation.title} ${conversation.category}`.toLowerCase();
  return query.split(/\s+/).every((word) => text.includes(word));
}

function showHome() {
  document.title = "NAATI CCL Practice – English ⇄ Malayalam";
  const segmentCount = conversations.reduce((sum, c) => sum + c.segments.length, 0);

  const hero = el("section", { class: "hero" },
    el("div", { class: "container" },
      el("p", { class: "eyebrow" }, "NAATI CCL · Malayalam"),
      el("h1", {}, "Practise interpreting with real dialogue segments"),
      el("p", { class: "lead" },
        "Listen to each segment, interpret it into the other language, then compare your version with a model answer."),
      el("dl", { class: "stats" },
        el("div", {}, el("dt", {}, "Domains"), el("dd", {}, String(categories().length))),
        el("div", {}, el("dt", {}, "Dialogues"), el("dd", {}, String(conversations.length))),
        el("div", {}, el("dt", {}, "Segments"), el("dd", {}, String(segmentCount))))));

  const steps = el("ol", { class: "steps" },
    ...[
      ["Listen", "Play the question for a segment in English or Malayalam."],
      ["Interpret", "Pause and say your interpretation in the other language."],
      ["Compare", "Reveal the model answer and check your interpretation."],
    ].map(([title, text], i) =>
      el("li", {}, el("span", { class: "step-number" }, String(i + 1)),
        el("div", {}, el("h3", {}, title), el("p", {}, text)))));

  const grid = el("ul", { class: "domain-grid" });
  for (const category of categories()) {
    const list = inCategory(category);
    grid.append(el("li", {},
      el("a", { href: link(category) },
        domainIcon(category),
        el("span", { class: "domain-name" }, domainTitle(category)),
        el("span", { class: "meta" },
          `${plural(list.length, "dialogue")} · ${plural(list.reduce((s, c) => s + c.segments.length, 0), "segment")}`))));
  }

  const results = el("div", { class: "hidden" });
  const search = searchBox("Search all dialogues", (query) => {
    grid.classList.toggle("hidden", Boolean(query));
    results.classList.toggle("hidden", !query);
    if (!query) return;
    const found = conversations.filter((c) => matches(c, query));
    results.replaceChildren(found.length
      ? conversationList(found, true)
      : el("p", { class: "empty" }, "No dialogues match your search."));
  });

  app.replaceChildren(
    hero,
    el("div", { class: "container" },
      steps,
      el("div", { class: "section-head" },
        el("div", {}, el("h2", {}, "Browse by domain"), el("p", { class: "muted" }, "Choose a topic area to see its dialogues.")),
        search),
      conversations.length ? grid : el("p", { class: "empty" }, "No dialogues yet."),
      results));
  window.scrollTo(0, 0);
}

function showCategory(category) {
  document.title = domainTitle(category) + " – NAATI CCL Practice";
  const list = inCategory(category);
  const listArea = el("div", {}, conversationList(list, false));
  const search = searchBox(`Search ${domainTitle(category)}`, (query) => {
    const found = query ? list.filter((c) => matches(c, query)) : list;
    listArea.replaceChildren(found.length
      ? conversationList(found, false)
      : el("p", { class: "empty" }, "No dialogues match your search."));
  });

  app.replaceChildren(el("div", { class: "container page" },
    breadcrumb(["Home", "#"], [domainTitle(category)]),
    el("div", { class: "page-head" },
      domainIcon(category),
      el("div", {},
        el("h1", {}, domainTitle(category)),
        el("p", { class: "muted" },
          `${plural(list.length, "dialogue")} · ${plural(list.reduce((s, c) => s + c.segments.length, 0), "segment")}`))),
    el("div", { class: "toolbar" }, search),
    listArea));
  window.scrollTo(0, 0);
}

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function player(conversation, audio, label) {
  const sound = el("audio", { preload: "none", src: audioUrl(conversation, audio.file) });
  const button = el("button", { class: "play", type: "button" });
  const seek = el("input", { class: "seek", type: "range", min: "0", max: "100", step: "0.1", value: "0", "aria-label": `${label} position` });
  const time = el("span", { class: "time" }, "0:00");

  function update() {
    const progress = sound.duration ? (sound.currentTime / sound.duration) * 100 : 0;
    seek.value = progress;
    seek.style.setProperty("--progress", `${progress}%`);
    time.textContent = sound.duration
      ? `${formatTime(sound.currentTime)} / ${formatTime(sound.duration)}`
      : formatTime(sound.currentTime);
  }

  function setPlaying(playing) {
    button.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
    button.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${label}`);
    button.classList.toggle("playing", playing);
  }

  button.addEventListener("click", () => (sound.paused ? sound.play() : sound.pause()));
  seek.addEventListener("input", () => {
    if (sound.duration) sound.currentTime = (seek.value / 100) * sound.duration;
  });
  sound.addEventListener("play", () => setPlaying(true));
  sound.addEventListener("pause", () => setPlaying(false));
  sound.addEventListener("timeupdate", update);
  sound.addEventListener("loadedmetadata", update);
  setPlaying(false);

  return el("div", { class: "player" }, button, seek, time, sound);
}

function part(kind, conversation, segment) {
  const audio = segment[kind];
  const label = `${kind === "question" ? "Question" : "Answer"}, segment ${segment.number}`;
  return el("div", { class: `part ${kind}` },
    el("div", { class: "part-label" },
      el("span", {}, kind === "question" ? "Question" : "Model answer"),
      el("span", { class: `lang lang-${audio.language.toLowerCase()}` }, audio.language)),
    player(conversation, audio, label));
}

function showConversation(conversation) {
  const { number, title } = parseTitle(conversation.title);
  document.title = title + " – NAATI CCL Practice";
  const answerParts = [];
  const answerButtons = [];

  function setAnswerVisible(index, visible) {
    answerParts[index].classList.toggle("hidden", !visible);
    answerButtons[index].replaceChildren(
      icon(visible
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="m1 1 22 22"/>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
      visible ? "Hide answer" : "Show answer");
    answerButtons[index].setAttribute("aria-expanded", String(visible));
  }

  const segments = conversation.segments.map((segment, index) => {
    const box = el("section", { class: "segment" },
      el("div", { class: "segment-head" },
        el("span", { class: "segment-number" }, String(segment.number)),
        el("h2", {}, `Segment ${segment.number}`)));
    if (segment.question) box.append(part("question", conversation, segment));
    if (segment.answer) {
      const answer = part("answer", conversation, segment);
      const button = el("button", {
        class: "reveal",
        type: "button",
        onclick: () => setAnswerVisible(index, answer.classList.contains("hidden")),
      });
      answerParts[index] = answer;
      answerButtons[index] = button;
      box.append(button, answer);
      setAnswerVisible(index, false);
    }
    return box;
  });

  let allShown = false;
  const toggleAll = el("button", {
    class: "button-secondary",
    type: "button",
    onclick: () => {
      allShown = !allShown;
      answerParts.forEach((_, index) => answerParts[index] && setAnswerVisible(index, allShown));
      toggleAll.textContent = allShown ? "Hide all answers" : "Show all answers";
    },
  }, "Show all answers");

  // Previous / next dialogue in the same domain
  const siblings = inCategory(conversation.category);
  const position = siblings.indexOf(conversation);
  const pager = el("nav", { class: "pager", "aria-label": "More dialogues" });
  for (const [offset, label, className] of [[-1, "Previous dialogue", "prev"], [1, "Next dialogue", "next"]]) {
    const other = siblings[position + offset];
    pager.append(other
      ? el("a", { class: className, href: link(other.path) },
        el("span", { class: "pager-label" }, label),
        el("span", { class: "pager-title" }, parseTitle(other.title).title))
      : el("span", {}));
  }

  app.replaceChildren(el("div", { class: "container narrow page" },
    breadcrumb(["Home", "#"], [domainTitle(conversation.category), link(conversation.category)], [title]),
    el("div", { class: "conversation-head" },
      el("p", { class: "eyebrow" }, `${domainTitle(conversation.category)}${number ? ` · Dialogue ${number}` : ""}`),
      el("h1", {}, title),
      el("p", { class: "muted" },
        `${plural(conversation.segments.length, "segment")} · Listen to each question, interpret it, then reveal the model answer.`)),
    el("div", { class: "toolbar sticky" },
      el("span", { class: "muted" }, `Dialogue ${position + 1} of ${siblings.length} in ${domainTitle(conversation.category)}`),
      toggleAll),
    ...segments,
    pager));
  window.scrollTo(0, 0);
}

function route() {
  const path = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const conversation = conversations.find((c) => c.path === path);
  if (conversation) showConversation(conversation);
  else if (categories().includes(path)) showCategory(path);
  else showHome();
}

// Only one recording plays at a time
document.addEventListener("play", (event) => {
  for (const audio of document.querySelectorAll("audio")) {
    if (audio !== event.target) audio.pause();
  }
}, true);

window.addEventListener("hashchange", route);

fetch("manifest.json", { cache: "no-cache" })
  .then((response) => response.json())
  .then((data) => {
    conversations = data.conversations;
    route();
  })
  .catch(() => {
    app.replaceChildren(el("p", { class: "status" }, "Could not load the dialogue list."));
  });
