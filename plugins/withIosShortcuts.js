const {
  withXcodeProject,
  withEntitlementsPlist,
} = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

const APP_GROUP = 'group.com.ingatuang.money.shared';
const EXTENSION_NAME = 'IngatUangIntents';
const EXTENSION_BUNDLE_SUFFIX = '.intents';

/**
 * withIosShortcuts — Config Plugin
 *
 * Membuat App Intents Extension terpisah di Xcode.
 * Ini memungkinkan Siri Shortcut berjalan bahkan saat app
 * benar-benar ter-terminate (killed oleh iOS).
 *
 * Arsitektur:
 * - Main App Target: SharedStorageModule.swift (bridge ke React Native)
 * - IngatUangIntents Extension: QuickAddIntent + TransactionParser + TransactionQueuer
 *   Extension ini ringan, selalu bisa dipanggil iOS tanpa membuka app penuh.
 */
const withIosShortcuts = (config) => {
  // Step 1: Create extension target in Xcode
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

    // ---- Create extension directory in ios/ ----
    const extDir = path.join(projectRoot, 'ios', EXTENSION_NAME);
    if (!fs.existsSync(extDir)) {
      fs.mkdirSync(extDir, { recursive: true });
      console.log(`[withIosShortcuts] ✅ Created extension folder: ${EXTENSION_NAME}/`);
    }

    // ---- Copy required files from module to extension folder ----
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

    // ---- Check if extension target exists ----
    const existingTargets = xcodeProject.pbxNativeTargetSection();
    let extTarget = Object.values(existingTargets).find(
      (t) => t && t.name === EXTENSION_NAME
    );

    if (extTarget) {
      console.log(`[withIosShortcuts] ⏭️ Extension target exists: ${EXTENSION_NAME}`);
      // If it exists, we skip creation to avoid duplicates
    } else {
      // ---- Create new extension target ----
      extTarget = xcodeProject.addTarget(
        EXTENSION_NAME,
        'app_extension',
        EXTENSION_NAME,
        extBundleId
      );
      if (!extTarget) {
        console.warn('[withIosShortcuts] ❌ Failed to create target');
        return config;
      }
      console.log(`[withIosShortcuts] ✅ Created target: ${EXTENSION_NAME}`);
    }

    // ---- Add files to project and group ----
    // Ensure we have a valid parent group
    const pbxGroupKey = xcodeProject.findPBXGroupKey({ name: appTargetName })
      || xcodeProject.findPBXGroupKey({ name: 'CustomTemplate' })
      || xcodeProject.findPBXGroupKey({ name: '' });

    // Create or find our extension group
    let extGroup = xcodeProject.pbxGroupByName(EXTENSION_NAME);
    if (!extGroup) {
      extGroup = xcodeProject.addPbxGroup([], EXTENSION_NAME, EXTENSION_NAME);
      if (pbxGroupKey) {
        xcodeProject.addToPbxGroup(extGroup.uuid, pbxGroupKey);
      }
    }

    const addAppFile = (filePath, targetUuid, groupUuid, isSource = true) => {
      // Check if already in project to prevent the null path crash
      if (xcodeProject.hasFile(filePath)) {
        console.log(`[withIosShortcuts] ⏭️ File in project: ${filePath}`);
        return;
      }

      const file = isSource 
        ? xcodeProject.addSourceFile(filePath, { target: targetUuid }, groupUuid)
        : xcodeProject.addResourceFile(filePath, { target: targetUuid }, groupUuid);

      if (!file) {
        // Safe check to avoid crash if something is still not quite right
        console.warn(`[withIosShortcuts] ⚠️ Failed to add file: ${filePath}`);
      }
    };

    // Swift Source Files
    [
      'QuickAddIntent.swift',
      'TransactionParser.swift',
      'TransactionQueuer.swift'
    ].forEach((f) => addAppFile(`${EXTENSION_NAME}/${f}`, extTarget.uuid, extGroup.uuid, true));

    // Resource Files
    addAppFile(`${EXTENSION_NAME}/IngatUangIntents-Info.plist`, extTarget.uuid, extGroup.uuid, false);
    addAppFile(`${EXTENSION_NAME}/IngatUangIntents.entitlements`, extTarget.uuid, extGroup.uuid, false);

    // ---- Configure Build Settings ----
    const targetUuid = extTarget.uuid;

    xcodeProject.addBuildProperty('INFOPLIST_FILE', `${EXTENSION_NAME}/IngatUangIntents-Info.plist`, EXTENSION_NAME);
    xcodeProject.addBuildProperty('CODE_SIGN_ENTITLEMENTS', `${EXTENSION_NAME}/IngatUangIntents.entitlements`, EXTENSION_NAME);
    xcodeProject.addBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', extBundleId, EXTENSION_NAME);
    xcodeProject.addBuildProperty('SWIFT_VERSION', '5.9', EXTENSION_NAME);
    xcodeProject.addBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '16.0', EXTENSION_NAME);
    xcodeProject.addBuildProperty('SKIP_INSTALL', 'YES', EXTENSION_NAME);
    xcodeProject.addBuildProperty('TARGETED_DEVICE_FAMILY', '"1,2"', EXTENSION_NAME);
    xcodeProject.addBuildProperty('APPLICATION_EXTENSION_API_ONLY', 'YES', EXTENSION_NAME);

    console.log(`[withIosShortcuts] ✅ Configured target build settings`);

    return config;
  });

  // Step 2: Add App Group to Main App entitlements
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
