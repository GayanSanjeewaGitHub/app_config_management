const appConfigService = require('../services/appConfigService');

/**
 * Middleware to check if a feature flag is enabled
 */
const featureFlagMiddleware = (featureName) => {
  return (req, res, next) => {
    const isEnabled = appConfigService.isFeatureEnabled(featureName);
    
    if (!isEnabled) {
      return res.status(403).json({
        success: false,
        message: `Feature '${featureName}' is currently disabled`,
        feature: featureName,
        enabled: false
      });
    }
    
    // Feature is enabled, continue to the next middleware/handler
    next();
  };
};

module.exports = featureFlagMiddleware;
