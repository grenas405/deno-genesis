// public/assets/js/login.js

import { showNotification } from '/assets/js/notifications.js';

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const statusEl = document.getElementById("loginMessage");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!username || !password) {
      const msg = "Please enter both username and password.";
      displayStatus(msg, "error");
      showNotification(msg, "error");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Login failed.";
        displayStatus(msg, "error");
        showNotification(msg, "error");
        return;
      }

      // Store token in localStorage
      localStorage.setItem("adminToken", data.token);

      const successMsg = "Login successful! Redirecting...";
      displayStatus(successMsg, "success");
      showNotification(successMsg, "success");

      setTimeout(() => {
        window.location.href = "/pages/admin/dashboard.html";
      }, 1200);
    } catch (err) {
      const errMsg = "Something went wrong. Please try again.";
      displayStatus(errMsg, "error");
      showNotification(errMsg, "error");
    }
  });

  function displayStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = type === "success" ? "green" : "red";
  }
});
