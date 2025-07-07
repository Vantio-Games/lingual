import { Command } from 'commander';
import { logger, LogLevel } from '../../utils/logger.js';
import { CompilerOptions, CompilerContext } from '../../types/index.js';
import { FileHelpers } from '../../utils/file-helpers.js';
import { LanguageManager } from '../../languages/language-manager.js';
import path from 'path';

export interface BuildCommandOptions {
  input: string;
  output?: string;
  targets?: string[];
  verbose?: boolean;
  debug?: boolean;
  watch?: boolean;
  json?: boolean;
}

export class BuildCommand {
  private languageManager: LanguageManager;

  constructor() {
    this.languageManager = new LanguageManager();
  }

  /**
   * Execute the build command
   */
  async execute(options: BuildCommandOptions): Promise<void> {
    try {
      // Validate input file
      if (!await FileHelpers.exists(options.input)) {
        logger.error(`Input file not found: ${options.input}`);
        process.exit(1);
      }

      // Set up logging
      if (options.verbose || options.debug) {
        logger.setLevel(LogLevel.DEBUG);
      }

      // Determine targets to build
      const targets = options.targets || ['csharp', 'javascript', 'typescript', 'gdscript', 'python'];
      const outputDir = options.output ? path.resolve(options.output) : './out';
      
      logger.info(`Building ${options.input} → ${outputDir}`);
      logger.info(`Targets: ${targets.join(', ')}`);

      // Read source file
      const sourceCode = await FileHelpers.readFile(options.input);
      const baseFileName = path.basename(options.input, path.extname(options.input));

      // Build for each target
      for (const target of targets) {
        await this.buildForTarget(sourceCode, target, outputDir, baseFileName, options);
      }

      logger.success(`Build completed successfully for ${targets.length} target(s)!`);

    } catch (error) {
      logger.error('Build command failed:', error);
      process.exit(1);
    }
  }

  /**
   * Build for a specific target
   */
  private async buildForTarget(
    sourceCode: string, 
    target: string, 
    outputDir: string, 
    baseFileName: string, 
    options: BuildCommandOptions
  ): Promise<void> {
    try {
      logger.info(`Building for ${target}...`);

      // Create compiler context
      const context: CompilerContext = {
        options: {
          target,
          verbose: options.verbose,
          debug: options.debug
        },
        macros: new Map(),
        errors: [],
        warnings: []
      };

      // Transpile the code
      const transpiledCode = await this.languageManager.transpile(
        sourceCode, 
        target, 
        context
      );

      // Handle errors
      if (context.errors.length > 0) {
        logger.error(`Build failed for ${target} with ${context.errors.length} errors:`);
        for (const error of context.errors) {
          logger.error(`  ${error.message}`);
        }
        return;
      }

      // Create target-specific output directory
      const targetOutputDir = path.join(outputDir, target);
      await FileHelpers.ensureDir(targetOutputDir);

      // Write main source file
      const outputFile = path.join(targetOutputDir, `${baseFileName}${this.getFileExtension(target)}`);
      await FileHelpers.writeFile(outputFile, transpiledCode);

      // Generate package files
      const language = this.languageManager.getLanguage(target);
      if (language) {
        await language.generatePackageFiles(targetOutputDir, baseFileName);
      }

      // Handle warnings
      if (context.warnings.length > 0) {
        logger.warn(`Build completed for ${target} with ${context.warnings.length} warnings:`);
        for (const warning of context.warnings) {
          logger.warn(`  ${warning.message}`);
        }
      }

      logger.success(`✓ ${target}: ${outputFile}`);

    } catch (error) {
      logger.error(`Build failed for ${target}:`, error);
    }
  }



  /**
   * Get file extension for target language
   */
  private getFileExtension(target: string): string {
    const extensions: Record<string, string> = {
      csharp: '.cs',
      javascript: '.js',
      typescript: '.ts',
      gdscript: '.gd',
      python: '.py'
    };
    return extensions[target] || '.cs';
  }

  /**
   * Create the build command for Commander.js
   */
  static createCommand(): Command {
    const command = new Command('build')
      .description('Build and transpile source files to multiple languages')
      .argument('<input>', 'Input file to build')
      .option('-o, --output <dir>', 'Output directory', './out')
      .option('-t, --targets <languages>', 'Target languages (comma-separated: csharp,javascript,typescript,gdscript,python)', 'csharp,javascript,typescript,gdscript,python')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('-d, --debug', 'Enable debug mode')
      .option('-w, --watch', 'Watch for file changes')
      .option('--json', 'Output AST as JSON for debugging')
      .action(async (input: string, options: any) => {
        const buildCommand = new BuildCommand();
        await buildCommand.execute({
          input,
          output: options.output,
          targets: options.targets.split(',').map((t: string) => t.trim()),
          verbose: options.verbose,
          debug: options.debug,
          watch: options.watch,
          json: options.json
        });
      });

    return command;
  }
} 