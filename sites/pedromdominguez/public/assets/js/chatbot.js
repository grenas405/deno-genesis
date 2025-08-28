import { showNotification } from './notifications.js';

export function initializeChatbot(marked) {
  const chatbotContainer = document.getElementById("chatbot-container");
  const toggleButton = document.getElementById("chatbot-toggle");
  const closeButton = document.getElementById("chatbot-close");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-btn");
  const chatBox = document.getElementById("chatbox");

  if (!chatbotContainer || !toggleButton || !closeButton || !userInput || !sendButton || !chatBox) {
    showNotification("❗ Chatbot UI elements not found. Initialization skipped.", "warning");
    return;
  }

  // Notify successful init
  showNotification("🤖 Chatbot initialized successfully!", "info");

  // Toggle visibility
  toggleButton.addEventListener("click", () => {
    chatbotContainer.classList.toggle("visible");
    showNotification("🤖 Chatbot toggled.", "info");
  });

  closeButton.addEventListener("click", () => {
    chatbotContainer.classList.remove("visible");
    showNotification("❌ Chatbot closed.", "info");
  });

  // Bind user input events
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // Fetch intro on load
  fetchIntroduction();

  async function fetchIntroduction() {
    const currentPage = window.location.pathname;
    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: currentPage })
      });
      const data = await response.json();
      appendMessage("bot", "Dominguez Tech Solutions AI Assistant 🤖", data.reply, true);
      showNotification("✅ Chatbot introduction loaded.", "success");
    } catch (error) {
      showNotification(`❌ Intro fetch error: ${error.message}`, "error");
    }
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    const currentPage = window.location.pathname;
    if (!message) return;

    appendMessage("user", "You", message);
    userInput.value = "";

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, page: currentPage })
      });
      const data = await response.json();
      appendMessage("bot", "Dominguez Tech Solutions AI Assistant 🤖", data.reply, true);
      showNotification("✅ AI response received.", "success");
    } catch (error) {
      appendMessage("error", "Error", "AI service is unavailable.");
      showNotification(`❌ AI service error: ${error.message}`, "error");
    }
  }

  function appendMessage(type, sender, message, isTypingEffect = false) {
    const wrapper = document.createElement("div");
    wrapper.className = `${type}-message`;

    const label = document.createElement("span");
    label.className = `${type}-label`;
    label.textContent = `${sender}:`;

    const content = document.createElement("div");
    content.className = `${type}-text`;

    wrapper.appendChild(label);
    wrapper.appendChild(content);
    chatBox.appendChild(wrapper);
	chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });

    isTypingEffect
      ? simulateTypingEffect(message, content)
      : (content.innerHTML = formatMessage(message));
  }

  function simulateTypingEffect(message, element) {
    let index = 0;
    const stripped = message.replace(/<[^>]*>?/gm, "");

    function type() {
      if (index < stripped.length) {
        element.innerHTML = formatMessage(stripped.substring(0, index + 1));
        index++;
        setTimeout(type, 25);
      }
    }

    type();
  }

  function formatMessage(markdownText) {
    if (typeof marked !== "undefined") {
      return marked.parse(markdownText, { breaks: true });
    } else {
      showNotification("⚠️ marked.js not loaded. Returning raw text.", "warning");
      return markdownText.replace(/\n/g, "<br>");
    }
  }
}
