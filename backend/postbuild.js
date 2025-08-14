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

      // import/export ifadelerinde .js uzantısı ekle (relative importlara)
      content = content.replace(/(import\s.+?from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, (match, p1, p2, p3) => {
        return p2.endsWith('.js') ? match : p1 + p2 + '.js' + p3;
      });

      // sadece 'import "./modulename"' gibi uzantısız importlar
      content = content.replace(/(import\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, (match, p1, p2, p3) => {
        return p2.endsWith('.js') ? match : p1 + p2 + '.js' + p3;
      });

      fs.writeFileSync(fullPath, content);
    }
  }
}

fixImports(dir);