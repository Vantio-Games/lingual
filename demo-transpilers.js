#!/usr/bin/env node

// Demo script for JavaScript and TypeScript transpilers
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

console.log('🚀 Lingual Transpiler Demo');
console.log('==========================\n');

// Check if the CLI is available
if (!existsSync('./dist/cli.js')) {
  console.log('❌ CLI not built. Please run: npm run build');
  process.exit(1);
}

const exampleFile = './examples/multi-target.lingual';

if (!existsSync(exampleFile)) {
  console.log(`❌ Example file not found: ${exampleFile}`);
  process.exit(1);
}

const targets = [
  { name: 'C#', flag: 'csharp', ext: '.cs' },
  { name: 'JavaScript', flag: 'javascript', ext: '.js' },
  { name: 'TypeScript', flag: 'typescript', ext: '.ts' }
];

console.log('📝 Transpiling example to all targets...\n');

for (const target of targets) {
  console.log(`🎯 Generating ${target.name} code...`);
  
  try {
    const outputDir = `./demo-output/${target.flag}`;
    const command = `node ./dist/cli.js build ${exampleFile} -t ${target.flag} -o ${outputDir}`;
    
    console.log(`   Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ ${target.name} transpilation successful!`);
    console.log(`📁 Output: ${outputDir}/multi-target${target.ext}`);
    console.log('');
    
  } catch (error) {
    console.log(`❌ ${target.name} transpilation failed:`, error.message);
    console.log('');
  }
}

console.log('🎉 Demo completed!');
console.log('\n📋 Generated files:');
console.log('   ./demo-output/csharp/multi-target.cs');
console.log('   ./demo-output/javascript/multi-target.js');
console.log('   ./demo-output/typescript/multi-target.ts');
console.log('\n💡 You can now run the generated code:');
console.log('   - C#: dotnet run --project ./demo-output/csharp/');
console.log('   - JavaScript: node ./demo-output/javascript/multi-target.js');
console.log('   - TypeScript: npm run build && node ./demo-output/typescript/multi-target.js'); 