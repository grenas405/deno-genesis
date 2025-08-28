// utils/consoleStyler.ts
// ================================================================================
// 🎨 DenoGenesis Console Styler - Professional Terminal Output
// Enterprise-grade logging and visual formatting for development experience
// ================================================================================

export interface DenoGenesisConfig {
  version: string;
  buildDate: string;
  environment: string;
  port: number;
  author: string;
  repository: string;
  description: string;
}

export class ConsoleStyler {
  // ANSI Color codes for professional terminal output
  private static colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    
    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    
    // Background colors
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',
    
    // Custom combinations
    gold: '\x1b[33m\x1b[1m',
    success: '\x1b[32m\x1b[1m',
    error: '\x1b[31m\x1b[1m',
    warning: '\x1b[33m\x1b[1m',
    info: '\x1b[34m\x1b[1m'
  };
  
  /**
   * Print the DenoGenesis framework banner
   */
  static printBanner(config: DenoGenesisConfig): void {
    const banner = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                          🚀 DENOGENESIS FRAMEWORK                              ║
║                     Enterprise Digital Sovereignty Platform                    ║
╠════════════════════════════════════════════════════════════════════════════════╣
║  Version:     ${config.version.padEnd(20)} │  Environment: ${config.environment.padEnd(20)} ║
║  Build Date:  ${config.buildDate.padEnd(20)} │  Port:        ${config.port.toString().padEnd(20)} ║
║  Author:      ${config.author.padEnd(20)} │  Location:    Oklahoma City, OK    ║
╠════════════════════════════════════════════════════════════════════════════════╣
║  🎯 Mission: Democratizing Digital Sovereignty Through Local-First Architecture ║
║  🔧 Tech:    Deno + Oak + PostgreSQL + WebSocket + AI Integration             ║
║  🌐 Impact:  Enabling businesses to own their digital infrastructure          ║
╚════════════════════════════════════════════════════════════════════════════════╝`;
    
    console.log(this.colors.cyan + banner + this.colors.reset);
  }
  
  /**
   * Print a formatted section header
   */
  static logSection(title: string, color: keyof typeof ConsoleStyler.colors = 'blue'): void {
    const line = '═'.repeat(80);
    console.log(`${this.colors[color]}╔${line}╗${this.colors.reset}`);
    console.log(`${this.colors[color]}║ ${this.colors.bright}${title.padEnd(78)}${this.colors.reset}${this.colors[color]} ║${this.colors.reset}`);
    console.log(`${this.colors[color]}╚${line}╝${this.colors.reset}`);
  }
  
  /**
   * Log a route registration with formatting
   */
  static logRoute(path: string, description: string): void {
    const arrow = '➤';
    const maxPathLength = 35;
    const pathPadded = path.length > maxPathLength 
      ? path.substring(0, maxPathLength - 3) + '...'
      : path.padEnd(maxPathLength);
    
    console.log(
      `${this.colors.green}${arrow} ${pathPadded}${this.colors.reset} ` +
      `${this.colors.dim}${description}${this.colors.reset}`
    );
  }
  
  /**
   * Log success message
   */
  static logSuccess(message: string): void {
    console.log(`${this.colors.success}✅ ${message}${this.colors.reset}`);
  }
  
  /**
   * Log warning message
   */
  static logWarning(message: string): void {
    console.log(`${this.colors.warning}⚠️  ${message}${this.colors.reset}`);
  }
  
  /**
   * Log error message
   */
  static logError(message: string): void {
    console.log(`${this.colors.error}❌ ${message}${this.colors.reset}`);
  }
  
  /**
   * Log info message
   */
  static logInfo(message: string): void {
    console.log(`${this.colors.info}ℹ️  ${message}${this.colors.reset}`);
  }
  
  /**
   * Log debug message (dimmed)
   */
  static logDebug(message: string): void {
    console.log(`${this.colors.dim}🔍 ${message}${this.colors.reset}`);
  }
  
  /**
   * Log metrics in a formatted table
   */
  static logMetrics(metrics: any): void {
    console.log(`${this.colors.cyan}📊 Server Metrics:${this.colors.reset}`);
    console.log(`   ${this.colors.bright}Uptime:${this.colors.reset} ${metrics.uptime}`);
    console.log(`   ${this.colors.bright}Requests:${this.colors.reset} ${metrics.requests} | ${this.colors.bright}Errors:${this.colors.reset} ${metrics.errors} | ${this.colors.bright}Success Rate:${this.colors.reset} ${metrics.successRate}`);
    
    if (metrics.memory) {
      console.log(`   ${this.colors.bright}Memory:${this.colors.reset} ${metrics.memory.heapUsed} / ${metrics.memory.heapTotal}`);
    }
  }
  
  /**
   * Log startup information
   */
  static logStartup(config: DenoGenesisConfig): void {
    console.log('\n');
    this.logSection('🚀 DenoGenesis Framework Startup', 'green');
    console.log(`${this.colors.bright}Server URL:${this.colors.reset} http://localhost:${config.port}`);
    console.log(`${this.colors.bright}Environment:${this.colors.reset} ${config.environment}`);
    console.log(`${this.colors.bright}Process ID:${this.colors.reset} ${Deno.pid}`);
    console.log(`${this.colors.bright}Version:${this.colors.reset} ${config.version}`);
    console.log(`${this.colors.bright}Author:${this.colors.reset} ${config.author}`);
    console.log('\n');
  }
  
  /**
   * Log with custom styling
   */
  static logCustom(message: string, icon: string, color: keyof typeof ConsoleStyler.colors): void {
    console.log(`${this.colors[color]}${icon} ${message}${this.colors.reset}`);
  }
  
  /**
   * Create a progress bar (for loading operations)
   */
  static progressBar(current: number, total: number, width: number = 40): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    
    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);
    
    return `${this.colors.green}${filledBar}${this.colors.dim}${emptyBar}${this.colors.reset} ${percentage}%`;
  }
  
  /**
   * Log a table of data
   */
  static logTable(data: Array<Record<string, any>>, headers?: string[]): void {
    if (data.length === 0) return;
    
    const keys = headers || Object.keys(data[0]);
    const maxWidths = keys.map(key => 
      Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
    );
    
    // Header
    const headerRow = keys.map((key, i) => key.padEnd(maxWidths[i])).join(' │ ');
    console.log(`${this.colors.bright}┌─${keys.map((_, i) => '─'.repeat(maxWidths[i])).join('─┼─')}─┐${this.colors.reset}`);
    console.log(`${this.colors.bright}│ ${headerRow} │${this.colors.reset}`);
    console.log(`${this.colors.bright}├─${keys.map((_, i) => '─'.repeat(maxWidths[i])).join('─┼─')}─┤${this.colors.reset}`);
    
    // Data rows
    data.forEach(row => {
      const dataRow = keys.map((key, i) => 
        String(row[key] || '').padEnd(maxWidths[i])
      ).join(' │ ');
      console.log(`│ ${dataRow} │`);
    });
    
    console.log(`${this.colors.bright}└─${keys.map((_, i) => '─'.repeat(maxWidths[i])).join('─┴─')}─┘${this.colors.reset}`);
  }
  
  /**
   * Clear the console (development helper)
   */
  static clear(): void {
    console.clear();
  }
  
  /**
   * Log with timestamp
   */
  static logWithTime(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();
    const timeStr = `${this.colors.dim}[${timestamp}]${this.colors.reset}`;
    
    switch (level) {
      case 'success':
        this.logSuccess(`${timeStr} ${message}`);
        break;
      case 'warning':
        this.logWarning(`${timeStr} ${message}`);
        break;
      case 'error':
        this.logError(`${timeStr} ${message}`);
        break;
      default:
        this.logInfo(`${timeStr} ${message}`);
    }
  }
  
  /**
   * Log environment-specific messages
   */
  static logEnvironment(environment: string): void {
    const envMessages = {
      development: {
        icon: '🔧',
        color: 'yellow' as const,
        message: 'Development mode - Enhanced logging and debugging enabled'
      },
      production: {
        icon: '🚀',
        color: 'green' as const,
        message: 'Production mode - Optimized for performance and security'
      },
      testing: {
        icon: '🧪',
        color: 'blue' as const,
        message: 'Testing mode - Running in test environment'
      }
    };
    
    const config = envMessages[environment as keyof typeof envMessages] || {
      icon: '❓',
      color: 'gray' as const,
      message: `Unknown environment: ${environment}`
    };
    
    this.logCustom(config.message, config.icon, config.color);
  }
  
  /**
   * Create ASCII art text (simple version)
   */
  static asciiArt(text: string): void {
    // Simple ASCII art for "DENOGENESIS"
    if (text.toUpperCase() === 'DENOGENESIS') {
      console.log(`${this.colors.gold}
██████╗ ███████╗███╗   ██╗ ██████╗  ██████╗ ███████╗███╗   ██╗███████╗███████╗██╗███████╗
██╔══██╗██╔════╝████╗  ██║██╔═══██╗██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔════╝██║██╔════╝
██║  ██║█████╗  ██╔██╗ ██║██║   ██║██║  ███╗█████╗  ██╔██╗ ██║█████╗  ███████╗██║███████╗
██║  ██║██╔══╝  ██║╚██╗██║██║   ██║██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚════██║██║╚════██║
██████╔╝███████╗██║ ╚████║╚██████╔╝╚██████╔╝███████╗██║ ╚████║███████╗███████║██║███████║
╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝╚══════╝
${this.colors.reset}`);
    } else {
      console.log(`${this.colors.bright}${text}${this.colors.reset}`);
    }
  }
}
