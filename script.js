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

  bubble.innerHTML =
    '<span class="typing"><i></i><i></i><i></i></span>';

  row.append(avatar, bubble);

  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  $("#typingRow")?.remove();
}

async function askOrion(prompt) {
  const response = await fetch("/.netlify/functions/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: prompt,
      mode: mode
    })
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from Orion server.");
  }

  if (!response.ok) {
    throw new Error(
      data.error || "Orion could not process your request."
    );
  }

  return data.answer || "Sorry, Orion did not return an answer.";
}

async function sendMessage() {
  const text = input.value.trim();

  if (!text || sendBtn.disabled) {
    return;
  }

  addMessage(text, "user");

  input.value = "";
  input.style.height = "auto";

  sendBtn.disabled = true;

  showTyping();

  try {
    const reply = await askOrion(text);

    removeTyping();

    const bubble = addMessage("", "ai");

    // Type the response smoothly
    for (const char of reply) {
      bubble.textContent += char;
      messages.scrollTop = messages.scrollHeight;

      await new Promise((resolve) =>
        setTimeout(resolve, 5)
      );
    }

  } catch (error) {
    removeTyping();

    addMessage(
      "Sorry bro, Orion couldn't connect to the AI server. Please try again.",
      "ai"
    );

    console.error("Orion error:", error);
  }

  sendBtn.disabled = false;
  input.focus();
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";

  input.style.height =
    Math.min(input.scrollHeight, 130) + "px";
});

// Quick prompt buttons
document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;

    input.focus();

    input.dispatchEvent(new Event("input"));
  });
});

// Chat / Search mode
document.querySelectorAll(".tool-pill").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".tool-pill")
      .forEach((b) => b.classList.remove("active"));

    button.classList.add("active");

    mode = button.dataset.mode;
  });
});

// File selection
$("#fileBtn").addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  attachments = [...fileInput.files];

  attachmentPreview.innerHTML = "";

  attachmentPreview.classList.toggle(
    "hidden",
    attachments.length === 0
  );

  attachments.forEach((file) => {
    const tag = document.createElement("span");

    tag.className = "attachment";

    tag.textContent = `📎 ${file.name}`;

    attachmentPreview.appendChild(tag);
  });
});

// New chat
$("#newChatBtn").addEventListener("click", () => {
  messages.innerHTML = `
    <div class="welcome-message">
      <div class="mini-orb"></div>

      <div>
        <strong>New conversation.</strong>

        <p>
          What would you like to explore?
        </p>
      </div>
    </div>
  `;

  input.value = "";

  attachments = [];

  attachmentPreview.innerHTML = "";

  attachmentPreview.classList.add("hidden");

  input.focus();
});

// Dark / Light mode
$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");

  $("#themeBtn").textContent =
    document.body.classList.contains("light")
      ? "☾"
      : "☼";
});

// Voice recognition
let recognition;

if (
  "webkitSpeechRecognition" in window ||
  "SpeechRecognition" in window
) {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();

  recognition.lang = "en-IN";

  recognition.interimResults = true;

  recognition.onstart = () => {
    $("#voiceBtn").classList.add("listening");
  };

  recognition.onend = () => {
    $("#voiceBtn").classList.remove("listening");
  };

  recognition.onresult = (event) => {
    input.value = [...event.results]
      .map((result) => result[0].transcript)
      .join("");

    input.dispatchEvent(new Event("input"));
  };
}

$("#voiceBtn").addEventListener("click", () => {
  if (!recognition) {
    alert(
      "Voice input is not supported in this browser."
    );

    return;
  }

  recognition.start();
});
