const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');

class ParameterStoreService {
  constructor() {
    this.client = new SSMClient({ 
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.basePath = process.env.PARAMETER_STORE_PATH || '/myapp/config/';
    this.cache = {};
  }

  /**
   * Get a single parameter from Parameter Store
   */
  async getParameter(parameterName, useCache = true) {
    try {
      // Check cache first
      if (useCache && this.cache[parameterName]) {
        console.log(`📦 Retrieved parameter from cache: ${parameterName}`);
        return this.cache[parameterName];
      }

      const command = new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true // Decrypt SecureString parameters
      });

      const response = await this.client.send(command);
      const value = response.Parameter.Value;
      
      // Store in cache
      this.cache[parameterName] = value;
      
      console.log(`✅ Retrieved parameter: ${parameterName}`);
      return value;
    } catch (error) {
      if (error.name === 'ParameterNotFound') {
        console.warn(`⚠️  Parameter not found: ${parameterName}`);
        return null;
      }
      console.error(`❌ Error getting parameter ${parameterName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all parameters under a specific path
   */
  async getParametersByPath(path = null, useCache = true) {
    try {
      const parameterPath = path || this.basePath;
      const cacheKey = `path:${parameterPath}`;
      
      // Check cache first
      if (useCache && this.cache[cacheKey]) {
        console.log(`📦 Retrieved parameters from cache: ${parameterPath}`);
        return this.cache[cacheKey];
      }

      const command = new GetParametersByPathCommand({
        Path: parameterPath,
        Recursive: true,
        WithDecryption: true
      });

      const response = await this.client.send(command);
      
      // Convert array to key-value object
      const parameters = {};
      if (response.Parameters) {
        response.Parameters.forEach(param => {
          // Remove the path prefix from the parameter name
          const key = param.Name.replace(parameterPath, '').replace(/^\//, '');
          parameters[key] = param.Value;
        });
      }
      
      // Store in cache
      this.cache[cacheKey] = parameters;
      
      console.log(`✅ Retrieved ${Object.keys(parameters).length} parameters from path: ${parameterPath}`);
      return parameters;
    } catch (error) {
      console.error(`❌ Error getting parameters by path ${parameterPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get a parameter with a relative path (based on basePath)
   */
  async getRelativeParameter(relativeName, useCache = true) {
    const fullPath = `${this.basePath}${relativeName}`;
    return await this.getParameter(fullPath, useCache);
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache = {};
    console.log('🗑️  Parameter Store cache cleared');
  }

  /**
   * Clear cache for a specific parameter
   */
  clearParameterCache(parameterName) {
    delete this.cache[parameterName];
    console.log(`🗑️  Cache cleared for parameter: ${parameterName}`);
  }

  /**
   * Get database connection string (example usage)
   */
  async getDatabaseConfig() {
    try {
      const dbHost = await this.getRelativeParameter('database/host');
      const dbPort = await this.getRelativeParameter('database/port');
      const dbName = await this.getRelativeParameter('database/name');
      const dbUser = await this.getRelativeParameter('database/user');
      const dbPassword = await this.getRelativeParameter('database/password');
      
      return {
        host: dbHost,
        port: dbPort,
        database: dbName,
        user: dbUser,
        password: dbPassword
      };
    } catch (error) {
      console.error('❌ Error getting database config:', error.message);
      return null;
    }
  }

  /**
   * Get API keys (example usage)
   */
  async getApiKeys() {
    try {
      return await this.getParametersByPath(`${this.basePath}api-keys/`);
    } catch (error) {
      console.error('❌ Error getting API keys:', error.message);
      return {};
    }
  }
}

// Singleton instance
const parameterStoreService = new ParameterStoreService();

module.exports = parameterStoreService;
