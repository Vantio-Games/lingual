import { Command } from 'commander';
import { logger, LogLevel } from '../../utils/logger.js';
import { FileHelpers } from '../../utils/file-helpers.js';
import path from 'path';

export interface PrettifyCommandOptions {
  input?: string;
  verbose?: boolean;
  debug?: boolean;
  check?: boolean;
  write?: boolean;
}

export class PrettifyCommand {
  /**
   * Execute the prettify command
   */
  async execute(options: PrettifyCommandOptions): Promise<void> {
    try {
      // Set up logging
      if (options.verbose || options.debug) {
        logger.setLevel(LogLevel.DEBUG);
      }

      // Determine input files
      const inputFiles = await this.getInputFiles(options.input);

      if (inputFiles.length === 0) {
        logger.warn('No .lingual files found to prettify');
        return;
      }

      logger.info(`Found ${inputFiles.length} .lingual file(s) to prettify`);

      let formattedCount = 0;
      let errorCount = 0;

      for (const file of inputFiles) {
        try {
          const result = await this.prettifyFile(file, options);
          if (result.formatted) {
            formattedCount++;
          }
        } catch (error) {
          logger.error(`Failed to prettify ${file}:`, error);
          errorCount++;
        }
      }

      if (options.check) {
        if (formattedCount === 0) {
          logger.success('All files are properly formatted!');
        } else {
          logger.warn(`${formattedCount} file(s) need formatting`);
          process.exit(1);
        }
      } else {
        if (errorCount === 0) {
          logger.success(`Prettified ${formattedCount} file(s) successfully!`);
        } else {
          logger.error(`Failed to prettify ${errorCount} file(s)`);
          process.exit(1);
        }
      }

    } catch (error) {
      logger.error('Prettify command failed:', error);
      process.exit(1);
    }
  }

  /**
   * Get input files to process
   */
  private async getInputFiles(input?: string): Promise<string[]> {
    if (input) {
      // Single file specified
      if (await FileHelpers.exists(input)) {
        return [path.resolve(input)];
      } else {
        throw new Error(`Input file not found: ${input}`);
      }
    } else {
      // No input specified, find all .lingual files in CWD
      const files = await FileHelpers.findFiles('**/*.lingual');
      return files.map(file => path.resolve(file));
    }
  }

  /**
   * Prettify a single file
   */
  private async prettifyFile(filePath: string, options: PrettifyCommandOptions): Promise<{ formatted: boolean }> {
    logger.debug(`Prettifying file: ${filePath}`);

    // Read the file
    const originalContent = await FileHelpers.readFile(filePath);
    
    // Simple prettification - normalize whitespace and indentation
    const prettifiedContent = this.simplePrettify(originalContent);

    // Check if content changed
    const formatted = prettifiedContent !== originalContent;

    if (formatted) {
      if (options.check) {
        logger.warn(`File needs formatting: ${filePath}`);
      } else if (options.write !== false) {
        // Write the prettified content back to the file
        await FileHelpers.writeFile(filePath, prettifiedContent);
        logger.info(`Prettified: ${filePath}`);
      }
    } else {
      logger.debug(`File already properly formatted: ${filePath}`);
    }

    return { formatted };
  }

  /**
   * Simple prettification function
   */
  private simplePrettify(content: string): string {
    // Normalize line endings
    let result = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remove trailing whitespace
    result = result.replace(/[ \t]+$/gm, '');
    
    // Normalize indentation to 2 spaces
    const lines = result.split('\n');
    const normalizedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed === '') return '';
      
      // Count leading spaces/tabs and convert to 2-space indentation
      const leadingSpaces = line.length - line.trimLeft().length;
      const indentLevel = Math.floor(leadingSpaces / 2);
      return '  '.repeat(indentLevel) + trimmed;
    });
    
    // Remove empty lines at the beginning and end
    while (normalizedLines.length > 0 && normalizedLines[0] === '') {
      normalizedLines.shift();
    }
    while (normalizedLines.length > 0 && normalizedLines[normalizedLines.length - 1] === '') {
      normalizedLines.pop();
    }
    
    return normalizedLines.join('\n') + '\n';
  }

  /**
   * Create the prettify command for Commander.js
   */
  static createCommand(): Command {
    const command = new Command('prettify')
      .description('Prettify lingual source files')
      .argument('[input]', 'Input file or directory (defaults to current directory)')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('-d, --debug', 'Enable debug mode')
      .option('-c, --check', 'Check if files are formatted without modifying them')
      .option('-w, --write', 'Write changes to files (default behavior)')
      .action(async (input: string, options: any) => {
        const prettifyCommand = new PrettifyCommand();
        await prettifyCommand.execute({
          input: input || undefined,
          verbose: options.verbose,
          debug: options.debug,
          check: options.check,
          write: options.write !== false
        });
      });

    return command;
  }
} 