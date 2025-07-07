#!/usr/bin/env node

import { Command } from 'commander';
import { logger, LogLevel } from './utils/logger.js';
import { ConfigManager } from './config.js';

// Import all commands
import { BuildCommand } from './cli/commands/build.js';
import { PrettifyCommand } from './cli/commands/prettify.js';
import { TranspileCommand } from './cli/commands/transpile.js';
import { ListLanguagesCommand } from './cli/commands/list-languages.js';

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

// Add all commands
program.addCommand(BuildCommand.createCommand());
program.addCommand(PrettifyCommand.createCommand());
program.addCommand(TranspileCommand.createCommand());
program.addCommand(ListLanguagesCommand.createCommand());

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    program.help();
  });

// Parse command line arguments
program.parse(); 