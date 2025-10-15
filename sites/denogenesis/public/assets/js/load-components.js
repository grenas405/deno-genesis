// load-components.js → v3.0 → Notifications-First Loader
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
 * Fetches a component’s HTML from the server.
 * @param {string} componentPath - Path to the HTML fragment
 * @returns {Promise<string>} HTML string
 */
async function fetchComponentHTML(componentPath) {
  const response = await fetch(componentPath);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

  showNotification(`📍 ${componentName} inserted into ${config.targetElement}`, "info");
  return container;
}

// ================================================================================
// 🎯 UNIVERSAL LOADER
// - Loads any component by name from the registry
// - Expandable to handle dependencies, caching, performance later
// ================================================================================

export async function loadComponent(componentName, ...args) {
  if (loadedComponents.has(componentName)) {
    showNotification(`⚠️ ${componentName} already loaded`, "warning");
    return;
  }

  const config = COMPONENT_REGISTRY[componentName];
  if (!config) {
    showNotification(`❌ Unknown component: ${componentName}`, "error");
    return;
  }

  try {
    showNotification(`⏳ Loading ${componentName}...`, "info");

    const html = await fetchComponentHTML(config.path);
    const container = insertComponentIntoDOM(html, config, componentName);

    if (config.loader && typeof config.loader === 'function') {
      await config.loader(...args);
      showNotification(`⚙️ Initialized ${componentName}`, "success");
    }

    loadedComponents.add(componentName);
    showNotification(`✅ ${componentName} loaded successfully`, "success");
    return container;

  } catch (err) {
    showNotification(`❌ Failed to load ${componentName}: ${err.message}`, "error");
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
});