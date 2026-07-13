const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\a43d04df-75de-4fcc-a73b-af910052dcc9\\.system_generated\\tasks\\task-6094.log';
const content = fs.readFileSync(logPath, 'utf8');

// Let's search for filenames in task-6094.log
const regex = /([a-zA-Z0-9_\-\.\/\\]+\.[a-zA-Z]+):(\d+):(.*)/g;
const filesMap = {};

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([a-zA-Z0-9_\-\.\/\\]+\.[a-zA-Z]+):(\d+):(.*)/);
    if (match) {
        const fname = match[1].trim().replace(/\\/g, '/');
        const lnum = parseInt(match[2], 10);
        const code = match[3];
        if (!filesMap[fname]) filesMap[fname] = {};
        filesMap[fname][lnum] = code;
    } else {
        // Check if line mentions replace_file_content or write_to_file
        if (line.includes('TargetFile') || line.includes('TargetContent') || line.includes('ReplacementContent') || line.includes('CodeContent')) {
            // let's save notable lines
        }
    }
}

console.log("Captured files in task-6094.log matching fname:num:code:");
for (const [fname, lmap] of Object.entries(filesMap)) {
    const lnums = Object.keys(lmap).map(Number).sort((a,b)=>a-b);
    console.log(`- ${fname}: ${lnums.length} lines (L${lnums[0]} to L${lnums[lnums.length-1]})`);
    
    fs.mkdirSync('D:\\Projects\\FE-main\\scratch\\recovered_6094', { recursive: true });
    const rawOut = lnums.map(n => `${n}: ${lmap[n]}`).join('\n');
    const safeName = fname.replace(/\//g, '__');
    fs.writeFileSync(`D:\\Projects\\FE-main\\scratch\\recovered_6094\\${safeName}.txt`, rawOut, 'utf8');
}

// Also let's find any JSON blocks containing TargetFile or replace_file_content inside task-6094.log
const edits = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('TargetFile') && (line.includes('ReplacementContent') || line.includes('CodeContent') || line.includes('ReplacementChunks'))) {
        edits.push({ line: i, text: line.substring(0, 300) });
    }
}
console.log(`Total edits found in task-6094.log: ${edits.length}`);
fs.writeFileSync('D:\\Projects\\FE-main\\scratch\\edits_6094.json', JSON.stringify(edits, null, 2));
