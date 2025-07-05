import { Command } from 'commander';
import { BuildPipeline, BuildOptions } from '../../compiler/build.js';
import { logger, LogLevel } from '../../utils/logger.js';
import { CompilerOptions } from '../../types/index.js';
import { FileHelpers } from '../../utils/file-helpers.js';
import path from 'path';

export interface BuildCommandOptions {
  input: string;
  output?: string;
  target?: 'csharp' | 'javascript' | 'typescript';
  verbose?: boolean;
  debug?: boolean;
  watch?: boolean;
  json?: boolean;
}

export class BuildCommand {
  private pipeline: BuildPipeline;

  constructor() {
    const compilerOptions: CompilerOptions = {
      target: 'csharp',
      outputDir: './dist',
      verbose: false,
      debug: false
    };
    this.pipeline = new BuildPipeline(compilerOptions);
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

      // Prepare build options
      const buildOptions: BuildOptions = {
        inputFile: path.resolve(options.input),
        outputDir: options.output ? path.resolve(options.output) : './dist',
        target: options.target || 'csharp',
        verbose: options.verbose,
        debug: options.debug,
        watch: options.watch,
        json: options.json
      };

      logger.info(`Building ${options.input} → ${buildOptions.outputDir}`);

      // Execute build
      if (options.watch) {
        await this.pipeline.watch(buildOptions);
      } else {
        const result = await this.pipeline.build(buildOptions);
        this.handleBuildResult(result);
      }

    } catch (error) {
      logger.error('Build command failed:', error);
      process.exit(1);
    }
  }

  /**
   * Handle build results and display appropriate messages
   */
  private handleBuildResult(result: any): void {
    if (result.success) {
      logger.success(`Build completed successfully!`);
      logger.info(`Generated files:`);
      for (const file of result.outputFiles) {
        logger.info(`  ${file}`);
      }

      if (result.warnings.length > 0) {
        logger.warn(`Build completed with ${result.warnings.length} warnings:`);
        for (const warning of result.warnings) {
          logger.warn(`  ${warning}`);
        }
      }

      if (result.ast && process.env.LINGUAL_DEBUG) {
        logger.debug('AST:', JSON.stringify(result.ast, null, 2));
      }
    } else {
      logger.error(`Build failed with ${result.errors.length} errors:`);
      for (const error of result.errors) {
        logger.error(`  ${error}`);
      }
      process.exit(1);
    }
  }

  /**
   * Create the build command for Commander.js
   */
  static createCommand(): Command {
    const command = new Command('build')
      .description('Build and transpile source files')
      .argument('<input>', 'Input file to build')
      .option('-o, --output <dir>', 'Output directory', './dist')
      .option('-t, --target <language>', 'Target language (csharp, javascript, typescript)', 'csharp')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('-d, --debug', 'Enable debug mode')
      .option('-w, --watch', 'Watch for file changes')
      .option('--json', 'Output AST as JSON for debugging')
      .action(async (input: string, options: any) => {
        const buildCommand = new BuildCommand();
        await buildCommand.execute({
          input,
          output: options.output,
          target: options.target,
          verbose: options.verbose,
          debug: options.debug,
          watch: options.watch,
          json: options.json
        });
      });

    return command;
  }
} 