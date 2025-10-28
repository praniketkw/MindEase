#!/bin/bash

# MindEase Azure Resource Deployment Script
# This script creates all necessary Azure resources for the MindEase application

set -e

# Configuration variables
RESOURCE_GROUP_NAME="mind-ease"
LOCATION="eastus2"
APP_NAME="mindease-app"
KEY_VAULT_NAME="mindease-kv-$(date +%s)"
STORAGE_ACCOUNT_NAME="mindeasestorage$(date +%s | tail -c 6)"
STATIC_WEB_APP_NAME="mindease-swa"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting MindEase Azure Resource Deployment...${NC}"

# Check if Azure CLI is installed and user is logged in
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! az account show &> /dev/null; then
    echo -e "${RED}Please log in to Azure CLI first: az login${NC}"
    exit 1
fi

# Get current subscription
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo -e "${YELLOW}Using subscription: $SUBSCRIPTION_ID${NC}"

# Create resource group
echo -e "${YELLOW}Creating resource group: $RESOURCE_GROUP_NAME${NC}"
az group create \
    --name $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --tags project=mindease environment=production

# Create Key Vault for secure API key management
echo -e "${YELLOW}Creating Key Vault: $KEY_VAULT_NAME${NC}"
az keyvault create \
    --name $KEY_VAULT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --sku standard \
    --enable-soft-delete true \
    --retention-days 7 \
    --tags project=mindease environment=production

# Create Azure OpenAI Service
echo -e "${YELLOW}Creating Azure OpenAI Service...${NC}"
OPENAI_SERVICE_NAME="mindease-openai-$(date +%s | tail -c 6)"
az cognitiveservices account create \
    --name $OPENAI_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --kind OpenAI \
    --sku S0 \
    --tags project=mindease environment=production

# Get OpenAI endpoint and key
OPENAI_ENDPOINT=$(az cognitiveservices account show \
    --name $OPENAI_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query properties.endpoint -o tsv)

OPENAI_KEY=$(az cognitiveservices account keys list \
    --name $OPENAI_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query key1 -o tsv)

# Create Azure AI Language Service
echo -e "${YELLOW}Creating Azure AI Language Service...${NC}"
LANGUAGE_SERVICE_NAME="mindease-language-$(date +%s | tail -c 6)"
az cognitiveservices account create \
    --name $LANGUAGE_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --kind TextAnalytics \
    --sku S \
    --tags project=mindease environment=production

# Get Language service endpoint and key
LANGUAGE_ENDPOINT=$(az cognitiveservices account show \
    --name $LANGUAGE_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query properties.endpoint -o tsv)

LANGUAGE_KEY=$(az cognitiveservices account keys list \
    --name $LANGUAGE_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query key1 -o tsv)

# Create Azure Content Safety Service
echo -e "${YELLOW}Creating Azure Content Safety Service...${NC}"
CONTENT_SAFETY_SERVICE_NAME="mindease-safety-$(date +%s | tail -c 6)"
az cognitiveservices account create \
    --name $CONTENT_SAFETY_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --kind ContentSafety \
    --sku S0 \
    --tags project=mindease environment=production

# Get Content Safety endpoint and key
CONTENT_SAFETY_ENDPOINT=$(az cognitiveservices account show \
    --name $CONTENT_SAFETY_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query properties.endpoint -o tsv)

CONTENT_SAFETY_KEY=$(az cognitiveservices account keys list \
    --name $CONTENT_SAFETY_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query key1 -o tsv)

# Create Azure Speech Service
echo -e "${YELLOW}Creating Azure Speech Service...${NC}"
SPEECH_SERVICE_NAME="mindease-speech-$(date +%s | tail -c 6)"
az cognitiveservices account create \
    --name $SPEECH_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --kind SpeechServices \
    --sku S0 \
    --tags project=mindease environment=production

# Get Speech service key
SPEECH_KEY=$(az cognitiveservices account keys list \
    --name $SPEECH_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query key1 -o tsv)

# Create Storage Account for backups
echo -e "${YELLOW}Creating Storage Account: $STORAGE_ACCOUNT_NAME${NC}"
az storage account create \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --sku Standard_LRS \
    --kind StorageV2 \
    --access-tier Hot \
    --tags project=mindease environment=production

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
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "azure-speech-region" --value "$LOCATION"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "jwt-secret" --value "$JWT_SECRET"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "encryption-key" --value "$ENCRYPTION_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "database-encryption-key" --value "$DATABASE_ENCRYPTION_KEY"

# Create Static Web App
echo -e "${YELLOW}Creating Azure Static Web App...${NC}"
az staticwebapp create \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --source https://github.com/YOUR_USERNAME/mindease-chatbot \
    --branch main \
    --app-location "/frontend" \
    --api-location "/backend" \
    --output-location "build" \
    --tags project=mindease environment=production

# Get Static Web App deployment token
SWA_TOKEN=$(az staticwebapp secrets list \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query properties.apiKey -o tsv)

# Output deployment information
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Key Vault: $KEY_VAULT_NAME"
echo "OpenAI Service: $OPENAI_SERVICE_NAME"
echo "Language Service: $LANGUAGE_SERVICE_NAME"
echo "Content Safety Service: $CONTENT_SAFETY_SERVICE_NAME"
echo "Speech Service: $SPEECH_SERVICE_NAME"
echo "Storage Account: $STORAGE_ACCOUNT_NAME"
echo "Static Web App: $STATIC_WEB_APP_NAME"
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
echo "AZURE_SPEECH_REGION: $LOCATION"
echo "JWT_SECRET: $JWT_SECRET"
echo "ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo "DATABASE_ENCRYPTION_KEY: $DATABASE_ENCRYPTION_KEY"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Add the GitHub secrets listed above to your repository"
echo "2. Update the GitHub repository URL in the Static Web App configuration"
echo "3. Deploy a GPT-4 model to your OpenAI service"
echo "4. Test the deployment pipeline"

# Save configuration to file
cat > deployment-config.json << EOF
{
  "resourceGroup": "$RESOURCE_GROUP_NAME",
  "location": "$LOCATION",
  "keyVault": "$KEY_VAULT_NAME",
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
      "region": "$LOCATION"
    }
  },
  "storage": "$STORAGE_ACCOUNT_NAME",
  "staticWebApp": "$STATIC_WEB_APP_NAME",
  "deploymentToken": "$SWA_TOKEN"
}
EOF

echo -e "${GREEN}Configuration saved to deployment-config.json${NC}"