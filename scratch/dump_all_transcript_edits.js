const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\a43d04df-75de-4fcc-a73b-af910052dcc9\\.system_generated\\logs\\transcript_full.jsonl';

if (!fs.existsSync(transcriptPath)) {
    console.error("transcript_full.jsonl not found at:", transcriptPath);
    process.exit(1);
}

const content = fs.readFileSync(transcriptPath, 'utf8');
const lines = content.split('\n').filter(Boolean);

console.log(`Total steps in transcript_full.jsonl: ${lines.length}`);

const editsByFile = {};
const aiAndChatMentions = [];

for (let i = 0; i < lines.length; i++) {
    try {
        const step = JSON.parse(lines[i]);
        const stepStr = JSON.stringify(step);
        
        // Check tool calls
        if (step.tool_calls && Array.isArray(step.tool_calls)) {
            for (const call of step.tool_calls) {
                const name = call.name || call.function?.name;
                const args = call.arguments || call.function?.arguments;
                
                if (['replace_file_content', 'multi_replace_file_content', 'write_to_file'].includes(name)) {
                    let parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
                    if (parsedArgs && parsedArgs.TargetFile) {
                        const file = parsedArgs.TargetFile.replace(/\\/g, '/');
                        if (!editsByFile[file]) editsByFile[file] = [];
                        editsByFile[file].push({
                            step: i,
                            tool: name,
                            instruction: parsedArgs.Instruction || parsedArgs.Description || '',
                            args: parsedArgs
                        });
                    }
                }
            }
        }
        
        // Search for ask-ai or session checking logic anywhere
        if (stepStr.toLowerCase().includes('ask-ai') || stepStr.toLowerCase().includes('checkingsession') || (stepStr.includes('sessions') && stepStr.includes('documents'))) {
            aiAndChatMentions.push({
                step: i,
                type: step.type,
                source: step.source,
                summary: stepStr.substring(0, 200)
            });
        }
    } catch (e) {
        // ignore JSON parse error
    }
}

console.log('\n========================================');
console.log('SUMMARY OF ALL EDITED FILES ACROSS TRANSCRIPT:');
for (const [file, edits] of Object.entries(editsByFile)) {
    console.log(`\n[FILE]: ${file} (${edits.length} edits)`);
    edits.forEach(e => {
        console.log(`  - Step ${e.step} (${e.tool}): ${e.instruction}`);
    });
}

console.log('\n========================================');
console.log('AI / CHAT / SESSION CHECKING MENTIONS FOUND:');
aiAndChatMentions.slice(0, 20).forEach(m => {
    console.log(`- Step ${m.step} [${m.type} / ${m.source}]: ${m.summary}`);
});

fs.writeFileSync('D:\\Projects\\FE-main\\scratch\\edits_summary.json', JSON.stringify(editsByFile, null, 2));
