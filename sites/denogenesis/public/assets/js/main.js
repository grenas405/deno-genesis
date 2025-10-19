// Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Add navbar background on scroll
        const nav = document.querySelector('.nav');
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                nav.style.background = 'rgba(15, 23, 42, 0.95)';
                nav.style.backdropFilter = 'blur(20px)';
            } else {
                nav.style.background = 'rgba(15, 23, 42, 0.9)';
                nav.style.backdropFilter = 'blur(20px)';
            }
            lastScrollY = window.scrollY;
        });
        
        // Add intersection observer for animation triggers
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = entry.target.dataset.animation || 'slideUp 0.6s ease-out forwards';
                }
            });
        }, observerOptions);
        
        // Observe elements that should animate on scroll
        document.querySelectorAll('.card, .feature-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.dataset.animation = 'slideUp 0.6s ease-out forwards';
            observer.observe(el);
        });
        
        // Performance optimization: Preload critical resources
        const preloadLinks = [
            '/docs/',
            '/docs/01-getting-started/',
            'https://github.com/grenas405/deno-genesis'
        ];
        
        preloadLinks.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
        });
        
        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

// ===== Next Script Block =====

{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Deno Genesis",
        "description": "Revolutionary web framework combining Unix philosophy with modern runtime capabilities",
        "url": "https://github.com/grenas405/deno-genesis",
        "applicationCategory": "WebApplication",
        "operatingSystem": "Cross-platform",
        "programmingLanguage": "TypeScript",
        "author": {
            "@type": "Organization",
            "name": "Deno Genesis Framework"
        },
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "ratingCount": "1"
        }
    }