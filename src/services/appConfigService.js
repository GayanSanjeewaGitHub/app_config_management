const { 
  AppConfigDataClient, 
  StartConfigurationSessionCommand, 
  GetLatestConfigurationCommand 
} = require('@aws-sdk/client-appconfigdata');

class AppConfigService {
  constructor() {
    this.client = new AppConfigDataClient({ 
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.application = process.env.APP_CONFIG_APPLICATION;
    this.environment = process.env.APP_CONFIG_ENVIRONMENT;
    this.configuration = process.env.APP_CONFIG_CONFIGURATION;
    this.pollInterval = parseInt(process.env.APP_CONFIG_POLL_INTERVAL) || 30000;
    
    this.sessionToken = null;
    this.configurationData = {};
    this.featureFlags = {};
    this.nextPollConfigurationToken = null;
  }

  /**
   * Initialize the App Config session
   */
  async initialize() {
    try {
      console.log('🚀 Initializing AWS App Config...');
      
      const command = new StartConfigurationSessionCommand({
        ApplicationIdentifier: this.application,
        EnvironmentIdentifier: this.environment,
        ConfigurationProfileIdentifier: this.configuration,
        RequiredMinimumPollIntervalInSeconds: Math.floor(this.pollInterval / 1000)
      });

      const response = await this.client.send(command);
      this.sessionToken = response.InitialConfigurationToken;
      
      console.log('✅ App Config session initialized successfully');
      
      // Fetch initial configuration
      await this.fetchConfiguration();
      
      // Start polling for configuration updates
      this.startPolling();
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing App Config:', error.message);
      throw error;
    }
  }

  /**
   * Fetch the latest configuration from App Config
   */
  async fetchConfiguration() {
    try {
      const command = new GetLatestConfigurationCommand({
        ConfigurationToken: this.sessionToken || this.nextPollConfigurationToken
      });

      const response = await this.client.send(command);
      
      // Update the token for next poll
      this.nextPollConfigurationToken = response.NextPollConfigurationToken;

      // Parse configuration if there's new data
      if (response.Configuration && response.Configuration.length > 0) {
        const configText = new TextDecoder().decode(response.Configuration);
        const parsedConfig = JSON.parse(configText);
        
        this.configurationData = parsedConfig;
        
        // Extract feature flags if they exist in the config
        if (parsedConfig.featureFlags) {
          this.featureFlags = parsedConfig.featureFlags;
          console.log('🎌 Feature flags updated:', this.featureFlags);
        }
        
        console.log('📦 Configuration updated from App Config');
      }
      
      return this.configurationData;
    } catch (error) {
      console.error('❌ Error fetching configuration:', error.message);
      return this.configurationData; // Return cached config on error
    }
  }

  /**
   * Start polling for configuration updates
   */
  startPolling() {
    setInterval(async () => {
      await this.fetchConfiguration();
    }, this.pollInterval);
    
    console.log(`🔄 Configuration polling started (interval: ${this.pollInterval}ms)`);
  }

  /**
   * Check if a feature flag is enabled
   */
  isFeatureEnabled(featureName) {
    return this.featureFlags[featureName] === true;
  }

  /**
   * Get a configuration value
   */
  getConfig(key, defaultValue = null) {
    return this.configurationData[key] || defaultValue;
  }

  /**
   * Get all feature flags
   */
  getAllFeatureFlags() {
    return this.featureFlags;
  }

  /**
   * Get all configuration data
   */
  getAllConfig() {
    return this.configurationData;
  }
}

// Singleton instance
const appConfigService = new AppConfigService();

module.exports = appConfigService;
