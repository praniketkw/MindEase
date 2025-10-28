# MindEase Mental Health Chatbot

An empathetic, ethically designed AI companion web application built to support student mental health, especially for international and university students adjusting to new environments.

## 🚀 Deployment Status
- **Azure Resources**: ✅ Deployed to `mind-ease` resource group
- **GitHub Secrets**: ✅ Configured
- **Application**: 🔄 Deploying to Azure Static Web Apps...

## Project Structure

```
mindease-chatbot/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── interfaces/     # TypeScript interfaces
│   │   ├── services/       # API service functions
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Express route controllers
│   │   ├── interfaces/     # TypeScript interfaces
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── shared/                   # Shared types and interfaces
│   └── types/
└── .kiro/specs/             # Project specifications
```

## Features

- **Conversational AI**: Empathetic responses using Azure OpenAI Service
- **Voice Interaction**: Speech-to-text and text-to-speech capabilities
- **Emotional Analysis**: Real-time sentiment and emotion detection
- **Crisis Detection**: Automatic crisis detection with immediate resource provision
- **Journaling**: Encrypted personal journaling with emotional insights
- **Privacy-First**: Local encrypted storage with data anonymization
- **Personalization**: Adaptive responses based on user history
- **Coping Strategies**: Personalized mental health coping recommendations

## Technology Stack

### Frontend
- React 18 with TypeScript
- Material-UI for design system
- Chart.js for data visualization
- Web Speech API for voice features

### Backend
- Node.js with Express.js
- TypeScript for type safety
- SQLite with AES-256 encryption
- Azure AI Services integration

### Azure Services
- Azure OpenAI Service (GPT-4)
- Azure AI Language (sentiment analysis)
- Azure Content Safety (crisis detection)
- Azure Speech Service (voice features)
- Azure AI Translator (multilingual support)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Azure subscription with AI services
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mindease-chatbot
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Configure environment variables:
```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env with your Azure service credentials

# Frontend configuration
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

### Development

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

3. Open http://localhost:3000 in your browser

### Testing

Run backend tests:
```bash
cd backend
npm test
```

Run frontend tests:
```bash
cd frontend
npm test
```

## Azure Services Setup

### Required Azure Resources
1. **Azure OpenAI Service** - For conversational AI
2. **Azure AI Language** - For sentiment analysis and text processing
3. **Azure Content Safety** - For crisis detection and content moderation
4. **Azure Speech Service** - For voice input/output features
5. **Azure Key Vault** - For secure API key management (production)

### Configuration
Update the environment variables in `backend/.env` with your Azure service endpoints and API keys.

## Privacy & Security

- All user data is encrypted locally using AES-256 encryption
- No raw emotional content is stored permanently
- API calls to Azure services use anonymized data
- Users have full control over their data with reset functionality
- Crisis detection operates without storing sensitive content

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Review the documentation in `.kiro/specs/`

## Acknowledgments

- Azure AI Services for powering the intelligent features
- Mental health professionals who provided guidance on ethical AI design
- The open-source community for the foundational technologies