module.exports = function(api) {
  api.cache(true);
  return {
    "presets": ["module:@react-native/babel-preset"],
    "plugins": [
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": null,
        "safe": true,
        "allowUndefined": true
      }],
      "@babel/plugin-proposal-export-namespace-from",
      "react-native-reanimated/plugin",
    ]
  };
};
