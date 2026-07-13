const fs = require('fs');
const path = require('path');

const tasksDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\a43d04df-75de-4fcc-a73b-af910052dcc9\\.system_generated\\tasks';
const outDir = path.join('D:\\Projects\\FE-main\\scratch\\full_recovered_files');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const logs = fs.readdirSync(tasksDir).filter(f => f.endsWith('.log'));

const filesOfInterest = new Set();
for (const logFile of logs) {
    const logPath = path.join(tasksDir, logFile);
    const content = fs.readFileSync(logPath, 'utf8');
    
    // Find TargetFile occurrences
    const regex = /"TargetFile"\s*:\s*"([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        filesOfInterest.add(match[1]);
    }
}

console.log('Files modified across logs:', Array.from(filesOfInterest));

let report = {};
for (const file of filesOfInterest) {
    report[file] = [];
}

for (const logFile of logs) {
    const logPath = path.join(tasksDir, logFile);
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const file of filesOfInterest) {
            if (line.includes(file)) {
                report[file].push({ log: logFile, line: i, text: line.substring(0, 300) });
            }
        }
    }
}

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log('Saved report.json with total files:', Object.keys(report).length);
