import { showNotification } from '/assets/js/notifications.js';

/**
 * Checks for admin token in localStorage and redirects if missing.
 * @param {string} redirectUrl - Where to send the user if not authenticated.
 */
export function requireAdminToken(redirectUrl = "../auth/login.html") {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    showNotification("❌ Access denied. Admin login required.", "error");
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1600); // Wait for notification to appear
  }
}

// 🔐 Enforce auth immediately when script loads
requireAdminToken();