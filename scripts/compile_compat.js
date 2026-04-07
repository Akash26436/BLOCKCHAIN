const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const contracts = ['AuditLog.sol', 'ContentRegistry.sol', 'VerificationContract.sol'];

const input = {
  language: 'Solidity',
  sources: {},
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'paris',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }
  }
};

contracts.forEach(name => {
  input.sources[name] = { content: fs.readFileSync(path.join('contracts', name), 'utf8') };
});

fs.writeFileSync('solc_input.json', JSON.stringify(input));

try {
  console.log("Compiling with solcjs standard-json targeting 'paris' EVM...");
  const out = execSync('npx solcjs --standard-json solc_input.json', { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
  
  // Find actual JSON (starts with {)
  const jsonStart = out.indexOf('{');
  if (jsonStart === -1) throw new Error("No JSON found in output: " + out);
  const jsonOut = out.substring(jsonStart);
  const output = JSON.parse(jsonOut);

  if (output.errors) {
    output.errors.forEach(e => {
        if (e.severity === 'error') console.error("❌ " + e.formattedMessage);
        else console.warn("⚠️ " + e.formattedMessage);
    });
    if (output.errors.some(e => e.severity === 'error')) process.exit(1);
  }

  for (const [file, contractNames] of Object.entries(output.contracts)) {
    for (const [name, art] of Object.entries(contractNames)) {
      const base = `contracts_${file.replace('.sol', '')}_sol_${name}`;
      fs.writeFileSync(`${base}.abi`, JSON.stringify(art.abi));
      fs.writeFileSync(`${base}.bin`, art.evm.bytecode.object);
      console.log(`✅ ${name} (from ${file}) -> paris EVM`);
    }
  }
} catch (e) {
  console.error("Manual compilation failed:", e.message);
  if (e.stdout) console.log("STDOUT:", e.stdout.slice(0, 500));
}
