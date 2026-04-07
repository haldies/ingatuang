const { withXcodeProject, withEntitlementsPlist } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withSimpleIntents = (config) => {
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    
    // 1. Define paths
    const sourceDir = path.join(projectRoot, 'modules', 'shared-storage', 'intents');
    const targetDirName = 'AppIntents';
    const iosAppDir = path.join(projectRoot, 'ios', config.modRequest.projectName, targetDirName);

    // 2. Ensure target directory exists in ios/ folder
    if (!fs.existsSync(iosAppDir)) {
      fs.mkdirSync(iosAppDir, { recursive: true });
    }

    const filesToSync = [
      'QuickAddIntent.swift'
    ];

    // 3. Copy files to the ios build directory
    filesToSync.forEach((file) => {
      const src = path.join(sourceDir, file);
      const dest = path.join(iosAppDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`[withSimpleIntents] ✅ Copied ${file} to ios/`);
      }
    });

    // 4. Register files in Xcode project
    const mainTargetUuid = xcodeProject.getFirstTarget().uuid;
    const appName = config.modRequest.projectName;
    
    // Find or create group
    const pbxGroupKey = xcodeProject.findPBXGroupKey({ name: appName });
    let group = xcodeProject.pbxGroupByName(targetDirName);
    if (!group) {
        group = xcodeProject.addPbxGroup([], targetDirName, targetDirName);
        if (pbxGroupKey) {
            xcodeProject.addToPbxGroup(group.uuid, pbxGroupKey);
        }
    }

    filesToSync.forEach((file) => {
      const relativePath = path.join(targetDirName, file);
      if (!xcodeProject.hasFile(relativePath)) {
        xcodeProject.addSourceFile(relativePath, { target: mainTargetUuid }, group.uuid);
        console.log(`[withSimpleIntents] ✅ Linked ${file} to main target`);
      }
    });

    return config;
  });

  // 5. Add App Group Entitlements to Main App
  config = withEntitlementsPlist(config, (config) => {
    const APP_GROUP = 'group.com.ingatuang.money.shared';
    const groups = config.modResults['com.apple.security.application-groups'] || [];
    if (!groups.includes(APP_GROUP)) {
      config.modResults['com.apple.security.application-groups'] = [...groups, APP_GROUP];
      console.log(`[withSimpleIntents] ✅ Added App Group: ${APP_GROUP}`);
    }
    return config;
  });

  return config;
};

module.exports = withSimpleIntents;
