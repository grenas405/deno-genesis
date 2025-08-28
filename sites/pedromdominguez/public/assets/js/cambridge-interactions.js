// ================================================================
// Cambridge Research Interactions - Advanced Academic Presentation
// Pedro M. Dominguez - Framework Architect & Independent Researcher
// ================================================================

class CambridgeInteractions {
  constructor() {
    this.isInitialized = false;
    this.observers = new Map();
    this.animations = new Map();
    this.metrics = {
      scrollProgress: 0,
      visibleSections: new Set(),
      interactionCount: 0,
      readingTime: 0
    };
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    document.addEventListener('DOMContentLoaded', () => {
      this.setupAcademicAnimations();
      this.initializeScrollTriggers();
      this.setupTypedEffects();
      this.initializeMetricsTracking();
      this.setupResearchInteractions();
      this.enableAcademicAccessibility();
      
      console.log('🎓 Cambridge Research Presentation Initialized');
      this.isInitialized = true;
    });
  }

  // ============================================
  // Academic-Grade Animation System
  // ============================================
  setupAcademicAnimations() {
    // Sophisticated scroll-based reveal animations
    const scrollTriggers = document.querySelectorAll('.scroll-trigger');
    
    const observerOptions = {
      threshold: [0, 0.1, 0.3, 0.5, 0.7, 1],
      rootMargin: '-50px 0px -50px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target;
        const progress = entry.intersectionRatio;
        
        if (progress > 0.1) {
          element.classList.add('visible', 'animate-in');
          this.metrics.visibleSections.add(element.id);
          
          // Progressive reveal based on scroll progress
          if (progress > 0.5) {
            element.classList.add('fully-visible');
            this.triggerSectionSpecificAnimations(element);
          }
        } else {
          element.classList.remove('fully-visible');
        }
        
        // Update scroll progress for academic reading analytics
        this.updateScrollProgress();
      });
    }, observerOptions);

    scrollTriggers.forEach(trigger => {
      scrollObserver.observe(trigger);
    });

    this.observers.set('scroll', scrollObserver);
  }

  triggerSectionSpecificAnimations(section) {
    const sectionId = section.id;
    
    switch (sectionId) {
      case 'cambridge-hero':
        this.animateHeroElements();
        break;
      case 'discovery-narrative':
        this.animateTimeline();
        break;
      case 'validation-metrics':
        this.animateMetricCards();
        break;
      case 'theoretical-contributions':
        this.animateContributionBlocks();
        break;
      case 'geographic-validation':
        this.animateGeographicContext();
        break;
      case 'commercial-validation':
        this.animateCommercialOutcomes();
        break;
    }
  }

  // ============================================
  // Hero Section Academic Presentation
  // ============================================
  animateHeroElements() {
    const heroContent = document.querySelector('#cambridge-hero .hero-content');
    const badge = document.querySelector('.hero-badge');
    
    if (heroContent) {
      heroContent.style.transform = 'translateY(0) scale(1)';
      heroContent.style.opacity = '1';
    }
    
    if (badge) {
      setTimeout(() => {
        badge.classList.add('badge-appear');
        badge.style.transform = 'translateY(0) scale(1)';
        badge.style.opacity = '1';
      }, 800);
    }
  }

  // ============================================
  // Professional Typed Text Effects
  // ============================================
  setupTypedEffects() {
    const typedElements = document.querySelectorAll('[data-typed]');
    
    typedElements.forEach((element, index) => {
      const text = element.textContent;
      element.textContent = '';
      element.style.opacity = '1';
      
      // Sophisticated typing animation with academic timing
      setTimeout(() => {
        this.typeText(element, text, {
          speed: 60,
          cursor: false,
          onComplete: () => {
            element.classList.add('typing-complete');
          }
        });
      }, index * 500);
    });
  }

  typeText(element, text, options = {}) {
    const {
      speed = 80,
      cursor = true,
      onComplete = () => {}
    } = options;
    
    let index = 0;
    const cursorSpan = cursor ? '<span class="typing-cursor">|</span>' : '';
    
    const typeInterval = setInterval(() => {
      element.innerHTML = text.slice(0, index) + cursorSpan;
      index++;
      
      if (index > text.length) {
        clearInterval(typeInterval);
        if (!cursor) {
          element.innerHTML = text;
        }
        onComplete();
      }
    }, speed);
  }

  // ============================================
  // Timeline Academic Presentation
  // ============================================
  animateTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('timeline-visible');
        
        // Add academic emphasis to key discoveries
        const content = item.querySelector('.timeline-content');
        if (content && content.textContent.includes('convergence')) {
          item.classList.add('breakthrough-moment');
        }
      }, index * 300);
    });
  }

  // ============================================
  // Metric Cards Research Validation
  // ============================================
  animateMetricCards() {
    const metricCards = document.querySelectorAll('.metric-card');
    
    metricCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('metric-revealed');
        
        // Animate metric values with academic precision
        const valueElement = card.querySelector('.metric-value');
        if (valueElement) {
          this.animateMetricValue(valueElement);
        }
      }, index * 150);
    });
  }

  animateMetricValue(element) {
    const finalText = element.textContent;
    element.textContent = '...';
    
    setTimeout(() => {
      element.textContent = finalText;
      element.classList.add('metric-value-reveal');
    }, 800);
  }

  // ============================================
  // Theoretical Contributions Animation
  // ============================================
  animateContributionBlocks() {
    const blocks = document.querySelectorAll('.contribution-block');
    
    blocks.forEach((block, index) => {
      setTimeout(() => {
        block.classList.add('contribution-visible');
        
        // Highlight novel contributions
        const proofHighlight = block.querySelector('.proof-highlight');
        if (proofHighlight) {
          setTimeout(() => {
            proofHighlight.classList.add('proof-emphasis');
          }, 500);
        }
      }, index * 200);
    });
  }

  // ============================================
  // Geographic Context Academic Emphasis
  // ============================================
  animateGeographicContext() {
    const locationHighlight = document.querySelector('.location-highlight');
    const contextItems = document.querySelectorAll('.context-item');
    
    if (locationHighlight) {
      locationHighlight.classList.add('location-emphasis');
    }
    
    contextItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('context-reveal');
      }, index * 100);
    });
  }

  // ============================================
  // Commercial Validation Results
  // ============================================
  animateCommercialOutcomes() {
    const outcomeItems = document.querySelectorAll('.outcome-item');
    
    outcomeItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('outcome-validated');
        
        // Add emphasis to significant achievements
        const title = item.querySelector('.outcome-title');
        if (title && (title.textContent.includes('Cost') || title.textContent.includes('Performance'))) {
          item.classList.add('key-achievement');
        }
      }, index * 120);
    });
  }

  // ============================================
  // Academic Research Interactions
  // ============================================
  setupResearchInteractions() {
    // Interactive research highlights
    const highlights = document.querySelectorAll('.highlight-text');
    highlights.forEach(highlight => {
      highlight.addEventListener('mouseenter', () => {
        highlight.classList.add('research-focus');
        this.showResearchContext(highlight);
      });
      
      highlight.addEventListener('mouseleave', () => {
        highlight.classList.remove('research-focus');
        this.hideResearchContext();
      });
    });

    // Timeline interaction for detailed exploration
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
      item.addEventListener('click', () => {
        this.expandTimelineItem(item);
        this.metrics.interactionCount++;
      });
    });

    // Metric card interaction for detailed data
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach(card => {
      card.addEventListener('click', () => {
        this.showMetricDetails(card);
        this.metrics.interactionCount++;
      });
    });

    // CTA tracking for collaboration interest
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
      ctaButton.addEventListener('click', () => {
        this.trackCollaborationInterest();
      });
    }
  }

  showResearchContext(element) {
    const text = element.textContent;
    let contextInfo = '';
    
    if (text.includes('Martin Kleppmann')) {
      contextInfo = 'Lead researcher on distributed systems at Cambridge University';
    } else if (text.includes('DenoGenesis')) {
      contextInfo = 'Multi-tenant framework implementing local-first principles';
    } else if (text.includes('Local-First Software')) {
      contextInfo = 'Architecture prioritizing local data ownership and offline functionality';
    }
    
    if (contextInfo) {
      this.createContextTooltip(element, contextInfo);
    }
  }

  createContextTooltip(element, content) {
    const tooltip = document.createElement('div');
    tooltip.className = 'research-tooltip';
    tooltip.textContent = content;
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      border: 1px solid rgba(59, 130, 246, 0.3);
      backdrop-filter: blur(8px);
      z-index: 1000;
      max-width: 300px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 8}px`;
    
    this.activeTooltip = tooltip;
  }

  hideResearchContext() {
    if (this.activeTooltip) {
      this.activeTooltip.remove();
      this.activeTooltip = null;
    }
  }

  expandTimelineItem(item) {
    // Remove previous expansions
    document.querySelectorAll('.timeline-item.expanded').forEach(el => {
      el.classList.remove('expanded');
    });
    
    item.classList.add('expanded');
    
    // Add detailed academic context based on the timeline item
    const content = item.querySelector('.timeline-content');
    const title = content.querySelector('.timeline-title').textContent;
    
    let detailContent = '';
    if (title.includes('Zero-Knowledge')) {
      detailContent = 'This demonstrates the accessibility principle - complex systems can be learned through AI-assisted methodologies without traditional computer science prerequisites.';
    } else if (title.includes('Problem-First')) {
      detailContent = 'Real-time error observation led to architectural insights that later aligned with established distributed systems research.';
    } else if (title.includes('Academic Connection')) {
      detailContent = 'The convergent evolution discovery validates both the universality of local-first principles and the effectiveness of AI-assisted research synthesis.';
    }
    
    if (detailContent && !content.querySelector('.detail-expansion')) {
      const detail = document.createElement('div');
      detail.className = 'detail-expansion';
      detail.style.cssText = `
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 8px;
        font-style: italic;
        border-left: 3px solid rgba(59, 130, 246, 0.5);
      `;
      detail.textContent = detailContent;
      content.appendChild(detail);
    }
  }

  showMetricDetails(card) {
    const title = card.querySelector('.metric-title').textContent;
    const value = card.querySelector('.metric-value').textContent;
    
    let detailInfo = '';
    if (title.includes('Development Timeline')) {
      detailInfo = 'From initial "What is a runtime?" question to extending Cambridge research. Demonstrates AI-assisted learning acceleration.';
    } else if (title.includes('Production Validation')) {
      detailInfo = 'Real business deployments with measurable revenue, proving commercial viability of academic theory.';
    } else if (title.includes('Performance')) {
      detailInfo = 'Direct database access eliminating network latency typical in cloud architectures.';
    } else if (title.includes('Academic Extension')) {
      detailInfo = 'Business Sovereignty and Developer Accessibility principles extending original 7-principle framework.';
    }
    
    if (detailInfo) {
      this.showDetailModal(title, value, detailInfo);
    }
  }

  showDetailModal(title, value, detail) {
    const modal = document.createElement('div');
    modal.className = 'metric-detail-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
      padding: 2rem;
      border-radius: 16px;
      max-width: 500px;
      margin: 2rem;
      border: 1px solid rgba(59, 130, 246, 0.3);
      box-shadow: 0 16px 64px rgba(0, 0, 0, 0.4);
    `;
    
    content.innerHTML = `
      <h3 style="color: #3b82f6; margin-bottom: 1rem; font-size: 1.5rem;">${title}</h3>
      <div style="color: #60a5fa; font-size: 2rem; font-weight: bold; margin-bottom: 1rem;">${value}</div>
      <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 1.5rem;">${detail}</p>
      <button onclick="this.closest('.metric-detail-modal').remove()" 
              style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; 
                     border-radius: 8px; cursor: pointer; font-weight: 600;">
        Close
      </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // ============================================
  // Academic Accessibility Features
  // ============================================
  enableAcademicAccessibility() {
    // Keyboard navigation for academic users
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        this.showKeyboardShortcuts();
      }
      
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Reading progress indicator for academic review
    this.createReadingProgressIndicator();
    
    // Focus management for screen readers
    this.setupFocusManagement();
    
    // High contrast mode detection and enhancement
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.body.classList.add('high-contrast-academic');
    }
  }

  createReadingProgressIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'reading-progress';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      z-index: 9999;
      transition: width 0.3s ease;
    `;
    
    document.body.appendChild(indicator);
    
    window.addEventListener('scroll', () => {
      const progress = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      indicator.style.width = `${Math.min(progress, 100)}%`;
      this.metrics.scrollProgress = progress;
    });
  }

  setupFocusManagement() {
    const focusableElements = document.querySelectorAll(
      'a, button, [tabindex], .timeline-item, .metric-card, .contribution-block'
    );
    
    focusableElements.forEach(element => {
      element.addEventListener('focus', () => {
        element.classList.add('academic-focus');
      });
      
      element.addEventListener('blur', () => {
        element.classList.remove('academic-focus');
      });
    });
  }

  showKeyboardShortcuts() {
    const shortcuts = [
      'Ctrl+H: Show keyboard shortcuts',
      'Tab: Navigate between sections',
      'Enter: Activate focused element',
      'Escape: Close modals and tooltips'
    ];
    
    const shortcutModal = document.createElement('div');
    shortcutModal.className = 'keyboard-shortcuts-modal';
    shortcutModal.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: rgba(15, 23, 42, 0.95); padding: 2rem; border-radius: 12px; 
                  border: 1px solid rgba(59, 130, 246, 0.3); z-index: 10001;">
        <h3 style="color: #3b82f6; margin-bottom: 1rem;">Academic Navigation Shortcuts</h3>
        <ul style="color: #e2e8f0; list-style: none; padding: 0;">
          ${shortcuts.map(shortcut => `<li style="margin-bottom: 0.5rem;">• ${shortcut}</li>`).join('')}
        </ul>
        <button onclick="this.closest('.keyboard-shortcuts-modal').remove()" 
                style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; 
                       border-radius: 6px; cursor: pointer; margin-top: 1rem;">Close</button>
      </div>
    `;
    
    document.body.appendChild(shortcutModal);
  }

  closeAllModals() {
    document.querySelectorAll('.metric-detail-modal, .keyboard-shortcuts-modal').forEach(modal => {
      modal.remove();
    });
    this.hideResearchContext();
  }

  // ============================================
  // Analytics and Research Metrics
  // ============================================
  initializeMetricsTracking() {
    // Track reading time for academic engagement analysis
    const startTime = Date.now();
    
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.metrics.readingTime = Math.floor((Date.now() - startTime) / 1000);
      }
    }, 1000);
    
    // Track section engagement
    window.addEventListener('beforeunload', () => {
      this.logAcademicEngagement();
    });
  }

  updateScrollProgress() {
    const sections = document.querySelectorAll('.research-section');
    let visibleCount = 0;
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        vis