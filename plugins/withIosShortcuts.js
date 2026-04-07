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
  // Step 1: Buat extension target di Xcode
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const sourceDir = path.join(projectRoot, 'modules', 'shared-storage', 'ios');

    const appTargetName = xcodeProject.getFirstTarget().firstTarget.productName;
    if (!appTargetName) {
      console.warn('[withIosShortcuts] ❌ Tidak bisa mendapat nama App Target');
      return config;
    }

    const mainBundleId = config.ios?.bundleIdentifier || 'com.ingatuang.money';
    const extBundleId = `${mainBundleId}${EXTENSION_BUNDLE_SUFFIX}`;

    // ---- Buat direktori extension di ios/ ----
    const extDir = path.join(projectRoot, 'ios', EXTENSION_NAME);
    if (!fs.existsSync(extDir)) {
      fs.mkdirSync(extDir, { recursive: true });
      console.log(`[withIosShortcuts] ✅ Folder extension dibuat: ${EXTENSION_NAME}/`);
    }

    // ---- Copy file Intent ke folder extension ----
    const extensionFiles = [
      'QuickAddIntent.swift',
      'TransactionParser.swift',
      'TransactionQueuer.swift',
      'IngatUangIntents-Info.plist',
    ];

    extensionFiles.forEach((fileName) => {
      const src = path.join(sourceDir, fileName);
      const dest = path.join(extDir, fileName);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`[withIosShortcuts] ✅ Copied to extension: ${fileName}`);
      } else {
        console.warn(`[withIosShortcuts] ⚠️ File tidak ditemukan: ${src}`);
      }
    });

    // ---- Cek apakah extension target sudah ada ----
    const existingTargets = xcodeProject.pbxNativeTargetSection();
    const extAlreadyExists = Object.values(existingTargets).some(
      (t) => t && t.name === EXTENSION_NAME
    );

    if (extAlreadyExists) {
      console.log(`[withIosShortcuts] ⏭️ Extension target sudah ada: ${EXTENSION_NAME}`);
      return config;
    }

    // ---- Tambahkan extension target ke Xcode Project ----
    const extTarget = xcodeProject.addTarget(
      EXTENSION_NAME,
      'app_extension',
      EXTENSION_NAME,
      extBundleId
    );

    if (!extTarget) {
      console.warn('[withIosShortcuts] ❌ Gagal membuat extension target');
      return config;
    }

    console.log(`[withIosShortcuts] ✅ Extension target dibuat: ${EXTENSION_NAME} (${extBundleId})`);

    // ---- Tambahkan Swift files sebagai compile sources di extension ----
    const swiftFiles = [
      'QuickAddIntent.swift',
      'TransactionParser.swift',
      'TransactionQueuer.swift',
    ];

    const extGroup = xcodeProject.addPbxGroup(
      swiftFiles.map((f) => `${EXTENSION_NAME}/${f}`),
      EXTENSION_NAME,
      EXTENSION_NAME
    );

    // Tambahkan grup ke root project
    const pbxGroupKey = xcodeProject.findPBXGroupKey({ name: 'CustomTemplate' })
      || xcodeProject.findPBXGroupKey({ name: appTargetName })
      || xcodeProject.findPBXGroupKey({ name: '' });

    if (pbxGroupKey && extGroup) {
      xcodeProject.addToPbxGroup(extGroup.uuid, pbxGroupKey);
    }

    // Tambahkan setiap file ke build phase extension target
    swiftFiles.forEach((fileName) => {
      xcodeProject.addSourceFile(
        `${EXTENSION_NAME}/${fileName}`,
        { target: extTarget.uuid },
        extGroup?.uuid
      );
    });

    // Tambahkan Info.plist ke resource
    xcodeProject.addResourceFile(
      `${EXTENSION_NAME}/IngatUangIntents-Info.plist`,
      { target: extTarget.uuid },
      extGroup?.uuid
    );

    // ---- Build settings untuk extension ----
    const extBuildSettings = {
      PRODUCT_NAME: EXTENSION_NAME,
      PRODUCT_BUNDLE_IDENTIFIER: extBundleId,
      SWIFT_VERSION: '5.9',
      IPHONEOS_DEPLOYMENT_TARGET: '16.0',
      INFOPLIST_FILE: `${EXTENSION_NAME}/IngatUangIntents-Info.plist`,
      CODE_SIGN_ENTITLEMENTS: `${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements`,
      SKIP_INSTALL: 'YES',
      TARGETED_DEVICE_FAMILY: '"1,2"',
    };

    xcodeProject.addBuildProperty('PRODUCT_NAME', EXTENSION_NAME, EXTENSION_NAME);
    xcodeProject.addBuildProperty('SWIFT_VERSION', '5.9', EXTENSION_NAME);
    xcodeProject.addBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '16.0', EXTENSION_NAME);

    console.log(`[withIosShortcuts] ✅ Build settings extension dikonfigurasi`);

    return config;
  });

  // Step 2: Tambahkan App Group entitlement ke Main App
  config = withEntitlementsPlist(config, (config) => {
    const existing = config.modResults['com.apple.security.application-groups'] || [];
    if (!existing.includes(APP_GROUP)) {
      config.modResults['com.apple.security.application-groups'] = [...existing, APP_GROUP];
      console.log(`[withIosShortcuts] ✅ App Group ditambahkan ke main entitlement`);
    }
    return config;
  });

  return config;
};

module.exports = withIosShortcuts;
