#!/bin/bash

# MindEase Key Vault Setup Script
# This script configures Key Vault access policies and retrieves secrets

set -e

# Configuration
RESOURCE_GROUP_NAME="mindease-rg"
KEY_VAULT_NAME=""
SERVICE_PRINCIPAL_NAME="mindease-sp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up Key Vault for MindEase...${NC}"

# Check if Key Vault name is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Please provide Key Vault name as first argument${NC}"
    echo "Usage: $0 <key-vault-name>"
    exit 1
fi

KEY_VAULT_NAME=$1

# Check if Azure CLI is installed and user is logged in
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! az account show &> /dev/null; then
    echo -e "${RED}Please log in to Azure CLI first: az login${NC}"
    exit 1
fi

# Get current user object ID
CURRENT_USER_ID=$(az ad signed-in-user show --query id -o tsv)
echo -e "${YELLOW}Current user ID: $CURRENT_USER_ID${NC}"

# Create service principal for application access
echo -e "${YELLOW}Creating service principal: $SERVICE_PRINCIPAL_NAME${NC}"
SP_OUTPUT=$(az ad sp create-for-rbac \
    --name $SERVICE_PRINCIPAL_NAME \
    --role "Key Vault Secrets User" \
    --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP_NAME/providers/Microsoft.KeyVault/vaults/$KEY_VAULT_NAME" \
    --output json)

SP_APP_ID=$(echo $SP_OUTPUT | jq -r '.appId')
SP_PASSWORD=$(echo $SP_OUTPUT | jq -r '.password')
SP_TENANT=$(echo $SP_OUTPUT | jq -r '.tenant')
SP_OBJECT_ID=$(az ad sp show --id $SP_APP_ID --query id -o tsv)

echo -e "${GREEN}Service principal created successfully!${NC}"
echo "App ID: $SP_APP_ID"
echo "Object ID: $SP_OBJECT_ID"

# Set Key Vault access policies
echo -e "${YELLOW}Setting Key Vault access policies...${NC}"

# Grant current user full access for setup
az keyvault set-policy \
    --name $KEY_VAULT_NAME \
    --object-id $CURRENT_USER_ID \
    --secret-permissions get list set delete backup restore recover purge

# Grant service principal read access for application
az keyvault set-policy \
    --name $KEY_VAULT_NAME \
    --object-id $SP_OBJECT_ID \
    --secret-permissions get list

echo -e "${GREEN}Key Vault access policies configured successfully!${NC}"

# Test Key Vault access
echo -e "${YELLOW}Testing Key Vault access...${NC}"
TEST_SECRET_NAME="test-secret"
TEST_SECRET_VALUE="test-value-$(date +%s)"

# Set test secret
az keyvault secret set \
    --vault-name $KEY_VAULT_NAME \
    --name $TEST_SECRET_NAME \
    --value $TEST_SECRET_VALUE

# Retrieve test secret
RETRIEVED_VALUE=$(az keyvault secret show \
    --vault-name $KEY_VAULT_NAME \
    --name $TEST_SECRET_NAME \
    --query value -o tsv)

if [ "$RETRIEVED_VALUE" = "$TEST_SECRET_VALUE" ]; then
    echo -e "${GREEN}Key Vault access test successful!${NC}"
    
    # Clean up test secret
    az keyvault secret delete \
        --vault-name $KEY_VAULT_NAME \
        --name $TEST_SECRET_NAME
else
    echo -e "${RED}Key Vault access test failed!${NC}"
    exit 1
fi

# Create environment file for local development
echo -e "${YELLOW}Creating local environment file...${NC}"
cat > .env.keyvault << EOF
# Key Vault Configuration for Local Development
AZURE_CLIENT_ID=$SP_APP_ID
AZURE_CLIENT_SECRET=$SP_PASSWORD
AZURE_TENANT_ID=$SP_TENANT
AZURE_KEY_VAULT_NAME=$KEY_VAULT_NAME

# Usage in Node.js:
# const { DefaultAzureCredential } = require('@azure/identity');
# const { SecretClient } = require('@azure/keyvault-secrets');
# 
# const credential = new DefaultAzureCredential();
# const client = new SecretClient('https://$KEY_VAULT_NAME.vault.azure.net/', credential);
EOF

# Output summary
echo -e "${GREEN}=== Key Vault Setup Summary ===${NC}"
echo "Key Vault Name: $KEY_VAULT_NAME"
echo "Service Principal App ID: $SP_APP_ID"
echo "Service Principal Object ID: $SP_OBJECT_ID"
echo ""
echo -e "${YELLOW}=== Additional GitHub Secrets ===${NC}"
echo "AZURE_CLIENT_ID: $SP_APP_ID"
echo "AZURE_CLIENT_SECRET: $SP_PASSWORD"
echo "AZURE_TENANT_ID: $SP_TENANT"
echo "AZURE_KEY_VAULT_NAME: $KEY_VAULT_NAME"
echo ""
echo -e "${GREEN}Key Vault configuration completed successfully!${NC}"
echo "Local environment file created: .env.keyvault"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add the additional GitHub secrets listed above"
echo "2. Update your application to use Key Vault for secret management"
echo "3. Test the Key Vault integration in your application"