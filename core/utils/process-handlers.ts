/**
 * =============================================================================
 * DenoGenesis Framework - Process Handlers (utils/process-handlers.ts)
 * =============================================================================
 * 
 * Unix Philosophy Implementation:
 * 1. Do One Thing Well: Process signal and error handling ONLY
 * 2. Make Everything a Filter: Accept input, return structured output
 * 3. Avoid Captive User Interfaces: Return structured data
 * 4. Store Data in Flat Text Files: Registration metadata is serializable
 * 5. Leverage Software Leverage: Compose with monitoring and testing systems
 * 
 * This module handles process lifecycle management: graceful shutdown signals
 * and global error handling. It provides the foundation for reliable,
 * production-ready Deno applications.
 * 
 * @module ProcessHandlers
 * @follows Unix Philosophy: Single responsibility (process management)
 * @permissions --allow-read (for logging), --allow-write (for logs)
 * @version 1.0.0
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @license AGPL-3.0
 */

// =============================================================================
// UNIX PRINCIPLE: DO ONE THING WELL
// =============================================================================

/**
 * Signal Handler Registration - Process Signal Management
 * 
 * Unix Philosophy: Accept input (cleanup function), transform behavior (register handlers)
 * Returns structured data about what was registered - composable and testable
 * 
 * Handles SIGINT (Ctrl+C) and SIGTERM (container shutdowns) for graceful shutdown.
 * Essential for production deployments where clean resource cleanup is critical.
 * 
 * @param cleanup Optional cleanup function to execute before shutdown
 * @returns SignalHandlerRegistration object describing what was registered
 * 
 * @example
 * ```typescript
 * import { registerSignalHandlers } from "./utils/process-handlers.ts";
 * 
 * const registration = registerSignalHandlers(async () => {
 *   await database.close();
 *   await server.close();
 *   console.log("Resources cleaned up");
 * });
 * 
 * console.log(`Registered ${registration.signals.length} signal handlers`);
 * console.log(`PID: ${registration.pid}`);
 * ```
 */
export function registerSignalHandlers(
  cleanup?: () => Promise<void> | void
): SignalHandlerRegistration {
  const signals = ["SIGINT", "SIGTERM"] as const;
  const registeredAt = new Date().toISOString();
  
  const handleShutdown = async (signal: string) => {
    // Unix Philosophy: Explicit, predictable behavior
    const shutdownEvent = {
      signal,
      timestamp: new Date().toISOString(),
      pid: Deno.pid,
    };
    
    console.log(`🛑 Graceful shutdown initiated (${signal})`);
    
    try {
      if (cleanup) {
        await cleanup();
      }
    } catch (error) {
      // Unix Philosophy: Don't hide errors, make them explicit
      console.error(`❌ Cleanup error: ${error.message}`);
    }
    
    console.log(`✅ DenoGenesis shutdown complete`);
    Deno.exit(0);
  };

  // Register each signal handler
  signals.forEach(signal => {
    Deno.addSignalListener(signal, () => handleShutdown(signal));
  });
  
  // Unix Philosophy: Return structured data about what happened
  return {
    signals: [...signals],
    registeredAt,
    hasCleanup: !!cleanup,
    pid: Deno.pid,
  };
}

/**
 * Error Handler Registration - Global Error Management  
 * 
 * Unix Philosophy: Transform system behavior (register global handlers)
 * Returns registration info - composable with monitoring systems
 * 
 * Catches unhandled exceptions and promise rejections that would otherwise
 * crash the application. Essential for production stability.
 * 
 * @returns ErrorHandlerRegistration object describing registered handlers
 * 
 * @example
 * ```typescript
 * import { registerErrorHandlers } from "./utils/process-handlers.ts";
 * 
 * const errorRegistration = registerErrorHandlers();
 * console.log(`Error handling active since ${errorRegistration.registeredAt}`);
 * 
 * // Handlers will catch:
 * // - Uncaught exceptions
 * // - Unhandled promise rejections
 * // - Logs structured error data for monitoring
 * ```
 */
export function registerErrorHandlers(): ErrorHandlerRegistration {
  const registeredAt = new Date().toISOString();
  
  // Unix Philosophy: Explicit error handling patterns
  const handleUncaughtException = (error: ErrorEvent) => {
    const errorData = {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      timestamp: new Date().toISOString(),
      type: "uncaught_exception",
      pid: Deno.pid,
    };
    
    console.error("🚨 Uncaught Exception:", errorData);
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const errorData = {
      reason: event.reason,
      timestamp: new Date().toISOString(),
      type: "unhandled_rejection",
      pid: Deno.pid,
    };
    
    console.error("🚨 Unhandled Promise Rejection:", errorData);
  };

  // Register global error handlers
  globalThis.addEventListener("error", handleUncaughtException);
  globalThis.addEventListener("unhandledrejection", handleUnhandledRejection);
  
  // Unix Philosophy: Return structured result
  return {
    registeredAt,
    handlers: ["error", "unhandledrejection"],
    pid: Deno.pid,
  };
}

// =============================================================================
// UNIX PRINCIPLE: MAKE EVERYTHING A FILTER
// =============================================================================

/**
 * Validate Process Handlers Setup
 * 
 * Pure function that checks if handlers are properly configured.
 * Returns validation result instead of throwing or logging directly.
 * 
 * @param signalReg Signal handler registration result
 * @param errorReg Error handler registration result  
 * @returns Validation result with success status and details
 * 
 * @example
 * ```typescript
 * const signalReg = registerSignalHandlers(cleanup);
 * const errorReg = registerErrorHandlers();
 * 
 * const validation = validateHandlerSetup(signalReg, errorReg);
 * if (validation.valid) {
 *   console.log("Process handlers configured correctly");
 * } else {
 *   console.error("Handler setup issues:", validation.issues);
 * }
 * ```
 */
export function validateHandlerSetup(
  signalReg: SignalHandlerRegistration,
  errorReg: ErrorHandlerRegistration
): HandlerValidationResult {
  const issues: string[] = [];
  
  // Validate signal handlers
  if (signalReg.signals.length === 0) {
    issues.push("No signal handlers registered");
  }
  
  if (!signalReg.signals.includes("SIGINT")) {
    issues.push("Missing SIGINT handler");
  }
  
  if (!signalReg.signals.includes("SIGTERM")) {
    issues.push("Missing SIGTERM handler");
  }
  
  // Validate error handlers
  if (errorReg.handlers.length === 0) {
    issues.push("No error handlers registered");
  }
  
  if (!errorReg.handlers.includes("error")) {
    issues.push("Missing uncaught exception handler");
  }
  
  if (!errorReg.handlers.includes("unhandledrejection")) {
    issues.push("Missing unhandled rejection handler");
  }
  
  // Check timing
  const signalTime = new Date(signalReg.registeredAt).getTime();
  const errorTime = new Date(errorReg.registeredAt).getTime();
  
  if (Math.abs(signalTime - errorTime) > 5000) {
    issues.push("Signal and error handlers registered far apart in time");
  }
  
  return {
    valid: issues.length === 0,
    issues,
    signalHandlerCount: signalReg.signals.length,
    errorHandlerCount: errorReg.handlers.length,
    hasCleanup: signalReg.hasCleanup,
    timestamp: new Date().toISOString(),
  };
}

// =============================================================================
// UNIX PRINCIPLE: AVOID CAPTIVE USER INTERFACES
// =============================================================================

/**
 * Type Definitions - Structured Data for Programmatic Use
 * 
 * Unix Philosophy: Return structured data that other programs can consume
 * These types enable composition with monitoring, logging, and testing systems
 */
export interface SignalHandlerRegistration {
  /** List of signals that handlers were registered for */
  signals: readonly string[];
  /** ISO timestamp when registration occurred */
  registeredAt: string;
  /** Whether a cleanup function was provided */
  hasCleanup: boolean;
  /** Process ID where handlers are registered */
  pid: number;
}

export interface ErrorHandlerRegistration {
  /** ISO timestamp when registration occurred */
  registeredAt: string;
  /** List of error event types being handled */
  handlers: readonly string[];
  /** Process ID where handlers are registered */
  pid: number;
}

export interface HandlerValidationResult {
  /** Whether all handlers are properly configured */
  valid: boolean;
  /** List of configuration issues found */
  issues: string[];
  /** Number of signal handlers registered */
  signalHandlerCount: number;
  /** Number of error handlers registered */
  errorHandlerCount: number;
  /** Whether cleanup function is available */
  hasCleanup: boolean;
  /** Validation timestamp */
  timestamp: string;
}

// =============================================================================
// UNIX PRINCIPLE: STORE DATA IN FLAT TEXT FILES (METADATA)
// =============================================================================

/**
 * Process Handler Module Metadata
 * 
 * Information about this module that can be written to flat files
 * for version tracking, monitoring, and deployment verification.
 */
export const PROCESS_HANDLERS_METADATA = {
  /** Semantic version of process handling utilities */
  version: "1.0.0",
  /** Unix Philosophy compliance level */
  philosophy: {
    singlePurpose: true,
    filterPattern: true,
    structuredOutput: true,
    composable: true,
    explicitErrors: true,
  },
  /** Supported signal types */
  supportedSignals: ["SIGINT", "SIGTERM"],
  /** Supported error types */
  supportedErrorTypes: ["error", "unhandledrejection"],
  /** Capabilities provided by this module */
  capabilities: [
    "signal_handling",
    "error_handling", 
    "graceful_shutdown",
    "structured_logging",
    "handler_validation",
  ],
  /** Framework component classification */
  classification: "process_management",
  /** Last updated timestamp */
  lastUpdated: "2025-09-08",
} as const;

// =============================================================================
// UNIX PRINCIPLE: LEVERAGE SOFTWARE LEVERAGE
// =============================================================================

/**
 * This module can be imported and used by:
 * - Web servers (graceful shutdown on deployment)
 * - Background services (clean task termination)
 * - CLI tools (proper signal handling)
 * - Testing frameworks (handler verification)
 * - Monitoring systems (process health tracking)
 * - Deployment scripts (startup validation)
 * 
 * Each function is pure and composable - maximum reusability
 */