// Home page: list of conversations from manifest.json.
// Conversation page (#/<category>/<conversation>): every segment's question audio, with its answer
// audio hidden behind a "Show answer" button.

const app = document.getElementById("app");
let conversations = [];

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

function audioUrl(conversation, file) {
  return [...conversation.path.split("/"), ...file.split("/")].map(encodeURIComponent).join("/");
}

function showHome() {
  document.title = "NAATI Practice Dialogues";
  const list = el("ul", { class: "conversation-list" });
  for (const conversation of conversations) {
    list.append(el("li", {},
      el("a", { href: "#/" + encodeURIComponent(conversation.path) },
        conversation.title,
        el("span", { class: "meta" }, `${conversation.segments.length} segments`))));
  }
  app.replaceChildren(conversations.length ? list : el("p", { class: "status" }, "No conversations yet."));
}

function part(kind, conversation, audio) {
  return el("div", { class: `part ${kind}` },
    el("div", { class: "label" }, kind === "question" ? "Question" : "Answer", el("span", { class: "lang" }, audio.language)),
    el("audio", { controls: "", preload: "none", src: audioUrl(conversation, audio.file) }));
}

function showConversation(conversation) {
  document.title = conversation.title + " – NAATI Practice Dialogues";
  const answerParts = [];
  const answerButtons = [];

  function setAnswerVisible(index, visible) {
    answerParts[index].classList.toggle("hidden", !visible);
    answerButtons[index].textContent = visible ? "Hide answer" : "Show answer";
  }

  const segments = conversation.segments.map((segment, index) => {
    const box = el("section", { class: "segment" }, el("h3", {}, `Segment ${segment.number}`));
    if (segment.question) box.append(part("question", conversation, segment.question));
    if (segment.answer) {
      const answer = part("answer", conversation, segment.answer);
      const button = el("button", {
        onclick: () => setAnswerVisible(index, answer.classList.contains("hidden")),
      });
      answerParts[index] = answer;
      answerButtons[index] = button;
      box.append(el("div", { class: "part" }, button), answer);
      setAnswerVisible(index, false);
    }
    return box;
  });

  let allShown = false;
  const toggleAll = el("button", {
    onclick: () => {
      allShown = !allShown;
      answerParts.forEach((_, index) => setAnswerVisible(index, allShown));
      toggleAll.textContent = allShown ? "Hide all answers" : "Show all answers";
    },
  }, "Show all answers");

  app.replaceChildren(
    el("a", { class: "back", href: "#" }, "← All conversations"),
    el("h2", {}, conversation.title),
    el("div", { class: "toolbar" }, toggleAll),
    ...segments);
  window.scrollTo(0, 0);
}

function route() {
  const path = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const conversation = conversations.find((c) => c.path === path);
  if (conversation) showConversation(conversation);
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
    app.replaceChildren(el("p", { class: "status" }, "Could not load the conversation list."));
  });
