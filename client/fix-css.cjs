const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.css')) results.push(file);
        }
    });
    return results;
}

const files = walk('/Users/biplab/Desktop/getway/client/src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Gradients
    content = content.replace(/linear-gradient\([^)]+#060e35[^)]+\)/g, 'var(--bg-panel)');
    content = content.replace(/radial-gradient\([^)]+rgba\(26, 63, 224, 0.07\)[^)]+\)/g, 'var(--bg-panel)');
    
    // Background colors
    content = content.replace(/background:\s*rgba\(5, 13, 46,[^)]+\);/gi, 'background: var(--bg-panel);');
    content = content.replace(/background:\s*rgba\(6, 14, 53,[^)]+\);/gi, 'background: var(--bg-panel);');
    
    // Border colors with cyan
    content = content.replace(/border(-[a-z]+)?:\s*1px solid rgba\(0, 212, 255, [0-9.]+\);/gi, 'border$1: 1px solid var(--border-color);');
    content = content.replace(/border-color:\s*rgba\(0, 212, 255, [0-9.]+\);/gi, 'border-color: var(--border-color);');
    
    // Box shadows with cyan
    content = content.replace(/box-shadow:.*rgba\(0, 212, 255, [0-9.]+\).*;/gi, 'box-shadow: var(--shadow-soft);');
    
    // Hover backgrounds
    content = content.replace(/background:\s*rgba\(0, 212, 255, 0.0[0-9]\);/gi, 'background: var(--bg-main);');
    content = content.replace(/background:\s*rgba\(0, 212, 255, 0.1[0-9]?\);/gi, 'background: var(--bg-main);');
    
    fs.writeFileSync(file, content);
});
console.log('Fixed CSS files.');
