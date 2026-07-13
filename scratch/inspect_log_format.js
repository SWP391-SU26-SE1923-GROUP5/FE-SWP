const fs = require('fs');
const path = require('path');

const tasksDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\a43d04df-75de-4fcc-a73b-af910052dcc9\\.system_generated\\tasks';
const logs = ['task-5577.log', 'task-6094.log', 'task-6423.log'];

for (const logName of logs) {
    const logPath = path.join(tasksDir, logName);
    if (!fs.existsSync(logPath)) continue;
    
    console.log(`\n=== Checking ${logName} (${fs.statSync(logPath).size} bytes) ===`);
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    
    let matches = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('replace_file_content') || lines[i].includes('write_to_file') || lines[i].includes('ask-ai') || lines[i].includes('chat')) {
            if (matches < 15) {
                console.log(`Line ${i}: ${lines[i].substring(0, 250)}`);
            }
            matches++;
        }
    }
    console.log(`Total matching lines in ${logName}: ${matches}`);
}
