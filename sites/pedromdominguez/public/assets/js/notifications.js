// public/js/notifications.js → v2.0 → Premium Enterprise Notifications
// ================================================================================
// 🚀 DenoGenesis Notification System - Enhanced Color-Coded with Premium Effects
// Features: 3D slide animations, color theming, progress bars, auto-stacking
// ================================================================================

// ================================================================================
// 🎨 NOTIFICATION CONFIGURATION
// ================================================================================

import anime from 'https://cdn.skypack.dev/animejs@3.2.1';

const NOTIFICATION_CONFIG = {
  // Timing configuration
  displayDuration: 6000,      // 6 seconds display time
  fadeOutDuration: 500,       // 0.5 second fade out
  stackLimit: 3,              // Maximum visible notifications

  // Animation configuration
  slideDistance: '120%',      // Distance for slide animation
  bounceDistance: '-12px',    // Bounce back distance

  // Auto-close configuration
  autoClose: true,
  pauseOnHover: true,

  // Icon configuration
  icons: {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  }
};

// ================================================================================
// 🌐 MAIN NOTIFICATION FUNCTION
// ================================================================================

export function showNotification(message, type = "info", options = {}) {
  ensureNotificationsComponent().then(() => {
    const container = document.getElementById("globalNotifications");
    if (!container) {
      console.warn("⚠️ No #globalNotifications container found.");
      return;
    }

    // Merge options with defaults
    const config = { ...NOTIFICATION_CONFIG, ...options };

    // ✅ Convert object payloads safely
    if (typeof message === "object" && message !== null) {
      const msg = message.message || "(no message)";
      const t = message.type || type || "info";
      message = `${t.toUpperCase()} — ${msg}`;
      type = t;
    }

    // Clean up old notifications if stack limit exceeded
    manageNotificationStack(container, config.stackLimit);

    // Create enhanced notification element
    const notification = createNotificationElement(message, type, config);

    // Add to container with premium animations
    container.appendChild(notification);

    // Trigger entrance animation
    triggerEntranceAnimation(notification);

    // Setup auto-close with enhanced effects
    if (config.autoClose) {
      setupAutoClose(notification, config);
    }

    // Add interaction handlers
    addNotificationInteractions(notification, config);

    console.log(`🔔 Notification displayed: ${type.toUpperCase()} - ${message}`);
  });
}

// ================================================================================
// 🎪 NOTIFICATION ELEMENT CREATION
// ================================================================================

function createNotificationElement(message, type, config) {
  const notification = document.createElement("div");

  // Enhanced class structure for premium styling
  notification.className = `notification ${getNotificationClass(type)}`;

  // Add unique ID for tracking
  notification.id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Set ARIA attributes for accessibility
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');
  notification.setAttribute('tabindex', '0');

  // Create enhanced HTML structure
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-indicator"></div>
      <div class="notification-message">
        <span class="notification-icon">${config.icons[type] || config.icons.info}</span>
        <span class="notification-text">${message}</span>
      </div>
      <button class="notification-close" aria-label="Close notification" title="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="notification-progress"></div>
  `;

  // Set initial state for animation
  notification.style.cssText = `
    opacity: 0;
    transform: translateX(${config.slideDistance}) scale(0.8) rotateY(25deg);
    filter: blur(12px);
    pointer-events: none;
  `;

  return notification;
}

// ================================================================================
// 🎯 NOTIFICATION CLASS MAPPING
// ================================================================================

function getNotificationClass(type) {
  const classMap = {
    success: "notification-success",
    warning: "notification-warning",
    error: "notification-error",
    info: "notification-info"
  };

  return classMap[type] || classMap.info;
}

// ================================================================================
// ✨ ANIME.JS ANIMATION MANAGEMENT
// ================================================================================

function triggerEntranceAnimation(notification) {
  // Ensure anime.js is available
  if (typeof anime === 'undefined') {
    console.warn('⚠️ Anime.js not loaded, falling back to CSS animations');
    fallbackEntranceAnimation(notification);
    return;
  }

  // Enable pointer events after animation starts
  notification.style.pointerEvents = 'auto';

  // Premium entrance animation with Anime.js
  const timeline = anime.timeline({
    easing: 'easeOutElastic(1, .8)',
    duration: 800
  });

  timeline
    .add({
      targets: notification,
      translateX: [120, -12],
      scale: [0.8, 1.05],
      rotateY: [25, -3],
      opacity: [0, 0.9],
      filter: ['blur(12px)', 'blur(2px)'],
      duration: 500,
      easing: 'easeOutExpo'
    })
    .add({
      targets: notification,
      translateX: [-12, 4],
      scale: [1.05, 0.98],
      rotateY: [-3, 1],
      opacity: [0.9, 1],
      filter: ['blur(2px)', 'blur(0px)'],
      duration: 200,
      easing: 'easeOutQuad'
    })
    .add({
      targets: notification,
      translateX: [4, 0],
      scale: [0.98, 1],
      rotateY: [1, 0],
      duration: 100,
      easing: 'easeOutSine'
    });

  // Animate the indicator with a delay
  anime({
    targets: notification.querySelector('.notification-indicator'),
    scale: [0, 1.2, 1],
    opacity: [0, 1],
    duration: 600,
    delay: 300,
    easing: 'easeOutElastic(1, .6)'
  });

  // Animate the progress bar
  const progressBar = notification.querySelector('.notification-progress');
  if (progressBar) {
    anime({
      targets: progressBar,
      width: ['100%', '0%'],
      duration: NOTIFICATION_CONFIG.displayDuration,
      easing: 'linear',
      delay: 400
    });
  }
}

function triggerExitAnimation(notification, callback) {
  // Ensure anime.js is available
  if (typeof anime === 'undefined') {
    console.warn('⚠️ Anime.js not loaded, falling back to CSS animations');
    fallbackExitAnimation(notification, callback);
    return;
  }

  // Premium exit animation with Anime.js
  const timeline = anime.timeline({
    complete: callback
  });

  timeline
    .add({
      targets: notification,
      translateX: [0, -8],
      scale: [1, 1.02],
      rotateY: [0, -2],
      opacity: [1, 0.8],
      filter: ['blur(0px)', 'blur(1px)'],
      duration: 150,
      easing: 'easeInQuad'
    })
    .add({
      targets: notification,
      translateX: [-8, 120],
      scale: [1.02, 0.8],
      rotateY: [-2, 25],
      opacity: [0.8, 0],
      filter: ['blur(1px)', 'blur(12px)'],
      duration: 400,
      easing: 'easeInExpo'
    });

  // Disable pointer events immediately
  notification.style.pointerEvents = 'none';
}

// Fallback animations for when Anime.js isn't available
function fallbackEntranceAnimation(notification) {
  notification.style.cssText = `
    opacity: 1;
    transform: translateX(0) scale(1) rotateY(0deg);
    filter: blur(0);
    pointer-events: auto;
    transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  `;
}

function fallbackExitAnimation(notification, callback) {
  notification.style.cssText = `
    opacity: 0;
    transform: translateX(120%) scale(0.8) rotateY(25deg);
    filter: blur(12px);
    pointer-events: none;
    transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  `;

  setTimeout(() => {
    if (callback) callback();
  }, 500);
}

// ================================================================================
// ⏰ AUTO-CLOSE MANAGEMENT
// ================================================================================

function setupAutoClose(notification, config) {
  let timeoutId;
  let remainingTime = config.displayDuration;
  let startTime = Date.now();
  let isPaused = false;

  function startTimer() {
    if (isPaused) return;

    timeoutId = setTimeout(() => {
      closeNotification(notification);
    }, remainingTime);
  }

  function pauseTimer() {
    if (!config.pauseOnHover || isPaused) return;

    clearTimeout(timeoutId);
    remainingTime -= (Date.now() - startTime);
    isPaused = true;
  }

  function resumeTimer() {
    if (!config.pauseOnHover || !isPaused) return;

    isPaused = false;
    startTime = Date.now();
    startTimer();
  }

  // Setup hover pause/resume
  if (config.pauseOnHover) {
    notification.addEventListener('mouseenter', pauseTimer);
    notification.addEventListener('mouseleave', resumeTimer);
    notification.addEventListener('focus', pauseTimer);
    notification.addEventListener('blur', resumeTimer);
  }

  // Start the timer
  startTimer();

  // Store timer functions for external access
  notification._notificationTimer = {
    pause: pauseTimer,
    resume: resumeTimer,
    clear: () => clearTimeout(timeoutId)
  };
}

// ================================================================================
// 🖱️ ENHANCED INTERACTION HANDLERS WITH ANIME.JS
// ================================================================================

function addNotificationInteractions(notification, config) {
  // Close button functionality with micro-animation
  const closeButton = notification.querySelector('.notification-close');
  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();

      // Animate close button before closing
      if (typeof anime !== 'undefined') {
        anime({
          targets: closeButton,
          scale: [1, 1.2, 0.8],
          rotate: [0, 90],
          duration: 200,
          easing: 'easeOutQuad',
          complete: () => closeNotification(notification)
        });
      } else {
        closeNotification(notification);
      }
    });

    // Close button hover effects
    closeButton.addEventListener('mouseenter', () => {
      if (typeof anime !== 'undefined') {
        anime({
          targets: closeButton,
          scale: 1.1,
          rotate: 90,
          duration: 200,
          easing: 'easeOutQuad'
        });
      }
    });

    closeButton.addEventListener('mouseleave', () => {
      if (typeof anime !== 'undefined') {
        anime({
          targets: closeButton,
          scale: 1,
          rotate: 0,
          duration: 200,
          easing: 'easeOutQuad'
        });
      }
    });
  }

  // Click to close functionality
  notification.addEventListener('click', () => {
    closeNotification(notification);
  });

  // Keyboard accessibility
  notification.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeNotification(notification);
    }
  });

  // Enhanced hover effects with Anime.js
  notification.addEventListener('mouseenter', () => {
    if (typeof anime !== 'undefined') {
      anime({
        targets: notification,
        translateX: -8,
        scale: 1.02,
        duration: 300,
        easing: 'easeOutQuad'
      });

      // Animate indicator on hover
      anime({
        targets: notification.querySelector('.notification-indicator'),
        scale: 1.2,
        duration: 200,
        easing: 'easeOutQuad'
      });
    } else {
      notification.style.transform = 'translateX(-8px) scale(1.02)';
    }
  });

  notification.addEventListener('mouseleave', () => {
    if (typeof anime !== 'undefined') {
      anime({
        targets: notification,
        translateX: 0,
        scale: 1,
        duration: 300,
        easing: 'easeOutQuad'
      });

      // Animate indicator back
      anime({
        targets: notification.querySelector('.notification-indicator'),
        scale: 1,
        duration: 200,
        easing: 'easeOutQuad'
      });
    } else {
      notification.style.transform = 'translateX(0) scale(1)';
    }
  });

  // Focus animations
  notification.addEventListener('focus', () => {
    if (typeof anime !== 'undefined') {
      anime({
        targets: notification,
        scale: 1.01,
        duration: 200,
        easing: 'easeOutQuad'
      });
    }
  });

  notification.addEventListener('blur', () => {
    if (typeof anime !== 'undefined') {
      anime({
        targets: notification,
        scale: 1,
        duration: 200,
        easing: 'easeOutQuad'
      });
    }
  });
}

// ================================================================================
// 🗑️ NOTIFICATION CLEANUP
// ================================================================================

function closeNotification(notification) {
  // Clear any existing timers
  if (notification._notificationTimer) {
    notification._notificationTimer.clear();
  }

  // Trigger exit animation
  triggerExitAnimation(notification, () => {
    // Remove from DOM
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }

    // Restack remaining notifications
    restackNotifications();
  });
}

function manageNotificationStack(container, stackLimit) {
  const notifications = container.querySelectorAll('.notification');

  // Remove excess notifications from the bottom
  if (notifications.length >= stackLimit) {
    const excess = notifications.length - stackLimit + 1;
    for (let i = 0; i < excess; i++) {
      if (notifications[i]) {
        closeNotification(notifications[i]);
      }
    }
  }
}

function restackNotifications() {
  const container = document.getElementById("globalNotifications");
  if (!container) return;

  const notifications = container.querySelectorAll('.notification');

  // Use Anime.js for smooth restacking animation
  if (typeof anime !== 'undefined') {
    notifications.forEach((notification, index) => {
      const offset = index * 8;
      const scale = Math.max(0.92, 1 - (index * 0.04));
      const opacity = Math.max(0.7, 1 - (index * 0.15));

      anime({
        targets: notification,
        marginTop: index > 0 ? `-${offset}px` : '0px',
        scale: scale,
        opacity: opacity,
        duration: 400,
        easing: 'easeOutQuart'
      });

      // Set z-index for proper stacking
      notification.style.zIndex = 10000 - index;
    });
  } else {
    // Fallback without anime.js
    notifications.forEach((notification, index) => {
      const offset = index * 8;
      const scale = Math.max(0.95, 1 - (index * 0.05));

      if (index > 0) {
        notification.style.marginTop = `-${offset}px`;
        notification.style.transform = `scale(${scale})`;
        notification.style.zIndex = 10000 - index;
      } else {
        notification.style.marginTop = '0';
        notification.style.transform = 'scale(1)';
        notification.style.zIndex = 10000;
      }
    });
  }
}

// ================================================================================
// 🔧 UTILITY FUNCTIONS
// ================================================================================

// Enhanced notification variants
export function showSuccessNotification(message, options = {}) {
  return showNotification(message, 'success', options);
}

export function showInfoNotification(message, options = {}) {
  return showNotification(message, 'info', options);
}

export function showWarningNotification(message, options = {}) {
  return showNotification(message, 'warning', options);
}

export function showErrorNotification(message, options = {}) {
  return showNotification(message, 'error', options);
}

// Persistent notification (no auto-close)
export function showPersistentNotification(message, type = 'info', options = {}) {
  return showNotification(message, type, { ...options, autoClose: false });
}

// Quick notification (shorter display time)
export function showQuickNotification(message, type = 'info', options = {}) {
  return showNotification(message, type, { ...options, displayDuration: 3000 });
}

// Clear all notifications
export function clearAllNotifications() {
  const container = document.getElementById("globalNotifications");
  if (!container) return;

  const notifications = container.querySelectorAll('.notification');
  notifications.forEach(notification => {
    closeNotification(notification);
  });
}

// Get notification count
export function getNotificationCount() {
  const container = document.getElementById("globalNotifications");
  if (!container) return 0;

  return container.querySelectorAll('.notification').length;
}

// ================================================================================
// 🧠 COMPONENT INITIALIZATION
// ================================================================================

// Enhanced utility to auto-load notifications.html if not already present
async function ensureNotificationsComponent() {
  if (document.getElementById("globalNotifications")) return;

  try {
    console.log('📦 Loading notifications component...');

    // Try multiple possible paths for the component
    const possiblePaths = [
      "/components/notifications.html",
      "../../components/notifications.html",
      "./components/notifications.html"
    ];

    let html = null;
    let loadedFrom = null;

    for (const path of possiblePaths) {
      try {
        const res = await fetch(path);
        if (res.ok) {
          html = await res.text();
          loadedFrom = path;
          break;
        }
      } catch (err) {
        console.log(`⚠️ Failed to load from ${path}, trying next...`);
      }
    }

    if (!html) {
      throw new Error('Could not load notifications.html from any path');
    }

    // Create and inject the component
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    console.log(`✅ Notifications component loaded from: ${loadedFrom}`);

    // Ensure the container has proper styling
    const notificationsContainer = document.getElementById("globalNotifications");
    if (notificationsContainer) {
      notificationsContainer.className = "notifications-container";
    }

  } catch (err) {
    console.error("❌ Failed to load notifications component:", err);

    // Fallback: create minimal notifications container
    const fallbackContainer = document.createElement("div");
    fallbackContainer.id = "globalNotifications";
    fallbackContainer.className = "notifications-container";
    fallbackContainer.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1rem;
      pointer-events: none;
      max-width: 420px;
    `;
    document.body.appendChild(fallbackContainer);

    console.log('🔧 Created fallback notifications container');
  }
}

// ================================================================================
// 🎯 DEVELOPMENT & DEBUGGING UTILITIES
// ================================================================================

// Development mode utilities
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  window.DenoGenesisNotifications = {
    show: showNotification,
    showSuccess: showSuccessNotification,
    showInfo: showInfoNotification,
    showWarning: showWarningNotification,
    showError: showErrorNotification,
    showPersistent: showPersistentNotification,
    showQuick: showQuickNotification,
    clear: clearAllNotifications,
    count: getNotificationCount,

    // Test functions
    test: () => {
      showSuccessNotification('✅ Success notification test');
      setTimeout(() => showInfoNotification('ℹ️ Info notification test'), 500);
      setTimeout(() => showWarningNotification('⚠️ Warning notification test'), 1000);
      setTimeout(() => showErrorNotification('❌ Error notification test'), 1500);
    },

    config: NOTIFICATION_CONFIG
  };

  console.log('🔧 DenoGenesis Notifications available at window.DenoGenesisNotifications');
}

// ================================================================================
// 🚀 INITIALIZATION
// ================================================================================

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureNotificationsComponent);
} else {
  ensureNotificationsComponent();
}
