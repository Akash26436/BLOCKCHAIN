const fs = require('fs');
const path = require('path');

const abiPath = path.join(__dirname, 'contracts_AuditLog_sol_AuditLog.abi');
const abisJsPath = path.join(__dirname, 'frontend/src/contracts/abis.js');

if (!fs.existsSync(abiPath)) {
  console.error('ABI file not found!');
  process.exit(1);
}

const newAuditLogAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
let abisJsContent = fs.readFileSync(abisJsPath, 'utf8');

// Find the AuditLog section and replace its content
const startTag = '"AuditLog": [';
const startIndex = abisJsContent.indexOf(startTag) + startTag.length - 1;

// This is a bit brittle, lets just replace the whole export const ABIs if we have to
// But lets try a more targeted approach: find the matching ]
let bracketCount = 1;
let endIndex = startIndex + 1;
while (bracketCount > 0 && endIndex < abisJsContent.length) {
  if (abisJsContent[endIndex] === '[') bracketCount++;
  if (abisJsContent[endIndex] === ']') bracketCount--;
  endIndex++;
}

const finalAbisJs = abisJsContent.slice(0, startIndex) + JSON.stringify(newAuditLogAbi, null, 2) + abisJsContent.slice(endIndex);
fs.writeFileSync(abisJsPath, finalAbisJs);
console.log('Successfully updated AuditLog ABI in abis.js');
