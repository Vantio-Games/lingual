import { Command } from 'commander';
import { logger } from '../../utils/logger.js';
import { LanguageManager } from '../../languages/language-manager.js';

export class ListLanguagesCommand {
  static createCommand(): Command {
    const command = new Command('list-languages')
      .description('List all available target languages')
      .action(async () => {
        try {
          const languageManager = new LanguageManager();
          const languages = languageManager.getAvailableLanguages();
          
          logger.info('Available target languages:');
          logger.info('');
          
          for (const [name, language] of Object.entries(languages)) {
            logger.info(`${language.emoji} ${language.name} (${name})`);
            logger.info(`  ${language.description}`);
            logger.info(`  Version: ${language.version}`);
            logger.info('');
          }
        } catch (error) {
          logger.error('Failed to list languages:', error);
          process.exit(1);
        }
      });

    return command;
  }
} 