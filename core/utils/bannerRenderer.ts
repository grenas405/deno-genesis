// core/utils/bannerRenderer.ts
// Enhanced Banner System with Modular Design
// ================================================================================

interface BannerConfig {
  readonly version: string;
  readonly buildDate: string;
  readonly author: string;
  readonly repository: string;
  readonly environment: string;
  readonly port: number;
  readonly features?: readonly string[];
  readonly ai?: {
    readonly enabled: boolean;
    readonly models?: readonly string[];
  };
}

interface BannerTheme {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly muted: string;
  readonly reset: string;
}

interface BannerDimensions {
  readonly width: number;
  readonly padding: number;
  readonly maxFeatureLength: number;
}

/**
 * Enhanced Banner Renderer with Responsive Design and Theming
 */
export class BannerRenderer {
  private static readonly THEMES: Record<string, BannerTheme> = {
    default: {
      primary: '\x1b[96m',    // Bright cyan
      secondary: '\x1b[37m',   // White
      accent: '\x1b[35m\x1b[1m', // Bold magenta
      success: '\x1b[32m\x1b[1m', // Bold green
      warning: '\x1b[33m\x1b[1m', // Bold yellow
      error: '\x1b[31m\x1b[1m',   // Bold red
      muted: '\x1b[90m',       // Gray
      reset: '\x1b[0m'
    },
    minimal: {
      primary: '\x1b[37m',     // White
      secondary: '\x1b[37m',   // White
      accent: '\x1b[1m',       // Bold
      success: '\x1b[32m',     // Green
      warning: '\x1b[33m',     // Yellow
      error: '\x1b[31m',       // Red
      muted: '\x1b[2m',        // Dim
      reset: '\x1b[0m'
    }
  };

  private static readonly DIMENSIONS: BannerDimensions = {
    width: 88,
    padding: 2,
    maxFeatureLength: 65
  };

  private readonly theme: BannerTheme;
  private readonly dimensions: BannerDimensions;

  constructor(themeName: string = 'default') {
    this.theme = BannerRenderer.THEMES[themeName] || BannerRenderer.THEMES.default;
    this.dimensions = BannerRenderer.DIMENSIONS;
  }

  /**
   * Renders the complete banner with all sections
   */
  render(config: BannerConfig): string {
    const sections = [
      this.renderHeader(),
      this.renderSystemInfo(config),
      this.renderMission(),
      this.renderFooter(config)
    ];

    return sections.join('\n');
  }

  /**
   * Renders just the header section for quick startup logs
   */
  renderHeader(): string {
    const { width } = this.dimensions;
    const { primary, secondary, accent, reset } = this.theme;

    const topLine = '╔' + '═'.repeat(width - 2) + '╗';
    const bottomLine = '╠' + '═'.repeat(width - 2) + '╣';

    const title = '🚀 DENOGENESIS FRAMEWORK';
    const subtitle = 'Enterprise Digital Sovereignty Platform';
    const tagline = 'Democratizing Local-First Architecture';

    return [
      ${primary}${topLine}${reset},
      ${primary}║${this.centerText(title, accent)}║${reset},
      ${primary}║${this.centerText(subtitle, secondary)}║${reset},
      ${primary}║${this.centerText(tagline, secondary)}║${reset},
      ${primary}${bottomLine}${reset}
    ].join('\n');
  }

  /**
   * Renders system information in a clean grid layout
   */
  renderSystemInfo(config: BannerConfig): string {
    const { primary, secondary, muted, reset } = this.theme;
    const aiStatus = this.getAiStatusDisplay(config.ai);

    const infoGrid = [
      { label: 'Version', value: config.version, label2: 'Environment', value2: config.environment },
      { label: 'Build Date', value: config.buildDate, label2: 'Port', value2: config.port.toString() },
      { label: 'Author', value: config.author, label2: 'Location', value2: 'Oklahoma City, OK' },
      { label: 'Repository', value: this.truncateText(config.repository, 20), label2: 'AI Status', value2: aiStatus.text }
    ];

    const lines = infoGrid.map(row => {
      const left = this.formatInfoPair(row.label, row.value, 38);
      const right = this.formatInfoPair(row.label2, row.value2, 38);
      return ${primary}║${reset} ${left} ${muted}│${reset} ${right} ${primary}║${reset};
    });

    return lines.join('\n');
  }

  /**
   * Renders mission and technical information
   */
  renderMission(): string {
    const { primary, accent, secondary, muted, reset } = this.theme;
    const separator = '╠' + '═'.repeat(this.dimensions.width - 2) + '╣';

    const missionItems = [
      { icon: '🎯', label: 'Mission', text: 'Democratizing Digital Sovereignty Through Local-First Architecture' },
      { icon: '🔧', label: 'Tech Stack', text: 'Deno + Oak + PostgreSQL + WebSocket + AI Integration' },
      { icon: '🌐', label: 'Impact', text: 'Enabling businesses to own their digital infrastructure' }
    ];

    const lines = [
      ${primary}${separator}${reset},
      ...missionItems.map(item =>
        ${primary}║${reset} ${item.icon} ${accent}${item.label}:${reset} ${secondary}${this.wrapText(item.text, 70)}${reset} ${primary}║${reset}
      )
    ];

    return lines.join('\n');
  }

  /**
   * Renders footer with features and closing border
   */
  renderFooter(config: BannerConfig): string {
    const { primary, accent, secondary, reset } = this.theme;
    const features = this.getFeaturesList(config.features);
    const bottomLine = '╚' + '═'.repeat(this.dimensions.width - 2) + '╝';

    const featureLine = ${primary}║${reset} ✨ ${accent}Features:${reset} ${secondary}${features}${reset};
    const padding = this.dimensions.width - this.getDisplayLength(featureLine) + 4; // Adjust for ANSI codes

    return [
      ${featureLine}${' '.repeat(Math.max(0, padding))}${primary}║${reset},
      ${primary}${bottomLine}${reset}
    ].join('\n');
  }

  /**
   * Renders AI model information as a separate section
   */
  renderAiModels(models: readonly string[]): string {
    const { accent, secondary, reset } = this.theme;
    return 🧠 ${accent}AI Models:${reset} ${secondary}${models.join(', ')}${reset};
  }

  // ================================================================================
  // Private Helper Methods
  // ================================================================================

  private centerText(text: string, color: string): string {
    const { width } = this.dimensions;
    const padding = Math.max(0, Math.floor((width - 2 - text.length) / 2));
    const rightPadding = width - 2 - text.length - padding;
    return ${' '.repeat(padding)}${color}${text}${this.theme.reset}${' '.repeat(rightPadding)};
  }

  private formatInfoPair(label: string, value: string, maxWidth: number): string {
    const { accent, secondary, reset } = this.theme;
    const formatted = ${accent}${label}:${reset} ${secondary}${value}${reset};
    const padding = maxWidth - this.getDisplayLength(formatted);
    return formatted + ' '.repeat(Math.max(0, padding));
  }

  private getAiStatusDisplay(ai?: BannerConfig['ai']): { text: string; color: string } {
    if (ai?.enabled) {
      return { text: '🤖 AI-Enabled', color: this.theme.success };
    }
    return { text: '⚙️  Standard Mode', color: this.theme.muted };
  }

  private getFeaturesList(features?: readonly string[]): string {
    if (!features || features.length === 0) {
      return 'Core Features';
    }

    const joined = features.join(', ');
    return joined.length > this.dimensions.maxFeatureLength
      ? joined.substring(0, this.dimensions.maxFeatureLength - 3) + '...'
      : joined;
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private wrapText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private getDisplayLength(text: string): number {
    // Remove ANSI escape codes to get actual display length
    return text.replace(/\x1b\[[0-9;]*m/g, '').length;
  }
}

/**
 * Static utility methods for backward compatibility and convenience
 */
export class EnhancedBannerRenderer {
  private static defaultRenderer = new BannerRenderer();

  /**
   * Enhanced banner printing with improved design and modularity
   */
  static printBanner(config: BannerConfig, theme: string = 'default'): void {
    const renderer = new BannerRenderer(theme);
    const banner = renderer.render(config);

    console.log(banner);

    // Add AI model information if available
    if (config.ai?.enabled && config.ai.models && config.ai.models.length > 0) {
      console.log(renderer.renderAiModels(config.ai.models));
    }
  }

  /**
   * Quick startup banner for faster initialization
   */
  static printQuickBanner(): void {
    console.log(this.defaultRenderer.renderHeader());
  }

  /**
   * Responsive banner that adapts to terminal width
   */
  static printResponsiveBanner(config: BannerConfig): void {
    try {
      const terminalWidth = Deno.consoleSize?.()?.columns || 88;
      const theme = terminalWidth < 80 ? 'minimal' : 'default';
      this.printBanner(config, theme);
    } catch {
      // Fallback to default banner if console size detection fails
      this.printBanner(config);
    }
  }

  /**
   * Banner with performance metrics integration
   */
  static printBannerWithMetrics(
    config: BannerConfig,
    metrics: {
      startupTime?: number;
      memoryUsage?: number;
      loadedModules?: number;
    }
  ): void {
    this.printBanner(config);

    if (Object.keys(metrics).length > 0) {
      console.log(''); // Add spacing

      if (metrics.startupTime) {
        console.log(⚡ Startup: ${metrics.startupTime.toFixed(2)}ms);
      }
      if (metrics.memoryUsage) {
        console.log(💾 Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB);
      }
      if (metrics.loadedModules) {
        console.log(📦 Modules: ${metrics.loadedModules});
      }
    }
  }
}
