// File: /assets/js/user-messages.js
import { showNotification } from '../../public/js/notifications.js';

const token = localStorage.getItem("adminToken");
const status = document.getElementById("status-message");

async function fetchContactMessages() {
  const container = document.getElementById("messages-container");
  container.innerHTML = "<p class='loading'>Loading messages...</p>";
  status.textContent = "";

  try {
    const res = await fetch("/api/contact", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const messages = await res.json();
    container.innerHTML = "";

    if (!messages.length) {
      container.innerHTML = "<p class='no-messages'>No messages found.</p>";
      showNotification("No messages found.", "info");
      return;
    }

    messages.forEach((msg) => {
      const card = document.createElement("div");
      card.className = "message-card";

      const timestamp = msg.submitted_at && !isNaN(Date.parse(msg.submitted_at))
        ? new Date(msg.submitted_at).toLocaleString()
        : "Unavailable";

      card.innerHTML = `
        <h3>👤 ${msg.name}</h3>
        <p><strong>📧 Email:</strong> ${msg.email}</p>
        <p><strong>📞 Phone:</strong> ${msg.phone || "N/A"}</p>
        <p><strong>🕒 Submitted:</strong> ${timestamp}</p>
        <p><strong>💬 Message:</strong><br/>${msg.message}</p>
        <button class="delete-btn" data-id="${msg.id}">🗑️ Delete</button>
      `;

      card.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this message?")) {
          deleteContactMessage(msg.id);
        }
      });

      container.appendChild(card);
    });

    showNotification("✅ Messages loaded.", "success");

  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    container.innerHTML = `<p class="error-message">Error: ${err.message}</p>`;
    showNotification(`❌ Error: ${err.message}`, "error");
  }
}

async function deleteContactMessage(id) {
  status.textContent = "";
  try {
    const res = await fetch(`/api/contact/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();
    if (!res.ok) {
      showNotification(`❌ ${result.error}`, "error");
      return;
    }

    showNotification("✅ Message deleted.", "success");
    fetchContactMessages(); // Refresh list

  } catch (err) {
    console.error("❌ Error deleting message:", err);
    showNotification("❌ Failed to delete message.", "error");
  }
}

document.addEventListener("DOMContentLoaded", fetchContactMessages);
