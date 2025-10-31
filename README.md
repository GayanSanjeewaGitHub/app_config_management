# AWS App Config & Parameter Store CRUD Application

A Node.js REST API application demonstrating integration with **AWS App Config** for feature flags and dynamic configuration, and **AWS Systems Manager Parameter Store** for secure parameter management.

## 🎯 Features

- **CRUD Operations**: Complete REST API for managing items (Create, Read, Update, Delete)
- **AWS App Config Integration**: 
  - Dynamic configuration management
  - Feature flag support
  - Automatic configuration polling and updates
- **AWS Parameter Store Integration**:
  - Secure parameter retrieval
  - Support for encrypted parameters (SecureString)
  - Parameter caching for improved performance
- **Feature Flag Middleware**: Protect routes based on feature flag status
- **In-Memory Data Store**: Simple data persistence for demo purposes

## 📋 Prerequisites

- Node.js (v14 or higher)
- AWS Account with appropriate permissions
- AWS CLI configured with credentials (or environment variables set)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd app_config_management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your AWS configuration:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# AWS App Config Settings
APP_CONFIG_APPLICATION=MyApplication
APP_CONFIG_ENVIRONMENT=Production
APP_CONFIG_CONFIGURATION=MyConfig
APP_CONFIG_POLL_INTERVAL=30000

# AWS Parameter Store Settings
PARAMETER_STORE_PATH=/myapp/config/

# Server Settings
PORT=3000
```

### 4. Set Up AWS Resources

#### AWS App Config Setup

1. **Create an Application:**
   ```bash
   aws appconfig create-application --name MyApplication --description "My sample application"
   ```

2. **Create an Environment:**
   ```bash
   aws appconfig create-environment --application-id <app-id> --name Production --description "Production environment"
   ```

3. **Create a Configuration Profile:**
   ```bash
   aws appconfig create-configuration-profile --application-id <app-id> --name MyConfig --location-uri hosted --type AWS.Freeform
   ```

4. **Create a Hosted Configuration Version:**
   
   Create a file `config.json` with your configuration:
   ```json
   {
     "featureFlags": {
       "enableCreate": true,
       "enableUpdate": true,
       "enableDelete": false
     },
     "appName": "My CRUD App",
     "maxItemsPerPage": 100
   }
   ```

   Deploy it:
   ```bash
   aws appconfig create-hosted-configuration-version --application-id <app-id> --configuration-profile-id <profile-id> --content fileb://config.json --content-type "application/json"
   ```

5. **Start a Deployment:**
   ```bash
   aws appconfig start-deployment --application-id <app-id> --environment-id <env-id> --deployment-strategy-id <strategy-id> --configuration-profile-id <profile-id> --configuration-version <version>
   ```

#### AWS Parameter Store Setup

Add some sample parameters:

```bash
# Add database configuration
aws ssm put-parameter --name "/myapp/config/database/host" --value "localhost" --type String
aws ssm put-parameter --name "/myapp/config/database/port" --value "5432" --type String
aws ssm put-parameter --name "/myapp/config/database/name" --value "mydb" --type String
aws ssm put-parameter --name "/myapp/config/database/user" --value "admin" --type String
aws ssm put-parameter --name "/myapp/config/database/password" --value "secret123" --type SecureString

# Add API keys
aws ssm put-parameter --name "/myapp/config/api-keys/external-api" --value "your-api-key" --type SecureString
```

### 5. Run the Application

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Endpoints

### Items CRUD

| Method | Endpoint | Description | Feature Flag |
|--------|----------|-------------|--------------|
| GET | `/api/items` | Get all items | - |
| GET | `/api/items/:id` | Get item by ID | - |
| POST | `/api/items` | Create new item | `enableCreate` |
| PUT | `/api/items/:id` | Update item | `enableUpdate` |
| DELETE | `/api/items/:id` | Delete item | `enableDelete` |

### Configuration Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/appconfig` | Get all App Config data |
| GET | `/api/config/feature-flags` | Get all feature flags |
| GET | `/api/config/feature-flags/:name` | Check specific feature flag |
| GET | `/api/config/parameter-store` | Get all parameters from base path |
| GET | `/api/config/parameter-store/:name` | Get specific parameter |
| POST | `/api/config/refresh` | Force refresh App Config |
| DELETE | `/api/config/cache` | Clear Parameter Store cache |

### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API documentation |
| GET | `/health` | Health check |

## 🧪 Testing the API

### Using cURL

**Get all items:**
```bash
curl http://localhost:3000/api/items
```

**Create a new item:**
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"New Item","description":"My new item"}'
```

**Check feature flag:**
```bash
curl http://localhost:3000/api/config/feature-flags/enableCreate
```

**Get parameter from Parameter Store:**
```bash
curl http://localhost:3000/api/config/parameter-store/database/host
```

### Using Postman

Import the following endpoints into Postman or use the built-in documentation at `http://localhost:3000`

## 🔧 Configuration

### Feature Flags

Feature flags are defined in your App Config configuration. Update the configuration in AWS App Config:

```json
{
  "featureFlags": {
    "enableCreate": true,
    "enableUpdate": true,
    "enableDelete": false
  }
}
```

The application automatically polls for updates every 30 seconds (configurable via `APP_CONFIG_POLL_INTERVAL`).

### Parameter Store

Parameters can be organized hierarchically. The application uses the base path defined in `PARAMETER_STORE_PATH`.

Example structure:
```
/myapp/config/
  ├── database/
  │   ├── host
  │   ├── port
  │   ├── name
  │   ├── user
  │   └── password
  └── api-keys/
      └── external-api
```

## 🏗️ Project Structure

```
app_config_management/
├── src/
│   ├── middleware/
│   │   └── featureFlagMiddleware.js    # Feature flag protection
│   ├── routes/
│   │   ├── items.js                    # CRUD routes
│   │   └── config.js                   # Configuration routes
│   ├── services/
│   │   ├── appConfigService.js         # App Config integration
│   │   └── parameterStoreService.js    # Parameter Store integration
│   └── server.js                       # Application entry point
├── .env.example                         # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use IAM roles** when running on EC2/ECS instead of access keys
3. **Use SecureString** for sensitive parameters in Parameter Store
4. **Encrypt App Config data** for sensitive configuration
5. **Apply least privilege** IAM policies for App Config and Parameter Store access

### Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "appconfig:StartConfigurationSession",
        "appconfig:GetLatestConfiguration"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/myapp/*"
    }
  ]
}
```

## 🐛 Troubleshooting

**App Config initialization fails:**
- Verify your App Config application, environment, and configuration names
- Ensure you have deployed a configuration version
- Check AWS credentials and permissions

**Parameter Store returns null:**
- Verify parameter names match exactly (case-sensitive)
- Check the base path configuration
- Ensure IAM permissions for SSM

**Feature flags not updating:**
- Check the poll interval setting
- Verify the App Config deployment is complete
- Manually trigger refresh: `POST /api/config/refresh`

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.