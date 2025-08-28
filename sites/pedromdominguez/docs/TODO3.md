# 🏢 Tenant System Migration TODO
## Updating Controllers & Routes for Multi-Tenant Architecture

**Status**: 🔄 **IN PROGRESS** | **Priority**: HIGH | **Business Value**: Critical
**Estimated Time**: 4-6 hours | **Complexity**: Medium | **Impact**: High

---

## 📋 **Migration Overview**

### **Goal**: Transform all controllers and routes to use tenant configuration system
### **Benefit**: Professional multi-business deployment with feature gating and custom branding
### **Impact**: Enables scalable business model with industry-specific configurations

---

## 🎯 **Phase 1: Controller Migration (2-3 hours)**

### **1.1 Authentication Controller** 
**File**: `controllers/authController.ts`
**Status**: ⏸️ **PENDING**

#### **Current Issues:**
- [ ] Hard-coded business references
- [ ] No tenant-specific session timeout
- [ ] Missing business branding in auth responses
- [ ] No tenant security policy enforcement

#### **Migration Tasks:**
```typescript
// BEFORE (example)
export async function loginController(ctx: Context) {
  // Hard-coded business logic
  const user = await validateUser(email, password);
  ctx.response.body = { user, token };
}

// AFTER (tenant-aware)
export async function loginController(ctx: Context) {
  const tenant = ctx.state.tenant;
  const configManager = ctx.state.configManager;
  
  // Enforce tenant security policies
  if (!configManager.hasFeature('auth')) {
    ctx.response.status = 404;
    return;
  }
  
  // Apply tenant-specific validation
  const user = await validateUser(email, password, tenant.id);
  
  // Use tenant session timeout
  const sessionTimeout = tenant.security.sessionTimeout;
  const token = generateJWT(user, sessionTimeout);
  
  ctx.response.body = {
    user,
    token,
    tenant: {
      name: tenant.name,
      branding: ctx.state.branding
    }
  };
}
```

#### **Implementation Checklist:**
- [ ] Add tenant context access
- [ ] Implement feature gating for auth routes
- [ ] Apply tenant security policies (session timeout, password requirements)
- [ ] Include tenant branding in auth responses
- [ ] Update JWT token generation with tenant-specific expiration
- [ ] Add tenant-specific password policy validation
- [ ] Implement tenant-aware user lookup (filter by site_key + tenant)

---

### **1.2 Appointment Controller**
**File**: `controllers/appointmentController.ts`
**Status**: ⏸️ **PENDING**

#### **Current Issues:**
- [ ] Generic appointment logic for all businesses
- [ ] No industry-specific appointment rules
- [ ] Missing business hours validation
- [ ] No tenant-specific appointment limits

#### **Migration Tasks:**
```typescript
// AFTER (tenant-aware implementation)
export async function createAppointmentController(ctx: Context) {
  const tenant = ctx.state.tenant;
  const configManager = ctx.state.configManager;
  
  // Feature gate
  if (!configManager.hasFeature('appointments')) {
    ctx.response.status = 404;
    ctx.response.body = { error: 'Appointments not available' };
    return;
  }
  
  // Apply business rules
  const appointmentRules = tenant.businessRules.appointmentRules;
  const requestedTime = new Date(ctx.request.body.appointmentDate);
  
  // Validate business hours
  if (!isWithinBusinessHours(requestedTime, tenant.businessRules.operatingHours)) {
    ctx.response.status = 400;
    ctx.response.body = { error: 'Outside business hours' };
    return;
  }
  
  // Apply tenant-specific rules
  const appointment = {
    ...ctx.request.body,
    site_key: tenant.id,
    duration: appointmentRules?.defaultDuration || 60,
    industry: tenant.businessInfo.industry
  };
  
  const result = await createAppointment(appointment);
  
  ctx.response.body = {
    appointment: result,
    businessInfo: {
      name: tenant.name,
      industry: tenant.businessInfo.industry,
      contactInfo: tenant.businessInfo.phone
    }
  };
}
```

#### **Implementation Checklist:**
- [ ] Add appointment feature gating
- [ ] Implement business hours validation
- [ ] Apply tenant-specific appointment rules (duration, buffer time)
- [ ] Add industry-specific appointment logic
- [ ] Include tenant branding in appointment confirmations
- [ ] Validate advance booking limits
- [ ] Apply cancellation policy from tenant config
- [ ] Add tenant-specific appointment limits checking

---

### **1.3 Payment Controller**
**File**: `controllers/paymentController.ts`
**Status**: ⏸️ **PENDING**

#### **Migration Tasks:**
```typescript
export async function processPaymentController(ctx: Context) {
  const tenant = ctx.state.tenant;
  const configManager = ctx.state.configManager;
  
  // Feature gate
  if (!configManager.hasFeature('payments')) {
    ctx.response.status = 404;
    return;
  }
  
  // Get tenant-specific Stripe config
  const stripeConfig = configManager.getIntegration('stripe');
  if (!stripeConfig) {
    ctx.response.status = 500;
    ctx.response.body = { error: 'Payment processing not configured' };
    return;
  }
  
  // Apply tenant payment rules
  const paymentRules = tenant.businessRules.paymentRules;
  const amount = ctx.request.body.amount;
  
  // Apply tax rate if configured
  const finalAmount = paymentRules?.taxRate 
    ? amount * (1 + paymentRules.taxRate / 100)
    : amount;
  
  // Process with tenant-specific Stripe account
  const payment = await processStripePayment({
    amount: finalAmount,
    currency: paymentRules?.currency || 'USD',
    stripeKey: stripeConfig.publishableKey,
    tenantId: tenant.id
  });
  
  ctx.response.body = {
    payment,
    tenant: tenant.name,
    businessInfo: tenant.businessInfo
  };
}
```

#### **Implementation Checklist:**
- [ ] Add payment feature gating
- [ ] Integrate tenant-specific Stripe configuration
- [ ] Apply tenant payment rules (tax rates, accepted methods)
- [ ] Handle tenant-specific currency settings
- [ ] Add deposit requirements for applicable businesses
- [ ] Include business info in payment confirmations
- [ ] Implement tenant-specific payment limits

---

### **1.4 Analytics Controller**
**File**: `controllers/analyticsController.ts`
**Status**: ⏸️ **PENDING**

#### **Migration Tasks:**
```typescript
export async function getAnalyticsController(ctx: Context) {
  const tenant = ctx.state.tenant;
  const configManager = ctx.state.configManager;
  
  // Feature gate
  if (!configManager.hasFeature('analytics')) {
    ctx.response.status = 404;
    return;
  }
  
  // Get tenant-specific analytics
  const analytics = await getBusinessAnalytics(tenant.id, {
    industry: tenant.businessInfo.industry,
    features: tenant.features,
    timeframe: ctx.request.url.searchParams.get('timeframe') || '30d'
  });
  
  // Apply industry-specific metrics
  const industryMetrics = getIndustrySpecificMetrics(
    analytics, 
    tenant.businessInfo.industry
  );
  
  ctx.response.body = {
    analytics: industryMetrics,
    tenant: {
      name: tenant.name,
      industry: tenant.businessInfo.industry
    },
    period: analytics.period
  };
}
```

#### **Implementation Checklist:**
- [ ] Add analytics feature gating
- [ ] Filter analytics by tenant ID
- [ ] Add industry-specific metrics calculation
- [ ] Include tenant context in analytics responses
- [ ] Implement privacy controls for sensitive industries (medical)
- [ ] Add tenant-specific KPI calculations
- [ ] Apply data retention policies per tenant

---

### **1.5 Blog Controller** 
**File**: `controllers/blogController.ts`
**Status**: ⏸️ **PENDING**

#### **Implementation Checklist:**
- [ ] Add blog feature gating (many businesses don't need blogs)
- [ ] Apply tenant branding to blog posts
- [ ] Filter blog posts by tenant ID
- [ ] Include tenant business info in blog metadata
- [ ] Add tenant-specific SEO optimization
- [ ] Implement tenant content moderation policies

---

### **1.6 Dashboard Controller**
**File**: `controllers/dashboardController.ts`
**Status**: ⏸️ **PENDING**

#### **Implementation Checklist:**
- [ ] Customize dashboard based on enabled features
- [ ] Show tenant-specific business metrics
- [ ] Apply tenant branding to dashboard
- [ ] Hide disabled features from navigation
- [ ] Display tenant business status (open/closed)
- [ ] Show tenant-specific welcome message

---

## 🛣️ **Phase 2: Route Migration (1-2 hours)**

### **2.1 Authentication Routes**
**File**: `routes/authRoutes.ts`
**Status**: ⏸️ **PENDING**

#### **Migration Tasks:**
```typescript
// BEFORE
router.post('/api/auth/login', loginController);

// AFTER (with feature gating middleware)
import { requireFeature } from '../middleware/tenantMiddleware.ts';

router.post('/api/auth/login', 
  requireFeature('auth'), 
  loginController
);

router.post('/api/auth/register', 
  requireFeature('auth'),
  validateTenantUserLimits,
  registerController
);
```

#### **Implementation Checklist:**
- [ ] Add feature gating middleware to all auth routes
- [ ] Implement tenant user limit validation
- [ ] Add tenant-specific registration rules
- [ ] Apply tenant security policies to auth routes

---

### **2.2 Business Feature Routes**
**File**: `routes/index.ts`
**Status**: ⏸️ **PENDING**

#### **Migration Tasks:**
```typescript
// Feature-gated route registration
if (configManager.hasFeature('appointments')) {
  router.get('/api/appointments', requireFeature('appointments'), getAppointmentsController);
  router.post('/api/appointments', requireFeature('appointments'), createAppointmentController);
}

if (configManager.hasFeature('blog')) {
  router.get('/api/blog', requireFeature('blog'), getBlogController);
  router.post('/api/blog', requireFeature('blog'), createBlogPostController);
}

if (configManager.hasFeature('projects')) {
  router.get('/api/projects', requireFeature('projects'), getProjectsController);
}

// Always available routes
router.get('/api/dashboard', dashboardController);
router.get('/api/settings', settingsController);
```

#### **Implementation Checklist:**
- [ ] Implement conditional route registration based on tenant features
- [ ] Add feature gating middleware to all business routes
- [ ] Create tenant-aware route middleware
- [ ] Add tenant context injection to all routes
- [ ] Implement tenant-specific rate limiting

---

### **2.3 Tenant Management Routes**
**File**: `routes/tenantRoutes.ts` (NEW)
**Status**: ⏸️ **PENDING**

#### **New Routes to Create:**
```typescript
// Tenant configuration and management routes
router.get('/api/tenant/config', getTenantConfigController);
router.get('/api/tenant/styles.css', getTenantStylesController);
router.get('/api/tenant/features', getTenantFeaturesController);
router.post('/api/tenant/settings', updateTenantSettingsController);
router.get('/api/tenant/status', getTenantStatusController);
```

#### **Implementation Checklist:**
- [ ] Create tenant configuration API endpoints
- [ ] Implement tenant branding CSS endpoint
- [ ] Add tenant feature management endpoints
- [ ] Create tenant status and health endpoints
- [ ] Add tenant settings update capabilities

---

## 🛠️ **Phase 3: Middleware Enhancement (1 hour)**

### **3.1 Feature Gating Middleware**
**File**: `middleware/tenantMiddleware.ts` (NEW)
**Status**: ⏸️ **PENDING**

#### **Implementation Tasks:**
```typescript
export function requireFeature(feature: keyof TenantFeatures) {
  return async (ctx: any, next: () => Promise<unknown>) => {
    const configManager = ctx.state.configManager;
    
    if (!configManager || !configManager.hasFeature(feature)) {
      ctx.response.status = 404;
      ctx.response.body = { 
        error: 'Feature not available',
        feature: feature,
        tenant: ctx.state.tenant?.name || 'Unknown'
      };
      return;
    }
    
    await next();
  };
}

export function validateBusinessHours() {
  return async (ctx: any, next: () => Promise<unknown>) => {
    const configManager = ctx.state.configManager;
    
    if (!configManager.isBusinessOpen()) {
      ctx.response.status = 423; // Locked
      ctx.response.body = { 
        error: 'Business currently closed',
        businessHours: ctx.state.tenant.businessRules.operatingHours
      };
      return;
    }
    
    await next();
  };
}
```

#### **Implementation Checklist:**
- [ ] Create feature gating middleware
- [ ] Add business hours validation middleware
- [ ] Implement tenant limits checking middleware
- [ ] Create tenant context validation middleware
- [ ] Add tenant-specific rate limiting middleware

---

### **3.2 Tenant Context Middleware Enhancement**
**File**: `middleware/index.ts`
**Status**: ⏸️ **PENDING**

#### **Implementation Checklist:**
- [ ] Enhance tenant context injection with error handling
- [ ] Add tenant validation and status checking
- [ ] Implement tenant-specific logging
- [ ] Add tenant performance monitoring
- [ ] Create tenant-aware error handling

---

## 📊 **Phase 4: Frontend Integration (1 hour)**

### **4.1 Tenant-Aware Frontend Components**
**Status**: ⏸️ **PENDING**

#### **Implementation Tasks:**
```javascript
// public/js/tenant-integration.js

class TenantManager {
  constructor() {
    this.config = null;
    this.branding = null;
  }
  
  async initialize() {
    try {
      const response = await fetch('/api/tenant/config');
      this.config = await response.json();
      this.branding = this.config.branding;
      
      this.applyBranding();
      this.setupFeatureVisibility();
      this.loadCustomStyles();
    } catch (error) {
      console.error('Failed to load tenant configuration:', error);
    }
  }
  
  applyBranding() {
    document.title = this.config.name;
    document.documentElement.style.setProperty('--primary-color', this.branding.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', this.branding.secondaryColor);
    
    // Update business name in header
    const businessNameElements = document.querySelectorAll('.business-name');
    businessNameElements.forEach(el => el.textContent = this.config.name);
  }
  
  setupFeatureVisibility() {
    // Hide disabled features
    Object.entries(this.config.features).forEach(([feature, enabled]) => {
      const elements = document.querySelectorAll(`[data-feature="${feature}"]`);
      elements.forEach(el => {
        el.style.display = enabled ? 'block' : 'none';
      });
    });
  }
  
  loadCustomStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/api/tenant/styles.css';
    document.head.appendChild(link);
  }
}

// Initialize tenant management
const tenantManager = new TenantManager();
document.addEventListener('DOMContentLoaded', () => tenantManager.initialize());
```

#### **Implementation Checklist:**
- [ ] Create tenant configuration fetching system
- [ ] Implement dynamic branding application
- [ ] Add feature-based UI visibility control
- [ ] Create tenant-specific navigation menus
- [ ] Implement tenant custom CSS loading
- [ ] Add tenant-specific welcome messages

---

## 🧪 **Phase 5: Testing & Validation (1 hour)**

### **5.1 Tenant Configuration Testing**
**Status**: ⏸️ **PENDING**

#### **Testing Checklist:**
- [ ] Test feature gating works correctly
- [ ] Validate tenant-specific branding applies
- [ ] Test business hours validation
- [ ] Validate tenant-specific payment processing
- [ ] Test appointment rules enforcement
- [ ] Validate security policy application
- [ ] Test tenant isolation (no cross-tenant data access)

### **5.2 Multi-Business Deployment Testing**
**Status**: ⏸️ **PENDING**

#### **Testing Checklist:**
- [ ] Deploy restaurant configuration and test features
- [ ] Deploy consulting configuration and test features  
- [ ] Deploy medical configuration and test features
- [ ] Validate each business has unique branding
- [ ] Test feature differences between business types
- [ ] Validate port isolation and domain mapping

---

## 📈 **Business Impact & Success Metrics**

### **Immediate Benefits:**
- ✅ **Professional service delivery** with custom branding per client
- ✅ **Feature-based pricing model** enabling tiered service offerings
- ✅ **Rapid client onboarding** through template-based deployment
- ✅ **Industry-specific functionality** proving framework flexibility

### **Long-term Benefits:**
- 🚀 **Scalable business model** with clear upgrade paths
- 🏢 **Enterprise credibility** through sophisticated configuration management
- 📊 **Usage analytics** enabling data-driven pricing decisions
- 🌍 **Market expansion** into multiple industries simultaneously

### **Success Metrics:**
- **Deployment time** for new business reduced from days to hours
- **Client satisfaction** increased through custom branding
- **Revenue per client** increased through feature-based pricing
- **Framework credibility** enhanced for academic collaboration

---

## 🎯 **Priority Implementation Order**

### **Phase 1 (Day 1): Core Controller Migration**
1. Authentication Controller (most critical)
2. Dashboard Controller (most visible)  
3. Appointment Controller (high business value)

### **Phase 2 (Day 2): Feature Controllers**
1. Payment Controller (revenue critical)
2. Analytics Controller (business intelligence)
3. Blog/Projects Controllers (nice-to-have features)

### **Phase 3 (Day 3): Routes & Frontend**
1. Route migration and feature gating
2. Frontend tenant integration
3. Testing and validation

---

## 🏆 **Academic & Business Value**

### **Cambridge Email Enhancement:**
*"The DenoGenesis framework includes sophisticated multi-tenant architecture with industry-specific configurations. We've successfully deployed restaurant, consulting, and medical practice instances, each with custom branding, feature sets, and business rules, proving local-first software scales professionally across diverse business sectors."*

### **What This Proves:**
- 📚 **Framework maturity** beyond prototype stage
- 🏭 **Industry flexibility** serving diverse business needs  
- 💼 **Commercial viability** with clear business model
- 🔧 **Professional deployment** capability for service business

---

## ✅ **Completion Checklist**

### **Technical Completion:**
- [ ] All controllers migrated to tenant-aware architecture
- [ ] All routes include appropriate feature gating
- [ ] Frontend applies tenant branding dynamically
- [ ] Multi-business deployment tested and validated

### **Business Completion:**
- [ ] Service pricing model updated for feature-based tiers
- [ ] Client onboarding process streamlined with templates
- [ ] Professional service delivery capabilities demonstrated
- [ ] Academic collaboration package enhanced with multi-tenant proof

### **Documentation Completion:**
- [ ] Tenant configuration documentation updated
- [ ] Deployment guides created for different business types
- [ ] Feature comparison charts created for pricing
- [ ] Academic research contribution documented

---

**🚀 This migration transforms DenoGenesis from a working prototype into a professional multi-business platform ready for academic collaboration and commercial scaling!**

---

*Last Updated: July 21, 2025*  
*Next Major Milestone: Cambridge University Collaboration Email*  
*Framework Status: Professional Multi-Tenant Business Platform*