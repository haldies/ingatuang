const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
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

config.cacheStores = [
  {
    name: 'metro-cache',
    type: 'filesystem',
  },
];

config.resolver = {
  ...config.resolver,
  blockList: [
    /node_modules\/.*\/__(tests|mocks)__\/.*/,
    /.*\/__tests__\/.*/,
    /.*\.test\.(js|jsx|ts|tsx)$/,
    /.*\.spec\.(js|jsx|ts|tsx)$/,
  ],
};

module.exports = config;
