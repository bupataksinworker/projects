const { MongoClient } = require("mongodb");
const fs = require("fs");

const uri = "mongodb://admin:admin@localhost:27017"; // เปลี่ยน URI ตามการตั้งค่า
const dbName = "bupataksin"; // ชื่อฐานข้อมูล

// ฟังก์ชันสร้างชื่อโฟลเดอร์ตามวันที่และเวลา
function getBackupFolderName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    return `mongodb_${year}${month}${day}_${hour}${minute}`;
}

async function backupDatabase() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        const backupFolder = `/backupSystem/backup/${getBackupFolderName()}`; // โฟลเดอร์ใหม่
        if (!fs.existsSync(backupFolder)) {
            fs.mkdirSync(backupFolder, { recursive: true });
        }

        for (let collection of collections) {
            const collName = collection.name;
            const data = await db.collection(collName).find().toArray();
            fs.writeFileSync(`${backupFolder}/${collName}.json`, JSON.stringify(data, null, 2));
            console.log(`✅ Exported: ${collName}`);
        }

        console.log(`🎉 Backup completed! Files are in: ${backupFolder}`);
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.close();
    }
}

backupDatabase();
