import fs from 'fs'; 
import path from 'path'; 

function deleteMetaFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      deleteMetaFiles(fullPath);
    } else if (entry.name.startsWith("._") || entry.name === ".DS_Store") {
      fs.unlinkSync(fullPath);
      console.log(`🧹 Deleted: ${fullPath}`);
    }
  }
}

deleteMetaFiles(__dirname);
