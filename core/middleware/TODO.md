# CORS Middleware Implementation Guide
## Replacing Simple CORS with Advanced CORS Middleware in DenoGenesis Framework

### **Introduction**

Cross-Origin Resource Sharing (CORS) is a critical security mechanism that controls how web applications running at one origin (domain) can access resources from another origin. Your DenoGenesis framework currently uses a simple CORS implementation directly from the `oakCors` library, but you have a more sophisticated, security-focused CORS middleware in `core/middleware/cors.ts` that follows Unix Philosophy principles.

### **Current State Analysis**

#### **What's Currently Happening in `core/middleware/index.ts`:**

```typescript
// CURRENT: Simple CORS implementation
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// The advanced CORS middleware is commented out:
// import { createCorsMiddleware, type CorsConfig } from "./cors.ts"; // COMMENTED OUT
```

The current implementation uses a basic CORS setup that lacks:
- Environment-aware origin validation
- Security analytics and monitoring
- Suspicious origin detection
- Advanced configuration options
- Detailed logging for blocked requests

#### **What's Available in `core/middleware/cors.ts`:**

Your existing CORS middleware provides enterprise-grade features:

1. **Environment-Aware Configuration**: Different origin rules for development vs production
2. **Security Analytics**: Tracks CORS requests, blocked origins, and suspicious patterns
3. **Advanced Validation**: Wildcard patterns, subdomain matching, and comprehensive validation
4. **Enhanced Logging**: Detailed security logging for debugging and monitoring
5. **Performance Optimization**: Efficient origin checking and caching

### **Technical Implementation**

#### **Step 1: Understanding the Middleware Architecture**

Your framework follows Unix Philosophy principles:

- **Do One Thing Well**: The CORS middleware focuses solely on CORS handling
- **Composable**: It integrates seamlessly with your middleware stack
- **Text-Based Configuration**: Human-readable configuration objects
- **Explicit Dependencies**: Clear interfaces and type definitions

#### **Step 2: Modifying `core/middleware/index.ts`**

**Current Import Section:**
```typescript
// CURRENT STATE
import { createSecurityMiddleware, type SecurityConfig } from "./security.ts";
// import { createCorsMiddleware, type CorsConfig } from "./cors.ts"; // COMMENTED OUT
import { Logger, createLoggingMiddleware, type LoggingConfig } from "./logging.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
```

**Required Changes:**
```typescript
// UPDATED STATE
import { createSecurityMiddleware, type SecurityConfig } from "./security.ts";
import { createCorsMiddleware, type CorsConfig } from "./cors.ts"; // ✅ UNCOMMENTED
import { Logger, createLoggingMiddleware, type LoggingConfig } from "./logging.ts";
// Remove the simple oakCors import - we'll use our advanced middleware
```

**Export Section Updates:**
```typescript
// CURRENT EXPORTS
export { createSecurityMiddleware, type SecurityConfig };
// export { createCorsMiddleware, type CorsConfig }; // COMMENTED OUT

// UPDATED EXPORTS
export { createSecurityMiddleware, type SecurityConfig };
export { createCorsMiddleware, type CorsConfig }; // ✅ UNCOMMENTED
```

#### **Step 3: Updating the Middleware Stack Creation**

**Locate the `createMiddlewareStack` function:**

In your current implementation, you'll find something like:

```typescript
// CURRENT: Simple CORS in middleware stack
.use(oakCors({
  origin: allowedOrigins,
  credentials: true
}))
```

**Replace with Advanced CORS Middleware:**

```typescript
// UPDATED: Advanced CORS middleware
.use(createCorsMiddleware({
  environment: config.environment,
  allowedOrigins: config.cors.allowedOrigins,
  developmentOrigins: config.cors.developmentOrigins,
  credentials: config.cors.credentials ?? true,
  maxAge: config.cors.maxAge ?? 86400,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-API-Key'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Request-ID', 
    'X-Response-Time'
  ]
}))
```

#### **Step 4: Configuration Interface Updates**

Your `MiddlewareConfig` interface already includes CORS configuration:

```typescript
export interface MiddlewareConfig {
  environment: string;
  port: number;
  cors: {
    allowedOrigins: string[];
    developmentOrigins: string[];
    credentials?: boolean;
    maxAge?: number;
  };
  // ... other config
}
```

**Enhanced Configuration Options:**

```typescript
export interface MiddlewareConfig {
  environment: string;
  port: number;
  cors: {
    allowedOrigins: string[];
    developmentOrigins?: string[];
    credentials?: boolean;
    maxAge?: number;
    allowedMethods?: string[];        // ✅ NEW
    allowedHeaders?: string[];        // ✅ NEW
    exposedHeaders?: string[];        // ✅ NEW
    preflightContinue?: boolean;      // ✅ NEW
    optionsSuccessStatus?: number;    // ✅ NEW
  };
  // ... other config
}
```

### **Advanced Features Explanation**

#### **1. Environment-Aware Origin Handling**

```typescript
// The middleware automatically handles different environments
const corsMiddleware = createCorsMiddleware({
  environment: 'development', // or 'production'
  allowedOrigins: ['https://yourdomain.com'],
  developmentOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000']
});

// In development: allows both production AND development origins
// In production: only allows production origins
```

#### **2. Security Analytics and Monitoring**

```typescript
// The middleware includes built-in analytics
class CorsAnalytics {
  trackRequest(origin: string, method: string, userAgent: string): void
  trackAllowedOrigin(origin: string): void
  trackBlockedOrigin(origin: string): void
  getStats(): CorsStats
  getDetailedReport(): CorsReport
}
```

**Benefits:**
- Track which origins are making requests
- Identify potential security threats
- Monitor CORS usage patterns
- Generate security reports

#### **3. Advanced Origin Validation**

```typescript
// Supports multiple validation patterns:

// Exact match
allowedOrigins: ['https://app.yourdomain.com']

// Wildcard patterns
allowedOrigins: ['https://*.yourdomain.com']

// Subdomain matching
allowedOrigins: ['*.example.com'] // matches any.example.com

// Mixed configurations
allowedOrigins: [
  'https://app.yourdomain.com',    // exact
  'https://*.staging.yourdomain.com', // wildcard
  'https://partner.external.com'    // third-party
]
```

#### **4. Enhanced Security Logging**

```typescript
// Development Mode Logging:
console.warn(`⚠️ CORS: Origin not in allowlist: ${origin}`);
console.warn(`   User-Agent: ${userAgent}`);
console.warn(`   Method: ${method}`);
console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);

// Production Mode Logging (secure):
console.warn(`🚨 CORS: Blocked origin: ${origin.substring(0, 50)}...`);
```

### **Security Considerations**

#### **1. Origin Validation Security**

```typescript
// The middleware includes sophisticated validation:
static isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  // 1. Exact match check
  if (allowedOrigins.includes(origin)) return true;
  
  // 2. Wildcard pattern matching
  for (const allowedOrigin of allowedOrigins) {
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) return true;
    }
  }
  
  // 3. Subdomain pattern matching
  // Implementation details...
  
  return false;
}
```

#### **2. Suspicious Origin Detection**

```typescript
// Built-in security features:
static isOriginSuspicious(origin: string): boolean {
  const suspiciousPatterns = [
    /localhost:\d{4,5}$/, // High ports (potential dev bypass)
    /\d+\.\d+\.\d+\.\d+/, // Direct IP addresses
    /[^a-zA-Z0-9.-]/,     // Special characters
    // Add more patterns as needed
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(origin));
}
```

#### **3. Rate Limiting and Protection**

```typescript
// The analytics system can be extended for rate limiting:
class CorsAnalytics {
  private requestCounts = new Map<string, number>();
  
  trackRequest(origin: string, method: string, userAgent: string): void {
    const key = `${origin}:${method}`;
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    
    // Potential rate limiting logic
    if (this.requestCounts.get(key)! > RATE_LIMIT) {
      console.warn(`🚨 CORS: Rate limit exceeded for ${origin}`);
    }
  }
}
```

### **Implementation Steps**

#### **Complete Implementation Checklist:**

1. **✅ Uncomment CORS imports in `core/middleware/index.ts`:**
   ```typescript
   import { createCorsMiddleware, type CorsConfig } from "./cors.ts";
   ```

2. **✅ Export CORS components:**
   ```typescript
   export { createCorsMiddleware, type CorsConfig };
   ```

3. **✅ Replace simple CORS in middleware stack:**
   ```typescript
   // Replace oakCors() with createCorsMiddleware(config.cors)
   .use(createCorsMiddleware({
     environment: config.environment,
     allowedOrigins: config.cors.allowedOrigins,
     developmentOrigins: config.cors.developmentOrigins,
     credentials: config.cors.credentials ?? true,
     maxAge: config.cors.maxAge ?? 86400
   }))
   ```

4. **✅ Update middleware logging:**
   ```typescript
   const middlewareNames = [
     '1. Performance Monitoring',
     '2. Error Handling',
     '3. Request Logging', 
     '4. Security Headers',
     '5. Advanced CORS Protection', // ✅ UPDATED NAME
     '6. Health Check',
     '7. Static File Serving'
   ];
   ```

5. **✅ Remove simple oakCors import:**
   ```typescript
   // Remove this line:
   // import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
   ```

### **Configuration Examples**

#### **Development Environment:**
```typescript
const developmentConfig: MiddlewareConfig = {
  environment: 'development',
  cors: {
    allowedOrigins: ['https://yourdomain.com'],
    developmentOrigins: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8000'
    ],
    credentials: true,
    maxAge: 300 // Short cache in development
  }
};
```

#### **Production Environment:**
```typescript
const productionConfig: MiddlewareConfig = {
  environment: 'production',
  cors: {
    allowedOrigins: [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'https://app.yourdomain.com'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours in production
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Request-ID']
  }
};
```

### **Testing the Implementation**

#### **1. Verify CORS Functionality:**

```typescript
// Test script to verify CORS is working
async function testCors() {
  const testOrigins = [
    'https://yourdomain.com',      // Should be allowed
    'https://malicious.com',       // Should be blocked
    'http://localhost:3000'        // Should be allowed in dev
  ];
  
  for (const origin of testOrigins) {
    const response = await fetch('http://localhost:8000/api/test', {
      method: 'GET',
      headers: { 'Origin': origin }
    });
    
    console.log(`Origin: ${origin}`);
    console.log(`Status: ${response.status}`);
    console.log(`CORS Headers:`, response.headers.get('Access-Control-Allow-Origin'));
  }
}
```

#### **2. Monitor CORS Analytics:**

```typescript
// Add to your monitoring/debugging code
const corsStats = corsMiddleware.analytics.getStats();
console.log('CORS Statistics:', corsStats);

const corsReport = corsMiddleware.analytics.getDetailedReport();
console.log('Detailed CORS Report:', corsReport);
```

### **Benefits of the Advanced Implementation**

#### **1. Enhanced Security:**
- Sophisticated origin validation
- Suspicious pattern detection
- Detailed security logging
- Environment-aware configurations

#### **2. Better Debugging:**
- Comprehensive request tracking
- Detailed error messages in development
- Security-focused logging in production
- Analytics for optimization

#### **3. Production Readiness:**
- Performance optimizations
- Caching support
- Rate limiting capabilities
- Enterprise-grade monitoring

#### **4. Unix Philosophy Alignment:**
- Single responsibility (CORS only)
- Composable with other middleware
- Text-based configuration
- Clear, explicit interfaces

### **Troubleshooting Common Issues**

#### **Issue 1: "Module not found" errors**
```bash
# Ensure all imports are correct and files exist
deno check core/middleware/index.ts
```

#### **Issue 2: CORS still blocking legitimate requests**
```typescript
// Check your configuration:
console.log('CORS Config:', config.cors);
console.log('Environment:', config.environment);
```

#### **Issue 3: Too many allowed origins in development**
```typescript
// The middleware automatically combines origins:
// Final origins = allowedOrigins + developmentOrigins (in dev mode)
```

### **Conclusion**

By implementing the advanced CORS middleware, you're replacing a simple, basic CORS solution with an enterprise-grade, security-focused system that:

- **Follows Unix Philosophy principles** of doing one thing exceptionally well
- **Provides comprehensive security** through advanced validation and monitoring
- **Enables better debugging** with detailed logging and analytics
- **Supports production deployments** with performance optimizations
- **Maintains framework consistency** with your existing middleware architecture

This change transforms your CORS handling from a basic necessity into a powerful security and monitoring tool that grows with your application's needs while maintaining the elegant simplicity that defines the DenoGenesis framework.
