import { showNotification } from './notifications.js';

/**
 * Dynamically inject site settings into your public pages.
 * Only injects global elements — no hero headline (page-specific).
 */

export async function injectSiteSettings(siteKey = "pedromd") {
  try {
    const res = await fetch(`/api/settings?site=${siteKey}`);
    const data = await res.json();

    if (!res.ok) {
      showNotification(`⚠️ Failed to load site settings: ${data.error}`, "warning");
      return;
    }

    // ✅ Only shared elements
    const contactEmailEl = document.getElementById("contact-email");
    const businessPhoneEl = document.getElementById("business-phone");

    if (contactEmailEl) {
      contactEmailEl.textContent = data.contact_email || "contact@example.com";
      contactEmailEl.href = `mailto:${data.contact_email}`;
    }

    if (businessPhoneEl) {
      businessPhoneEl.textContent = data.business_phone || "(555) 555-5555";
      businessPhoneEl.href = `tel:${data.business_phone}`;
    }

    showNotification("✅ Site settings injected successfully!", "success");

  } catch (err) {
    showNotification(`❌ Failed to inject site settings: ${err.message}`, "error");
  }
}

// ✅ Auto-run when loaded
document.addEventListener("DOMContentLoaded", () => injectSiteSettings());
