const path = require('path');
const fs = require('fs');

function saveFile(filePath, uint8Array) {
    const dir = path.dirname(filePath);
    
    // Ensure the directory exists
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFile(filePath, Buffer.from(uint8Array), (err) => {
        if (err) console.error('Error saving file:', err);
        else console.log('File saved:', filePath);
    });
}
const readDatabase = (path_) => {
    const dbPath = path.join(__dirname, path_);
    if (!fs.existsSync(dbPath))  fs.writeFileSync(dbPath, JSON.stringify([]));
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};
const writeDatabase = (path_,data) => {
    const dbPath = path.join(__dirname, path_);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 4));
};
const addToDatabase = (path_,data,type) => {
    switch ( type ) {
        case "push":{
            let database = readDatabase(path_);
            database.push(data);
            writeDatabase(path_,database);
        }
        break;
        case "key":{
            let database = readDatabase(path_);
            database[data.key] = data.value;
            writeDatabase(path_,database);
        }
        break;
        default:
            console.log("Unknown type: "+type);
    }
};



module.exports = {readDatabase,writeDatabase,addToDatabase,saveFile};