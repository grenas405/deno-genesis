// navigation.js → v2.0 → Component-based architecture
// ================================================================================
// 🚀 DenoGenesis Navigation System - Enhanced Modular Design
// ================================================================================

import anime from 'https://cdn.skypack.dev/animejs@3.2.1';
import { showNotification } from './notifications.js';

// 🔧 Component paths registry
const NAVBAR_COMPONENTS = {
  guest: '/components/guest-navbar.html',
  admin: '/components/admin-navbar.html'
};

// 📊 Performance tracking
let navigationMetrics = {
  loadTime: 0,
  animationCount: 0,
  lastAction: null
};

/**
 * 🚀 Enhanced Navigation Setup with Component Loading
 */
export async function setupNavigation() {
  const startTime = performance.now();

  try {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
      throw new Error('Navbar element not found in DOM');
    }

    // 🔐 Determine user role
    const isAdmin = !!localStorage.getItem('adminToken');
    const componentType = isAdmin ? 'admin' : 'guest';

    console.log(`🔄 Loading ${componentType} navigation component...`);

    // 📥 Load appropriate navbar component
    await loadNavbarComponent(navbar, componentType);

    // ⚙️ Initialize navigation functionality
    initializeNavigation();

    // 📊 Track performance
    navigationMetrics.loadTime = performance.now() - startTime;
    console.log(`✅ Navigation loaded in ${navigationMetrics.loadTime.toFixed(2)}ms`);

    showNotification(`✅ ${componentType} navigation initialized successfully.`, 'success');

  } catch (error) {
    console.error('❌ Navigation setup failed:', error);
    showNotification(`❗ Navigation setup failed: ${error.message}`, 'error');

    // 🛡️ Fallback to basic navigation
    setupFallbackNavigation();
  }
}

/**
 * 📥 Load navbar component from external file
 */
async function loadNavbarComponent(navbar, componentType) {
  try {
    const componentPath = NAVBAR_COMPONENTS[componentType];

    if (!componentPath) {
      throw new Error(`Unknown component type: ${componentType}`);
    }

    const response = await fetch(componentPath);

    if (!response.ok) {
      throw new Error(`Failed to load component: ${response.status} ${response.statusText}`);
    }

    const htmlContent = await response.text();
    navbar.innerHTML = htmlContent;

    console.log(`📦 ${componentType} navbar component loaded successfully`);

  } catch (error) {
    console.error(`❌ Failed to load ${componentType} navbar:`, error);
    throw new Error(`Component loading failed: ${error.message}`);
  }
}

/**
 * ⚙️ Initialize navigation functionality after component loading
 */
function initializeNavigation() {
  // 🔍 Get navigation elements
  const elements = getNavigationElements();

  if (!elements.isValid) {
    throw new Error('Missing required navigation elements after component load');
  }

  const { menuButton, sidebarButton, sidebarMenu, overlay } = elements;

  // 🎨 Setup animations and event listeners
  setupMenuAnimations(menuButton, sidebarButton, sidebarMenu, overlay);
  setupEventListeners(menuButton, sidebarButton, sidebarMenu, overlay);
  setupKeyboardNavigation(sidebarMenu);
  setupClickOutsideHandling(sidebarMenu, menuButton, sidebarButton);

  // 🎯 Highlight active navigation link
  highlightActiveLink(sidebarMenu);

  // 🔐 Setup admin-specific functionality
  setupAdminLogout();

  console.log('🎯 Navigation functionality initialized');
}

/**
 * 🔍 Get and validate navigation elements
 */
function getNavigationElements() {
  const menuButton = document.getElementById('menu-toggle');
  const sidebarButton = document.getElementById('sidebar-toggle');
  const sidebarMenu = document.getElementById('sidebar-menu');
  const overlay = document.getElementById('menu-overlay');

  const isValid = !!(menuButton && sidebarButton && sidebarMenu && overlay);

  if (!isValid) {
    console.warn('⚠️ Missing navigation elements:', {
      menuButton: !!menuButton,
      sidebarButton: !!sidebarButton,
      sidebarMenu: !!sidebarMenu,
      overlay: !!overlay
    });
  }

  return {
    menuButton,
    sidebarButton,
    sidebarMenu,
    overlay,
    isValid
  };
}

/**
 * 🎨 Setup menu animations
 */
function setupMenuAnimations(menuButton, sidebarButton, sidebarMenu, overlay) {
  const animateOpen = (bars) => {
    navigationMetrics.animationCount++;

    anime({
      targets: bars[0],
      rotate: 45,
      translateY: 8,
      duration: 300,
      easing: 'easeInOutQuad',
    });

    anime({
      targets: bars[1],
      opacity: 0,
      duration: 200,
      easing: 'easeInOutQuad',
    });

    anime({
      targets: bars[2],
      rotate: -45,
      translateY: -8,
      duration: 300,
      easing: 'easeInOutQuad',
    });
  };

  const animateClose = (bars) => {
    navigationMetrics.animationCount++;

    anime({
      targets: bars[0],
      rotate: 0,
      translateY: 0,
      duration: 300,
      easing: 'easeInOutQuad',
    });

    anime({
      targets: bars[1],
      opacity: 1,
      duration: 200,
      easing: 'easeInOutQuad',
    });

    anime({
      targets: bars[2],
      rotate: 0,
      translateY: 0,
      duration: 300,
      easing: 'easeInOutQuad',
    });
  };

  const openMenu = () => {
    navigationMetrics.lastAction = 'open';

    menuButton.classList.add('open');
    sidebarButton.classList.add('open');
    animateOpen(menuButton.querySelectorAll('.bar'));
    animateOpen(sidebarButton.querySelectorAll('.bar'));
    sidebarMenu.classList.add('visible');
    sidebarMenu.classList.remove('hidden');
    overlay.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    // 🎯 Focus management for accessibility
    sidebarMenu.setAttribute('aria-hidden', 'false');
    const firstLink = sidebarMenu.querySelector('.nav-links a');
    if (firstLink) firstLink.focus();

  };

  const closeMenu = () => {
    navigationMetrics.lastAction = 'close';

    menuButton.classList.remove('open');
    sidebarButton.classList.remove('open');
    animateClose(menuButton.querySelectorAll('.bar'));
    animateClose(sidebarButton.querySelectorAll('.bar'));
    sidebarMenu.classList.remove('visible');
    sidebarMenu.classList.add('hidden');
    overlay.classList.add('hidden');
    document.body.classList.remove('no-scroll');

    // 🎯 Focus management for accessibility
    sidebarMenu.setAttribute('aria-hidden', 'true');
    menuButton.focus();

  };

  const toggleMenu = () => {
    if (sidebarMenu.classList.contains('visible')) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // 📎 Attach animation functions to elements for external access
  menuButton._toggleMenu = toggleMenu;
  menuButton._openMenu = openMenu;
  menuButton._closeMenu = closeMenu;
}

/**
 * 🎧 Setup event listeners
 */
function setupEventListeners(menuButton, sidebarButton, sidebarMenu, overlay) {
  // 🖱️ Click events
  menuButton.addEventListener('click', menuButton._toggleMenu);
  sidebarButton.addEventListener('click', menuButton._toggleMenu);
  overlay.addEventListener('click', menuButton._closeMenu);

  // 🎹 Enhanced keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebarMenu.classList.contains('visible')) {
      e.preventDefault();
      menuButton._closeMenu();
    }
  });
}

/**
 * ⌨️ Setup keyboard navigation
 */
function setupKeyboardNavigation(sidebarMenu) {
  const navLinks = sidebarMenu.querySelectorAll('.nav-links a, .nav-button');

  navLinks.forEach((link, index) => {
    link.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (index + 1) % navLinks.length;
          navLinks[nextIndex].focus();
          break;

        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = (index - 1 + navLinks.length) % navLinks.length;
          navLinks[prevIndex].focus();
          break;

        case 'Home':
          e.preventDefault();
          navLinks[0].focus();
          break;

        case 'End':
          e.preventDefault();
          navLinks[navLinks.length - 1].focus();
          break;
      }
    });
  });
}

/**
 * 🖱️ Setup click outside handling
 */
function setupClickOutsideHandling(sidebarMenu, menuButton, sidebarButton) {
  document.addEventListener('click', (event) => {
    const isInsideSidebar = sidebarMenu.contains(event.target);
    const isToggleButton = menuButton.contains(event.target) ||
                          sidebarButton.contains(event.target);

    if (!isInsideSidebar && !isToggleButton && sidebarMenu.classList.contains('visible')) {
      menuButton._closeMenu();
    }
  });
}

/**
 * 🎯 Highlight active navigation link
 */
function highlightActiveLink(sidebarMenu) {
  try {
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const navLinks = sidebarMenu.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
      const linkPage = link.getAttribute('href').split('/').pop().toLowerCase();
      if (currentPage === linkPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
        console.log(`🎯 Active link highlighted: ${linkPage}`);
      }
    });
  } catch (error) {
    console.warn('⚠️ Failed to highlight active link:', error);
  }
}

/**
 * 🔐 Setup admin logout functionality
 */
function setupAdminLogout() {
  const logoutLink = document.getElementById('logout-link');

  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();

      try {
        // 🔄 Show loading state
        logoutLink.textContent = '🔄 Logging out...';
        logoutLink.style.pointerEvents = 'none';

        // 🗑️ Clear admin token
        localStorage.removeItem('adminToken');

        // 📊 Optional: Call logout API endpoint
        // await fetch('/api/auth/logout', { method: 'POST' });

        showNotification('🚪 You have been logged out successfully.', 'success');

        // 🔄 Redirect after short delay
        setTimeout(() => {
          window.location.href = '../../pages/auth/login.html';
        }, 1000);

      } catch (error) {
        console.error('❌ Logout failed:', error);
        showNotification('❗ Logout failed. Please try again.', 'error');

        // 🔄 Reset button state
        logoutLink.textContent = '🚪 Logout';
        logoutLink.style.pointerEvents = 'auto';
      }
    });

    console.log('🔐 Admin logout functionality enabled');
  }
}

/**
 * 🛡️ Fallback navigation for when component loading fails
 */
function setupFallbackNavigation() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  console.log('🛡️ Setting up fallback navigation...');

  navbar.innerHTML = `
    <div class="nav-left">
      <span class="nav-title">Pedro M. Dominguez</span>
    </div>
    <div class="nav-right">
      <a href="../../pages/home/index.html" class="nav-link">🏠 Home</a>
      <a href="../../pages/contact/contact.html" class="nav-link">📬 Contact</a>
    </div>
  `;

  showNotification('🛡️ Fallback navigation active.', 'warning');
}

/**
 * 📊 Get navigation performance metrics
 */
export function getNavigationMetrics() {
  return {
    ...navigationMetrics,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent.slice(0, 50) + '...'
  };
}

/**
 * 🔄 Reload navigation component
 */
export async function reloadNavigation() {
  console.log('🔄 Reloading navigation...');

  try {
    // 🧹 Clear existing navigation
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.innerHTML = '';
    }

    // 🔄 Reinitialize
    await setupNavigation();

  } catch (error) {
    console.error('❌ Navigation reload failed:', error);
    showNotification('❗ Failed to reload navigation.', 'error');
  }
}

// 🌐 Export for global access in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  window.NavigationManager = {
    setup: setupNavigation,
    reload: reloadNavigation,
    metrics: getNavigationMetrics,
    components: NAVBAR_COMPONENTS
  };
  console.log('🔧 Navigation Manager available at window.NavigationManager');
}
