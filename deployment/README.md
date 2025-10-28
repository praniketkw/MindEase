# MindEase Deployment Guide

This directory contains all the necessary files and scripts for deploying MindEase to Azure.

## Quick Start

### Prerequisites
- Azure CLI installed and configured
- Node.js 18+ installed
- Git repository set up
- Azure subscription with sufficient credits

### 1. Deploy Azure Resources

Choose one of the following methods:

#### Option A: Using ARM Template (Recommended)
```bash
cd deployment
./deploy-with-arm.sh
```

#### Option B: Using Azure CLI Script
```bash
cd deployment
./deploy-azure-resources.sh
```

### 2. Configure GitHub Secrets
After deployment, add the output secrets to your GitHub repository settings.

### 3. Deploy Application
Push your code to the main branch to trigger the deployment pipeline.

## Files Overview

### Configuration Files
- `staticwebapp.config.json` - Azure Static Web Apps configuration
- `.github/workflows/azure-static-web-apps-ci-cd.yml` - GitHub Actions workflow
- `backend/.env.production` - Production environment variables template
- `frontend/.env.production` - Frontend production environment variables

### Deployment Scripts
- `deploy-with-arm.sh` - Deploy using ARM template (recommended)
- `deploy-azure-resources.sh` - Deploy using Azure CLI commands
- `setup-keyvault.sh` - Configure Key Vault access policies
- `azure-resources.json` - ARM template for Azure resources

### Documentation
- `production-checklist.md` - Complete deployment checklist
- `README.md` - This file

## Detailed Deployment Instructions

### Step 1: Prepare Your Environment

1. **Install Azure CLI**
   ```bash
   # macOS
   brew install azure-cli
   
   # Windows
   winget install Microsoft.AzureCLI
   
   # Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Login to Azure**
   ```bash
   az login
   az account set --subscription "your-subscription-id"
   ```

3. **Verify Prerequisites**
   ```bash
   az --version
   node --version
   npm --version
   ```

### Step 2: Deploy Azure Resources

1. **Make scripts executable**
   ```bash
   chmod +x deployment/*.sh
   ```

2. **Run deployment script**
   ```bash
   cd deployment
   ./deploy-with-arm.sh
   ```

3. **Note the output values** - you'll need these for GitHub secrets

### Step 3: Configure GitHub Repository

1. **Add GitHub Secrets**
   Go to your repository → Settings → Secrets and variables → Actions
   
   Add all the secrets listed in the deployment script output.

2. **Update Repository URL**
   If needed, update the repository URL in the Static Web App configuration.

### Step 4: Deploy Application

1. **Push to main branch**
   ```bash
   git add .
   git commit -m "Initial production deployment"
   git push origin main
   ```

2. **Monitor deployment**
   - Check GitHub Actions tab for build status
   - Monitor Azure Static Web Apps deployment logs

### Step 5: Verify Deployment

1. **Check application health**
   ```bash
   curl https://your-app-url.azurestaticapps.net/health
   ```

2. **Test key functionality**
   - Load the application in browser
   - Test chat functionality
   - Test voice input/output
   - Verify journal entries work
   - Test crisis detection

## Environment Variables

### Backend Environment Variables
```bash
# Azure Services
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=your-openai-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_LANGUAGE_ENDPOINT=https://your-language.cognitiveservices.azure.com/
AZURE_LANGUAGE_API_KEY=your-language-key
AZURE_CONTENT_SAFETY_ENDPOINT=https://your-safety.cognitiveservices.azure.com/
AZURE_CONTENT_SAFETY_API_KEY=your-safety-key
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=eastus

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
DATABASE_ENCRYPTION_KEY=your-db-encryption-key

# Application
NODE_ENV=production
CORS_ORIGIN=https://your-app.azurestaticapps.net
```

### Frontend Environment Variables
```bash
REACT_APP_API_BASE_URL=https://your-app.azurestaticapps.net
REACT_APP_ENVIRONMENT=production
```

## Troubleshooting

### Common Issues

1. **Deployment fails with authentication error**
   - Verify you're logged into Azure CLI
   - Check your subscription permissions
   - Ensure you have Contributor role on the subscription

2. **GitHub Actions fails**
   - Verify all required secrets are set
   - Check the secrets match the deployment output exactly
   - Ensure the repository URL is correct in Static Web App

3. **Application doesn't load**
   - Check the build logs in GitHub Actions
   - Verify the frontend build completed successfully
   - Check browser console for errors

4. **API calls fail**
   - Verify backend environment variables are set
   - Check Azure service endpoints are correct
   - Ensure API keys are valid and not expired

5. **Voice functionality doesn't work**
   - Verify Azure Speech service is deployed
   - Check speech service key and region
   - Ensure HTTPS is enabled (required for microphone access)

### Getting Help

1. **Check logs**
   ```bash
   # View deployment logs
   az staticwebapp logs show --name your-app-name --resource-group your-rg
   
   # View application logs (if available)
   az monitor log-analytics query --workspace your-workspace --analytics-query "requests | limit 50"
   ```

2. **Validate configuration**
   ```bash
   # Test Azure services
   az cognitiveservices account show --name your-openai-service --resource-group your-rg
   
   # Test Static Web App
   az staticwebapp show --name your-app-name --resource-group your-rg
   ```

## Security Considerations

### Production Security Checklist
- [ ] All secrets are stored in GitHub Secrets, not in code
- [ ] HTTPS is enforced
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled
- [ ] Error messages don't expose sensitive information
- [ ] Logging excludes personal information
- [ ] Database encryption is enabled

### Monitoring
- Set up Azure Monitor alerts for critical errors
- Monitor application performance and availability
- Review security logs regularly
- Keep dependencies updated

## Cost Management

### Estimated Monthly Costs (50 active users)
- Azure Static Web Apps: Free tier
- Azure OpenAI (GPT-4): ~$100-120
- Azure AI Language: ~$10-15
- Azure Content Safety: ~$5-10
- Azure Speech: ~$10-15
- Azure Key Vault: ~$1-2
- Storage: ~$1-2

**Total: ~$127-165/month for 50 users**

### Cost Optimization Tips
- Use Azure Free Tier where possible
- Monitor usage and set up billing alerts
- Consider using smaller models for development
- Implement caching to reduce API calls
- Use Azure Cost Management tools

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly
- [ ] Monitor performance metrics
- [ ] Review security logs
- [ ] Update documentation as needed

### Updates and Patches
- Test updates in a staging environment first
- Use blue-green deployment for zero-downtime updates
- Keep Azure services updated
- Monitor for security advisories

## Support

For deployment issues:
1. Check this documentation first
2. Review the troubleshooting section
3. Check Azure service status
4. Contact the development team

---

**Last Updated:** [Current Date]
**Version:** 1.0.0