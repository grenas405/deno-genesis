import {
  loadFooter,
  loadNotifications,
  loadWebSocket,
  loadTechStackSlider,
  loadSystemInfoFAB
} from './load-components.js';

import anime from 'https://cdn.skypack.dev/animejs@3.2.1';
import { marked } from "https://cdn.jsdelivr.net/npm/marked/+esm";
import { setupNavigation } from './navigation.js';
import { initializeTypingEffects } from './initTypingEffects.js';
import { initAnimations } from './animations.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Load core dynamic components
  loadFooter();
  loadNotifications();
  loadWebSocket();
  setupNavigation();

  // Portfolio-specific features
  loadTechStackSlider();
  loadSystemInfoFAB();

  // Typing effects and animations
  initializeTypingEffects();
  initAnimations();

  showNotification('✅ All components & animations loaded for PedroMDominguez.com', 'success');
});