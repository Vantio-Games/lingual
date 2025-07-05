import { BaseNode, Identifier, SourceLocation } from '../../types/index.js';
import { ApiDefinition } from './api.js';
import { TypeDefinition } from './type.js';

export interface ModuleDefinition extends BaseNode {
  type: 'ModuleDefinition';
  name: Identifier;
  apis: ApiDefinition[];
  types: TypeDefinition[];
  functions: any[]; // Will be imported from existing function types
  description?: string;
  exports?: string[];
}

export interface ImportStatement extends BaseNode {
  type: 'ImportStatement';
  module: string;
  items: string[];
  alias?: string;
}

export interface ExportStatement extends BaseNode {
  type: 'ExportStatement';
  items: string[];
  default?: string;
} 