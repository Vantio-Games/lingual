import { Command } from 'commander';
import { logger, LogLevel } from '../../utils/logger.js';
import { FileHelpers } from '../../utils/file-helpers.js';
import { CompilerContext, CompilerOptions } from '../../types/index.js';
import { LanguageManager } from '../../languages/language-manager.js';
import path from 'path';

export class TranspileCommand {
  static createCommand(): Command {
    const command = new Command('transpile')
      .description('Transpile a single source file')
      .argument('<source>', 'Source file to transpile')
      .option('-t, --target <language>', 'Target language', 'csharp')
      .option('-o, --output <file>', 'Output file path')
      .action(async (source: string, options: any) => {
        try {
          const globalOpts = (command.parent as any)?.opts() || {};
          
          if (globalOpts.verbose) {
            logger.setLevel(LogLevel.DEBUG);
          }

          logger.info(`Transpiling ${source} to ${options.target}`);

          const compilerOptions: CompilerOptions = {
            target: options.target,
            verbose: globalOpts.verbose,
            debug: globalOpts.debug
          };

          const context: CompilerContext = {
            options: compilerOptions,
            macros: new Map(),
            errors: [],
            warnings: []
          };

          const outputFile = options.output || getDefaultOutputFile(source, options.target);
          await processFile(source, context, outputFile);

          if (context.errors.length > 0) {
            logger.error(`Transpile failed with ${context.errors.length} errors:`);
            for (const error of context.errors) {
              logger.error(`  ${error.message}`);
            }
            process.exit(1);
          }

          logger.success(`Transpile completed! Output written to ${outputFile}`);

        } catch (error) {
          logger.error('Transpile failed:', error);
          process.exit(1);
        }
      });

    return command;
  }
}

// Process a single file
async function processFile(sourceFile: string, context: CompilerContext, outputFile?: string): Promise<void> {
  logger.debug(`Processing file: ${sourceFile}`);

  // Read source file
  const sourceCode = await FileHelpers.readFile(sourceFile);
  logger.debug(`Read ${sourceCode.length} characters from ${sourceFile}`);

  // Get language manager and transpile
  const languageManager = new LanguageManager();
  const transpiledCode = await languageManager.transpile(sourceCode, context.options.target, context);

  // Write output
  const finalOutputFile = outputFile || getDefaultOutputFile(sourceFile, context.options.target);
  await FileHelpers.writeFile(finalOutputFile, transpiledCode);
  
  logger.info(`Generated ${finalOutputFile}`);
}

// Get default output file path
function getDefaultOutputFile(sourceFile: string, target: string): string {
  const dir = path.dirname(sourceFile);
  const name = path.basename(sourceFile, path.extname(sourceFile));
  
  const extensions: Record<string, string> = {
    csharp: '.cs',
    javascript: '.js',
    typescript: '.ts',
    python: '.py',
    go: '.go'
  };

  const ext = extensions[target] || '.cs';
  return path.join(dir, `${name}${ext}`);
} 