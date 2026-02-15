const { rcedit } = require('rcedit');
const path = require('path');

exports.default = async function(context) {
  // Only run for Windows builds
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const iconPath = path.join(__dirname, 'build-resources', 'icon.ico');
  
  console.log(`Applying icon to: ${exePath}`);
  
  try {
    await rcedit(exePath, {
      icon: iconPath
    });
    console.log('Icon applied successfully!');
  } catch (error) {
    console.error('Failed to apply icon:', error.message);
  }
};
