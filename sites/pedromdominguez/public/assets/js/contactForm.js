// public/assets/js/contactForm.js

import { showNotification } from './notifications.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");
  const messageContainer = document.createElement("p");
  messageContainer.id = "contactMessage";
  messageContainer.style.marginTop = "1rem";
  messageContainer.style.fontWeight = "bold";
  form.appendChild(messageContainer);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();

    // Phone is required, Email is optional
    if (!name || !phone || !message) {
      displayMessage("❌ Please fill out your name, phone, and message.", "error");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || null, phone, message }),
      });

      const data = await res.json();

      if (res.ok) {
        displayMessage("✅ Your message has been submitted successfully!", "success");
        showNotification("✅ Contact message submitted!", "success");
        form.reset();
      } else {
        displayMessage(`❌ ${data.error}`, "error");
        showNotification(`❌ ${data.error}`, "error");
      }
    } catch (err) {
      displayMessage("❌ Something went wrong. Please try again later.", "error");
      showNotification("❌ Error submitting contact form. Please try again later.", "error");
    }
  });

  function displayMessage(text, type) {
    messageContainer.textContent = text;
    messageContainer.style.color = type === "success" ? "gold" : "#ff5e5e";
  }
});