# new-stie

> Created with Deno Genesis Framework  
> **Unix Philosophy + Modern Runtime = Revolutionary Development**

## 🚀 Quick Start

```bash
# Start development server
genesis dev --port=3002

# Or run directly with Deno
deno run --allow-read --allow-write --allow-net --allow-env main.ts
```

## 📁 Project Structure

```
new-stie/
├── public/                 # Static assets and pages
│   ├── pages/             # HTML pages
│   │   └── home/
│   │       └── index.html # Generated home page
│   ├── styles/            # CSS stylesheets  
│   ├── scripts/           # JavaScript files
│   └── images/            # Image assets
├── logs/                  # Application logs
├── core/                  # → Symlink to ../../core/
├── utils/                 # → Symlink to ../../core/utils/
├── middleware/            # → Symlink to ../../core/middleware/
├── config/                # → Symlink to ../../core/config/
├── types/                 # → Symlink to ../../core/types/
├── database/              # → Symlink to ../../core/database/
├── models/                # → Symlink to ../../core/models/
├── routes/                # → Symlink to ../../core/routes/
├── services/              # → Symlink to ../../core/services/
├── controllers/           # → Symlink to ../../core/controllers/
├── main.ts                # → Symlink to ../../core/main.ts
├── VERSION                # → Symlink to ../../core/VERSION
├── meta.ts                # → Symlink to ../../core/meta.ts
├── site.config.ts         # Site-specific configuration
└── README.md              # This file
```

## ⚙️ Configuration

### Site Settings
- **Name**: new-stie
- **Port**: 3002
- **Template**: basic
- **Description**: Deno Genesis Site

### Core Framework Integration
This site uses symbolic links to the core Deno Genesis framework, ensuring:
- ✅ **Version Consistency**: All sites use the same core framework version
- ✅ **Instant Updates**: Framework updates automatically apply to all sites
- ✅ **Reduced Redundancy**: Single source of truth for core functionality
- ✅ **Easy Maintenance**: Update once, deploy everywhere

## 🔧 Development

### Available Commands
```bash
# Development server with hot reload
genesis dev

# Production deployment
genesis deploy

# Database operations
genesis db setup
genesis db migrate

# Environment management
genesis env setup
genesis env validate

# Status check
genesis status
```

### Adding Pages
1. Create HTML files in `public/pages/[page-name]/`
2. Add corresponding routes in the framework
3. Update navigation in your templates

### Styling
- Add CSS files to `public/styles/`
- Follow the UI guidelines from `docs/05-frontend/ui-guidelines.md`
- Use CSS custom properties for consistent theming

## 🔒 Security

### Framework Security Features
- **Explicit Permissions**: Deno's permission model ensures secure execution
- **No Package Dependencies**: Zero npm packages, zero supply chain attacks  
- **Type Safety**: Full TypeScript integration prevents runtime errors
- **Secure Defaults**: All configurations follow security best practices

### Site-Specific Security
- HTTPS-ready configuration
- CSP headers configured
- XSS protection enabled
- CSRF protection implemented

## 📊 Performance

### Built-in Optimizations
- **Critical CSS Inlined**: Above-the-fold styles loaded immediately
- **Lazy Loading**: Images and components loaded on demand
- **Resource Hints**: DNS prefetch, preload, and prefetch optimizations
- **Compression**: Automatic gzip/brotli compression
- **Caching**: Intelligent caching strategies

### Monitoring
- Structured logging to `logs/` directory
- Performance metrics collection
- Error tracking and reporting
- Health check endpoints

## 🤝 Contributing

1. Make changes to your site-specific files in `public/`
2. For framework changes, modify files in the core framework
3. Test changes with `genesis dev`
4. Deploy with `genesis deploy`

## 📚 Documentation

- **Framework Docs**: `docs/` directory in project root
- **UI Guidelines**: `docs/05-frontend/ui-guidelines.md`
- **Architecture**: `docs/02-framework/architecture.md`
- **Deployment**: `docs/07-deployment/`

## 🆘 Support

- **Issues**: Create issues in the main Deno Genesis repository
- **Documentation**: Check `docs/` for comprehensive guides
- **Community**: Join the discussion in project issues

---

**Created with ❤️ using Deno Genesis Framework**  
*Unix Philosophy + Modern Runtime = Revolutionary Development*
