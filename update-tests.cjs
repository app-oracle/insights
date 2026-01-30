const fs = require('fs');

let content = fs.readFileSync('test/index.test.ts', 'utf8');

// Pattern 1: getFeedbackLink('version', { metadata })
content = content.replace(/getFeedbackLink\('([^']+)',\s*\{/g, 
  "getFeedbackLink({\n        appVersion: '$1',\n        metadata: {");

// Pattern 2: getFeedbackLink('version', null)
content = content.replace(/getFeedbackLink\('([^']+)',\s*null\)/g,
  "getFeedbackLink({ appVersion: '$1', metadata: null })");

// Pattern 3: getFeedbackLink('')
content = content.replace(/getFeedbackLink\(''\)/g,
  "getFeedbackLink({ appVersion: '' })");

// Pattern 4: getFeedbackLink('', { metadata })
content = content.replace(/getFeedbackLink\('',\s*\{/g,
  "getFeedbackLink({\n        appVersion: '',\n        metadata: {");

fs.writeFileSync('test/index.test.ts', content);
console.log('Updated test file');
