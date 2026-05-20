const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase @firebase/auth RN entry (getReactNativePersistence) için
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
