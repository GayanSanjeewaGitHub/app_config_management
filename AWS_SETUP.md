# AWS Setup Commands Reference

## Quick Setup Script

### 1. Set Variables
```bash
export AWS_REGION=us-east-1
export APP_NAME=MyApplication
export ENV_NAME=Production
export CONFIG_NAME=MyConfig
```

### 2. Create App Config Resources
```bash
# Create Application
APP_ID=$(aws appconfig create-application \
  --name $APP_NAME \
  --description "CRUD application with feature flags" \
  --query 'Id' --output text)

echo "Application ID: $APP_ID"

# Create Environment
ENV_ID=$(aws appconfig create-environment \
  --application-id $APP_ID \
  --name $ENV_NAME \
  --description "Production environment" \
  --query 'Id' --output text)

echo "Environment ID: $ENV_ID"

# Create Configuration Profile
PROFILE_ID=$(aws appconfig create-configuration-profile \
  --application-id $APP_ID \
  --name $CONFIG_NAME \
  --location-uri hosted \
  --type AWS.Freeform \
  --query 'Id' --output text)

echo "Configuration Profile ID: $PROFILE_ID"

# Create Hosted Configuration Version
VERSION=$(aws appconfig create-hosted-configuration-version \
  --application-id $APP_ID \
  --configuration-profile-id $PROFILE_ID \
  --content fileb://config.example.json \
  --content-type "application/json" \
  --query 'VersionNumber' --output text)

echo "Configuration Version: $VERSION"

# Get default deployment strategy
STRATEGY_ID=$(aws appconfig list-deployment-strategies \
  --query 'Items[?Name==`AppConfig.AllAtOnce`].Id' \
  --output text)

echo "Deployment Strategy ID: $STRATEGY_ID"

# Start Deployment
aws appconfig start-deployment \
  --application-id $APP_ID \
  --environment-id $ENV_ID \
  --deployment-strategy-id $STRATEGY_ID \
  --configuration-profile-id $PROFILE_ID \
  --configuration-version $VERSION

echo "Deployment started successfully!"
```

### 3. Create Parameter Store Parameters
```bash
# Database configuration
aws ssm put-parameter \
  --name "/myapp/config/database/host" \
  --value "localhost" \
  --type String \
  --description "Database host"

aws ssm put-parameter \
  --name "/myapp/config/database/port" \
  --value "5432" \
  --type String \
  --description "Database port"

aws ssm put-parameter \
  --name "/myapp/config/database/name" \
  --value "mydb" \
  --type String \
  --description "Database name"

aws ssm put-parameter \
  --name "/myapp/config/database/user" \
  --value "admin" \
  --type String \
  --description "Database user"

aws ssm put-parameter \
  --name "/myapp/config/database/password" \
  --value "ChangeMe123!" \
  --type SecureString \
  --description "Database password (encrypted)"

# API Keys
aws ssm put-parameter \
  --name "/myapp/config/api-keys/external-api" \
  --value "your-api-key-here" \
  --type SecureString \
  --description "External API key (encrypted)"

aws ssm put-parameter \
  --name "/myapp/config/api-keys/payment-gateway" \
  --value "payment-api-key-here" \
  --type SecureString \
  --description "Payment gateway API key (encrypted)"

echo "Parameter Store parameters created successfully!"
```

### 4. Update .env File
```bash
# Update your .env file with the IDs
cat > .env << EOF
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

APP_CONFIG_APPLICATION=$APP_NAME
APP_CONFIG_ENVIRONMENT=$ENV_NAME
APP_CONFIG_CONFIGURATION=$CONFIG_NAME
APP_CONFIG_POLL_INTERVAL=30000

PARAMETER_STORE_PATH=/myapp/config/

PORT=3000
EOF

echo ".env file created!"
```

## Update Configuration

### Update App Config
```bash
# Create new configuration version
NEW_VERSION=$(aws appconfig create-hosted-configuration-version \
  --application-id $APP_ID \
  --configuration-profile-id $PROFILE_ID \
  --content fileb://config.example.json \
  --content-type "application/json" \
  --query 'VersionNumber' --output text)

# Deploy new version
aws appconfig start-deployment \
  --application-id $APP_ID \
  --environment-id $ENV_ID \
  --deployment-strategy-id $STRATEGY_ID \
  --configuration-profile-id $PROFILE_ID \
  --configuration-version $NEW_VERSION
```

### Update Parameter Store
```bash
# Update a parameter
aws ssm put-parameter \
  --name "/myapp/config/database/host" \
  --value "new-host.example.com" \
  --type String \
  --overwrite
```

## Cleanup Resources

### Delete App Config Resources
```bash
# Delete deployment (if any active)
# aws appconfig stop-deployment --application-id $APP_ID --environment-id $ENV_ID --deployment-number <number>

# Delete configuration profile
aws appconfig delete-configuration-profile \
  --application-id $APP_ID \
  --configuration-profile-id $PROFILE_ID

# Delete environment
aws appconfig delete-environment \
  --application-id $APP_ID \
  --environment-id $ENV_ID

# Delete application
aws appconfig delete-application --application-id $APP_ID

echo "App Config resources deleted!"
```

### Delete Parameter Store Parameters
```bash
# Delete all parameters under path
aws ssm delete-parameters \
  --names $(aws ssm get-parameters-by-path \
    --path "/myapp/config" \
    --recursive \
    --query 'Parameters[].Name' \
    --output text)

echo "Parameter Store parameters deleted!"
```

## Verify Setup

### Check App Config
```bash
# List applications
aws appconfig list-applications

# List environments
aws appconfig list-environments --application-id $APP_ID

# List configuration profiles
aws appconfig list-configuration-profiles --application-id $APP_ID

# List deployments
aws appconfig list-deployments --application-id $APP_ID --environment-id $ENV_ID
```

### Check Parameter Store
```bash
# List all parameters
aws ssm get-parameters-by-path \
  --path "/myapp/config" \
  --recursive \
  --with-decryption

# Get specific parameter
aws ssm get-parameter \
  --name "/myapp/config/database/host" \
  --with-decryption
```
