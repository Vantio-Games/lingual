#!/usr/bin/env node

import { Command } from 'commander';
import { LingualParser } from './parser/grammar.js';
import { tokenize } from './lexer/tokens.js';
import { CSharpTranspiler } from './transpilers/csharp.js';
import { MacroInterpreter } from './macros/interpreter.js';
import { MacroRuntime } from './macros/runtime.js';
import { FileHelpers } from './utils/file-helpers.js';
import { logger, LogLevel } from './utils/logger.js';
import { CompilerContext, CompilerOptions } from './types/index.js';
import { ConfigManager } from './config.js';
import { BuildCommand } from './cli/commands/build.js';
import path from 'path';

const program = new Command();

program
  .name('lingual')
  .description('A CLI tool for transpiling a custom language to other programming languages')
  .version('1.0.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-d, --debug', 'Enable debug mode')
  .option('-o, --output <dir>', 'Output directory for generated files');

// Build command
program.addCommand(BuildCommand.createCommand());

// Transpile command
program
  .command('transpile')
  .description('Transpile a single source file')
  .argument('<source>', 'Source file to transpile')
  .option('-t, --target <language>', 'Target language (csharp, javascript, typescript)', 'csharp')
  .option('-o, --output <file>', 'Output file path')
  .action(async (source, options) => {
    try {
      const globalOpts = program.opts();
      
      if (globalOpts.verbose) {
        logger.setLevel(LogLevel.DEBUG);
      }

      logger.info(`Transpiling ${source} to ${options.target}`);

      const compilerOptions: CompilerOptions = {
        target: options.target as any,
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

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    program.help();
  });

// Process a single file
async function processFile(sourceFile: string, context: CompilerContext, outputFile?: string): Promise<void> {
  logger.debug(`Processing file: ${sourceFile}`);

  // Read source file
  const sourceCode = await FileHelpers.readFile(sourceFile);
  logger.debug(`Read ${sourceCode.length} characters from ${sourceFile}`);

  // Tokenize
  const tokens = tokenize(sourceCode);
  logger.debug(`Tokenized into ${tokens.length} tokens`);

  // Parse
  const parser = new LingualParser();
  const parseResult = parser.program();
  
  if (!parseResult) {
    context.errors.push({
      message: `Failed to parse ${sourceFile}`,
      code: 'PARSE_ERROR'
    });
    return;
  }

  // Process macros
  const macroInterpreter = new MacroInterpreter(context);
  const processedProgram = macroInterpreter.processProgram(parseResult);

  // Transpile
  let transpiledCode: string;
  switch (context.options.target) {
    case 'csharp':
      const csharpTranspiler = new CSharpTranspiler();
      transpiledCode = csharpTranspiler.transpile(processedProgram);
      break;
    default:
      context.errors.push({
        message: `Unsupported target language: ${context.options.target}`,
        code: 'UNSUPPORTED_TARGET'
      });
      return;
  }

  // Write output
  const finalOutputFile = outputFile || getDefaultOutputFile(sourceFile, context.options.target);
  await FileHelpers.writeFile(finalOutputFile, transpiledCode);
  
  logger.info(`Generated ${finalOutputFile}`);
}

// Get source files to process
async function getSourceFiles(source: string): Promise<string[]> {
  if (await FileHelpers.exists(source)) {
    const stats = await FileHelpers.getFileInfo(source);
    if (stats.size > 0) {
      return [source];
    }
  }

  // Try to find files with .lingual extension
  const files = await FileHelpers.findFiles(`${source}/**/*.lingual`);
  if (files.length === 0) {
    throw new Error(`No source files found in ${source}`);
  }

  return files;
}

// Get default output file path
function getDefaultOutputFile(sourceFile: string, target: string): string {
  const dir = path.dirname(sourceFile);
  const name = path.basename(sourceFile, path.extname(sourceFile));
  
  const extensions = {
    csharp: '.cs',
    javascript: '.js',
    typescript: '.ts'
  };

  const ext = extensions[target as keyof typeof extensions] || '.cs';
  return path.join(dir, `${name}${ext}`);
}

// Parse command line arguments
program.parse(); 