const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const sdkRoot = path.resolve(workspaceRoot, 'sdk');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (so SDK changes trigger rebuilds)
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
// Project node_modules comes first, then SDK's, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(sdkRoot, 'node_modules'),  // For SDK dependencies like axios
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Add specific alias for our local SDK package
config.resolver.extraNodeModules = {
  '@bharat-engine/sdk': sdkRoot,
};

// NOTE: We intentionally do NOT set disableHierarchicalLookup = true
// because React Native's internal modules need hierarchical lookup to work!

module.exports = config;
