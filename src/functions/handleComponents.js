const fs = require('node:fs');
const path = require('node:path');

async function handleComponents(client) {
    const componentsPath = path.join(__dirname, '../components');
    const componentTypes = [
        { folder: 'buttons', collection: client.buttons },
        { folder: 'selectMenus', collection: client.selectMenus },
        { folder: 'modals', collection: client.modals }
    ];

    for (const { folder, collection } of componentTypes) {
        const typePath = path.join(componentsPath, folder);
        if (!fs.existsSync(typePath)) continue;
        const files = getAllJsFiles(typePath);
        for (const filePath of files) {
            const component = require(filePath);
            if ('customId' in component && 'execute' in component) {
                collection.set(component.customId, component);
            } else {
                console.log(`[WARNING] The component at ${filePath} is missing a required "customId" or "execute" property.`);
            }
        }
    }
}

function getAllJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllJsFiles(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    }
    return results;
}

module.exports = handleComponents;