import { BaseNode, Identifier, SourceLocation } from '../../types/index.js';

export interface TypeField extends BaseNode {
  type: 'TypeField';
  name: Identifier;
  typeAnnotation: any; // TypeAnnotation object
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface TypeDefinition extends BaseNode {
  type: 'TypeDefinition';
  name: Identifier;
  fields: TypeField[];
  description?: string;
  extends?: string[];
  implements?: string[];
}

export interface EnumValue extends BaseNode {
  type: 'EnumValue';
  name: Identifier;
  value?: string | number;
  description?: string;
}

export interface EnumDefinition extends BaseNode {
  type: 'EnumDefinition';
  name: Identifier;
  values: EnumValue[];
  description?: string;
}

export interface InterfaceDefinition extends BaseNode {
  type: 'InterfaceDefinition';
  name: Identifier;
  fields: TypeField[];
  description?: string;
  extends?: string[];
} 