const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withObjectiveCAppDelegate = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, 'ios');
      
      if (fs.existsSync(iosPath)) {
        const appName = config.modRequest.projectName || config.name;
        const swiftAppDelegate = path.join(iosPath, appName, 'AppDelegate.swift');
        
        // Remove Swift AppDelegate if it exists
        if (fs.existsSync(swiftAppDelegate)) {
          fs.unlinkSync(swiftAppDelegate);
          console.log('Removed Swift AppDelegate');
        }
      }
      
      return config;
    },
  ]);
};

module.exports = withObjectiveCAppDelegate;
