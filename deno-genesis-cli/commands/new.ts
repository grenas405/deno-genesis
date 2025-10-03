/**
 * Genesis New Command - Create component-based sites
 * 
 * Unix Philosophy Implementation:
 * - Do one thing well: Generate component architecture sites
 * - Accept text input: Site name, template type, component specs
 * - Produce text output: Component files, loaders, and configuration
 * - Filter and transform: User intent → component-based site structure
 * - Composable: Works within existing hub-and-spoke architecture
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

interface CLIContext {
  cwd: string;
  configPath: string;
  verbose: boolean;
  dryRun: boolean;
  format: 'text' | 'json' | 'yaml';
}

interface SiteTemplate {
  name: string;
  description: string;
  files: Record<string, string>;
  directories: string[];
}

// Site templates with component architecture
const SITE_TEMPLATES: Record<string, SiteTemplate> = {
  webapp: {
    name: "Component-Based Web Application",
    description: "Full web application with notification-first component loader",
    directories: [
      "assets/css",
      "assets/js",
      "components",
      "pages"
    ],
    files: {
      "index.html": (siteName: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteName} - DenoGenesis Framework</title>
    <meta name="description" content="${siteName} built with DenoGenesis component architecture">
    
    <!-- Design System -->
    <link rel="stylesheet" href="/assets/css/style.css" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
    <!-- Header Component -->
    <header>
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    ${siteName}
                </div>
                <nav class="nav">
                    <a href="#home" class="nav-link">Home</a>
                    <a href="#about" class="nav-link">About</a>
                    <a href="#services" class="nav-link">Services</a>
                    <a href="#contact" class="nav-link">Contact</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero" id="home">
        <div class="container">
            <div class="hero-content">
                <h1 class="fade-in">${siteName}</h1>
                <p class="fade-in">
                    Built with DenoGenesis Framework<br>
                    <span class="highlight">Component-Based Architecture</span>
                </p>
                
                <div class="cta-buttons fade-in">
                    <a href="#services" class="btn btn-primary">Get Started</a>
                    <a href="#about" class="btn btn-secondary">Learn More</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Main Content -->
    <main id="main-content">
        <!-- Content will be loaded dynamically by components -->
    </main>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${siteName}</h3>
                    <p>Built with DenoGenesis Framework</p>
                    <p>Component-based architecture for modern web applications</p>
                </div>
                
                <div class="footer-section">
                    <h3>Technology</h3>
                    <p>Deno Runtime</p>
                    <p>Component Architecture</p>
                    <p>Notification System</p>
                    <p>Progressive Enhancement</p>
                </div>
            </div>
            
            <div style="text-align: center; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                <p>&copy; 2025 ${siteName} | Powered by DenoGenesis Framework</p>
            </div>
        </div>
    </footer>

    <!-- Component System Scripts -->
    <script type="module" src="/assets/js/notifications.js"></script>
    <script type="module" src="/assets/js/load-components.js"></script>
    <script type="module" src="/assets/js/navigation.js"></script>
    <script type="module" src="/assets/js/main.js"></script>
</body>
</html>`,

      "assets/js/notifications.js": () => `// notifications.js → v2.0 → Premium Enterprise Notifications
// ================================================================================
// 🚀 DenoGenesis Notification System - Enhanced Color-Coded with Premium Effects
// Features: 3D slide animations, color theming, progress bars, auto-stacking
// ================================================================================

import anime from 'https://cdn.skypack.dev/animejs@3.2.1';

// ================================================================================
// 🎨 NOTIFICATION CONFIGURATION
// ================================================================================

const NOTIFICATION_CONFIG = {
  displayDuration: 6000,
  fadeOutDuration: 500,
  stackLimit: 3,
  slideDistance: '120%',
  bounceDistance: '-12px',
  autoClose: true,
  pauseOnHover: true,
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

    const config = { ...NOTIFICATION_CONFIG, ...options };

    if (typeof message === "object" && message !== null) {
      const msg = message.message || "(no message)";
      const t = message.type || type || "info";
      message = \`\${t.toUpperCase()} — \${msg}\`;
      type = t;
    }

    manageNotificationStack(container, config.stackLimit);
    const notification = createNotificationElement(message, type, config);
    container.appendChild(notification);
    triggerEntranceAnimation(notification);

    if (config.autoClose) {
      setupAutoClose(notification, config);
    }

    addNotificationInteractions(notification, config);
    console.log(\`🔔 Notification: \${type.toUpperCase()} - \${message}\`);
  });
}

// ================================================================================
// 🎪 NOTIFICATION ELEMENT CREATION
// ================================================================================

function createNotificationElement(message, type, config) {
  const notification = document.createElement("div");
  notification.className = \`notification \${getNotificationClass(type)}\`;
  notification.id = \`notification-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');
  notification.setAttribute('tabindex', '0');

  notification.innerHTML = \`
    <div class="notification-content">
      <div class="notification-indicator"></div>
      <div class="notification-message">
        <span class="notification-icon">\${config.icons[type] || config.icons.info}</span>
        <span class="notification-text">\${message}</span>
      </div>
      <button class="notification-close" aria-label="Close notification" title="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="notification-progress"></div>
  \`;

  notification.style.cssText = \`
    opacity: 0;
    transform: translateX(\${config.slideDistance}) scale(0.8) rotateY(25deg);
    filter: blur(12px);
    pointer-events: none;
  \`;

  return notification;
}

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
  if (typeof anime === 'undefined') {
    fallbackEntranceAnimation(notification);
    return;
  }

  notification.style.pointerEvents = 'auto';

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

  anime({
    targets: notification.querySelector('.notification-indicator'),
    scale: [0, 1.2, 1],
    opacity: [0, 1],
    duration: 600,
    delay: 300,
    easing: 'easeOutElastic(1, .6)'
  });

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
  if (typeof anime === 'undefined') {
    fallbackExitAnimation(notification, callback);
    return;
  }

  const timeline = anime.timeline({ complete: callback });

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

  notification.style.pointerEvents = 'none';
}

function fallbackEntranceAnimation(notification) {
  notification.style.cssText = \`
    opacity: 1;
    transform: translateX(0) scale(1) rotateY(0deg);
    filter: blur(0);
    pointer-events: auto;
    transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  \`;
}

function fallbackExitAnimation(notification, callback) {
  notification.style.cssText = \`
    opacity: 0;
    transform: translateX(120%) scale(0.8) rotateY(25deg);
    filter: blur(12px);
    pointer-events: none;
    transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  \`;
  setTimeout(() => { if (callback) callback(); }, 500);
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

  if (config.pauseOnHover) {
    notification.addEventListener('mouseenter', pauseTimer);
    notification.addEventListener('mouseleave', resumeTimer);
    notification.addEventListener('focus', pauseTimer);
    notification.addEventListener('blur', resumeTimer);
  }

  startTimer();

  notification._notificationTimer = {
    pause: pauseTimer,
    resume: resumeTimer,
    clear: () => clearTimeout(timeoutId)
  };
}

// ================================================================================
// 🖱️ INTERACTION HANDLERS
// ================================================================================

function addNotificationInteractions(notification, config) {
  const closeButton = notification.querySelector('.notification-close');
  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
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

  notification.addEventListener('click', () => closeNotification(notification));

  notification.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeNotification(notification);
    }
  });

  notification.addEventListener('mouseenter', () => {
    if (typeof anime !== 'undefined') {
      anime({
        targets: notification,
        translateX: -8,
        scale: 1.02,
        duration: 300,
        easing: 'easeOutQuad'
      });
      anime({
        targets: notification.querySelector('.notification-indicator'),
        scale: 1.2,
        duration: 200,
        easing: 'easeOutQuad'
      });
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
      anime({
        targets: notification.querySelector('.notification-indicator'),
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
  if (notification._notificationTimer) {
    notification._notificationTimer.clear();
  }

  triggerExitAnimation(notification, () => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
    restackNotifications();
  });
}

function manageNotificationStack(container, stackLimit) {
  const notifications = container.querySelectorAll('.notification');
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

  if (typeof anime !== 'undefined') {
    notifications.forEach((notification, index) => {
      const offset = index * 8;
      const scale = Math.max(0.92, 1 - (index * 0.04));
      const opacity = Math.max(0.7, 1 - (index * 0.15));

      anime({
        targets: notification,
        marginTop: index > 0 ? \`-\${offset}px\` : '0px',
        scale: scale,
        opacity: opacity,
        duration: 400,
        easing: 'easeOutQuart'
      });

      notification.style.zIndex = 10000 - index;
    });
  }
}

// ================================================================================
// 🔧 UTILITY FUNCTIONS
// ================================================================================

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

export function showPersistentNotification(message, type = 'info', options = {}) {
  return showNotification(message, type, { ...options, autoClose: false });
}

export function clearAllNotifications() {
  const container = document.getElementById("globalNotifications");
  if (!container) return;
  const notifications = container.querySelectorAll('.notification');
  notifications.forEach(notification => closeNotification(notification));
}

export function getNotificationCount() {
  const container = document.getElementById("globalNotifications");
  if (!container) return 0;
  return container.querySelectorAll('.notification').length;
}

// ================================================================================
// 🧠 COMPONENT INITIALIZATION
// ================================================================================

async function ensureNotificationsComponent() {
  if (document.getElementById("globalNotifications")) return;

  try {
    console.log('📦 Loading notifications component...');

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
        console.log(\`⚠️ Failed to load from \${path}, trying next...\`);
      }
    }

    if (!html) {
      throw new Error('Could not load notifications.html from any path');
    }

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    console.log(\`✅ Notifications component loaded from: \${loadedFrom}\`);

    const notificationsContainer = document.getElementById("globalNotifications");
    if (notificationsContainer) {
      notificationsContainer.className = "notifications-container";
    }

  } catch (err) {
    console.error("❌ Failed to load notifications component:", err);

    const fallbackContainer = document.createElement("div");
    fallbackContainer.id = "globalNotifications";
    fallbackContainer.className = "notifications-container";
    fallbackContainer.style.cssText = \`
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
    \`;
    document.body.appendChild(fallbackContainer);

    console.log('🔧 Created fallback notifications container');
  }
}

// ================================================================================
// 🚀 INITIALIZATION
// ================================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureNotificationsComponent);
} else {
  ensureNotificationsComponent();
}`,

      "assets/js/load-components.js": (siteName: string) => `// load-components.js → v3.0 → Notifications-First Loader
// ================================================================================
// 🚀 DenoGenesis Component Loader (Minimal, Expandable, Self-Documenting)
// Focus: Notifications system with clean lifecycle + extensibility
// ================================================================================

import { showNotification } from './notifications.js';

// ================================================================================
// 🔧 COMPONENT REGISTRY
// - Each entry documents itself (path, dependencies, DOM target, etc.)
// - Easy to expand later: just add another component config
// ================================================================================

const COMPONENT_REGISTRY = {
  notifications: {
    path: '/components/notifications.html', // 📂 Component HTML path
    cacheable: true,                        // 💾 Allow caching
    targetElement: 'body',                  // 🎯 Where to insert
    appendMethod: 'appendChild',            // 🔗 How to insert
    loader: null                            // ⚙️ Optional init fn
  }
};

// ================================================================================
// 📦 STATE & METRICS
// - Tracks loaded components
// - Future expansion: performance metrics, error counters, etc.
// ================================================================================

const loadedComponents = new Set();

// ================================================================================
// 🛠️ CORE HELPERS
// ================================================================================

/**
 * Fetches a component's HTML from the server.
 * @param {string} componentPath - Path to the HTML fragment
 * @returns {Promise<string>} HTML string
 */
async function fetchComponentHTML(componentPath) {
  const response = await fetch(componentPath);
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }
  const html = await response.text();
  if (!html.trim()) {
    throw new Error("Empty component HTML received");
  }
  return html;
}

/**
 * Inserts the fetched HTML into the DOM according to registry config.
 * @param {string} html - Raw HTML string
 * @param {object} config - Component config
 * @param {string} componentName - Name of the component
 */
function insertComponentIntoDOM(html, config, componentName) {
  const container = document.createElement('div');
  container.innerHTML = html;
  container.setAttribute('data-component', componentName);

  const target = document.querySelector(config.targetElement) || document.body;

  target[config.appendMethod](container);

  showNotification(\`📍 \${componentName} inserted into \${config.targetElement}\`, "info");
  return container;
}

// ================================================================================
// 🎯 UNIVERSAL LOADER
// - Loads any component by name from the registry
// - Expandable to handle dependencies, caching, performance later
// ================================================================================

export async function loadComponent(componentName, ...args) {
  if (loadedComponents.has(componentName)) {
    showNotification(\`⚠️ \${componentName} already loaded\`, "warning");
    return;
  }

  const config = COMPONENT_REGISTRY[componentName];
  if (!config) {
    showNotification(\`❌ Unknown component: \${componentName}\`, "error");
    return;
  }

  try {
    showNotification(\`⏳ Loading \${componentName}...\`, "info");

    const html = await fetchComponentHTML(config.path);
    const container = insertComponentIntoDOM(html, config, componentName);

    if (config.loader && typeof config.loader === 'function') {
      await config.loader(...args);
      showNotification(\`⚙️ Initialized \${componentName}\`, "success");
    }

    loadedComponents.add(componentName);
    showNotification(\`✅ \${componentName} loaded successfully\`, "success");
    return container;

  } catch (err) {
    showNotification(\`❌ Failed to load \${componentName}: \${err.message}\`, "error");
  }
}

// ================================================================================
// 🎯 PUBLIC API (Backward Compatible)
// ================================================================================

export function loadNotifications() {
  return loadComponent('notifications');
}

/**
 * Utility: Returns list of loaded components.
 */
export function getLoadedComponents() {
  return Array.from(loadedComponents);
}

/**
 * Utility: Returns the registry for inspection/debugging.
 */
export function getComponentRegistry() {
  return { ...COMPONENT_REGISTRY };
}

// ================================================================================
// 🚀 AUTO-BOOT
// ================================================================================

document.addEventListener('DOMContentLoaded', async () => {
  showNotification("🚀 DenoGenesis Loader initialized", "info");
  await loadNotifications();
});`, loaded from cache\`, "success");
    } else {
      html = await fetchComponentHTML(config.path);
      if (config.cacheable) {
        componentCache.set(config.path, html);
      }
    }

    const container = insertComponentIntoDOM(html, config, componentName);

    if (config.loader && typeof config.loader === 'function') {
      await config.loader(...args);
      showNotification(\`⚙️ Initialized \${componentName}\`, "success");
    }

    loadedComponents.add(componentName);
    showNotification(\`✅ \${componentName} loaded successfully\`, "success");
    return container;

  } catch (err) {
    showNotification(\`❌ Failed to load \${componentName}: \${err.message}\`, "error");
  }
}

// ================================================================================
// 🎯 PUBLIC API (Backward Compatible)
// ================================================================================

export function loadNotifications() {
  return loadComponent('notifications');
}

export function loadHero() {
  return loadComponent('hero');
}

export function loadServices() {
  return loadComponent('services');
}

export function loadContact() {
  return loadComponent('contact');
}

/**
 * Utility: Returns list of loaded components.
 */
export function getLoadedComponents() {
  return Array.from(loadedComponents);
}

/**
 * Utility: Returns the registry for inspection/debugging.
 */
export function getComponentRegistry() {
  return { ...COMPONENT_REGISTRY };
}

/**
 * Utility: Clear component cache
 */
export function clearCache() {
  componentCache.clear();
  showNotification('🧹 Component cache cleared', 'info');
}

// ================================================================================
// 🚀 AUTO-BOOT
// ================================================================================

document.addEventListener('DOMContentLoaded', async () => {
  showNotification("🚀 ${siteName} Component Loader initialized", "info");
  await loadNotifications();
});`,

      "assets/js/navigation.js": () => `// navigation.js → v3.0 → Smooth Navigation System
// ================================================================================
// 🧭 DenoGenesis Navigation System
// Purpose: Handle smooth scrolling, active states, mobile menu
// ================================================================================

import { showNotification } from './notifications.js';

// ================================================================================
// 🎯 NAVIGATION SETUP
// ================================================================================

export function setupNavigation() {
  // Smooth scrolling for anchor links
  setupSmoothScrolling();
  
  // Active navigation highlighting
  setupActiveNavigation();
  
  // Mobile menu (if exists)
  setupMobileMenu();
  
  showNotification('🧭 Navigation system initialized', 'info');
}

// ================================================================================
// 🌊 SMOOTH SCROLLING
// ================================================================================

function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without causing scroll
        history.pushState(null, null, \`#\${targetId}\`);
        
        showNotification(\`📍 Navigated to \${targetId}\`, 'info');
      }
    });
  });
}

// ================================================================================
// 🎯 ACTIVE NAVIGATION HIGHLIGHTING
// ================================================================================

function setupActiveNavigation() {
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  const sections = Array.from(navLinks).map(link => {
    const targetId = link.getAttribute('href').substring(1);
    return {
      element: document.getElementById(targetId),
      link: link,
      id: targetId
    };
  }).filter(item => item.element);

  // Intersection Observer for active states
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const section = sections.find(s => s.element === entry.target);
      if (section) {
        if (entry.isIntersecting) {
          // Remove active from all links
          navLinks.forEach(link => link.classList.remove('active'));
          
          // Add active to current section's link
          section.link.classList.add('active');
          
          // Update page title
          document.title = \`\${section.id.charAt(0).toUpperCase() + section.id.slice(1)} - \${document.title.split(' - ')[1] || document.title}\`;
        }
      }
    });
  }, {
    rootMargin: '-20% 0px -70% 0px'
  });

  sections.forEach(section => {
    observer.observe(section.element);
  });
}

// ================================================================================
// 📱 MOBILE MENU
// ================================================================================

function setupMobileMenu() {
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const nav = document.querySelector('.nav');
  
  // Create mobile toggle if nav exists but toggle doesn't
  if (nav && !mobileToggle) {
    createMobileToggle();
  }
  
  if (mobileToggle && (mobileMenu || nav)) {
    const menu = mobileMenu || nav;
    
    mobileToggle.addEventListener('click', () => {
      const isOpen = menu.hasAttribute('data-mobile-open');
      
      if (isOpen) {
        menu.removeAttribute('data-mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        showNotification('📱 Mobile menu closed', 'info');
      } else {
        menu.setAttribute('data-mobile-open', '');
        mobileToggle.setAttribute('aria-expanded', 'true');
        showNotification('📱 Mobile menu opened', 'info');
      }
    });
    
    // Close mobile menu when clicking on nav links
    const mobileNavLinks = menu.querySelectorAll('a');
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        menu.removeAttribute('data-mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
    
    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.hasAttribute('data-mobile-open')) {
        menu.removeAttribute('data-mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

function createMobileToggle() {
  const header = document.querySelector('header .header-content');
  if (header) {
    const toggle = document.createElement('button');
    toggle.setAttribute('data-mobile-toggle', '');
    toggle.setAttribute('aria-label', 'Toggle mobile menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = \`
      <span></span>
      <span></span>
      <span></span>
    \`;
    toggle.style.cssText = \`
      display: none;
      flex-direction: column;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      
      @media (max-width: 768px) {
        display: flex;
      }
    \`;
    
    // Style hamburger lines
    toggle.querySelectorAll('span').forEach(span => {
      span.style.cssText = \`
        width: 24px;
        height: 2px;
        background: currentColor;
        transition: all 0.3s ease;
      \`;
    });
    
    header.appendChild(toggle);
  }
}`,

      "assets/js/main.js": (siteName: string) => `import { loadNotifications } from './load-components.js';
import { setupNavigation } from './navigation.js';
import { showNotification } from './notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 🔔 Load ONLY notifications
  await loadNotifications();

  // 🧭 Setup navigation
  setupNavigation();

  showNotification('✅ ${siteName} initialized successfully', 'success');
  
  // Initialize fade-in animations
  initializeFadeInAnimations();
  
  // Setup performance monitoring
  if ('performance' in window) {
    const loadTime = performance.now();
    console.log(\`🚀 \${loadTime.toFixed(0)}ms - ${siteName} loaded\`);
    console.log('⚡ Built with DenoGenesis Framework');
  }
});

// ================================================================================
// 🎨 ANIMATION SYSTEM
// ================================================================================

function initializeFadeInAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  const fadeElements = document.querySelectorAll('.fade-in');
  fadeElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = \`opacity 0.8s ease \${index * 0.1}s, transform 0.8s ease \${index * 0.1}s\`;
    observer.observe(el);
  });
}`,,

      "assets/css/style.css": () => `/* DenoGenesis Framework - Component Architecture Styles */
/* ================================================================================ */
/* 🎨 DESIGN SYSTEM - CSS Custom Properties */
/* ================================================================================ */

:root {
  /* Brand Colors */
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-light: #3b82f6;
  
  --secondary: #64748b;
  --accent: #f59e0b;
  
  /* Neutrals */
  --white: #ffffff;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  --black: #000000;
  
  /* Typography */
  --font-sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", monospace;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
}

/* ================================================================================ */
/* 🔧 RESET & BASE STYLES */
/* ================================================================================ */

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  line-height: 1.6;
  color: var(--gray-900);
  background: var(--white);
  overflow-x: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* ================================================================================ */
/* 🧭 HEADER COMPONENT */
/* ================================================================================ */

header {
  background: var(--white);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) 0;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.nav {
  display: flex;
  gap: var(--space-6);
}

.nav-link {
  color: var(--gray-800);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
  position: relative;
}

.nav-link:hover,
.nav-link.active {
  color: var(--primary);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary);
}

/* Mobile Navigation */
@media (max-width: 768px) {
  .nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--white);
    box-shadow: var(--shadow-md);
    flex-direction: column;
    padding: var(--space-4);
  }
  
  .nav[data-mobile-open] {
    display: flex;
  }
}

/* ================================================================================ */
/* 🚀 HERO COMPONENT */
/* ================================================================================ */

.hero {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  color: var(--white);
  padding: var(--space-20) 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-content h1 {
  font-size: 3.5rem;
  font-weight: 700;
  margin: 0 0 var(--space-4) 0;
  line-height: 1.1;
}

.hero-content p {
  font-size: 1.25rem;
  margin: 0 0 var(--space-8) 0;
  opacity: 0.9;
}

.highlight {
  color: var(--accent);
  font-weight: 600;
}

.cta-buttons {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3) var(--space-6);
  text-decoration: none;
  font-weight: 600;
  border-radius: 0.5rem;
  transition: all var(--transition-normal);
  border: 2px solid transparent;
}

.btn-primary {
  background: var(--white);
  color: var(--primary);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: transparent;
  color: var(--white);
  border-color: var(--white);
}

.btn-secondary:hover {
  background: var(--white);
  color: var(--primary);
}

/* ================================================================================ */
/* 🦶 FOOTER COMPONENT */
/* ================================================================================ */

footer {
  background: var(--gray-900);
  color: var(--gray-200);
  padding: var(--space-16) 0 var(--space-8) 0;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

.footer-section h3 {
  color: var(--white);
  font-size: 1.25rem;
  margin: 0 0 var(--space-4) 0;
}

.footer-section p {
  margin: 0 0 var(--space-2) 0;
  opacity: 0.8;
}

/* ================================================================================ */
/* 🎨 ANIMATION UTILITIES */
/* ================================================================================ */

.fade-in {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ================================================================================ */
/* 📱 RESPONSIVE DESIGN */
/* ================================================================================ */

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.5rem;
  }
  
  .hero-content p {
    font-size: 1.1rem;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
}`,

      "components/notifications.html": () => `<!-- Notifications Component with Premium Styling -->
<div id="globalNotifications" class="notifications-container"></div>

<style>
/* ================================================================================ */
/* 🎨 PREMIUM NOTIFICATION SYSTEM STYLES */
/* ================================================================================ */

.notifications-container {
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
}

/* Base Notification Styling */
.notification {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-width: 320px;
  max-width: 420px;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  transform-style: preserve-3d;
  perspective: 1000px;
}

.notification:hover {
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 8px 20px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.08);
}

/* Notification Content Layout */
.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  position: relative;
  z-index: 2;
}

/* Color Indicator Bar */
.notification-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, currentColor 0%, transparent 100%);
  border-radius: 12px 0 0 12px;
}

/* Notification Message Area */
.notification-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.notification-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.notification-text {
  color: #1e293b;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Close Button */
.notification-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.notification-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1e293b;
}

.notification-close:active {
  transform: scale(0.9);
}

/* Progress Bar */
.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: currentColor;
  opacity: 0.3;
  border-radius: 0 0 12px 12px;
  transform-origin: left center;
  z-index: 1;
}

/* ================================================================================ */
/* 🎨 NOTIFICATION TYPE VARIANTS */
/* ================================================================================ */

/* Success Notification */
.notification-success {
  color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.notification-success:hover {
  border-color: rgba(16, 185, 129, 0.3);
}

.notification-success .notification-progress {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

/* Info Notification */
.notification-info {
  color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.notification-info:hover {
  border-color: rgba(59, 130, 246, 0.3);
}

.notification-info .notification-progress {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

/* Warning Notification */
.notification-warning {
  color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.notification-warning:hover {
  border-color: rgba(245, 158, 11, 0.3);
}

.notification-warning .notification-progress {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

/* Error Notification */
.notification-error {
  color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.notification-error:hover {
  border-color: rgba(239, 68, 68, 0.3);
}

.notification-error .notification-progress {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

/* ================================================================================ */
/* 📱 RESPONSIVE DESIGN */
/* ================================================================================ */

@media (max-width: 768px) {
  .notifications-container {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
    align-items: stretch;
  }

  .notification {
    min-width: 0;
    max-width: none;
  }

  .notification-text {
    font-size: 0.875rem;
  }
}

/* ================================================================================ */
/* ♿ ACCESSIBILITY */
/* ================================================================================ */

.notification:focus {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

.notification:focus:not(:focus-visible) {
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .notification,
  .notification-close,
  .notification-progress {
    transition: none !important;
    animation: none !important;
  }
}

/* ================================================================================ */
/* 🌙 DARK MODE SUPPORT */
/* ================================================================================ */

@media (prefers-color-scheme: dark) {
  .notification {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    box-shadow: 
      0 10px 40px rgba(0, 0, 0, 0.4),
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .notification-text {
    color: #f1f5f9;
  }

  .notification-close {
    color: #94a3b8;
  }

  .notification-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f1f5f9;
  }

  .notification-success {
    background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .notification-info {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .notification-warning {
    background: linear-gradient(135deg, #78350f 0%, #451a03 100%);
    border-color: rgba(245, 158, 11, 0.3);
  }

  .notification-error {
    background: linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%);
    border-color: rgba(239, 68, 68, 0.3);
  }
}
</style>`,

      "components/hero.html": (siteName: string) => `<!-- Hero Component -->
<section class="hero-component fade-in" data-component="hero">
  <div class="container">
    <div class="component-content">
      <h2>Welcome to ${siteName}</h2>
      <p>This is a dynamically loaded hero component showcasing the DenoGenesis component architecture.</p>
      
      <div class="feature-grid">
        <div class="feature-item">
          <div class="feature-icon">🚀</div>
          <h3>Fast Loading</h3>
          <p>Components load on demand with caching support</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🔔</div>
          <h3>Notifications</h3>
          <p>Real-time feedback for all user interactions</p>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">📱</div>
          <h3>Responsive</h3>
          <p>Mobile-first design with progressive enhancement</p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
.hero-component {
  padding: var(--space-16) 0;
  background: var(--gray-50);
}

.component-content {
  text-align: center;
}

.component-content h2 {
  font-size: 2.5rem;
  margin: 0 0 var(--space-4) 0;
  color: var(--primary);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-6);
  margin-top: var(--space-8);
}

.feature-item {
  background: var(--white);
  padding: var(--space-6);
  border-radius: 1rem;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-normal);
}

.feature-item:hover {
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: var(--space-3);
}

.feature-item h3 {
  margin: 0 0 var(--space-2) 0;
  color: var(--gray-900);
}

.feature-item p {
  margin: 0;
  color: var(--gray-600);
}
</style>`,

      "components/services.html": (siteName: string) => `<!-- Services Component -->
<section class="services-component fade-in" data-component="services">
  <div class="container">
    <div class="component-content">
      <h2>Our Services</h2>
      <p>Built with the DenoGenesis Framework component architecture</p>
      
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon">🌐</div>
          <h3>Web Development</h3>
          <p>Modern, responsive websites built with component-based architecture</p>
          <ul>
            <li>Component-based design</li>
            <li>Progressive enhancement</li>
            <li>Mobile-first approach</li>
            <li>Performance optimized</li>
          </ul>
        </div>
        
        <div class="service-card">
          <div class="service-icon">⚡</div>
          <h3>Performance Optimization</h3>
          <p>Fast-loading applications with smart caching and lazy loading</p>
          <ul>
            <li>Component caching</li>
            <li>Lazy loading</li>
            <li>Asset optimization</li>
            <li>Network-aware features</li>
          </ul>
        </div>
        
        <div class="service-card">
          <div class="service-icon">🔧</div>
          <h3>Custom Solutions</h3>
          <p>Tailored applications built for your specific business needs</p>
          <ul>
            <li>Custom components</li>
            <li>API integration</li>
            <li>Database design</li>
            <li>Security implementation</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
.services-component {
  padding: var(--space-16) 0;
  background: var(--white);
}

.component-content {
  text-align: center;
}

.component-content h2 {
  font-size: 2.5rem;
  margin: 0 0 var(--space-4) 0;
  color: var(--gray-900);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-8);
  margin-top: var(--space-8);
}

.service-card {
  background: var(--gray-50);
  padding: var(--space-8);
  border-radius: 1rem;
  text-align: left;
  transition: all var(--transition-normal);
  border: 2px solid transparent;
}

.service-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.service-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-4);
}

.service-card h3 {
  margin: 0 0 var(--space-3) 0;
  color: var(--primary);
  font-size: 1.5rem;
}

.service-card p {
  margin: 0 0 var(--space-4) 0;
  color: var(--gray-700);
}

.service-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.service-card li {
  padding: var(--space-1) 0;
  color: var(--gray-600);
  position: relative;
  padding-left: var(--space-4);
}

.service-card li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary);
  font-weight: bold;
}
</style>`,

      "components/contact.html": (siteName: string) => `<!-- Contact Component -->
<section class="contact-component fade-in" data-component="contact">
  <div class="container">
    <div class="component-content">
      <h2>Get In Touch</h2>
      <p>Ready to build something amazing with DenoGenesis Framework?</p>
      
      <div class="contact-grid">
        <div class="contact-info">
          <h3>Contact Information</h3>
          
          <div class="contact-item">
            <div class="contact-icon">📧</div>
            <div>
              <strong>Email</strong>
              <p>hello@${siteName.toLowerCase().replace(/\s+/g, '')}.com</p>
            </div>
          </div>
          
          <div class="contact-item">
            <div class="contact-icon">📱</div>
            <div>
              <strong>Phone</strong>
              <p>(405) 555-0123</p>
            </div>
          </div>
          
          <div class="contact-item">
            <div class="contact-icon">📍</div>
            <div>
              <strong>Location</strong>
              <p>Oklahoma City, OK</p>
            </div>
          </div>
          
          <div class="tech-stack">
            <h4>Built With</h4>
            <div class="tech-tags">
              <span class="tech-tag">Deno</span>
              <span class="tech-tag">TypeScript</span>
              <span class="tech-tag">Component Architecture</span>
              <span class="tech-tag">Progressive Enhancement</span>
            </div>
          </div>
        </div>
        
        <div class="contact-form">
          <h3>Send a Message</h3>
          
          <form id="contact-form" data-genesis-form="contact">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
              <label for="subject">Subject</label>
              <input type="text" id="subject" name="subject" required>
            </div>
            
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" name="message" rows="5" required></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
.contact-component {
  padding: var(--space-16) 0;
  background: var(--gray-50);
}

.component-content {
  text-align: center;
}

.component-content h2 {
  font-size: 2.5rem;
  margin: 0 0 var(--space-4) 0;
  color: var(--gray-900);
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  margin-top: var(--space-8);
  text-align: left;
}

.contact-info h3,
.contact-form h3 {
  margin: 0 0 var(--space-6) 0;
  color: var(--primary);
  font-size: 1.5rem;
}

.contact-item {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  align-items: flex-start;
}

.contact-icon {
  font-size: 1.5rem;
  width: 2rem;
  flex-shrink: 0;
}

.contact-item strong {
  display: block;
  color: var(--gray-900);
  margin-bottom: var(--space-1);
}

.contact-item p {
  margin: 0;
  color: var(--gray-600);
}

.tech-stack {
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--gray-200);
}

.tech-stack h4 {
  margin: 0 0 var(--space-3) 0;
  color: var(--gray-900);
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tech-tag {
  background: var(--primary);
  color: var(--white);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--space-4);
  font-size: 0.875rem;
  font-weight: 500;
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--gray-900);
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-3);
  border: 2px solid var(--gray-200);
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  transition: border-color var(--transition-fast);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<script>
// Contact form handling
document.getElementById('contact-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  
  // Simulate form submission
  console.log('Contact form submitted:', data);
  
  // Show success notification
  if (window.showNotification) {
    window.showNotification('Message sent successfully! We will get back to you soon.', 'success');
  }
  
  // Reset form
  this.reset();
});
</script>`,

      "README.md": (siteName: string) => `# ${siteName}

Built with DenoGenesis Framework - Component Architecture

## Features

- **Component-Based Architecture**: Modular, reusable components with dynamic loading
- **Notification System**: Real-time user feedback for all interactions  
- **Progressive Enhancement**: Works without JavaScript, enhanced with it
- **Mobile-First Design**: Responsive across all device sizes
- **Performance Optimized**: Component caching and lazy loading
- **Smooth Navigation**: Intersection Observer-based active states

## Project Structure

\`\`\`
${siteName.toLowerCase().replace(/\s+/g, '-')}/
├── index.html                 # Main HTML shell
├── assets/
│   ├── css/
│   │   └── style.css         # Component styles with CSS variables
│   └── js/
│       ├── notifications.js   # Notification system core
│       ├── load-components.js # Dynamic component loader
│       ├── navigation.js      # Smooth navigation system
│       └── main.js           # Application initialization
├── components/
│   ├── notifications.html    # Notifications component template
│   ├── hero.html            # Hero section component
│   ├── services.html        # Services showcase component  
│   └── contact.html         # Contact form component
└── README.md
\`\`\`

## Component System

The site uses a notification-first component loading system:

1. **Notifications**: Core feedback system for user interactions
2. **Component Registry**: Centralized component configuration
3. **Dynamic Loading**: Components loaded on demand with caching
4. **Progressive Enhancement**: Components work offline-first

## Development

### Local Development

\`\`\`bash
# Start Genesis development server
genesis dev ${siteName.toLowerCase().replace(/\s+/g, '-')}

# Or serve statically
python -m http.server 3000
\`\`\`

### Component Development

Add new components by:

1. Creating HTML template in \`components/\`
2. Registering in \`assets/js/load-components.js\`  
3. Adding loader function if needed
4. Styling in component template or main CSS

### Customization

The design system uses CSS custom properties for easy theming:

\`\`\`css
:root {
  --primary: #2563eb;
  --secondary: #64748b;
  --accent: #f59e0b;
  /* ... */
}
\`\`\`

## Deployment

### Genesis Framework Deployment

\`\`\`bash
# Deploy to staging
genesis deploy staging --site=${siteName.toLowerCase().replace(/\s+/g, '-')}

# Deploy to production  
genesis deploy production --site=${siteName.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

### Static Deployment

The site is fully static and can be deployed to any web server:

- Netlify
- Vercel
- GitHub Pages
- Traditional web hosting

## Built With

- **DenoGenesis Framework**: Component architecture and tooling
- **Vanilla JavaScript**: No dependencies, modern ES modules
- **CSS Custom Properties**: Design system and theming
- **Progressive Enhancement**: Accessible, fast, reliable

## License

Built with DenoGenesis Framework  
© 2025 ${siteName}

---

*Powered by DenoGenesis Framework - Revolutionary component architecture for modern web development*`
    }
  },

  static: {
    name: "Static Component Site", 
    description: "Lightweight static site with component architecture",
    directories: [
      "assets/css",
      "assets/js", 
      "components"
    ],
    files: {
      "index.html": (siteName: string) => generateIndexHTML(siteName, "static"),
      "assets/js/notifications.js": () => `// Lightweight notifications for static sites
export function showNotification(message, type = 'info') {
  console.log(\`[\${type.toUpperCase()}] \${message}\`);
  // Minimal notification implementation for static sites
}`,
      "assets/js/main.js": (siteName: string) => `// ${siteName} - Minimal Static Site
console.log('${siteName} - Static site loaded');`,
      "assets/css/style.css": () => generateDesignSystemCSS() + generateComponentsCSS(),
      "README.md": (siteName: string) => `# ${siteName}\n\nStatic site built with Genesis component architecture.`
    }
  },

  api: {
    name: "API Service with Web UI",
    description: "Deno API service with component-based admin interface", 
    directories: [
      "assets/css",
      "assets/js",
      "components",
      "routes",
      "controllers",
      "services"
    ],
    files: {
      "main.ts": (siteName: string) => `import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const app = new Application();
const router = new Router();

// API Routes
router.get("/api/status", (ctx) => {
  ctx.response.body = {
    service: "${siteName}",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  };
});

// Health check
router.get("/health", (ctx) => {
  ctx.response.body = { status: "ok" };
});

// Serve static files for component UI
router.get("/(.*)", async (ctx) => {
  await ctx.send({
    root: \`\${Deno.cwd()}\`,
    index: "index.html",
  });
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

const port = 8000;
console.log(\`🚀 ${siteName} API running on port \${port}\`);
await app.listen({ port });`,

      "index.html": (siteName: string) => generateIndexHTML(siteName, "api"),
      "deno.json": () => `{
  "tasks": {
    "start": "deno run --allow-net --allow-read main.ts",
    "dev": "deno run --allow-net --allow-read --watch main.ts"
  }
}`,
      "README.md": (siteName: string) => `# ${siteName}\n\nAPI service with component-based web interface.`
    }
  }
};

export async function newCommand(args: string[], context: CLIContext): Promise<number> {
  try {
    // Parse arguments
    const siteName = args[0];
    const template = extractOption(args, "--template") || "webapp";

    if (!siteName) {
      console.error("❌ Site name required");
      console.error("Usage: genesis new <site-name> [--template=webapp|static|api]");
      return 1;
    }

    // Validate template
    if (!SITE_TEMPLATES[template]) {
      console.error(`❌ Unknown template: ${template}`);
      console.error("Available templates: webapp, static, api");
      return 1;
    }

    // Check if we're in a Genesis project
    const configExists = await exists(context.configPath);
    if (!configExists) {
      console.error("❌ Not in a Genesis project directory");
      console.error("Run 'genesis init' first to create a new project");
      return 1;
    }

    const siteDir = join(context.cwd, "sites", siteName);

    // Check if site already exists
    if (await exists(siteDir)) {
      console.error(`❌ Site '${siteName}' already exists`);
      return 1;
    }

    const templateConfig = SITE_TEMPLATES[template];

    if (context.verbose) {
      console.log(`📋 Creating ${templateConfig.name}:`);
      console.log(`   Site: ${siteName}`);
      console.log(`   Template: ${template}`);
      console.log(`   Directory: ${siteDir}`);
    }

    if (context.dryRun) {
      console.log("🔍 Dry run - would create:");
      console.log(`   📁 ${siteDir}/`);
      templateConfig.directories.forEach(dir => {
        console.log(`   📁 ${siteDir}/${dir}/`);
      });
      Object.keys(templateConfig.files).forEach(file => {
        console.log(`   📄 ${siteDir}/${file}`);
      });
      return 0;
    }

    // Create site directory structure
    await ensureDir(siteDir);
    
    for (const dir of templateConfig.directories) {
      await ensureDir(join(siteDir, dir));
      if (context.verbose) {
        console.log(`📁 Created directory: ${dir}/`);
      }
    }

    // Generate and write files
    for (const [filePath, generator] of Object.entries(templateConfig.files)) {
      const content = typeof generator === 'function' ? generator(siteName) : generator;
      const fullPath = join(siteDir, filePath);
      
      await Deno.writeTextFile(fullPath, content);
      
      if (context.verbose) {
        console.log(`📄 Created file: ${filePath}`);
      }
    }

    // Success output
    console.log(`\n✅ Successfully created ${siteName}!`);
    console.log(`\n📦 Site Details:`);
    console.log(`   Name: ${siteName}`);
    console.log(`   Template: ${templateConfig.name}`);
    console.log(`   Location: sites/${siteName}/`);
    
    console.log(`\n🚀 Next Steps:`);
    console.log(`   cd sites/${siteName}/`);
    console.log(`   genesis dev ${siteName}`);
    
    if (template === "api") {
      console.log(`   # API will be available at http://localhost:8000`);
      console.log(`   # Web interface at http://localhost:8000/`);
    } else {
      console.log(`   # Site will be available at http://localhost:3000`);
    }

    console.log(`\n📖 Features:`);
    console.log(`   🔔 Notification system with real-time feedback`);
    console.log(`   📦 Component-based architecture with lazy loading`);
    console.log(`   📱 Mobile-first responsive design`);
    console.log(`   ⚡ Progressive enhancement and offline support`);
    console.log(`   🎨 CSS custom properties for easy theming`);

    return 0;

  } catch (error) {
    console.error(`❌ Error creating site: ${error.message}`);
    if (context.verbose) {
      console.error(error.stack);
    }
    return 1;
  }
}

// Utility function to extract options from args
function extractOption(args: string[], option: string): string | null {
  const index = args.findIndex(arg => arg.startsWith(option));
  if (index === -1) return null;
  
  const optionArg = args[index];
  if (optionArg.includes("=")) {
    return optionArg.split("=")[1];
  }
  
  return args[index + 1] || null;
}
