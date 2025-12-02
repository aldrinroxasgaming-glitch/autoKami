import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to mapping/nodeNames.txt (CSV format)
const csvPath = path.join(__dirname, '../../../mapping/nodeNames.txt');
const outPath = path.join(__dirname, '../data/nodeMap.json');

console.log(`Reading CSV from: ${csvPath}`);

try {
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Simple CSV Parser handling quotes
    // Pattern: Match quoted string OR non-comma sequence, followed by comma or end of line
    const pattern = /(".*?"|[^,"]+)(?=\s*,|\s*$)/g;
    
    const lines = fileContent.split(/\r?\n/);
    if (lines.length === 0) throw new Error("Empty file");

    // Header: NodeID,Name,Affinity,LevelLimit,YieldIndex,ScavCost
    // We assume fixed order for this simple parser to avoid complex header mapping logic, 
    // but we can also map by index if needed.
    // Let's parse header first line to be safe? No, user provided format is fixed.
    // We'll trust line 1 is header.

    const nodeMap: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse line
        // Basic split won't work for "Eerie, Scrap". 
        // Let's use a regex match loop.
        
        // Matches:
        // 1. "..." (Quoted)
        // 2. [^,]+ (Unquoted)
        // followed by separator
        
        const matches = [];
        const regex = /(?:^|,)\s*(?:"([^"]*)"|([^",]*))/g;
        let match;
        
        // Reset regex index just in case (not needed for loop over strings but good practice)
        // Actually split-based regex is better:
        // line.split(/,(?=(?:(?:[^ "]*\"){2})*[^ "]*$)/)
        
        const parts = line.split(/,(?=(?:(?:[^ "]*\"){2})*[^ "]*$)/).map(p => p.trim().replace(/^"|"$/g, ''));
        
        if (parts.length < 6) {
            // console.warn(`Line ${i} incomplete: ${line}`);
            // Some lines might have empty trailing fields which split might ignore or handle
            // Let's assume parts[0] is ID.
        }

        // NodeID,Name,Affinity,LevelLimit,YieldIndex,ScavCost
        const nodeID = parseInt(parts[0]);
        if (isNaN(nodeID)) continue;

        const name = parts[1];
        const affinity = parts[2];
        const levelLimit = parts[3] ? parseInt(parts[3]) : null;
        const yieldIndex = parts[4] ? parseInt(parts[4]) : null;
        const scavCost = parts[5] ? parseInt(parts[5]) : null;

        nodeMap.push({
            nodeID,
            name,
            affinity,
            levelLimit,
            yieldIndex,
            scavCost
        });
    }

    // Write to JSON
    fs.writeFileSync(outPath, JSON.stringify(nodeMap, null, 2));
    console.log(`✅ Successfully generated nodeMap.json at ${outPath}`);
    console.log(`Total Nodes: ${nodeMap.length}`);

} catch (error) {
    console.error('Error generating node map:', error);
}