import fs from 'fs';
import path from 'path';

const dir = path.resolve('./dist');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, (match, p1, p2, p3) => {
        // Eğer zaten .js ile bitmiyorsa ekle
        if (!p2.endsWith('.js')) {
          return p1 + p2 + '.js' + p3;
        }
        return match;
      });
      fs.writeFileSync(fullPath, content);
    }
  }
}

fixImports(dir);