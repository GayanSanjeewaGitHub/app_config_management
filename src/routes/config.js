const express = require('express');
const router = express.Router();
const appConfigService = require('../services/appConfigService');
const parameterStoreService = require('../services/parameterStoreService');

/**
 * @route   GET /api/config/appconfig
 * @desc    Get all App Config data
 * @access  Public
 */
router.get('/appconfig', (req, res) => {
  res.json({
    success: true,
    data: appConfigService.getAllConfig()
  });
});

/**
 * @route   GET /api/config/feature-flags
 * @desc    Get all feature flags from App Config
 * @access  Public
 */
router.get('/feature-flags', (req, res) => {
  res.json({
    success: true,
    data: appConfigService.getAllFeatureFlags()
  });
});

/**
 * @route   GET /api/config/feature-flags/:name
 * @desc    Check if a specific feature flag is enabled
 * @access  Public
 */
router.get('/feature-flags/:name', (req, res) => {
  const featureName = req.params.name;
  const isEnabled = appConfigService.isFeatureEnabled(featureName);
  
  res.json({
    success: true,
    feature: featureName,
    enabled: isEnabled
  });
});

/**
 * @route   GET /api/config/parameter-store/:name
 * @desc    Get a parameter from Parameter Store
 * @access  Public
 */
router.get('/parameter-store/:name', async (req, res) => {
  try {
    const paramName = req.params.name;
    const value = await parameterStoreService.getRelativeParameter(paramName);
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        message: 'Parameter not found'
      });
    }
    
    res.json({
      success: true,
      parameter: paramName,
      value: value
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving parameter',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/config/parameter-store
 * @desc    Get all parameters from Parameter Store base path
 * @access  Public
 */
router.get('/parameter-store', async (req, res) => {
  try {
    const parameters = await parameterStoreService.getParametersByPath();
    
    res.json({
      success: true,
      count: Object.keys(parameters).length,
      data: parameters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving parameters',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/config/refresh
 * @desc    Force refresh configuration from App Config
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    await appConfigService.fetchConfiguration();
    
    res.json({
      success: true,
      message: 'Configuration refreshed successfully',
      data: appConfigService.getAllConfig()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error refreshing configuration',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/config/cache
 * @desc    Clear Parameter Store cache
 * @access  Public
 */
router.delete('/cache', (req, res) => {
  parameterStoreService.clearCache();
  
  res.json({
    success: true,
    message: 'Parameter Store cache cleared successfully'
  });
});

module.exports = router;
