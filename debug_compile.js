const { execSync } = require('child_process');
try {
    const output = execSync('npx hardhat compile', { encoding: 'utf8', stdio: 'pipe' });
    console.log('Compilation successful:');
    console.log(output);
} catch (error) {
    console.error('Compilation failed:');
    console.error(error.stdout);
    console.error(error.stderr);
}
