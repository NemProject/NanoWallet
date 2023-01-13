const { notarize } = require('electron-notarize');
const appBundleId = require('../package.json').build.appId;

// You will need to notarize the application if the "Developer ID Certificate" is new
exports.default = async (context) => {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization because this is not a macOS build.');
    return;
  } else if (process.env.DESKTOP_APP_NOTARIZE !== 'true') {
    console.log('Skipping notarization because DESKTOP_APP_NOTARIZE env is not set.');
    return;
  } else if (process.env.DESKTOP_APP_APPLE_ID === undefined || process.env.DESKTOP_APP_APPLE_PASSWORD === undefined) {
    console.log('Skipping notarization because DESKTOP_APP_APPLE_ID or DESKTOP_APP_APPLE_PASSWORD env is not set.');
    return;
  } else if (process.env.DESKTOP_APP_APPLE_TEAM_ID === undefined) {
    console.log('Skipping notarization because DESKTOP_APP_APPLE_TEAM_ID env is not set.');
    return;
}
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${appName} with bundleId[${appBundleId}] at ${appPath} ... (This might take several minutes)`);

  return await notarize({
    appBundleId: appBundleId,
    appPath: appPath,
    appleId: process.env.DESKTOP_APP_APPLE_ID,
    appleIdPassword: process.env.DESKTOP_APP_APPLE_PASSWORD,
    ascProvider: process.env.DESKTOP_APP_APPLE_TEAM_ID,
  });
};
