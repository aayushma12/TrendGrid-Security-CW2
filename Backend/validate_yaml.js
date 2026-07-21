const yaml = require('yaml');
const fs = require('fs');

const fileContent = fs.readFileSync('src/features/category/swagger/index.ts', 'utf8');

// extract the JSDoc block
const blockRegex = /\/\*\*([\s\S]*?)\*\//;
const match = fileContent.match(blockRegex);
if (!match) {
  console.log('No JSDoc block found');
  process.exit(1);
}

// remove ' * ' from the beginning of each line
let yamlContent = match[1].split('\n').map(line => line.replace(/^ \* ?/, '')).join('\n');
yamlContent = yamlContent.replace('@openapi', '');

try {
  yaml.parse(yamlContent);
  console.log('YAML parsed successfully!');
} catch (e) {
  console.error('YAML Parsing Error:', e.message);
}
