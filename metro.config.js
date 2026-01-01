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

// Optimize bundle size
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    compress: {
      drop_console: true, // Remove console.log in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
    },
    mangle: {
      keep_fnames: false,
    },
    output: {
      comments: false,
      ascii_only: true,
    },
  },
};

const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(config, { input: './global.css' });
