#!/bin/bash

# MindEase ARM Template Deployment Script
# This script deploys Azure resources using ARM template

set -e

# Configuration
RESOURCE_GROUP_NAME="mindease-rg"
LOCATION="eastus"
DEPLOYMENT_NAME="mindease-deployment-$(date +%Y%m%d-%H%M%S)"
TEMPLATE_FILE="azure-resources.json"
GITHUB_REPO_URL=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting MindEase ARM Template Deployment...${NC}"

# Check if Azure CLI is installed and user is logged in
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! az account show &> /dev/null; then
    echo -e "${RED}Please log in to Azure CLI first: az login${NC}"
    exit 1
fi

# Prompt for GitHub repository URL if not set
if [ -z "$GITHUB_REPO_URL" ]; then
    echo -e "${YELLOW}Please enter your GitHub repository URL (e.g., https://github.com/username/mindease-chatbot):${NC}"
    read -r GITHUB_REPO_URL
    
    if [ -z "$GITHUB_REPO_URL" ]; then
        echo -e "${RED}GitHub repository URL is required for Static Web App deployment.${NC}"
        exit 1
    fi
fi

# Create resource group if it doesn't exist
echo -e "${YELLOW}Creating/updating resource group: $RESOURCE_GROUP_NAME${NC}"
az group create \
    --name $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --tags project=mindease environment=production

# Validate ARM template
echo -e "${YELLOW}Validating ARM template...${NC}"
az deployment group validate \
    --resource-group $RESOURCE_GROUP_NAME \
    --template-file $TEMPLATE_FILE \
    --parameters appName=mindease \
                 location=$LOCATION \
                 environment=production \
                 githubRepositoryUrl="$GITHUB_REPO_URL" \
                 githubBranch=main

if [ $? -ne 0 ]; then
    echo -e "${RED}ARM template validation failed. Please check the template.${NC}"
    exit 1
fi

echo -e "${GREEN}ARM template validation successful!${NC}"

# Deploy ARM template
echo -e "${YELLOW}Deploying ARM template...${NC}"
DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group $RESOURCE_GROUP_NAME \
    --name $DEPLOYMENT_NAME \
    --template-file $TEMPLATE_FILE \
    --parameters appName=mindease \
                 location=$LOCATION \
                 environment=production \
                 githubRepositoryUrl="$GITHUB_REPO_URL" \
                 githubBranch=main \
    --output json)

if [ $? -ne 0 ]; then
    echo -e "${RED}ARM template deployment failed.${NC}"
    exit 1
fi

# Extract outputs from deployment
KEY_VAULT_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.keyVaultName.value')
OPENAI_ENDPOINT=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.openAIEndpoint.value')
LANGUAGE_ENDPOINT=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.languageEndpoint.value')
CONTENT_SAFETY_ENDPOINT=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.contentSafetyEndpoint.value')
SPEECH_REGION=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.speechRegion.value')
STORAGE_ACCOUNT_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.storageAccountName.value')
STATIC_WEB_APP_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.staticWebAppName.value')
STATIC_WEB_APP_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.properties.outputs.staticWebAppUrl.value')

echo -e "${GREEN}ARM template deployment completed successfully!${NC}"

# Get API keys for services
echo -e "${YELLOW}Retrieving API keys...${NC}"

# Get service names from deployment
OPENAI_SERVICE_NAME=$(az cognitiveservices account list \
    --resource-group $RESOURCE_GROUP_NAME \
    --query "[?kind=='OpenAI'].name | [0]" -o tsv)

LANGUAGE_SERVICE_NAME=$(az cognitiveservices account list \
    --resource-group $RESOURCE_GROUP_NAME \
    --query "[?kind=='TextAnalytics'].name | [0]" -o tsv)

CONTENT_SAFETY_SERVICE_NAME=$(az cognitiveservices account list \
    --resource-group $RESOURCE_GROUP_NAME \
    --query "[?kind=='ContentSafety'].name | [0]" -o tsv)

SPEECH_SERVICE_NAME=$(az cognitiveservices account list \
    --resource-group $RESOURCE_GROUP_NAME \
    --query "[?kind=='SpeechServices'].name | [0]" -o tsv)

# Get API keys
OPENAI_KEY=$(az cognitiveservices account keys list \
    --name $OPENAI_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query key1 -o tsv)

LANGUAGE_KEY=$(az cognitiveservices account keys list \
    --name $LANGUAGE_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query key1 -o tsv)

CONTENT_SAFETY_KEY=$(az cognitiveservices account keys list \
    --name $CONTENT_SAFETY_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query key1 -o tsv)

SPEECH_KEY=$(az cognitiveservices account keys list \
    --name $SPEECH_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query key1 -o tsv)

# Get Static Web App deployment token
SWA_TOKEN=$(az staticwebapp secrets list \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query properties.apiKey -o tsv)

# Generate secure keys
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
DATABASE_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Store secrets in Key Vault
echo -e "${YELLOW}Storing secrets in Key Vault...${NC}"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "azure-openai-endpoint" --value "$OPENAI_ENDPOINT"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "azure-openai-api-key" --value "$OPENAI_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "azure-language-endpoint" --value "$LANGUAGE_ENDPOINT"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "azure-language-api-key" --value "$LANGUAGE_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "azure-content-safety-endpoint" --value "$CONTENT_SAFETY_ENDPOINT"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "azure-content-safety-api-key" --value "$CONTENT_SAFETY_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "azure-speech-key" --value "$SPEECH_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "azure-speech-region" --value "$SPEECH_REGION"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "jwt-secret" --value "$JWT_SECRET"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "encryption-key" --value "$ENCRYPTION_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "database-encryption-key" --value "$DATABASE_ENCRYPTION_KEY"

# Output deployment information
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Key Vault: $KEY_VAULT_NAME"
echo "Static Web App: $STATIC_WEB_APP_NAME"
echo "Static Web App URL: https://$STATIC_WEB_APP_URL"
echo ""
echo -e "${YELLOW}=== GitHub Secrets to Configure ===${NC}"
echo "AZURE_STATIC_WEB_APPS_API_TOKEN: $SWA_TOKEN"
echo "AZURE_OPENAI_ENDPOINT: $OPENAI_ENDPOINT"
echo "AZURE_OPENAI_API_KEY: $OPENAI_KEY"
echo "AZURE_LANGUAGE_ENDPOINT: $LANGUAGE_ENDPOINT"
echo "AZURE_LANGUAGE_API_KEY: $LANGUAGE_KEY"
echo "AZURE_CONTENT_SAFETY_ENDPOINT: $CONTENT_SAFETY_ENDPOINT"
echo "AZURE_CONTENT_SAFETY_API_KEY: $CONTENT_SAFETY_KEY"
echo "AZURE_SPEECH_KEY: $SPEECH_KEY"
echo "AZURE_SPEECH_REGION: $SPEECH_REGION"
echo "JWT_SECRET: $JWT_SECRET"
echo "ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo "DATABASE_ENCRYPTION_KEY: $DATABASE_ENCRYPTION_KEY"
echo "REACT_APP_API_BASE_URL: https://$STATIC_WEB_APP_URL"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Add the GitHub secrets listed above to your repository"
echo "2. Deploy a GPT-4 model to your OpenAI service"
echo "3. Push code to trigger the deployment pipeline"
echo "4. Test the application at: https://$STATIC_WEB_APP_URL"

# Save configuration to file
cat > deployment-config.json << EOF
{
  "deploymentName": "$DEPLOYMENT_NAME",
  "resourceGroup": "$RESOURCE_GROUP_NAME",
  "location": "$LOCATION",
  "keyVault": "$KEY_VAULT_NAME",
  "staticWebApp": {
    "name": "$STATIC_WEB_APP_NAME",
    "url": "https://$STATIC_WEB_APP_URL",
    "deploymentToken": "$SWA_TOKEN"
  },
  "services": {
    "openai": {
      "name": "$OPENAI_SERVICE_NAME",
      "endpoint": "$OPENAI_ENDPOINT"
    },
    "language": {
      "name": "$LANGUAGE_SERVICE_NAME",
      "endpoint": "$LANGUAGE_ENDPOINT"
    },
    "contentSafety": {
      "name": "$CONTENT_SAFETY_SERVICE_NAME",
      "endpoint": "$CONTENT_SAFETY_ENDPOINT"
    },
    "speech": {
      "name": "$SPEECH_SERVICE_NAME",
      "region": "$SPEECH_REGION"
    }
  },
  "storage": "$STORAGE_ACCOUNT_NAME"
}
EOF

echo -e "${GREEN}Configuration saved to deployment-config.json${NC}"