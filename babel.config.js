module.exports = function (api) {
  api.cache(true);

  // Add custom babel plugins in the babel.plugins.js file
  const buildAdditionalPlugins = require("./babel.plugins");

  return {
    presets: [
      [
        "babel-preset-expo",
        // Remove jsxImportSource since we're not using NativeWind classes
      ],
      // Remove nativewind/babel preset since we're not using it
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],

          alias: {
            "@": "./",
            "tailwind.config": "./tailwind.config.js",
          },
        },
      ],
      "@babel/plugin-proposal-export-namespace-from",
      ...buildAdditionalPlugins(api),
      "react-native-worklets/plugin", // Must be last
    ],
  };
};
