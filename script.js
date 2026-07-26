const $ = (s) => document.querySelector(s);
const messages = $("#messages");
const input = $("#promptInput");
const sendBtn = $("#sendBtn");
const fileInput = $("#fileInput");
const attachmentPreview = $("#attachmentPreview");
let attachments = [];
let mode = "chat";

function addMessage(text, type) {
  const row = document.createElement("div");
  row.className = `message ${type}`;
  if (type === "ai") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    row.appendChild(avatar);
  }
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  row.appendChild(bubble);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "message ai";
  row.id = "typingRow";
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
  row.append(avatar, bubble);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  $("#typingRow")?.remove();
}

function demoReply(prompt) {
  const lower = prompt.toLowerCase();
  if (mode === "search") {
    return "Search mode is ready for the real Orion backend. Once web search is connected, Orion will be able to retrieve current information and cite sources here.";
  }
  if (lower.includes("code")) return "Orion's coding workspace is ready for integration. The next phase will connect a real AI model so I can generate, explain, debug, and improve code.";
  if (lower.includes("research")) return "Orion's research mode is ready. The next phase will connect web search and document tools so research can be gathered and summarized with sources.";
  if (lower.includes("hello") || lower.includes("hi")) return "Hello! I'm Orion. 🌌 I'm ready to help you explore ideas, learn, create, research, and build.";
  return "I'm Orion's interface prototype. The visual experience is live, and the next phase is connecting a secure AI backend. Your message was received successfully.";
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || sendBtn.disabled) return;
  addMessage(text, "user");
  input.value = "";
  input.style.height = "auto";
  sendBtn.disabled = true;
  showTyping();
  await new Promise(r => setTimeout(r, 800));
  removeTyping();
  const bubble = addMessage("", "ai");
  const reply = demoReply(text);
  for (const char of reply) {
    bubble.textContent += char;
    messages.scrollTop = messages.scrollHeight;
    await new Promise(r => setTimeout(r, 8));
  }
  sendBtn.disabled = false;
  input.focus();
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 130) + "px";
});

document.querySelectorAll("[data-prompt]").forEach(btn => {
  btn.addEventListener("click", () => {
    input.value = btn.dataset.prompt;
    input.focus();
    input.dispatchEvent(new Event("input"));
  });
});

document.querySelectorAll(".tool-pill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tool-pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.dataset.mode;
  });
});

$("#fileBtn").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  attachments = [...fileInput.files];
  attachmentPreview.innerHTML = "";
  attachmentPreview.classList.toggle("hidden", attachments.length === 0);
  attachments.forEach(file => {
    const tag = document.createElement("span");
    tag.className = "attachment";
    tag.textContent = `📎 ${file.name}`;
    attachmentPreview.appendChild(tag);
  });
});

$("#newChatBtn").addEventListener("click", () => {
  messages.innerHTML = `<div class="welcome-message"><div class="mini-orb"></div><div><strong>New conversation.</strong><p>What would you like to explore?</p></div></div>`;
  input.value = "";
  attachments = [];
  attachmentPreview.innerHTML = "";
  attachmentPreview.classList.add("hidden");
});

$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  $("#themeBtn").textContent = document.body.classList.contains("light") ? "☾" : "☼";
});

let recognition;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = true;
  recognition.onstart = () => $("#voiceBtn").classList.add("listening");
  recognition.onend = () => $("#voiceBtn").classList.remove("listening");
  recognition.onresult = e => {
    input.value = [...e.results].map(r => r[0].transcript).join("");
    input.dispatchEvent(new Event("input"));
  };
}
$("#voiceBtn").addEventListener("click", () => {
  if (!recognition) {
    alert("Voice input is not supported in this browser.");
    return;
  }
  recognition.start();
});
