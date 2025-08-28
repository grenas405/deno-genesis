// animations.js → v1.1 → Sovereign Animation Utility (Wrapped)
import anime from 'https://cdn.skypack.dev/animejs@3.2.1';

/* === 1️⃣ Reusable Timeline Example === */
function runSovereignTimeline() {
  const timeline = anime.timeline({
    easing: 'easeInOutQuad',
    duration: 700
  });

  timeline
    .add({
      targets: '.ascii-logo line',
      translateX: [100, 0],
      opacity: [0, 1],
      delay: anime.stagger(50)
    })
    .add({
      targets: '.system-check',
      translateY: [20, 0],
      opacity: [0, 1],
    }, '-=400')
    .add({
      targets: '.founder-info',
      scale: [0.8, 1],
      opacity: [0, 1],
    }, '-=400');
}

function animateStaggerGrid(selector) {
  anime({
    targets: selector,
    translateY: [50, 0],
    opacity: [0, 1],
    delay: anime.stagger(100, { grid: [5, 5], from: 'center' }),
    easing: 'easeOutQuad',
    duration: 1000
  });
}

function animateKeyframes(target) {
  anime({
    targets: target,
    keyframes: [
      { translateY: -20 },
      { translateY: 0 },
      { scale: 1.2 },
      { scale: 1 }
    ],
    duration: 2000,
    easing: 'easeInOutSine'
  });
}

function animatePulse(target) {
  anime({
    targets: target,
    scale: [1, 1.1],
    direction: 'alternate',
    easing: 'easeInOutSine',
    duration: 800,
    loop: true
  });
}

function setupScrollTrigger(selector) {
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        anime({
          targets: entry.target,
          translateY: [50, 0],
          opacity: [0, 1],
          easing: 'easeOutCubic',
          duration: 1000
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(selector).forEach(el => observer.observe(el));
}

function animateMatrixChar(target) {
  anime({
    targets: target,
    opacity: [
      { value: 1, duration: 200, easing: 'easeInOutSine' },
      { value: 0.5, duration: 300, easing: 'easeInOutSine' }
    ],
    loop: true,
    direction: 'alternate'
  });
}

/* ✅ Single wrapped initAnimations() */
export function initAnimations() {
  // Run the parts you want globally:
  runSovereignTimeline();
  setupScrollTrigger('.scroll-trigger');

  // Optionally call these on specific selectors
  animateStaggerGrid('.grid-item');
  animatePulse('#cta-button');
  animateKeyframes('.hero-logo');
  animateMatrixChar('.matrix-char');
}