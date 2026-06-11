const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  new RegExp(path.resolve("..", "..", "node_modules", "react")),
  new RegExp(path.resolve("..", "..", "node_modules", "react-native")),
];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "./node_modules"),
  path.resolve(__dirname, "../../node_modules"),
];

config.resolver.extraNodeModules = {
  "expo-key-event": "../..",
};

config.watchFolders = [path.resolve(__dirname, "..", "..")];

module.exports = config;
