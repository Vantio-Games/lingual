#!/usr/bin/env node

// Test script to verify JavaScript and TypeScript transpilers
import { BuildPipeline } from './src/compiler/build.js';
import { CompilerOptions } from './src/types/index.js';
import { FileHelpers } from './src/utils/file-helpers.js';
import path from 'path';

async function testTranspilers(): Promise<void> {
  console.log('🧪 Testing JavaScript and TypeScript transpilers...\n');

  const compilerOptions: CompilerOptions = {
    target: 'csharp', // This will be overridden
    outputDir: './test-output',
    verbose: true,
    debug: true
  };

  const pipeline = new BuildPipeline(compilerOptions);

  // Test with calculator example
  const inputFile = './examples/calculator.lingual';
  
  // Ensure test output directory exists
  await FileHelpers.ensureDir('./test-output');

  const targets = ['javascript', 'typescript'] as const;
  
  for (const target of targets) {
    console.log(`📝 Testing ${target} transpiler...`);
    
    try {
      const buildOptions = {
        inputFile: path.resolve(inputFile),
        outputDir: `./test-output/${target}`,
        target: target,
        verbose: true,
        debug: true,
        watch: false,
        json: false
      };

      const result = await pipeline.build(buildOptions);
      
      if (result.success) {
        console.log(`✅ ${target} transpilation successful!`);
        console.log(`📁 Generated files:`);
        for (const file of result.outputFiles) {
          console.log(`   ${file}`);
        }
        console.log('');
      } else {
        console.log(`❌ ${target} transpilation failed:`);
        for (const error of result.errors) {
          console.log(`   ${error}`);
        }
        console.log('');
      }
    } catch (error) {
      console.log(`❌ ${target} transpilation error:`, error);
      console.log('');
    }
  }

  console.log('🎉 Transpiler testing completed!');
}

// Run the test
testTranspilers().catch(console.error); 