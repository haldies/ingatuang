const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ignore build folders to prevent watch errors
config.watchFolders = [];
config.resolver = {
  ...config.resolver,
  blockList: [
    /node_modules\/.*\/android\/.*\/build\/.*/,
    /android\/.*\/build\/.*/,
  ],
};

const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(config, { input: './global.css' });
