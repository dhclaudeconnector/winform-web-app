const fs = require('fs');
const path = require('path');

function generateVersion() {
  // Lấy thời gian Việt Nam (UTC+7)
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

  const year = vietnamTime.getFullYear().toString().slice(-2);
  const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getDate()).padStart(2, '0');
  const hours = String(vietnamTime.getHours()).padStart(2, '0');
  const minutes = String(vietnamTime.getMinutes()).padStart(2, '0');

  const version = `1.${year}.${month}${day}.${hours}${minutes}`;

  const versionFile = path.join(__dirname, '..', 'src', 'lib', 'version.ts');
  const content = `// Auto-generated file - do not edit manually
export const BUILD_VERSION = '${version}';
export const BUILD_DATE = '${vietnamTime.toISOString()}';
`;

  fs.writeFileSync(versionFile, content, 'utf8');
  console.log(`Generated version: ${version} (Vietnam time)`);
}

generateVersion();
