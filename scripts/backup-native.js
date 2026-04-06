const fs = require('fs');
const path = require('path');

const srcBase = 'android/app/src/main';
const destBase = 'plugins/android-native';

const mappings = [
  { src: 'java/com/ingatuang/money', dest: 'java/com/ingatuang/money' },
  { src: 'res/xml', dest: 'res/xml' },
  { src: 'res/layout', dest: 'res/layout' },
  { src: 'res/drawable', dest: 'res/drawable' },
  { src: 'res/values', dest: 'res/values' }
];

function copyRecursive(src, dest) {
  if (fs.existsSync(src)) {
    if (fs.lstatSync(src).isDirectory()) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach(file => {
        copyRecursive(path.join(src, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

mappings.forEach(m => {
  const s = path.join(srcBase, m.src);
  const d = path.join(destBase, m.dest);
  console.log(`Copying ${s} to ${d}...`);
  copyRecursive(s, d);
});
console.log('Done!');
