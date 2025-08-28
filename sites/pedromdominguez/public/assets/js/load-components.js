// load-components.js → v2.1 → Enterprise Architecture
// ================================================================================
// 🚀 DenoGenesis Component Loader - Enterprise-Grade Dynamic Loading System
// Enhanced with error handling, caching, performance monitoring, and simplified notifications
// ================================================================================

import { initializeChatbot } from './chatbot.js';
import { initializeFloatingSearch } from './search-widget.js';
import { initializeWebSocket, sendWebSocketMessage } from './wsClient.js';
import { showNotification } from './notifications.js';
import { initializeTechStackSlider } from './techStackSlider.js';
import { initializeSystemInfoFAB } from './systemInfoFAB.js';

// ================================================================================
// 🔧 COMPONENT REGISTRY & CONFIGURATION
// ================================================================================

const COMPONENT_REGISTRY = {
  footer: {
    path: '/components/footer.html',
    cacheable: true,
    dependencies: [],
    targetElement: 'footer',
    loader: null
  },
  chatbot: {
    path: '/components/chatbot.html',
    cacheable: true,
    dependencies: ['notifications'],
    targetElement: 'body',
    loader: initializeChatbot,
    appendMethod: 'appendChild'
  },
  searchWidget: {
    path: '/components/search-widget.html',
    cacheable: true,
    dependencies: ['notifications'],
    targetElement: 'body',
    loader: initializeFloatingSearch,
    appendMethod: 'appendChild'
  },
  notifications: {
    path: '/components/notifications.html',
    cacheable: true,
    dependencies: [],
    targetElement: 'body',
    loader: null,
    appendMethod: 'appendChild'
  },
  techStackSlider: {
    path: '/components/tech-stack-slider.html',
    cacheable: true,
    dependencies: [],
    targetElement: 'footer',
    loader: initializeTechStackSlider,
    appendMethod: 'insertBefore'
  },
  systemInfoFAB: {
    path: '/components/system-info-fab.html',
    cacheable: true,
    dependencies: [],
    targetElement: 'body',
    loader: initializeSystemInfoFAB,
    appendMethod: 'appendChild'
  },
  bootScreen: {
    path: '/components/boot.html',
    cacheable: false,
    dependencies: [],
    targetElement: 'body',
    loader: null,
    appendMethod: 'appendChild'
  }
};

// ================================================================================
// 📊 PERFORMANCE MONITORING & CACHING
// ================================================================================

const componentCache = new Map();
const loadedComponents = new Set();
const loadingPromises = new Map();
const componentLoadOrder = []; // Track order for final notification

const performanceMetrics = {
  totalLoads: 0,
  cacheHits: 0,
  loadTimes: {},
  errors: {},
  averageLoadTime: 0,
  lastUpdate: Date.now()
};

// Network awareness
function getConnectionInfo() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    effectiveType: connection ? connection.effectiveType : 'unknown',
    downlink: connection ? connection.downlink : null,
    rtt: connection ? connection.rtt : null
  };
}

function shouldUseCaching() {
  const connection = getConnectionInfo();
  return connection.effectiveType !== '2g' && connection.effectiveType !== 'slow-2g';
}

// ================================================================================
// 🛡️ ERROR HANDLING & RESILIENCE
// ================================================================================

class ComponentError extends Error {
  constructor(message, component, originalError = null) {
    super(message);
    this.name = 'ComponentError';
    this.component = component;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

// Enhanced error logging (silent for user, detailed for console)
function logError(component, error, context = '') {
  const errorInfo = {
    component,
    error: error.message,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent.slice(0, 100),
    url: window.location.href
  };

  performanceMetrics.errors[component] = (performanceMetrics.errors[component] || 0) + 1;

  console.error('🚨 Component Loading Error:', errorInfo);

  // Optional: Send to monitoring service
  if (window.trackError) {
    window.trackError('ComponentLoadError', errorInfo);
  }
}

// ================================================================================
// 🚀 CORE COMPONENT LOADING ENGINE
// ================================================================================

async function fetchComponentHTML(componentPath, cacheable = true) {
  const startTime = performance.now();
  const cacheKey = componentPath;

  try {
    // Check cache first
    if (cacheable && shouldUseCaching() && componentCache.has(cacheKey)) {
      performanceMetrics.cacheHits++;
      console.log(`📦 Cache hit for: ${componentPath}`);
      return componentCache.get(cacheKey);
    }

    // Fetch from network
    console.log(`🌐 Fetching component: ${componentPath}`);
    const response = await fetch(componentPath);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Validate HTML content
    if (!html.trim()) {
      throw new Error('Empty component content received');
    }

    // Cache if appropriate
    if (cacheable && shouldUseCaching()) {
      componentCache.set(cacheKey, html);
      console.log(`💾 Cached component: ${componentPath}`);
    }

    // Track performance
    const loadTime = performance.now() - startTime;
    performanceMetrics.loadTimes[componentPath] = loadTime;
    performanceMetrics.totalLoads++;

    console.log(`✅ Component loaded: ${componentPath} (${loadTime.toFixed(2)}ms)`);
    return html;

  } catch (error) {
    const loadTime = performance.now() - startTime;
    throw new ComponentError(
      `Failed to fetch component: ${componentPath}`,
      componentPath,
      error
    );
  }
}

// ================================================================================
// 🔗 DEPENDENCY MANAGEMENT
// ================================================================================

async function loadComponentDependencies(componentName) {
  const config = COMPONENT_REGISTRY[componentName];
  if (!config || !config.dependencies.length) {
    return;
  }

  console.log(`🔗 Loading dependencies for ${componentName}: ${config.dependencies.join(', ')}`);

  const dependencyPromises = config.dependencies.map(async (dep) => {
    if (!loadedComponents.has(dep)) {
      await loadComponentByName(dep);
    }
  });

  await Promise.all(dependencyPromises);
  console.log(`✅ Dependencies loaded for ${componentName}`);
}

// ================================================================================
// 🎯 SMART COMPONENT INSERTION
// ================================================================================

function insertComponentIntoDOM(html, config, componentName) {
  try {
    const container = document.createElement(config.targetElement === 'body' ? 'div' : 'section');
    container.innerHTML = html;
    container.setAttribute('data-component', componentName);

    const targetElement = config.targetElement === 'body'
      ? document.body
      : document.getElementById(config.targetElement);

    if (!targetElement) {
      console.warn(`⚠️ Target element not found: ${config.targetElement}, appending to body`);
      document.body.appendChild(container);
      return container;
    }

    switch (config.appendMethod) {
      case 'insertBefore':
        if (targetElement.parentNode) {
          targetElement.parentNode.insertBefore(container, targetElement);
        } else {
          document.body.appendChild(container);
        }
        break;
      case 'appendChild':
      default:
        targetElement.appendChild(container);
        break;
    }

    console.log(`📍 Component inserted: ${componentName} → ${config.targetElement}`);
    return container;

  } catch (error) {
    throw new ComponentError(`Failed to insert component into DOM: ${componentName}`, componentName, error);
  }
}

// ================================================================================
// 🎪 UNIVERSAL COMPONENT LOADER
// ================================================================================

async function loadComponentByName(componentName, ...args) {
  // Prevent duplicate loading
  if (loadedComponents.has(componentName)) {
    console.log(`⚠️ Component already loaded: ${componentName}`);
    return;
  }

  // Check if already loading
  if (loadingPromises.has(componentName)) {
    console.log(`⏳ Component already loading: ${componentName}`);
    return await loadingPromises.get(componentName);
  }

  const config = COMPONENT_REGISTRY[componentName];
  if (!config) {
    throw new ComponentError(`Component not found in registry: ${componentName}`, componentName);
  }

  // Create loading promise
  const loadingPromise = (async () => {
    try {
      console.log(`🚀 Loading component: ${componentName}`);

      // Load dependencies first
      await loadComponentDependencies(componentName);

      // Fetch component HTML
      const html = await fetchComponentHTML(config.path, config.cacheable);

      // Insert into DOM
      const container = insertComponentIntoDOM(html, config, componentName);

      // Initialize component if loader exists
      if (config.loader && typeof config.loader === 'function') {
        console.log(`⚙️ Initializing component: ${componentName}`);
        await config.loader(...args);
      }

      // Mark as loaded and track order
      loadedComponents.add(componentName);
      componentLoadOrder.push(componentName);

      console.log(`✅ Component fully loaded: ${componentName}`);
      return container;

    } catch (error) {
      logError(componentName, error, 'loadComponentByName');
      // Only show error notifications, not loading notifications
      showNotification(`❌ Failed to load ${componentName}`, 'error');
      throw error;
    } finally {
      loadingPromises.delete(componentName);
    }
  })();

  loadingPromises.set(componentName, loadingPromise);
  return await loadingPromise;
}

// ================================================================================
// 📦 PUBLIC API FUNCTIONS (Backward Compatible)
// ================================================================================

export async function loadFooter() {
  try {
    await loadComponentByName('footer');
  } catch (error) {
    console.error('Footer loading failed:', error);
  }
}

export async function loadChatbot(marked) {
  try {
    await loadComponentByName('chatbot', marked);
  } catch (error) {
    console.error('Chatbot loading failed:', error);
  }
}

export async function loadSearchWidget() {
  try {
    await loadComponentByName('searchWidget');
  } catch (error) {
    console.error('Search widget loading failed:', error);
  }
}

export async function loadNotifications() {
  try {
    await loadComponentByName('notifications');
  } catch (error) {
    console.error('Notifications loading failed:', error);
  }
}

export async function loadTechStackSlider() {
  try {
    await loadComponentByName('techStackSlider');
  } catch (error) {
    console.error('Tech stack slider loading failed:', error);
  }
}

export async function loadSystemInfoFAB() {
  try {
    await loadComponentByName('systemInfoFAB');
  } catch (error) {
    console.error('System info FAB loading failed:', error);
  }
}

export async function loadBootScreen() {
  try {
    return await loadComponentByName('bootScreen');
  } catch (error) {
    console.error('Boot screen loading failed:', error);
    throw error;
  }
}

// ================================================================================
// 🌐 WEBSOCKET INTEGRATION
// ================================================================================

export function loadWebSocket(wsUrl = "wss://pedromdominguez.com/api/ws") {
  try {
    console.log(`🔌 Initializing WebSocket: ${wsUrl}`);
    initializeWebSocket(wsUrl);
  } catch (error) {
    console.error('WebSocket initialization failed:', error);
    showNotification('Real-time features unavailable', 'warning');
  }
}

// ================================================================================
// 🎯 BATCH LOADING & ADVANCED OPERATIONS
// ================================================================================

export async function loadComponentsBatch(componentNames = [], showFinalNotification = true) {
  if (!Array.isArray(componentNames) || componentNames.length === 0) {
    console.warn('No components specified for batch loading');
    return [];
  }

  console.log(`🚀 Batch loading ${componentNames.length} components:`, componentNames);

  const results = await Promise.allSettled(
    componentNames.map(name => loadComponentByName(name))
  );

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`✅ Batch loading complete: ${successful.length} successful, ${failed.length} failed`);

  // Show single success notification if requested
  if (showFinalNotification && successful.length > 0) {
    if (failed.length === 0) {
      showNotification('✅ All components loaded successfully for Pedro M. Dominguez', 'success');
    } else {
      showNotification(`⚠️ ${successful.length}/${componentNames.length} components loaded successfully for Pedro M. Dominguez`, 'warning');
    }
  }

  return {
    successful: successful.map(r => r.value),
    failed: failed.map(r => r.reason),
    total: componentNames.length
  };
}

// ================================================================================
// 🎯 SIMPLIFIED SUCCESS NOTIFICATION
// ================================================================================

export function showFinalSuccessNotification() {
  const totalComponents = loadedComponents.size;
  const errorCount = Object.values(performanceMetrics.errors).reduce((sum, count) => sum + count, 0);

  if (totalComponents > 0) {
    if (errorCount === 0) {
      showNotification('✅ All components loaded successfully for Pedro M. Dominguez', 'success');
    } else {
      showNotification(`⚠️ ${totalComponents} components loaded with ${errorCount} errors for Pedro M. Dominguez`, 'warning');
    }
  }
}

// ================================================================================
// 📊 PERFORMANCE MONITORING & DEBUGGING
// ================================================================================

export function getPerformanceMetrics() {
  const totalTime = Object.values(performanceMetrics.loadTimes).reduce((a, b) => a + b, 0);
  const avgTime = performanceMetrics.totalLoads > 0 ? totalTime / performanceMetrics.totalLoads : 0;

  return {
    ...performanceMetrics,
    averageLoadTime: Number(avgTime.toFixed(2)),
    cacheHitRate: performanceMetrics.totalLoads > 0
      ? Number((performanceMetrics.cacheHits / performanceMetrics.totalLoads * 100).toFixed(2))
      : 0,
    loadedComponents: Array.from(loadedComponents),
    componentLoadOrder,
    connectionInfo: getConnectionInfo(),
    cacheSize: componentCache.size,
    timestamp: Date.now()
  };
}

export function clearComponentCache() {
  componentCache.clear();
  console.log('🧹 Component cache cleared');
}

export function unloadComponent(componentName) {
  try {
    // Remove from DOM
    const elements = document.querySelectorAll(`[data-component="${componentName}"]`);
    elements.forEach(el => el.remove());

    // Remove from loaded set
    loadedComponents.delete(componentName);

    // Remove from load order
    const orderIndex = componentLoadOrder.indexOf(componentName);
    if (orderIndex > -1) {
      componentLoadOrder.splice(orderIndex, 1);
    }

    // Remove from cache
    const config = COMPONENT_REGISTRY[componentName];
    if (config) {
      componentCache.delete(config.path);
    }

    console.log(`🗑️ Component unloaded: ${componentName}`);
    return true;
  } catch (error) {
    logError(componentName, error, 'unloadComponent');
    return false;
  }
}

export function reloadComponent(componentName, ...args) {
  console.log(`🔄 Reloading component: ${componentName}`);
  unloadComponent(componentName);
  return loadComponentByName(componentName, ...args);
}

// ================================================================================
// 🛠️ DEVELOPMENT & DEBUGGING TOOLS
// ================================================================================

export function getLoadedComponents() {
  return Array.from(loadedComponents);
}

export function getComponentRegistry() {
  return { ...COMPONENT_REGISTRY };
}

export function isComponentLoaded(componentName) {
  return loadedComponents.has(componentName);
}

// ================================================================================
// 🌐 GLOBAL EXPORTS
// ================================================================================

export {
  sendWebSocketMessage,
  loadComponentByName,
};

// ================================================================================
// 🔧 DEVELOPMENT MODE UTILITIES
// ================================================================================

if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  window.DenoGenesisComponents = {
    loadComponent: loadComponentByName,
    batchLoad: loadComponentsBatch,
    metrics: getPerformanceMetrics,
    unload: unloadComponent,
    reload: reloadComponent,
    clearCache: clearComponentCache,
    registry: getComponentRegistry,
    loaded: getLoadedComponents,
    isLoaded: isComponentLoaded,
    showSuccess: showFinalSuccessNotification
  };

  console.log('🔧 DenoGenesis Component Manager available at window.DenoGenesisComponents');
  console.log('📊 Performance metrics:', getPerformanceMetrics());
}

// ================================================================================
// 🎯 INITIALIZATION
// ================================================================================

// Auto-load critical components
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DenoGenesis Component Loader initialized');

  // Load essential components first (silently)
  try {
    await loadComponentsBatch(['notifications'], false);
    console.log('✅ Critical components loaded');
  } catch (error) {
    console.error('❌ Failed to load critical components:', error);
  }
});
