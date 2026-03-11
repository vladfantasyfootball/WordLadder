module.exports = function(api) {
  api.cache(true);
  
  // Use .env.production in production builds, .env in development
  const envFile = process.env.EAS_BUILD === 'true' ? '.env.production' : '.env';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": envFile,
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
