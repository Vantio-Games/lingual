import { BaseNode, Identifier, SourceLocation } from '../../types/index.js';

export interface ApiParameter extends BaseNode {
  type: 'ApiParameter';
  name: Identifier;
  typeAnnotation: string;
  required: boolean;
}

export interface ApiDefinition extends BaseNode {
  type: 'ApiDefinition';
  name: Identifier;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  parameters: ApiParameter[];
  returns: string;
  headers?: Record<string, string>;
  description?: string;
}

export interface ApiResponse extends BaseNode {
  type: 'ApiResponse';
  statusCode: number;
  typeAnnotation: string;
  description?: string;
}

export interface ApiRequest extends BaseNode {
  type: 'ApiRequest';
  typeAnnotation: string;
  description?: string;
}

// Extended API definition with request/response details
export interface DetailedApiDefinition extends ApiDefinition {
  request?: ApiRequest;
  responses: ApiResponse[];
} 