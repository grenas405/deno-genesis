DenoGenesis Centralized Architecture Documentation

**Enterprise Framework Management System**  
**Version:** 2.1.0  
**Last Updated:** August 27, 2025  
**Author:** Pedro M. Dominguez - DenoGenesis Framework Team

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Site Management](#site-management)
4. [Framework Operations](#framework-operations)
5. [Development Workflow](#development-workflow)
6. [Deployment Procedures](#deployment-procedures)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Command Reference](#command-reference)
10. [Best Practices](#best-practices)

---

## 🏛️ Architecture Overview

### Core Principle: Single Source of Truth

The DenoGenesis Centralized Architecture eliminates framework version drift by implementing a **hub-and-spoke model** where:

- **Hub**: Centralized framework at `/home/admin/deno-genesis/`
- **Spokes**: Individual sites in `sites/` directory, linked to `core/` via symbolic links
- **Isolation**: Each site maintains port isolation and site-specific code

```
🏗️ CENTRALIZED ARCHITECTURE DIAGRAM
                                    
┌─────────────────────────────────────┐
│      DenoGenesis Framework Hub      │
│    /home/admin/deno-genesis/        │
│                                     │
│  ├── core/                          │
│  │   ├── middleware/                │
│  │   ├── database/                  │
│  │   ├── config/                    │
│  │   ├── utils/                     │
│  │   └── types/                     │
│  ├── sites/                         │
│  │   ├── domtech/      (Port 3000)  │
│  │   ├── roofing/      (Port 3001)  │
│  │   ├── okdevs/       (Port 3002)  │
│  │   ├── pedro/        (Port 3003)  │
│  │   └── movers/       (Port 3004)  │
│  ├── templates/                     │
│  ├── scripts/                       │
│  └── VERSION                        │
└─────────────────────────────────────┘
```

### Benefits of Centralized Architecture

#### ✅ **Framework Consistency**
- All sites use identical framework version
- No version drift between environments
- Consistent behavior across all properties

#### ✅ **Simplified Updates**
- Update framework once, affects all sites
- Zero-downtime rolling updates
- Automated version synchronization

#### ✅ **Port Isolation Maintained**
- Each site runs on dedicated port
- Independent scaling and configuration
- Site-specific environment variables

#### ✅ **Development Efficiency**
- Framework improvements benefit all sites instantly
- New sites inherit latest framework automatically
- Reduced code duplication and maintenance overhead

---

## 📊 Monitoring & Maintenance

### System Health Monitoring

#### **Centralized Health Monitor**
```typescript
// denogenesis-framework/scripts/health-monitor.ts

export interface SystemHealthReport {
  timestamp: string;
  framework: FrameworkHealth;
  sites: SiteHealth[];
  system: SystemHealth;
  alerts: Alert[];
}

export interface FrameworkHealth {
  version: string;
  integrity: boolean;
  lastUpdated: string;
  sitesConnected: number;
  sitesActive: number;
}

export interface SiteHealth {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  requests: number;
  errors: number;
  errorRate: number;
  frameworkVersion: string;
  versionMatch: boolean;
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkConnections: number;
  loadAverage: number[];
}

export interface Alert {
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  timestamp: string;
  site?: string;
}

export class HealthMonitor {
  private alerts: Alert[] = [];
  
  async generateHealthReport(): Promise<SystemHealthReport> {
    console.log("🏥 Generating DenoGenesis System Health Report...");
    
    const timestamp = new Date().toISOString();
    
    // Framework health
    const framework = await this.checkFrameworkHealth();
    
    // Site health
    const sites = await this.checkAllSitesHealth();
    
    // System health
    const system = await this.checkSystemHealth();
    
    // Generate alerts
    this.generateAlerts(framework, sites, system);
    
    return {
      timestamp,
      framework,
      sites,
      system,
      alerts: this.alerts
    };
  }
  
  private async checkFrameworkHealth(): Promise<FrameworkHealth> {
    const metadata = await getFrameworkMetadata();
    const integrity = await validateFrameworkIntegrity();
    const sites = await getConnectedSites();
    
    const sitesActive = sites.filter(site => site.status === 'active').length;
    
    return {
      version: metadata.version,
      integrity,
      lastUpdated: metadata.buildDate,
      sitesConnected: sites.length,
      sitesActive
    };
  }
  
  private async checkSystemHealth(): Promise<SystemHealth> {
    try {
      const cpuUsage = await this.getCPUUsage();
      const memoryInfo = await this.getMemoryInfo();
      const diskUsage = await this.getDiskUsage();
      const loadAverage = await this.getLoadAverage();
      const networkConnections = await this.getNetworkConnections();
      
      return {
        cpuUsage,
        memoryUsage: memoryInfo.percentage,
        diskUsage: diskUsage.percentage,
        networkConnections,
        loadAverage
      };
    } catch (error) {
      console.warn("⚠️ Could not collect system health metrics:", error.message);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkConnections: 0,
        loadAverage: [0, 0, 0]
      };
    }
  }
  
  private generateAlerts(framework: FrameworkHealth, sites: SiteHealth[], system: SystemHealth) {
    this.alerts = [];
    
    // Framework alerts
    if (!framework.integrity) {
      this.alerts.push({
        severity: 'critical',
        category: 'framework',
        message: 'Framework integrity check failed',
        timestamp: new Date().toISOString()
      });
    }
    
    if (framework.sitesActive < framework.sitesConnected) {
      const inactiveSites = framework.sitesConnected - framework.sitesActive;
      this.alerts.push({
        severity: 'warning',
        category: 'framework',
        message: `${inactiveSites} sites are inactive`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Site alerts
    sites.forEach(site => {
      if (site.status === 'down') {
        this.alerts.push({
          severity: 'error',
          category: 'site',
          message: `${site.name} is down`,
          timestamp: new Date().toISOString(),
          site: site.name
        });
      }
      
      if (site.errorRate > 10) {
        this.alerts.push({
          severity: 'warning',
          category: 'site',
          message: `${site.name} has high error rate: ${site.errorRate.toFixed(2)}%`,
          timestamp: new Date().toISOString(),
          site: site.name
        });
      }
      
      if (!site.versionMatch) {
        this.alerts.push({
          severity: 'warning',
          category: 'site',
          message: `${site.name} framework version mismatch`,
          timestamp: new Date().toISOString(),
          site: site.name
        });
      }
    });
    
    // System alerts
    if (system.cpuUsage > 80) {
      this.alerts.push({
        severity: 'warning',
        category: 'system',
        message: `High CPU usage: ${system.cpuUsage.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (system.memoryUsage > 85) {
      this.alerts.push({
        severity: 'warning',
        category: 'system',
        message: `High memory usage: ${system.memoryUsage.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (system.diskUsage > 90) {
      this.alerts.push({
        severity: 'critical',
        category: 'system',
        message: `Critical disk usage: ${system.diskUsage.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

### Automated Monitoring Script
```bash
#!/bin/bash
# monitor-all-sites.sh

echo "🔍 DenoGenesis System Monitor"
echo "============================="

# Framework status
echo "📦 Framework Status:"
if [ -f "/home/admin/deno-genesis/VERSION" ]; then
    FRAMEWORK_VERSION=$(head -1 /home/admin/deno-genesis/VERSION)
    echo "✅ Framework Version: $FRAMEWORK_VERSION"
else
    echo "❌ Framework VERSION file not found"
fi

echo ""
echo "🌐 Site Status:"
PORTS=(3000 3001 3002 3003 3004)
SITES=("DomTech" "Roofing" "OKDevs" "Pedro" "Movers")

for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    SITE=${SITES[$i]}
    
    if curl -s --max-time 5 "http://localhost:$PORT/health" > /dev/null; then
        RESPONSE=$(curl -s --max-time 5 "http://localhost:$PORT/health" | jq -r '.version // "unknown"' 2>/dev/null || echo "unknown")
        echo "✅ $SITE (Port $PORT): Running - Version $RESPONSE"
    else
        echo "❌ $SITE (Port $PORT): Down"
    fi
done

echo ""
echo "💻 System Resources:"
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
DISK_USAGE=$(df -h /home | awk 'NR==2 {print $5}' | cut -d'%' -f1)

echo "📊 CPU Usage: ${CPU_USAGE}%"
echo "🧠 Memory Usage: ${MEMORY_USAGE}%"
echo "💾 Disk Usage: ${DISK_USAGE}%"

if [ "$CPU_USAGE" -gt 80 ] || [ "$MEMORY_USAGE" -gt 85 ] || [ "$DISK_USAGE" -gt 90 ]; then
    echo "⚠️ ALERT: High resource usage detected!"
fi

echo ""
echo "📈 Framework Integrity:"
LINK_ISSUES=0
for site in /home/admin/deno-genesis/sites/*/; do
    site_name=$(basename "$site")
    if [ ! -L "$site/middleware" ] || [ ! -L "$site/database" ] || [ ! -L "$site/config" ]; then
        echo "❌ $site_name: Missing framework links"
        LINK_ISSUES=$((LINK_ISSUES + 1))
    else
        echo "✅ $site_name: Framework links intact"
    fi
done

if [ $LINK_ISSUES -eq 0 ]; then
    echo "✅ All sites properly linked to centralized framework"
else
    echo "⚠️ $LINK_ISSUES sites have framework link issues"
fi
```

---

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### **Site Won't Start**
```bash
# Problem: Site fails to start
# Symptoms: Port appears to be in use, permission errors, or import failures

# Solution 1: Check port conflicts
sudo lsof -i :3003
# Kill conflicting processes
sudo kill -9 <PID>

# Solution 2: Verify framework links
ls -la /home/admin/deno-genesis/sites/pedromdominguez-com/
# Ensure symbolic links exist and point to framework
ln -sf /home/admin/deno-genesis/core/middleware /home/admin/deno-genesis/sites/pedromdominguez-com/middleware

# Solution 3: Check permissions
sudo chown -R admin:admin /home/admin/deno-genesis/sites/pedromdominguez-com/
chmod +x /home/admin/deno-genesis/sites/pedromdominguez-com/main.ts
```

#### **Framework Version Mismatch**
```bash
# Problem: Sites reporting different framework versions
# Solution: Update all sites to latest framework version

cd /home/admin/deno-genesis
deno run --allow-all scripts/update-framework.ts --restart

# Verify all sites updated
for site in /home/admin/deno-genesis/sites/*/; do
    if [ -f "$site/FRAMEWORK_VERSION" ]; then
        echo "$(basename "$site"): $(head -1 "$site/FRAMEWORK_VERSION")"
    fi
done
```

#### **Database Connection Issues**
```bash
# Problem: Sites cannot connect to database
# Solution: Check database service and credentials

# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u webadmin -pPassword123! -h localhost universal_db -e "SELECT 1;"

# Restart database if needed
sudo systemctl restart mysql

# Check database logs
sudo tail -f /var/log/mysql/error.log
```

#### **Nginx Configuration Issues**
```bash
# Problem: Sites not accessible via domain
# Solution: Verify and reload nginx configuration

# Test nginx configuration
sudo nginx -t

# Reload nginx if configuration is valid
sudo systemctl reload nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify SSL certificates
sudo certbot certificates
```

### Emergency Recovery Procedures

#### **Complete System Recovery**
```bash
#!/bin/bash
# emergency-recovery.sh

echo "🚨 DenoGenesis Emergency Recovery"
echo "================================="

# Stop all sites
echo "🛑 Stopping all sites..."
for port in 3000 3001 3002 3003 3004; do
    PID=$(lsof -ti :$port)
    if [ ! -z "$PID" ]; then
        kill -TERM $PID
        echo "Stopped process on port $port"
    fi
done

# Restore from backup if available
if [ -d "/home/admin/deno-genesis-backup" ]; then
    echo "📦 Backup found, restoring framework..."
    cp -r /home/admin/deno-genesis-backup/* /home/admin/deno-genesis/
fi

# Rebuild framework links
echo "🔗 Rebuilding framework links..."
for site in /home/admin/deno-genesis/sites/*/; do
    site_name=$(basename "$site")
    echo "Linking $site_name..."
    
    ln -sf /home/admin/deno-genesis/core/middleware "$site/middleware"
    ln -sf /home/admin/deno-genesis/core/database "$site/database"
    ln -sf /home/admin/deno-genesis/core/config "$site/config"
    ln -sf /home/admin/deno-genesis/core/utils "$site/utils"
    ln -sf /home/admin/deno-genesis/core/types "$site/types"
done

# Restart sites
echo "🚀 Restarting sites..."
/home/admin/deno-genesis/scripts/start-all.sh

echo "✅ Emergency recovery complete"
```

---

## 📚 Command Reference

### Framework Management Commands
```bash
# Framework Operations
dgf-version                    # Show current framework version
dgf-update                     # Update framework to latest version
dgf-backup                     # Create full system backup
dgf-check                      # Run system health check
dgf-integrity                  # Verify framework integrity

# Site Management
dgf-start                      # Start all sites
dgf-stop                       # Stop all sites gracefully
dgf-restart                    # Restart all sites
dgf-status                     # Show status of all sites
dgf-logs                       # View aggregated site logs

# Development Tools
dgf-dev-framework              # Start framework development mode
dgf-dev-site <site-name>       # Start site development mode
dgf-create-site <name>         # Create new site from template
```

### Site-Specific Commands
```bash
# Site shortcuts
site-domtech                   # Navigate to DomTech site
site-roofing                   # Navigate to Roofing site
site-okdevs                    # Navigate to OKDevs site
site-pedro                     # Navigate to Pedro site
site-movers                    # Navigate to Movers site

# Development shortcuts
dev-domtech                    # Start DomTech in dev mode
dev-roofing                    # Start Roofing in dev mode
dev-okdevs                     # Start OKDevs in dev mode
dev-pedro                      # Start Pedro in dev mode
dev-movers                     # Start Movers in dev mode

# Health checks
health-all                     # Check all sites health
health-port <port>             # Check specific port
health-site <site-name>        # Check specific site
```

### System Monitoring Commands
```bash
# Monitoring
dgf-monitor                    # Start continuous monitoring
dgf-metrics                    # Show detailed system metrics
dgf-alerts                     # Show current alerts
dgf-uptime                     # Show site uptime statistics

# Logs
dgf-logs-framework             # Framework-specific logs
dgf-logs-site <name>           # Site-specific logs
dgf-logs-system                # System logs
dgf-logs-nginx                 # Nginx logs
```

### Database Commands
```bash
# Database operations
dgf-db-status                  # Check database connection
dgf-db-backup                  # Backup database
dgf-db-migrate                 # Run database migrations
dgf-db-reset                   # Reset database (use with caution)
```

---

## ✨ Best Practices

### Framework Development Best Practices

#### **1. Version Control**
```bash
# Always commit framework changes before updates
cd /home/admin/deno-genesis
git add .
git commit -m "feat: enhanced middleware performance monitoring"
git push origin main

# Tag releases
git tag -a v2.1.0 -m "Release v2.1.0 - Centralized Architecture"
git push origin v2.1.0
```

#### **2. Testing Before Deployment**
```bash
# Test framework changes in development
dgf-dev-framework

# Test on a single site first
dgf-dev-site pedromdominguez-com

# Run integrity checks
dgf-integrity

# Only then deploy to all sites
dgf-update --restart
```

#### **3. Backup Strategy**
```bash
# Daily automated backups
crontab -e
# Add: 0 2 * * * /home/pedro/denogenesis-framework/scripts/backup-system.sh

# Pre-deployment backups
dgf-backup

# Keep multiple backup versions
# Rotate backups weekly, keep monthly archives
```

### Site Development Best Practices

#### **1. Site-Specific Code Organization**
```typescript
// Keep site-specific code in designated areas
/home/admin/deno-genesis/sites/site-name/
├── routes/           # Site-specific routes only
├── controllers/      # Site-specific controllers  
├── services/         # Site business logic
├── models/           # Site data models
├── public/           # Site static assets
└── site-config.ts    # Site configuration

// Never modify framework files directly
// Use site-config.ts for customization
```

#### **2. Environment Management**
```typescript
// site-config.ts
export const SITE_CONFIG = {
  // Environment-specific overrides
  development: {
    logLevel: 'debug',
    enableHotReload: true
  },
  production: {
    logLevel: 'info',
    enableCompression: true,
    enableCaching: true
  }
};
```

#### **3. Resource Optimization**
```bash
# Optimize static assets
cd /home/pedro/sites/site-name/public/assets
# Compress images, minify CSS/JS
# Use appropriate cache headers in production
```

### Security Best Practices

#### **1. Access Control**
```bash
# Framework files should be read-only for sites
sudo chmod -R 755 /home/admin/deno-genesis/core/
sudo chown -R admin:admin /home/admin/deno-genesis/

# Site files should be writable only by owner
sudo chmod -R 755 /home/admin/deno-genesis/sites/
sudo chown -R admin:admin /home/admin/deno-genesis/sites/
```

#### **2. Environment Variables**
```bash
# Never commit sensitive data
echo ".env" >> .gitignore

# Use strong database passwords
# Rotate API keys regularly
# Use HTTPS in production
```

#### **3. Regular Security Updates**
```bash
# Keep system packages updated
sudo apt update && sudo apt upgrade

# Update Deno regularly  
deno upgrade

# Monitor security advisories for dependencies
```

### Performance Optimization

#### **1. Database Optimization**
```sql
-- Add appropriate indexes
CREATE INDEX idx_site_created_at ON table_name (site_key, created_at);

-- Optimize queries for multi-tenant setup
SELECT * FROM table_name WHERE site_key = ? ORDER BY created_at DESC LIMIT 10;
```

#### **2. Static Asset Optimization**
```nginx
# nginx configuration for static assets
location ~* \.(css|js|png|jpg|jpeg|gif|svg|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    gzip_static on;
}
```

#### **3. Memory Management**
```typescript
// Monitor memory usage in long-running processes
setInterval(() => {
  const memUsage = Deno.memoryUsage();
  if (memUsage.heapUsed > 100_000_000) { // 100MB
    console.warn('High memory usage detected:', memUsage);
  }
}, 60000); // Check every minute
```

### Deployment Best Practices

#### **1. Zero-Downtime Deployments**
```bash
# Use rolling updates
dgf-update --rolling --health-check-timeout=30

# Verify each site before proceeding to next
# Automatic rollback on failure
```

#### **2. Monitoring and Alerting**
```bash
# Set up continuous monitoring
dgf-monitor --continuous

# Configure alerts for:
# - Site downtime
# - High error rates  
# - Framework version mismatches
# - System resource exhaustion
```

#### **3. Documentation**
```markdown
# Always document:
# - Framework changes
# - Site configurations
# - Deployment procedures
# - Troubleshooting steps

# Keep documentation up-to-date
# Version control all documentation
```

---

## 📈 Performance Monitoring

### Key Metrics to Track

#### **Framework-Level Metrics**
- Framework version consistency across sites
- Framework integrity status
- Update deployment success rate
- Site link validation status

#### **Site-Level Metrics**  
- Response time per site
- Request throughput
- Error rates
- Uptime percentage
- Resource utilization

#### **System-Level Metrics**
- CPU usage trends
- Memory consumption
- Disk space utilization
- Network connection counts
- Database connection pool usage

### Automated Alerting Rules

```yaml
# alerting-rules.yml
alerts:
  - name: HighErrorRate
    condition: site.errorRate > 10
    severity: warning
    message: "Site {{site.name}} has error rate {{site.errorRate}}%"
    
  - name: SiteDown
    condition: site.status == 'down'
    severity: critical
    message: "Site {{site.name}} is down"
    
  - name: FrameworkVersionMismatch
    condition: site.versionMatch == false
    severity: warning
    message: "Site {{site.name}} framework version mismatch"
    
  - name: HighSystemLoad
    condition: system.cpuUsage > 80
    severity: warning
    message: "High CPU usage: {{system.cpuUsage}}%"
```

---

## 🎯 Conclusion

The DenoGenesis Centralized Architecture provides a robust, scalable foundation for managing multiple web applications with consistent framework behavior. By implementing symbolic linking and centralized version control, we achieve:

- **Simplified maintenance** through single-point updates
- **Consistent behavior** across all applications  
- **Improved development velocity** with shared improvements
- **Enhanced monitoring** through centralized health checks
- **Reliable deployments** with automated rollback capabilities

This architecture scales efficiently as new sites are added and provides a solid foundation for enterprise-level web application management.

---

**© 2025 Pedro M. Dominguez - DenoGenesis Framework Team**  
*Building the future of local-first web applications*
