// Home page (#): the domains (categories) from manifest.json, with a search over all dialogues.
// Domain page (#/<category>): the dialogues in that domain, numbered 1, 2, 3... in order.
// Dialogue page (#/<category>/<dialogue>): every segment's question audio, with its model answer hidden behind
// a "Show answer" button. If the dialogue folder has a transcript.json, its text can be shown too.
// Progress (which answers were revealed) is kept in this browser's localStorage.

const app = document.getElementById("app");
let conversations = [];

// ---------------------------------------------------------------------------------------------------------
// Domains: icon (24x24 line drawing) and colour, by lowercase folder name

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

const DOMAIN_COLORS = {
  "business": "#2563eb",
  "community": "#7c3aed",
  "consumer affairs": "#db2777",
  "education": "#0891b2",
  "employment": "#ea580c",
  "finance": "#059669",
  "health": "#dc2626",
  "housing": "#b45309",
  "immigration": "#4f46e5",
  "insurance": "#0d9488",
  "legal": "#475569",
  "social service": "#e11d48",
};
const DEFAULT_COLOR = "#134faa";

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="m1 1 22 22"/>',
  headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/><path d="M8 22h8"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/>',
  text: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  play: '<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  scale: '<path d="M12 3v18"/><path d="M5 21h14"/><path d="M3 9l4-6 4 6a4 4 0 0 1-8 0z"/><path d="M13 9l4-6 4 6a4 4 0 0 1-8 0z"/>',
};

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';

// Playback speeds in the speed menu. The chosen speed applies to every recording and is remembered
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];
const SPEED_KEY = "tlf-naati-speed-v1";

function loadSpeed() {
  try {
    const saved = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(saved) ? saved : 1;
  } catch {
    return 1;
  }
}

let playbackSpeed = loadSpeed();

function setSpeed(speed) {
  playbackSpeed = speed;
  try {
    localStorage.setItem(SPEED_KEY, String(speed));
  } catch {
    // ignore
  }
  for (const menu of document.querySelectorAll("select.speed")) menu.value = String(speed);
  for (const audio of document.querySelectorAll("audio")) audio.playbackRate = speed;
}

// ---------------------------------------------------------------------------------------------------------
// Titles: the folder names come from the PDF names, which are often cut off, in capitals or misspelled.
// These are the clean titles shown on the site, by folder name (the dialogue's "title" in manifest.json).
// Folders not listed here get an automatic clean-up (number, underscores and "Edited" removed, Title Case).

const TITLE_OVERRIDES = {
  "2. Conversation Between a Buyer and a Real Estate Agent": "A Buyer and a Real Estate Agent",
  "3. A small manufacturing business between Ibrahim Musa and Natalia Nadeem, the": "A Small Business Owner and the Union Representative",
  "4. Phone conversation between a business owner and the owner of a printing press": "A Phone Call with a Printing Press",
  "5 Phone conversation between a business owner and the owner of a printing press": "A Phone Call with a Printing Press",
  "6. Real Estate Agent and Inspection": "A Real Estate Agent and a Property Inspection",
  "6 New resident in the neighbourhood and Alice": "A New Resident in the Neighbourhood",
  "13. An officer at the community center and a person who wants to enroll her name": "Enrolling for the National Election",
  "17. Asking Neighbor’s help for hanging Curtain": "Asking a Neighbour to Help Hang Curtains",
  "22 A Friendly Chat Over Coffee – Brenda & Her Friend at the Farmer’s Market": "A Friendly Chat at the Farmers’ Market",
  "22. Cutting Trees": "An Unfinished Tree-Cutting Job",
  "23. Divorce Woman": "Advice on a Divorce",
  "24. Fence Dog": "A Broken Fence and the Neighbour’s Dog",
  "70. CONSUMER AFFAIRS CONCERT EVENT TICKET CANCELLATION": "Cancelling a Concert Ticket",
  "76. LOCAL COUNCIL OFFICER ON STOLEN": "A Stolen Rubbish Bin",
  "86. Story telling program for children": "A Storytelling Program for Children",
  "88. Cutting branch": "Cutting Overhanging Branches",
  "3. Vaccum Cleaner": "A Vacuum Cleaner",
  "19. Digital Customer Management System project, New": "A Digital Customer Management System",
  "36. DOG Adoption": "Dog Adoption",
  "81. SECOND HAND CAR BUYING": "Buying a Second-Hand Car",
  "89. . Conversation between cloth store employee and the customer regarding the": "A Clothing Store’s Rewards Program",
  "7. A Parent And The Dance Academy Teacher": "A Parent and the Dance Academy Teacher",
  "9. A mother and a class teacher regarding her daughter’s English language": "A Daughter’s English Language Skills",
  "37. conversation is between teacher and a parent regarding Welcome day of school": "School Welcome Day",
  "90. Conversation is between teacher and a parent regarding Welcome day of school": "School Welcome Day",
  "49. To get transfer certificate in the Middle of the semester": "A Transfer Certificate Mid-Semester",
  "61. Education": "Enrolling a Daughter at School",
  "74. JOINING DAUGHTER TO SWIMMING CLASS": "Enrolling a Daughter in Swimming Classes",
  "77. NAATI TRANSLATOR DIALOGUE": "NAATI Translator Dialogue",
  "2. Employee & Tax Officer Conversation": "An Employee and a Tax Officer",
  "5. employee who has taken leave to take care of his sick son": "Leave to Care for a Sick Son",
  "92.Dialogue is between an employee who has taken leave to take care of his sick": "Leave to Care for a Sick Son",
  "6. A cafe employee and the manager regarding a new employee": "A Café Employee and the Manager",
  "13. Working mom who is speaking to a manager in the workplace about leaving": "Leaving Work Early for a Sick Daughter",
  "63. Interview- Manager and Job Seeker": "A Job Interview",
  "75. LAUNDRY JOB HIRE": "Hiring for a Laundry Job",
  "82. SHOP ASSISTANCE WORKING": "Working as a Shop Assistant",
  "7. Bank Employ and old Man on Credit Card": "An Elderly Man’s Credit Card",
  "12. A bank employee and an entrepreneur who wants to start a fashion design": "A Loan for a Fashion Design Store",
  "15. A bank teller and a mother who want to apply secondary credit card for her": "A Second Credit Card for a Son",
  "1. Swimm class-broken Arm": "A Broken Arm at Swimming Class",
  "5. Doctor and Patient blood Test": "A Blood Test",
  "5. Mrs. Verma and her GP. Mrs. Verma- lower back pain": "Lower Back Pain",
  "8. A mother of a sick child and a receptionist at a Home doctor Service center": "Booking a Home Doctor for a Sick Child",
  "13. Child Immunisation": "Child Immunisation",
  "31. Child immunization": "Child Immunisation",
  "14. pharmacist and a customer asking supplement": "Asking a Pharmacist About Supplements",
  "17 Patient and doctor with cold": "Seeing a Doctor About a Cold",
  "19. Enroll for Physiotherapy": "Enrolling for Physiotherapy",
  "11. Property Manager and Tenant regarding change of rental payment from monthly": "Changing Rent from Monthly to Weekly",
  "15. Securing House": "Securing a House",
  "16. A resident – a daughter with her sick father and a next-door neighbor": "A Sick Father and a Next-Door Neighbour",
  "20. Roof repair New Editd": "Roof Repair",
  "41. Appartment": "An Apartment",
  "67. BUYING A DOG FOR SON": "Buying a Dog for a Son",
  "87. Conversation between a parent and a real estate agent (1)": "A Parent and a Real Estate Agent",
  "1. A Migrant who is new in Australia asks seeks for aJob": "A New Migrant Looking for a Job",
  "8. customs officer and a traveler at an Australian customs checkpoint": "At an Australian Customs Checkpoint",
  "10. New migrant -community gardening": "A New Migrant and Community Gardening",
  "35. Parent_s Visa": "A Parent’s Visa",
  "53. Book flight And Visa Application": "Booking a Flight and Applying for a Visa",
  "56. Fight Ticket to Sydney": "A Flight Ticket to Sydney",
  "14. Dialoue between Factory Workers": "Renewing Car Insurance",
  "18. Insurance Final": "An Insurance Enquiry",
  "21. Car reversing": "A Car Reversing Accident",
  "68. CAR ACCIDENT IN LAWYERS CHAMBER": "A Car Accident: At the Lawyer’s Office",
  "83. .CAR ACCIDENT IN LAWYERS CHAMBER": "A Car Accident: At the Lawyer’s Office",
  "73. INSURANCE INVESTIGATOR ON A CYCLIST ACCIDENT": "An Insurance Investigator and a Cyclist Accident",
  "78. PRIVATE INSURANCE AGENT AND INSURANCE TAKER": "A Private Insurance Agent and a Customer",
  "85. conversation is between Sarah from a travel insurance company and Mr": "A Travel Insurance Call",
  "9. Divorce Man": "Legal Advice on a Divorce",
  "9. Lawyer & a Person Lending Money to a Friend": "Lending Money to a Friend",
  "10. Conversation Central Link Employee and Pensioner": "A Centrelink Employee and a Pensioner",
  "16 Carer payments to Dad_s Illness": "Carer Payments for a Father’s Illness",
};

// Words kept lowercase in Title Case (except as the first word)
const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "with"]);

// "17. Fallen_Tree_Due_to_Storm_Edited" -> "Fallen Tree Due to Storm"; "66. ANNUAL WASTE COLLECTION" ->
// "Annual Waste Collection"; "11. Speech Therapist (2)" -> "Speech Therapist"
function cleanTitle(name) {
  if (TITLE_OVERRIDES[name]) return TITLE_OVERRIDES[name];
  let title = name
    .replace(/^\d+[\s.]*/, "")
    .replace(/_s\b/g, "’s")
    .replace(/_/g, " ")
    .replace(/\s*\(\d+\)$/, "")
    .replace(/\s+(new\s+)?edite?d$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const allCaps = /[A-Z]/.test(title) && title === title.toUpperCase();
  title = title.split(" ").map((word, i) => {
    if (allCaps) word = word.toLowerCase();
    else if (/[A-Z]/.test(word.slice(1))) return word; // keep words such as "GP" or "NAATI"
    const lower = word.toLowerCase();
    return i > 0 && SMALL_WORDS.has(lower) ? lower : word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
  return title || name;
}

// ---------------------------------------------------------------------------------------------------------
// Small helpers

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "style") node.style.cssText = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) if (child !== null && child !== undefined && child !== false) node.append(child);
  return node;
}

function icon(markup, className = "icon") {
  const span = el("span", { class: className, "aria-hidden": "true" });
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`;
  return span;
}

function domainColor(category) {
  return DOMAIN_COLORS[category.toLowerCase()] || DEFAULT_COLOR;
}

// CSS variables for a domain's colour: the colour, a light tint and a border tint (made here as see-through
// colours, so older browsers without CSS color-mix() show them too)
function accentStyle(category) {
  const color = domainColor(category);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  return `--accent: ${color}; --accent-soft: rgba(${r}, ${g}, ${b}, 0.12); --accent-line: rgba(${r}, ${g}, ${b}, 0.35)`;
}

function domainIcon(category, className = "domain-icon") {
  return icon(DOMAIN_ICONS[category.toLowerCase()] || DEFAULT_ICON, className);
}

// "business" -> "Business"
function domainTitle(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function fileUrl(conversation, file) {
  return [...conversation.path.split("/"), ...file.split("/")].map(encodeURIComponent).join("/");
}

function link(path) {
  return "#/" + encodeURIComponent(path);
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function categories() {
  return [...new Set(conversations.map((c) => c.category))];
}

function inCategory(category) {
  return conversations.filter((c) => c.category === category);
}

function segmentCount(list) {
  return list.reduce((sum, c) => sum + c.segments.length, 0);
}

function breadcrumb(...items) {
  // items: [label, href] pairs; the last one is the current page and has no link
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
  return el("label", { class: "search" }, icon(ICONS.search), input);
}

function progressBar(done, total, label) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return el("div", {
    class: "progress",
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuemax": String(total),
    "aria-valuenow": String(done),
    "aria-label": label,
  }, el("span", { style: `width: ${percent}%` }));
}

// ---------------------------------------------------------------------------------------------------------
// Progress: the segments whose answer was revealed, per dialogue, kept in localStorage

// v2: a segment counts once its question was heard (half of it at least) and its answer revealed. Progress
// saved under v1, which counted a revealed answer alone, is not used
const PROGRESS_KEY = "tlf-naati-progress-v2";
const LAST_KEY = "tlf-naati-last-v1";

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

let progress = loadProgress();

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or storage full - progress is simply not kept
  }
  updateProgressPill();
}

function practised(conversation) {
  const numbers = new Set(conversation.segments.filter((s) => s.answer).map((s) => s.number));
  return (progress[conversation.path] || []).filter((n) => numbers.has(n));
}

function answerCount(conversation) {
  return conversation.segments.filter((s) => s.answer).length;
}

function markPractised(conversation, number) {
  const done = new Set(progress[conversation.path] || []);
  if (done.has(number)) return;
  done.add(number);
  progress[conversation.path] = [...done];
  saveProgress();
}

function resetProgress(conversation) {
  delete progress[conversation.path];
  saveProgress();
}

function status(conversation) {
  const done = practised(conversation).length;
  if (!done) return "new";
  return done >= answerCount(conversation) ? "done" : "started";
}

function categoryProgress(list) {
  return {
    done: list.reduce((sum, c) => sum + practised(c).length, 0),
    total: list.reduce((sum, c) => sum + answerCount(c), 0),
  };
}

function updateProgressPill() {
  const pill = document.getElementById("progress-pill");
  const done = conversations.reduce((sum, c) => sum + practised(c).length, 0);
  pill.classList.toggle("hidden", !done);
  pill.replaceChildren(icon(ICONS.headphones), `${done} segment${done === 1 ? "" : "s"} practised`);
}

function rememberLast(conversation) {
  try {
    localStorage.setItem(LAST_KEY, conversation.path);
  } catch {
    // ignore
  }
}

function lastConversation() {
  let path = null;
  try {
    path = localStorage.getItem(LAST_KEY);
  } catch {
    // ignore
  }
  const conversation = conversations.find((c) => c.path === path);
  return conversation && status(conversation) !== "done" ? conversation : null;
}

// ---------------------------------------------------------------------------------------------------------
// Home page

const HERO_ART = `
<svg class="hero-art" viewBox="0 0 460 380" role="img" aria-label="Headphones with an English and a Malayalam speech bubble">
  <defs>
    <linearGradient id="g-amber" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
    <linearGradient id="g-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#2563eb"/></linearGradient>
    <linearGradient id="g-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity=".05"/></linearGradient>
  </defs>
  <circle cx="240" cy="190" r="168" fill="url(#g-ring)"/>
  <circle cx="240" cy="190" r="118" fill="#ffffff" fill-opacity=".06"/>
  <g class="art-float-1">
    <rect x="22" y="58" width="262" height="92" rx="22" fill="#ffffff"/>
    <path d="M70 148 l-8 26 30 -26z" fill="#ffffff"/>
    <circle cx="62" cy="104" r="22" fill="url(#g-blue)"/>
    <text x="62" y="110" text-anchor="middle" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="15" font-weight="800" fill="#fff">EN</text>
    <text x="98" y="98" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#0a1f44">Hello! How can I</text>
    <text x="98" y="122" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="#0a1f44">help you today?</text>
  </g>
  <g class="art-float-2">
    <rect x="166" y="218" width="272" height="92" rx="22" fill="url(#g-amber)"/>
    <path d="M392 308 l10 26 -32 -26z" fill="#f59e0b"/>
    <circle cx="206" cy="264" r="22" fill="#ffffff"/>
    <text x="206" y="270" text-anchor="middle" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="15" font-weight="800" fill="#b45309">ML</text>
    <text x="242" y="258" font-family="Noto Sans Malayalam, sans-serif" font-size="17" font-weight="600" fill="#422006">നമസ്കാരം! എനിക്ക്</text>
    <text x="242" y="284" font-family="Noto Sans Malayalam, sans-serif" font-size="17" font-weight="600" fill="#422006">ഒരു സഹായം വേണം.</text>
  </g>
  <g class="art-wave" fill="#ffffff">
    <rect x="300" y="160" width="7" height="22" rx="3.5" opacity=".9"/>
    <rect x="313" y="150" width="7" height="42" rx="3.5"/>
    <rect x="326" y="140" width="7" height="62" rx="3.5"/>
    <rect x="339" y="154" width="7" height="34" rx="3.5" opacity=".9"/>
    <rect x="352" y="146" width="7" height="50" rx="3.5"/>
    <rect x="365" y="158" width="7" height="26" rx="3.5" opacity=".8"/>
    <rect x="378" y="164" width="7" height="14" rx="3.5" opacity=".6"/>
  </g>
  <g transform="translate(36 200)" stroke="#ffffff" stroke-width="7" stroke-linecap="round" fill="none">
    <path d="M10 70 V48 a48 48 0 0 1 96 0 V70"/>
    <rect x="0" y="58" width="26" height="40" rx="11" fill="#ffffff" stroke="none"/>
    <rect x="90" y="58" width="26" height="40" rx="11" fill="#ffffff" stroke="none"/>
  </g>
  <g fill="#fca5a5">
    <path d="M420 70l4 12 12 4-12 4-4 12-4-12-12-4 12-4z"/>
    <path d="M150 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#ffffff" opacity=".7"/>
    <circle cx="440" cy="190" r="5" fill="#ffffff" opacity=".5"/>
    <circle cx="20" cy="190" r="4" fill="#fbbf24"/>
  </g>
</svg>`;

function heroSection() {
  const last = lastConversation();
  const art = el("div", { class: "hero-visual" });
  art.innerHTML = HERO_ART;

  const browse = el("button", {
    class: "button button-light",
    type: "button",
    onclick: () => document.getElementById("domains").scrollIntoView({ behavior: "smooth" }),
  }, "Browse the domains", icon(ICONS.arrowDown));

  return el("section", { class: "hero" },
    el("div", { class: "container hero-inner" },
      el("div", { class: "hero-copy" },
        el("p", { class: "hero-badge" }, icon(ICONS.sparkle), "NAATI CCL · English ⇄ Malayalam"),
        el("h1", {}, "Practise interpreting, ", el("span", { class: "highlight" }, "one segment at a time")),
        el("p", { class: "lead" },
          "Real dialogues from everyday Australian settings. Listen to each segment, interpret it into the other " +
          "language, then compare your version with a model answer."),
        el("div", { class: "hero-actions" },
          last
            ? el("a", { class: "button button-accent", href: link(last.path) },
              icon(ICONS.play), el("span", {}, "Continue: ", el("strong", {}, last.display)))
            : null,
          browse),
        el("dl", { class: "stats" },
          el("div", {}, el("dt", {}, "Domains"), el("dd", {}, String(categories().length))),
          el("div", {}, el("dt", {}, "Dialogues"), el("dd", {}, String(conversations.length))),
          el("div", {}, el("dt", {}, "Segments"), el("dd", {}, String(segmentCount(conversations)))))),
      art));
}

function stepsSection() {
  const steps = [
    [ICONS.headphones, "Listen", "Play a segment in English or Malayalam. Slow it down if you need to."],
    [ICONS.mic, "Interpret", "Pause and say your interpretation out loud in the other language."],
    [ICONS.check, "Compare", "Reveal the model answer and check how close your interpretation was."],
  ];
  return el("ol", { class: "steps" },
    ...steps.map(([markup, title, text], i) =>
      el("li", {},
        icon(markup, "step-icon"),
        el("div", {},
          el("p", { class: "step-kicker" }, `Step ${i + 1}`),
          el("h3", {}, title),
          el("p", {}, text)))));
}

function domainCard(category) {
  const list = inCategory(category);
  const { done, total } = categoryProgress(list);
  return el("li", {},
    el("a", { class: "domain-card", href: link(category), style: accentStyle(category) },
      el("div", { class: "domain-banner" },
        domainIcon(category, "domain-icon-large"),
        el("span", { class: "domain-count" }, plural(list.length, "dialogue"))),
      el("div", { class: "domain-body" },
        el("h3", {}, domainTitle(category)),
        el("p", { class: "meta" }, `${plural(segmentCount(list), "segment")}`),
        el("div", { class: "domain-progress" },
          progressBar(done, total, `${domainTitle(category)} progress`),
          el("span", {}, done ? `${Math.round((done / total) * 100)}%` : "Not started")))));
}

function tipsSection() {
  const tips = [
    [ICONS.bulb, "Interpret the meaning", "Say what the speaker means, in natural language – not word for word."],
    [ICONS.scale, "Keep the tone", "Match the speaker’s politeness and register, and don’t add or leave out details."],
    [ICONS.calendar, "Little and often", "A few dialogues every day builds speed and confidence faster than one long session."],
  ];
  return el("section", { class: "tips" },
    el("h2", {}, "Practice tips"),
    el("ul", {},
      ...tips.map(([markup, title, text]) =>
        el("li", {}, icon(markup, "tip-icon"), el("div", {}, el("h3", {}, title), el("p", {}, text))))));
}

function showHome() {
  document.title = "NAATI CCL Malayalam Practice – The Language Formula";

  const grid = el("ul", { class: "domain-grid" }, ...categories().map(domainCard));
  const results = el("div", { class: "hidden" });
  const search = searchBox("Search all dialogues", (query) => {
    grid.classList.toggle("hidden", Boolean(query));
    results.classList.toggle("hidden", !query);
    if (!query) return;
    const found = conversations.filter((c) => matches(c, query));
    results.replaceChildren(found.length
      ? dialogueList(found, true)
      : el("p", { class: "empty" }, "No dialogues match your search."));
  });

  app.replaceChildren(
    heroSection(),
    el("div", { class: "container" },
      stepsSection(),
      el("div", { class: "section-head", id: "domains" },
        el("div", {},
          el("h2", {}, "Browse by domain"),
          el("p", { class: "muted" }, "Pick a topic area – each one has dialogues from a different everyday setting.")),
        search),
      conversations.length ? grid : el("p", { class: "empty" }, "No dialogues yet."),
      results,
      tipsSection()));
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------------------------------------
// Dialogue lists (domain page and search results)

const STATUS_LABELS = { new: "Not started", started: "In progress", done: "Completed" };

function matches(conversation, query) {
  const text = `${conversation.display} ${conversation.title} ${conversation.category}`.toLowerCase();
  return query.split(/\s+/).every((word) => text.includes(word));
}

function dialogueList(list, showDomain) {
  const ul = el("ul", { class: "dialogue-list" });
  for (const conversation of list) {
    const done = practised(conversation).length;
    const total = answerCount(conversation);
    const state = status(conversation);
    const meta = [plural(conversation.segments.length, "segment")];
    if (showDomain) meta.unshift(domainTitle(conversation.category));
    ul.append(el("li", {},
      el("a", { class: `dialogue-card is-${state}`, href: link(conversation.path), style: accentStyle(conversation.category) },
        el("span", { class: "dialogue-number", title: `Dialogue ${conversation.index}` }, String(conversation.index)),
        el("span", { class: "dialogue-text" },
          el("span", { class: "dialogue-title" }, conversation.display),
          el("span", { class: "meta" }, meta.join(" · ")),
          state === "started" ? progressBar(done, total, `${conversation.display} progress`) : null),
        el("span", { class: `status-chip status-${state}` }, STATUS_LABELS[state]),
        icon(ICONS.chevron, "chevron"))));
  }
  return ul;
}

function showCategory(category) {
  document.title = `${domainTitle(category)} – The Language Formula`;
  const list = inCategory(category);
  const { done, total } = categoryProgress(list);
  let query = "";
  let filter = "all";

  const listArea = el("div");
  function render() {
    const found = list.filter((c) => (!query || matches(c, query)) && (filter === "all" || status(c) === filter));
    listArea.replaceChildren(found.length
      ? dialogueList(found, false)
      : el("p", { class: "empty" }, "No dialogues match."));
  }

  const chips = el("div", { class: "chips", role: "group", "aria-label": "Show dialogues" });
  for (const [value, label] of [["all", "All"], ["new", "Not started"], ["started", "In progress"], ["done", "Completed"]]) {
    const count = value === "all" ? list.length : list.filter((c) => status(c) === value).length;
    chips.append(el("button", {
      class: "chip",
      type: "button",
      "aria-pressed": String(value === filter),
      onclick: (event) => {
        filter = value;
        for (const chip of chips.children) chip.setAttribute("aria-pressed", String(chip === event.currentTarget));
        render();
      },
    }, label, el("span", { class: "chip-count" }, String(count))));
  }

  render();
  app.replaceChildren(
    el("section", { class: "page-banner", style: accentStyle(category) },
      el("div", { class: "container" },
        breadcrumb(["Home", "#"], [domainTitle(category)]),
        el("div", { class: "banner-head" },
          domainIcon(category, "banner-icon"),
          el("div", {},
            el("h1", {}, domainTitle(category)),
            el("p", {}, `${plural(list.length, "dialogue")} · ${plural(segmentCount(list), "segment")}`))),
        el("div", { class: "banner-progress" },
          progressBar(done, total, `${domainTitle(category)} progress`),
          el("span", {}, `${done} of ${total} segments practised`)))),
    el("div", { class: "container page" },
      el("div", { class: "toolbar" }, chips, searchBox(`Search ${domainTitle(category)}`, (value) => {
        query = value;
        render();
      })),
      listArea));
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------------------------------------
// Dialogue page

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function player(conversation, audio, label) {
  const sound = el("audio", { preload: "none", src: fileUrl(conversation, audio.file) });
  const button = el("button", { class: "play", type: "button" });
  const seek = el("input", { class: "seek", type: "range", min: "0", max: "100", step: "0.1", value: "0", "aria-label": `${label} position` });
  const time = el("span", { class: "time" }, "0:00");
  const speed = el("select", { class: "speed", title: "Playback speed", "aria-label": "Playback speed" },
    ...SPEEDS.map((value) => el("option", { value: String(value) }, `${value}×`)));
  speed.value = String(playbackSpeed);

  function update() {
    const position = sound.duration ? (sound.currentTime / sound.duration) * 100 : 0;
    seek.value = position;
    seek.style.setProperty("--progress", `${position}%`);
    time.textContent = sound.duration
      ? `${formatTime(sound.currentTime)} / ${formatTime(sound.duration)}`
      : formatTime(sound.currentTime);
  }

  function setPlaying(playing) {
    button.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
    button.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${label}`);
    button.classList.toggle("playing", playing);
  }

  // play() is cancelled (and its promise rejected) if the recording is paused before it starts - that is fine
  button.addEventListener("click", () => (sound.paused ? sound.play().catch(() => {}) : sound.pause()));
  seek.addEventListener("input", () => {
    if (sound.duration) sound.currentTime = (seek.value / 100) * sound.duration;
  });
  speed.addEventListener("change", () => setSpeed(Number(speed.value)));
  sound.addEventListener("play", () => {
    sound.playbackRate = playbackSpeed;
    setPlaying(true);
  });
  sound.addEventListener("pause", () => setPlaying(false));
  sound.addEventListener("ended", () => setPlaying(false));
  sound.addEventListener("timeupdate", update);
  sound.addEventListener("loadedmetadata", update);
  setPlaying(false);

  return el("div", { class: "player" }, button, seek, time, speed, sound);
}

function languageCode(language) {
  return language.toLowerCase() === "malayalam" ? "ml" : "en";
}

function part(kind, conversation, segment, text) {
  const audio = segment[kind];
  const isAnswer = kind === "answer";
  const label = `${isAnswer ? "Model answer" : "Question"}, segment ${segment.number}`;
  return el("div", { class: `part ${kind}` },
    el("div", { class: "part-label" },
      el("span", {}, isAnswer ? "Model answer" : "Listen"),
      el("span", { class: `lang lang-${languageCode(audio.language)}` }, audio.language)),
    player(conversation, audio, label),
    text ? el("p", { class: "part-text", lang: languageCode(audio.language) }, text) : null);
}

// transcript.json (made by pdf_to_audio_enhance_google.py) -> its segments by number, or null if the
// dialogue has none yet (build_manifest.py marks the dialogues that have one with "transcript": true)
async function loadTranscript(conversation) {
  if (!conversation.transcript) return null;
  try {
    const response = await fetch(fileUrl(conversation, "transcript.json"), { cache: "no-cache" });
    if (!response.ok) return null;
    const transcript = await response.json();
    return {
      speakers: transcript.speakers || [],
      segments: new Map((transcript.segments || []).map((s) => [s.number, s])),
    };
  } catch {
    return null;
  }
}

async function showConversation(conversation) {
  rememberLast(conversation);
  document.title = `${conversation.display} – The Language Formula`;
  const siblings = inCategory(conversation.category);
  const transcript = await loadTranscript(conversation);
  if (currentPath() !== conversation.path) return; // the reader moved on while it loaded

  const total = answerCount(conversation);
  const done = new Set(practised(conversation));
  const counter = el("span", { class: "counter" });
  const bar = el("div", { class: "progress" }, el("span"));
  const answers = [];
  const finished = el("div", { class: "finished hidden" });

  function refreshProgress() {
    counter.textContent = `${done.size} of ${total} segments practised`;
    counter.title = "A segment counts as practised when you have played its question and revealed its answer";
    bar.firstChild.style.width = `${total ? (done.size / total) * 100 : 0}%`;
    finished.classList.toggle("hidden", done.size < total || !total);
  }

  // A segment counts as practised only when its question was heard (at least half of it) AND its answer was
  // revealed, in either order - "Show all answers" or a quick click on play alone does not count
  function checkPractised(item) {
    if (!item.listened || !item.revealed || done.has(item.number)) return;
    done.add(item.number);
    markPractised(conversation, item.number);
    refreshProgress();
  }

  function setAnswerVisible(item, visible) {
    item.part.classList.toggle("hidden", !visible);
    item.button.replaceChildren(icon(visible ? ICONS.eyeOff : ICONS.eye), visible ? "Hide answer" : "Show answer");
    item.button.setAttribute("aria-expanded", String(visible));
    if (visible) {
      item.revealed = true;
      checkPractised(item);
    }
  }

  // The English speaker is shown on the left and the Malayalam speaker on the right, like a chat
  const speakerNames = {};
  for (const speaker of transcript?.speakers || []) speakerNames[speaker.language] = speaker.name;

  const segments = conversation.segments.map((segment) => {
    const texts = transcript?.segments.get(segment.number);
    // The speaker's language is the question's; without a question, it is the other language than the answer's
    const language = segment.question
      ? segment.question.language
      : (languageCode(segment.answer.language) === "ml" ? "English" : "Malayalam");
    const side = languageCode(language) === "ml" ? "right" : "left";
    const name = speakerNames[language.toLowerCase()];
    const bubble = el("div", { class: "bubble" },
      el("div", { class: "segment-head" },
        el("span", { class: "segment-number" }, String(segment.number)),
        el("span", { class: "segment-title" }, name ? `${name} · ${language} speaker` : `${language} speaker`)));
    const questionPart = segment.question ? part("question", conversation, segment, texts?.question?.text) : null;
    if (questionPart) bubble.append(questionPart);
    if (segment.answer) {
      const target = segment.answer.language;
      const answerPart = part("answer", conversation, segment, texts?.answer?.text);
      // A segment without a question recording only needs its answer revealed
      const item = { number: segment.number, part: answerPart, listened: !questionPart, revealed: false };
      const questionAudio = questionPart?.querySelector("audio");
      const heard = () => {
        if (item.listened) return;
        if (questionAudio.ended || (questionAudio.duration && questionAudio.currentTime >= questionAudio.duration / 2)) {
          item.listened = true;
          checkPractised(item);
        }
      };
      questionAudio?.addEventListener("timeupdate", heard);
      questionAudio?.addEventListener("ended", heard);
      item.button = el("button", {
        class: "reveal",
        type: "button",
        onclick: () => setAnswerVisible(item, answerPart.classList.contains("hidden")),
      });
      answers.push(item);
      bubble.append(
        el("p", { class: "your-turn" }, icon(ICONS.mic), `Your turn: interpret it into ${target}`),
        item.button,
        answerPart);
      setAnswerVisible(item, false);
    }
    return el("section", { class: `segment side-${side}` },
      el("span", { class: `avatar avatar-${languageCode(language)}`, "aria-hidden": "true" }, languageCode(language).toUpperCase()),
      bubble);
  });

  let allShown = false;
  const toggleAll = el("button", {
    class: "button button-outline",
    type: "button",
    onclick: () => {
      allShown = !allShown;
      answers.forEach((item) => setAnswerVisible(item, allShown));
      toggleAll.replaceChildren(icon(allShown ? ICONS.eyeOff : ICONS.eye), allShown ? "Hide all answers" : "Show all answers");
    },
  }, icon(ICONS.eye), "Show all answers");

  const textToggle = transcript
    ? el("button", {
      class: "button button-outline",
      type: "button",
      "aria-pressed": "false",
      onclick: () => {
        const on = !page.classList.contains("show-text");
        page.classList.toggle("show-text", on);
        textToggle.setAttribute("aria-pressed", String(on));
        textToggle.replaceChildren(icon(ICONS.text), on ? "Hide text" : "Show text");
      },
    }, icon(ICONS.text), "Show text")
    : null;

  const reset = el("button", {
    class: "button button-ghost",
    type: "button",
    title: "Start this dialogue again",
    onclick: () => {
      resetProgress(conversation);
      stopAllAudio();
      showConversation(conversation);
    },
  }, icon(ICONS.reset), "Reset");

  const position = siblings.indexOf(conversation);
  const next = siblings[position + 1];
  finished.append(
    icon(ICONS.check, "finished-icon"),
    el("div", {},
      el("h2", {}, "Dialogue complete – well done!"),
      el("p", {}, "You have listened to and checked every segment. Try the dialogue again from the start, or move on.")),
    next ? el("a", { class: "button button-primary", href: link(next.path) }, "Next dialogue", icon(ICONS.chevron)) : null);

  const pager = el("nav", { class: "pager", "aria-label": "More dialogues" });
  for (const [offset, label, className] of [[-1, "Previous dialogue", "prev"], [1, "Next dialogue", "next"]]) {
    const other = siblings[position + offset];
    pager.append(other
      ? el("a", { class: className, href: link(other.path) },
        el("span", { class: "pager-label" }, label),
        el("span", { class: "pager-title" }, `${other.index}. ${other.display}`))
      : el("span"));
  }

  const legend = el("div", { class: "legend" },
    el("span", {}, el("span", { class: "avatar avatar-en" }, "EN"), speakerNames.english || "English speaker"),
    el("span", {}, el("span", { class: "avatar avatar-ml" }, "ML"), speakerNames.malayalam || "Malayalam speaker"));

  const page = el("div", { class: "container narrow page conversation-page" },
    el("div", { class: "toolbar sticky" },
      el("div", { class: "toolbar-progress" }, counter, bar),
      el("div", { class: "toolbar-actions" }, textToggle, toggleAll, reset)),
    legend,
    ...segments,
    finished,
    pager);

  refreshProgress();
  app.replaceChildren(
    el("section", { class: "page-banner compact", style: accentStyle(conversation.category) },
      el("div", { class: "container narrow" },
        breadcrumb(["Home", "#"], [domainTitle(conversation.category), link(conversation.category)], [conversation.display]),
        el("p", { class: "banner-kicker" },
          domainIcon(conversation.category, "kicker-icon"),
          `${domainTitle(conversation.category)} · Dialogue ${conversation.index} of ${siblings.length}`),
        el("h1", {}, conversation.display),
        el("p", {}, `${plural(conversation.segments.length, "segment")} · Listen, interpret, then reveal the model answer.`))),
    page);
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------------------------------------
// Start

// The page path from the address, e.g. "business/1. New Mobile Van Businesses" - the same whether the link was
// written with %20 / %2F or with plain spaces and slashes
function currentPath() {
  const hash = location.hash.replace(/^#\/?/, "");
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

// A recording that is removed from the page keeps playing unless it is stopped
function stopAllAudio() {
  for (const audio of document.querySelectorAll("audio")) audio.pause();
}

function route() {
  stopAllAudio();
  const path = currentPath();
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
document.getElementById("year").textContent = new Date().getFullYear();

fetch("manifest.json", { cache: "no-cache" })
  .then((response) => response.json())
  .then((data) => {
    conversations = data.conversations;
    // Number the dialogues 1, 2, 3... within each domain (in manifest order) and give each a clean title;
    // a title used twice in a domain gets " (2)"
    for (const category of categories()) {
      const seen = new Map();
      inCategory(category).forEach((conversation, i) => {
        conversation.index = i + 1;
        const title = cleanTitle(conversation.title);
        const count = (seen.get(title) || 0) + 1;
        seen.set(title, count);
        conversation.display = count > 1 ? `${title} (${count})` : title;
      });
    }
    updateProgressPill();
    route();
  })
  .catch(() => {
    app.replaceChildren(el("p", { class: "status" }, "Could not load the dialogue list."));
  });
