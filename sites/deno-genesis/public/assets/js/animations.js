/**
 * DENO GENESIS - ANIMATIONS MODULE
 * Exportable typing animation functionality
 * Author: Pedro M. Dominguez
 */

/* ===================================
   CONFIGURATION
   =================================== */

// Languages: English, Spanish, German, French, Latin
const translations = [
  { 
    title: 'Deno Genesis', 
    subtitle: 'A Web Framework for Digital Sovereignty',
    lang: 'en' 
  },
  { 
    title: 'Deno Génesis', 
    subtitle: 'Un Marco Web para la Soberanía Digital',
    lang: 'es' 
  },
  { 
    title: 'Deno Genesis', 
    subtitle: 'Ein Web-Framework für Digitale Souveränität',
    lang: 'de' 
  },
  { 
    title: 'Deno Genèse', 
    subtitle: 'Un Framework Web pour la Souveraineté Numérique',
    lang: 'fr' 
  },
  { 
    title: 'Deno Genesis', 
    subtitle: 'Structura Interretialis pro Potestate Digitali',
    lang: 'la' 
  }
];

// Typing animation settings
const TYPING_CONFIG = {
  typingSpeed: 80,
  deletingSpeed: 40,
  pauseAfterComplete: 2500,
  pauseBetweenTitleAndSubtitle: 300,
  initialDelay: 1000
};

/* ===================================
   STATE MANAGEMENT
   =================================== */

let currentIndex = 0;
let charIndex = 0;
let isDeleting = false;
let isPaused = false;
let isTypingSubtitle = false;

/* ===================================
   DOM ELEMENTS
   =================================== */

let typedTitleElement = null;
let typedSubtitleElement = null;

/* ===================================
   TYPING ANIMATION LOGIC
   =================================== */

/**
 * Main typing animation function
 * Handles the typing and deleting of text across multiple languages
 */
function typeAnimation() {
  const currentTranslation = translations[currentIndex];
  const currentText = isTypingSubtitle ? currentTranslation.subtitle : currentTranslation.title;
  const currentElement = isTypingSubtitle ? typedSubtitleElement : typedTitleElement;
  
  // Handle pause after typing complete text
  if (isPaused) {
    setTimeout(() => {
      isPaused = false;
      isDeleting = true;
      typeAnimation();
    }, TYPING_CONFIG.pauseAfterComplete);
    return;
  }

  // Update the text being displayed
  if (isDeleting) {
    currentElement.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;
  } else {
    currentElement.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;
  }

  // Set language attribute for accessibility
  currentElement.setAttribute('lang', currentTranslation.lang);

  // Determine next step
  if (!isDeleting && charIndex === currentText.length) {
    // Finished typing current text
    if (!isTypingSubtitle) {
      // Just finished title, now type subtitle
      charIndex = 0;
      isTypingSubtitle = true;
      setTimeout(typeAnimation, TYPING_CONFIG.pauseBetweenTitleAndSubtitle);
      return;
    } else {
      // Finished both title and subtitle, pause before deleting
      isPaused = true;
      typeAnimation();
      return;
    }
  } else if (isDeleting && charIndex === 0) {
    // Finished deleting current text
    if (isTypingSubtitle) {
      // Just deleted subtitle, now delete title
      isTypingSubtitle = false;
      charIndex = currentTranslation.title.length;
      setTimeout(typeAnimation, TYPING_CONFIG.deletingSpeed);
      return;
    } else {
      // Finished deleting both, move to next language
      isDeleting = false;
      charIndex = 0;
      currentIndex = (currentIndex + 1) % translations.length;
      setTimeout(typeAnimation, TYPING_CONFIG.typingSpeed);
      return;
    }
  }

  // Continue typing/deleting
  const speed = isDeleting ? TYPING_CONFIG.deletingSpeed : TYPING_CONFIG.typingSpeed;
  setTimeout(typeAnimation, speed);
}

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Show full text without animation
 * For users who prefer reduced motion
 */
function showFullText() {
  if (typedTitleElement && typedSubtitleElement) {
    typedTitleElement.textContent = translations[0].title;
    typedSubtitleElement.textContent = translations[0].subtitle;
    
    // Remove blinking cursor
    typedTitleElement.style.animation = 'none';
    typedTitleElement.style.borderRight = 'none';
    typedSubtitleElement.style.animation = 'none';
    typedSubtitleElement.style.borderRight = 'none';
  }
}

/**
 * Initialize typing animation
 * Main exported function
 */
export function initAnimations() {
  console.log('Initializing typing animations...');

  // Get DOM elements
  typedTitleElement = document.getElementById('typed-title');
  typedSubtitleElement = document.getElementById('typed-subtitle');

  // Check if elements exist
  if (!typedTitleElement || !typedSubtitleElement) {
    console.error('Typing animation elements not found');
    return;
  }

  // Initialize with empty subtitle
  typedSubtitleElement.textContent = '';

  // Check for reduced motion preference
  if (prefersReducedMotion()) {
    console.log('Reduced motion detected - showing full text');
    showFullText();
    return;
  }

  // Start typing animation after delay
  setTimeout(typeAnimation, TYPING_CONFIG.initialDelay);
  
  console.log('Typing animation initialized successfully');
}

/**
 * Reset animation state
 * Useful for restarting the animation
 */
export function resetAnimation() {
  currentIndex = 0;
  charIndex = 0;
  isDeleting = false;
  isPaused = false;
  isTypingSubtitle = false;

  if (typedTitleElement) {
    typedTitleElement.textContent = translations[0].title.charAt(0);
  }
  if (typedSubtitleElement) {
    typedSubtitleElement.textContent = '';
  }

  setTimeout(typeAnimation, TYPING_CONFIG.typingSpeed);
}

/**
 * Get current animation state
 * Useful for debugging
 */
export function getAnimationState() {
  return {
    currentIndex,
    charIndex,
    isDeleting,
    isPaused,
    isTypingSubtitle,
    currentLanguage: translations[currentIndex].lang
  };
}

/**
 * Update typing speed
 * Allows dynamic speed changes
 */
export function setTypingSpeed(typingSpeed, deletingSpeed) {
  TYPING_CONFIG.typingSpeed = typingSpeed || TYPING_CONFIG.typingSpeed;
  TYPING_CONFIG.deletingSpeed = deletingSpeed || TYPING_CONFIG.deletingSpeed;
  console.log('Typing speed updated:', TYPING_CONFIG);
}

/**
 * Get available translations
 */
export function getTranslations() {
  return [...translations];
}

/* ===================================
   SMOOTH SCROLL FUNCTIONALITY
   =================================== */

/**
 * Initialize smooth scrolling for anchor links
 */
export function initializeSmoothScroll() {
  console.log('Initializing smooth scroll...');

  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL without page jump
        if (targetId !== '#') {
          history.pushState(null, null, targetId);
        }
      }
    });
  });

  console.log('Smooth scroll initialized successfully');
}

/* ===================================
   EXPORTS - Available Functions
   =================================== */

// Default export
export default {
  initAnimations,
  initializeSmoothScroll,
  resetAnimation,
  getAnimationState,
  setTypingSpeed,
  getTranslations
};

/**
 * Usage Example:
 * 
 * // In your script.js:
 * import { initAnimations, initializeSmoothScroll } from './animations.js';
 * 
 * document.addEventListener('DOMContentLoaded', () => {
 *   initAnimations();
 *   initializeSmoothScroll();
 * });
 * 
 * // Or import everything:
 * import animations from './animations.js';
 * 
 * document.addEventListener('DOMContentLoaded', () => {
 *   animations.initAnimations();
 *   animations.initializeSmoothScroll();
 * });
 */
