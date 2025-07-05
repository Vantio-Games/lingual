import { FileHelpers } from './utils/file-helpers.js';
import { logger } from './utils/logger.js';
import path from 'path';

export interface LingualConfig {
  target?: 'csharp' | 'javascript' | 'typescript';
  outputDir?: string;
  verbose?: boolean;
  debug?: boolean;
  macros?: {
    [key: string]: string | Function;
  };
  plugins?: string[];
  watch?: boolean;
  json?: boolean;
}

export class ConfigManager {
  private config: LingualConfig = {};
  private configPath?: string;

  constructor() {
    this.loadDefaultConfig();
  }

  /**
   * Load configuration from file
   */
  async loadConfig(configPath?: string): Promise<void> {
    const searchPaths = [
      configPath,
      'lingual.config.ts',
      'lingual.config.js',
      'lingual.config.json'
    ].filter(Boolean);

    for (const searchPath of searchPaths) {
      if (searchPath && await FileHelpers.exists(searchPath)) {
        try {
          await this.loadConfigFile(searchPath);
          this.configPath = searchPath;
          logger.debug(`Loaded config from: ${searchPath}`);
          return;
        } catch (error) {
          logger.warn(`Failed to load config from ${searchPath}:`, error);
        }
      }
    }

    logger.debug('No config file found, using defaults');
  }

  /**
   * Load configuration from a specific file
   */
  private async loadConfigFile(filePath: string): Promise<void> {
    const ext = path.extname(filePath);
    
    if (ext === '.json') {
      const content = await FileHelpers.readFile(filePath);
      this.config = { ...this.config, ...JSON.parse(content) };
    } else if (ext === '.js' || ext === '.ts') {
      // For now, we'll just read as JSON since dynamic imports require additional setup
      const content = await FileHelpers.readFile(filePath);
      // Simple JSON extraction from JS/TS files
      const jsonMatch = content.match(/export\s+default\s*({[\s\S]*})/);
      if (jsonMatch) {
        try {
          const config = eval(`(${jsonMatch[1]})`);
          this.config = { ...this.config, ...config };
        } catch (error) {
          logger.warn('Failed to parse config file:', error);
        }
      }
    }
  }

  /**
   * Load default configuration
   */
  private loadDefaultConfig(): void {
    this.config = {
      target: 'csharp',
      outputDir: './dist',
      verbose: false,
      debug: false,
      macros: {},
      plugins: [],
      watch: false,
      json: false
    };
  }

  /**
   * Get configuration value
   */
  get<K extends keyof LingualConfig>(key: K): LingualConfig[K] {
    return this.config[key];
  }

  /**
   * Set configuration value
   */
  set<K extends keyof LingualConfig>(key: K, value: LingualConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * Merge configuration with command line options
   */
  mergeWithOptions(options: Partial<LingualConfig>): LingualConfig {
    return {
      ...this.config,
      ...options
    };
  }

  /**
   * Get the full configuration
   */
  getConfig(): LingualConfig {
    return { ...this.config };
  }

  /**
   * Validate configuration
   */
  validate(): string[] {
    const errors: string[] = [];

    // Validate target
    if (this.config.target && !['csharp', 'javascript', 'typescript'].includes(this.config.target)) {
      errors.push(`Invalid target: ${this.config.target}`);
    }

    // Validate output directory
    if (this.config.outputDir && typeof this.config.outputDir !== 'string') {
      errors.push('Output directory must be a string');
    }

    // Validate macros
    if (this.config.macros && typeof this.config.macros !== 'object') {
      errors.push('Macros must be an object');
    }

    // Validate plugins
    if (this.config.plugins && !Array.isArray(this.config.plugins)) {
      errors.push('Plugins must be an array');
    }

    return errors;
  }

  /**
   * Save configuration to file
   */
  async saveConfig(filePath?: string): Promise<void> {
    const targetPath = filePath || this.configPath || 'lingual.config.json';
    
    try {
      const content = JSON.stringify(this.config, null, 2);
      await FileHelpers.writeFile(targetPath, content);
      logger.debug(`Saved config to: ${targetPath}`);
    } catch (error) {
      logger.error(`Failed to save config to ${targetPath}:`, error);
    }
  }

  /**
   * Create a sample configuration file
   */
  async createSampleConfig(filePath: string = 'lingual.config.json'): Promise<void> {
    const sampleConfig: LingualConfig = {
      target: 'csharp',
      outputDir: './dist',
      verbose: false,
      debug: false,
      macros: {
        upper: 'text => text.toUpperCase()',
        lower: 'text => text.toLowerCase()'
      },
      plugins: [],
      watch: false,
      json: false
    };

    const content = JSON.stringify(sampleConfig, null, 2);
    await FileHelpers.writeFile(filePath, content);
    logger.info(`Created sample config file: ${filePath}`);
  }
} 