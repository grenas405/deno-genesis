// /assets/js/public-appointments.js  →  v2.1  (relative-urls + notifications-first)

import { showNotification } from '/assets/js/notifications.js';

// ✅ REMOVED: API_BASE - now using relative URLs
// ❌ OLD: const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3003' : 'https://www.pedromdominguez.com';

const SITE_KEY = 'pedromd';
const token = localStorage.getItem('adminToken') || null;

/* ---------- Small inline helper for on-page status text ---------- */
function showResponse(message, success = true) {
  const box = document.getElementById('response-message');
  if (!box) return;
  box.textContent = message;
  box.style.color = success ? '#10b981' : '#ef4444';
  box.style.fontWeight = '600';
  setTimeout(() => (box.textContent = ''), 4000);
}

/* ---------- Fetch & render appointments ---------- */
async function fetchAppointments() {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    // ✅ NEW: Using relative URL - no more CSP issues!
    const res = await fetch(
      `/api/appointments?site=${SITE_KEY}`,
      { 
        method: 'GET', 
        headers,
        credentials: 'same-origin' // ✅ ADDED: Ensures cookies/auth work properly
      }
    );

    const data = await res.json();
    const container = document.getElementById('appointments-container');
    
    if (!container) {
      console.error('❌ appointments-container not found');
      showNotification('❌ Page setup error', 'error');
      return;
    }
    
    container.innerHTML = '';

    if (!res.ok) {
      const errMsg = data?.error || `Error loading appointments (${res.status})`;
      showResponse(errMsg, false);
      showNotification(`❌ ${errMsg}`, 'error');
      return;
    }

    if (!data.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No appointments found.</p>';
      showNotification('📭 No appointments to display', 'info');
      return;
    }

    // ✅ IMPROVED: Better data handling and UI
    data.forEach((appt) => {
      const card = document.createElement('div');
      card.className = 'appointment-card';
      card.innerHTML = `
        <h3>${escapeHtml(appt.name)}</h3>
        <p><strong>📞 Phone:</strong> ${escapeHtml(appt.phone)}</p>
        <p><strong>📧 Email:</strong> ${escapeHtml(appt.email || '—')}</p>
        <p><strong>🛠️ Service:</strong> ${escapeHtml(appt.service)}</p>
        <p><strong>💬 Message:</strong> ${escapeHtml(appt.message || '—')}</p>
        <p><small>⏰ Submitted: ${new Date(appt.created_at).toLocaleString()}</small></p>
      `;

      /* admin-only delete button */
      if (token) {
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '🗑️ Delete';
        delBtn.onclick = () => deleteAppointment(appt.id, appt.name);
        card.appendChild(delBtn);
      }

      container.appendChild(card);
    });

    const count = data.length;
    showNotification(`✅ Loaded ${count} appointment${count === 1 ? '' : 's'}`, 'success');
    console.log(`✅ Successfully loaded ${count} appointments`);
    
  } catch (err) {
    console.error('❌ Fetch error:', err);
    showResponse('Network error loading appointments.', false);
    showNotification(`❌ Network error: ${err.message}`, 'error');
  }
}

/* ---------- Delete appointment (admin only) ---------- */
async function deleteAppointment(id, name = 'appointment') {
  if (!confirm(`Are you sure you want to delete the appointment for "${name}"?`)) {
    return;
  }

  try {
    // ✅ NEW: Using relative URL
    const res = await fetch(
      `/api/appointments/${id}?site=${SITE_KEY}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'same-origin' // ✅ ADDED: Ensures auth works properly
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error || `Error deleting appointment (${res.status})`;
      showResponse(msg, false);
      showNotification(`❌ ${msg}`, 'error');
      return;
    }

    showResponse('Appointment deleted successfully.', true);
    showNotification(`✅ Deleted appointment for "${name}"`, 'success');
    console.log(`✅ Successfully deleted appointment ID: ${id}`);
    
    // ✅ IMPROVED: Small delay for user feedback, then refresh
    setTimeout(() => {
      fetchAppointments(); // refresh list
    }, 500);
    
  } catch (err) {
    console.error('❌ Delete error:', err);
    showResponse('Network error deleting appointment.', false);
    showNotification(`❌ Network error: ${err.message}`, 'error');
  }
}

/* ---------- Security helper: Escape HTML to prevent XSS ---------- */
function escapeHtml(text) {
  if (!text) return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ---------- Enhanced initialization ---------- */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Public appointments module loaded');
  
  // ✅ ADDED: Check if we're in admin mode
  if (token) {
    console.log('👤 Admin mode detected');
    showNotification('👤 Admin mode active', 'info', { duration: 2000 });
  }
  
  // Load appointments
  fetchAppointments();
});

/* ---------- Optional: Auto-refresh for real-time updates ---------- */
// ✅ ADDED: Auto-refresh every 30 seconds if user is active
let autoRefreshInterval;

function startAutoRefresh() {
  autoRefreshInterval = setInterval(() => {
    if (!document.hidden) { // Only refresh if page is visible
      console.log('🔄 Auto-refreshing appointments...');
      fetchAppointments();
    }
  }, 30000); // 30 seconds
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

// Start auto-refresh when page becomes visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
});

// Start auto-refresh on load (if page is visible)
if (!document.hidden) {
  startAutoRefresh();
}

// ✅ ADDED: Cleanup on page unload
window.addEventListener('beforeunload', stopAutoRefresh);