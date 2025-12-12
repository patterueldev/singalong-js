const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Make webpack process node_modules packages that aren't pre-compiled
  config.module.rules.forEach(rule => {
    if (rule.oneOf) {
      // Find the babel-loader rule
      const babelLoader = rule.oneOf.find(r => 
        r.loader && r.loader.includes('babel-loader')
      );
      
      if (babelLoader && babelLoader.include) {
        // Add ui-library to be processed by babel
        const originalInclude = babelLoader.include;
        babelLoader.include = function(modulePath) {
          // Include ui-library dist folder
          if (modulePath.includes('singalong-ui-library')) {
            return true;
          }
          // Use original include logic for everything else
          if (Array.isArray(originalInclude)) {
            return originalInclude.some(inc => modulePath.includes(inc));
          }
          return modulePath.includes(originalInclude);
        };
      }
    }
  });
  
  return config;
};
