import { promises as fs } from 'fs';
import { glob } from "glob";
import path from 'path';
import { logger } from './logger.js';

export interface FileInfo {
  path: string;
  content: string;
  size: number;
  modified: Date;
}

export class FileHelpers {
  /**
   * Read a file and return its content
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      logger.debug(`Reading file: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      logger.error(`Failed to read file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Write content to a file
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      logger.debug(`Writing file: ${filePath}`);
      await fs.writeFile(filePath, content, 'utf-8');
      logger.success(`File written: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to write file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Ensure a directory exists, creating it if necessary
   */
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      logger.debug(`Ensuring directory exists: ${dirPath}`);
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create directory ${dirPath}:`, error);
      throw error;
    }
  }

  /**
   * Get file information
   */
  static async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const stats = await fs.stat(filePath);
      const content = await this.readFile(filePath);
      
      return {
        path: filePath,
        content,
        size: stats.size,
        modified: stats.mtime
      };
    } catch (error) {
      logger.error(`Failed to get file info for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Find files matching a pattern
   */
  static async findFiles(pattern: string, options: Record<string, any> = {}): Promise<string[]> {
    try {
      logger.debug(`Finding files matching pattern: ${pattern}`);
      const files = await glob(pattern, options);
      logger.debug(`Found ${files.length} files`);
      return files;
    } catch (error) {
      logger.error(`Failed to find files with pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the directory name of a file path
   */
  static getDirName(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Get the file name (without extension) of a file path
   */
  static getFileName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Get the file extension of a file path
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Resolve a path relative to another path
   */
  static resolvePath(basePath: string, relativePath: string): string {
    return path.resolve(basePath, relativePath);
  }

  /**
   * Join path segments
   */
  static joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Copy a file from source to destination
   */
  static async copyFile(source: string, destination: string): Promise<void> {
    try {
      logger.debug(`Copying file from ${source} to ${destination}`);
      await fs.copyFile(source, destination);
      logger.success(`File copied: ${destination}`);
    } catch (error) {
      logger.error(`Failed to copy file from ${source} to ${destination}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      logger.debug(`Deleting file: ${filePath}`);
      await fs.unlink(filePath);
      logger.success(`File deleted: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  static async listFiles(dirPath: string, recursive = false): Promise<string[]> {
    try {
      logger.debug(`Listing files in directory: ${dirPath}`);
      const pattern = recursive ? `${dirPath}/**/*` : `${dirPath}/*`;
      const files = await this.findFiles(pattern, { nodir: true });
      return files;
    } catch (error) {
      logger.error(`Failed to list files in directory ${dirPath}:`, error);
      throw error;
    }
  }
} 