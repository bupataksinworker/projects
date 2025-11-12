// lib/exportScript.js
const { spawn } = require('child_process');
const path = require('path');

const BAT_PATH = path.resolve(path.join(__dirname, '..', 'bat', 'mongo_export_CSV_JSON_to_gdrive.bat'));

function runExport(collection, fields = '') {
  return new Promise((resolve, reject) => {
    // Validation เบื้องต้น (ห้าม inject)
    if (!/^[a-z0-9_]+$/i.test(collection)) {
      return reject(new Error('Invalid collection name'));
    }
    // fields: อนุญาตตัวอักษร , _ . $-0-9 เท่านั้น (เปลี่ยนตามต้องการ)
    if (fields && !/^[a-z0-9_,\.\$\-]+$/i.test(fields)) {
      return reject(new Error('Invalid fields'));
    }

    // spawn bat (ไม่ใช้ shell=true)
    const args = [collection, fields];
    console.log('[exportScript] spawning', BAT_PATH, args);
    // Run the .bat via cmd.exe /c to ensure proper batch execution and quoting on Windows
    const cmd = 'cmd.exe';
    const cmdArgs = ['/c', BAT_PATH, collection, fields];
    console.log('[exportScript] spawning', cmd, cmdArgs);
    const child = spawn(cmd, cmdArgs, { windowsHide: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        const err = new Error(`Export failed (code ${code})`);
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      }
    });
  });
}

module.exports = { runExport };
