const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

const uri = "mongodb://admin:admin@localhost:27017";
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
            obj[key] = restoreFieldTypes(obj[key]);
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
        const db = client.db(dbName);
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
                await db.collection(collName).deleteMany({});
                await db.collection(collName).insertMany(convertedData);
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
