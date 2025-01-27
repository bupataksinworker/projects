const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// กำหนดค่าต่างๆ
const backupDir = path.join(__dirname, 'backups');
const dbName = 'bupataksin';
const zipFile = path.join(backupDir, `full-backup-${new Date().toISOString().slice(0, 10)}.rar`); // บีบอัดเป็น .rar
const webFolder = path.join(__dirname); // โฟลเดอร์ WEB ทั้งหมด

// ตรวจสอบโฟลเดอร์ backups
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// ฟังก์ชันสำรองฐานข้อมูล
const backupDatabase = (callback) => {
    const dumpFile = path.join(backupDir, `${dbName}-backup.gz`);
    const command = `mongodump --uri="mongodb://admin:admin@localhost:27017/${dbName}" --archive=${dumpFile} --gzip`;

    exec(command, (err) => {
        if (err) {
            console.error(`❌ Database backup error: ${err}`);
            return callback(err);
        }
        console.log('✅ Database backup completed.');
        callback(null, dumpFile);
    });
};

// ฟังก์ชันสำรองทั้งโฟลเดอร์ WEB ด้วย WinRAR
const backupWebFolder = (callback) => {
    // ตรวจสอบว่า WinRAR ถูกติดตั้งหรือไม่
    const command = `"C:\\Program Files\\WinRAR\\WinRAR.exe" a -r ${zipFile} ${webFolder}`;

    exec(command, (err) => {
        if (err) {
            console.error(`❌ Web folder backup error: ${err}`);
            return callback(err);
        }
        console.log(`✅ Web folder backup completed: ${zipFile}`);
        callback();
    });
};

// ฟังก์ชันหลักที่รวมการสำรองข้อมูล
const fullBackup = () => {
    console.log('🚀 Starting backup process...');
    backupDatabase((err, dbDumpFile) => {
        if (err) return;
        backupWebFolder(() => {
            console.log('🎉 Backup process completed successfully.');
        });
    });
};

// เรียกใช้งานฟังก์ชัน Backup หลังจาก MongoDB เชื่อมต่อเสร็จ
module.exports = { fullBackup };
