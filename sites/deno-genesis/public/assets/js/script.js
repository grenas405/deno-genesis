import { loadNotifications } from './load-components.js';
import { setupNavigation } from './navigation.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 🔔 Load ONLY notifications
  await loadNotifications();

  // 🧭 Setup navigation
  setupNavigation();

  showNotification('✅ Notifications + Navigation initialized for PedroMDominguez.com', 'success');
});