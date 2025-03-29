const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

const uri = "mongodb://127.0.0.1:27017";
const dbName = "bupataksin";
const backupBaseDir = "/backupSystem/backup";

// หาโฟลเดอร์ Backup ล่าสุด
function getLatestBackupFolder() {
    const folders = fs.readdirSync(backupBaseDir)
        .filter(name => name.startsWith("mongodb_"))
        .sort()
        .reverse(); 
    return folders.length > 0 ? path.join(backupBaseDir, folders[0]) : null;
}

// ฟังก์ชันแปลงค่าทุกฟิลด์ให้เหมือนเดิม
function restoreFieldTypes(obj) {
    if (typeof obj === "string") {
        if (/^[0-9a-fA-F]{24}$/.test(obj)) return new ObjectId(obj);
        if (!isNaN(Date.parse(obj))) return new Date(obj);
        if (!isNaN(obj) && obj.trim() !== "") return Number(obj);
    } else if (Array.isArray(obj)) {
        return obj.map(restoreFieldTypes);
    } else if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
            if (/Name$/i.test(key)) { // Fix: fields ending with 'Name' always string
                obj[key] = String(obj[key]);
            } else {
                obj[key] = restoreFieldTypes(obj[key]);
            }
        }
    }
    return obj;
}

async function restoreDatabase() {
    const latestBackupFolder = getLatestBackupFolder();
    if (!latestBackupFolder) {
        console.log("❌ No backup folder found!");
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName); // Ensure database is created
        const files = fs.readdirSync(latestBackupFolder);

        for (let file of files) {
            if (file.endsWith('.json')) {
                const collName = file.replace('.json', '');
                const data = JSON.parse(fs.readFileSync(path.join(latestBackupFolder, file), "utf8"));

                if (data.length === 0) {
                    console.log(`⚠️ Skipped empty collection: ${collName}`);
                    continue;
                }

                const convertedData = data.map(doc => restoreFieldTypes(doc));
                const collection = db.collection(collName); // Ensure collection is created
                await collection.deleteMany({});
                await collection.insertMany(convertedData);
                console.log(`✅ Restored: ${collName}`);
            }
        }

        console.log("🎉 Restore completed successfully!");
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.close();
    }
}

restoreDatabase();