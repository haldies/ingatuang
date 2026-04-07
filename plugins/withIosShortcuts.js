const {
  withXcodeProject,
  withEntitlementsPlist,
} = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

const APP_GROUP = 'group.com.ingatuang.money.shared';
const EXTENSION_NAME = 'IngatUangIntents';
const EXTENSION_BUNDLE_SUFFIX = '.intents';


const withIosShortcuts = (config) => {
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const sourceDir = path.join(projectRoot, 'modules', 'shared-storage', 'ios');

    const appTarget = xcodeProject.getFirstTarget().firstTarget;
    const appTargetName = appTarget.productName;
    if (!appTargetName) {
      console.warn('[withIosShortcuts] ❌ Could not get App Target name');
      return config;
    }

    const mainBundleId = config.ios?.bundleIdentifier || 'com.ingatuang.money';
    const extBundleId = `${mainBundleId}${EXTENSION_BUNDLE_SUFFIX}`;

    const extDir = path.join(projectRoot, 'ios', EXTENSION_NAME);
    if (!fs.existsSync(extDir)) {
      fs.mkdirSync(extDir, { recursive: true });
      console.log(`[withIosShortcuts] ✅ Created extension folder: ${EXTENSION_NAME}/`);
    }
    const filesToCopy = [
      'QuickAddIntent.swift',
      'TransactionParser.swift',
      'TransactionQueuer.swift',
      'IngatUangIntents-Info.plist',
      'IngatUangIntents.entitlements',
    ];

    filesToCopy.forEach((fileName) => {
      const src = path.join(sourceDir, fileName);
      const dest = path.join(extDir, fileName);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`[withIosShortcuts] ✅ Copied: ${fileName}`);
      } else {
        console.warn(`[withIosShortcuts] ⚠️ Source not found: ${src}`);
      }
    });

    const existingTargets = xcodeProject.pbxNativeTargetSection();
    let extTargetUuid = null;
    
    for (const key in existingTargets) {
      if (key.endsWith('_comment')) continue;
      const t = existingTargets[key];
      if (t && t.name === EXTENSION_NAME || t.name === `"${EXTENSION_NAME}"`) {
        extTargetUuid = key;
        break;
      }
    }

    if (extTargetUuid) {
      console.log(`[withIosShortcuts] ⏭️ Extension target exists: ${EXTENSION_NAME}`);

    } else {

      const extTarget = xcodeProject.addTarget(
        EXTENSION_NAME,
        'app_extension',
        EXTENSION_NAME,
        extBundleId
      );
      if (!extTarget) {
        console.warn('[withIosShortcuts] Failed to create target');
        return config;
      }
      extTargetUuid = extTarget.uuid;
      console.log(`[withIosShortcuts] Created target: ${EXTENSION_NAME}`);
    }

    const pbxGroupKey = xcodeProject.findPBXGroupKey({ name: appTargetName })
      || xcodeProject.findPBXGroupKey({ name: 'CustomTemplate' })
      || xcodeProject.findPBXGroupKey({ name: '' });

    let extGroup = xcodeProject.pbxGroupByName(EXTENSION_NAME);
    if (!extGroup) {
      extGroup = xcodeProject.addPbxGroup([], EXTENSION_NAME, EXTENSION_NAME);
      if (pbxGroupKey) {
        xcodeProject.addToPbxGroup(extGroup.uuid, pbxGroupKey);
      }
    }

    const addAppFile = (filePath, targetUuid, groupUuid, isSource = true) => {
      if (xcodeProject.hasFile(filePath)) {
        console.log(`[withIosShortcuts] File in project: ${filePath}`);
        return;
      }

      let file;
      if (isSource) {
         file = xcodeProject.addSourceFile(filePath, { target: targetUuid }, groupUuid);
      } else {
         file = xcodeProject.addFile(filePath, groupUuid);
      }

      if (!file) {
        console.warn(`[withIosShortcuts] Failed to add file: ${filePath}`);
      }
    };
    [
      'QuickAddIntent.swift',
      'TransactionParser.swift',
      'TransactionQueuer.swift'
    ].forEach((f) => addAppFile(f, extTargetUuid, extGroup.uuid, true));

    // Resource Files
    addAppFile('IngatUangIntents-Info.plist', extTargetUuid, extGroup.uuid, false);
    addAppFile('IngatUangIntents.entitlements', extTargetUuid, extGroup.uuid, false);

    const targetUuid = extTargetUuid;

    xcodeProject.updateBuildProperty('INFOPLIST_FILE', `"${EXTENSION_NAME}/IngatUangIntents-Info.plist"`, null, EXTENSION_NAME);
    xcodeProject.updateBuildProperty('CODE_SIGN_ENTITLEMENTS', `"${EXTENSION_NAME}/IngatUangIntents.entitlements"`, null, EXTENSION_NAME);
    xcodeProject.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', `"${extBundleId}"`, null, EXTENSION_NAME);
    xcodeProject.updateBuildProperty('SWIFT_VERSION', '5.9', null, EXTENSION_NAME);
    xcodeProject.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '16.0', null, EXTENSION_NAME);
    xcodeProject.updateBuildProperty('SKIP_INSTALL', 'YES', null, EXTENSION_NAME);
    xcodeProject.updateBuildProperty('TARGETED_DEVICE_FAMILY', '"1,2"', null, EXTENSION_NAME);
    xcodeProject.updateBuildProperty('APPLICATION_EXTENSION_API_ONLY', 'YES', null, EXTENSION_NAME);

    console.log(`[withIosShortcuts] ✅ Configured target build settings`);

    return config;
  });

  config = withEntitlementsPlist(config, (config) => {
    const existing = config.modResults['com.apple.security.application-groups'] || [];
    if (!existing.includes(APP_GROUP)) {
      config.modResults['com.apple.security.application-groups'] = [...existing, APP_GROUP];
      console.log(`[withIosShortcuts] ✅ Added App Group to main app entitlements`);
    }
    return config;
  });

  return config;
};

module.exports = withIosShortcuts;
