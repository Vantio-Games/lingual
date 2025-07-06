export interface StandardLibraryFunction {
  name: string;
  signature: string;
  description: string;
  implementations: {
    typescript: string;
    javascript: string;
    csharp: string;
    python?: string;
    java?: string;
  };
}

export interface StandardLibraryModule {
  name: string;
  functions: StandardLibraryFunction[];
}

export const STANDARD_LIBRARY: StandardLibraryModule[] = [
  {
    name: 'http',
    functions: [
      {
        name: 'get',
        signature: 'get(url: string): Response',
        description: 'Make a GET HTTP request',
        implementations: {
          typescript: 'await fetch(url)',
          javascript: 'await fetch(url)',
          csharp: 'await httpClient.GetAsync(url)'
        }
      },
      {
        name: 'post',
        signature: 'post(url: string, data?: any): Response',
        description: 'Make a POST HTTP request',
        implementations: {
          typescript: 'await fetch(url, { method: "POST", body: JSON.stringify(data) })',
          javascript: 'await fetch(url, { method: "POST", body: JSON.stringify(data) })',
          csharp: 'await httpClient.PostAsync(url, new StringContent(JsonConvert.SerializeObject(data)))'
        }
      },
      {
        name: 'put',
        signature: 'put(url: string, data?: any): Response',
        description: 'Make a PUT HTTP request',
        implementations: {
          typescript: 'await fetch(url, { method: "PUT", body: JSON.stringify(data) })',
          javascript: 'await fetch(url, { method: "PUT", body: JSON.stringify(data) })',
          csharp: 'await httpClient.PutAsync(url, new StringContent(JsonConvert.SerializeObject(data)))'
        }
      },
      {
        name: 'delete',
        signature: 'delete(url: string): Response',
        description: 'Make a DELETE HTTP request',
        implementations: {
          typescript: 'await fetch(url, { method: "DELETE" })',
          javascript: 'await fetch(url, { method: "DELETE" })',
          csharp: 'await httpClient.DeleteAsync(url)'
        }
      }
    ]
  },
  {
    name: 'json',
    functions: [
      {
        name: 'parse',
        signature: 'parse(text: string): any',
        description: 'Parse JSON string',
        implementations: {
          typescript: 'JSON.parse(text)',
          javascript: 'JSON.parse(text)',
          csharp: 'JsonConvert.DeserializeObject(text)'
        }
      },
      {
        name: 'stringify',
        signature: 'stringify(obj: any): string',
        description: 'Convert object to JSON string',
        implementations: {
          typescript: 'JSON.stringify(obj)',
          javascript: 'JSON.stringify(obj)',
          csharp: 'JsonConvert.SerializeObject(obj)'
        }
      }
    ]
  }
];

export function findStandardLibraryFunction(moduleName: string, functionName: string): StandardLibraryFunction | undefined {
  const module = STANDARD_LIBRARY.find(m => m.name === moduleName);
  if (!module) return undefined;
  return module.functions.find(f => f.name === functionName);
}

export function getStandardLibraryImplementation(moduleName: string, functionName: string, targetLanguage: string): string | undefined {
  console.log('DEBUG: getStandardLibraryImplementation called with:', { moduleName, functionName, targetLanguage });
  const func = findStandardLibraryFunction(moduleName, functionName);
  if (!func) {
    console.log('DEBUG: No standard library function found');
    return undefined;
  }
  console.log('DEBUG: Found standard library function:', func);
  return func.implementations[targetLanguage as keyof typeof func.implementations];
} 