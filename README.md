# MindEase Mental Health Chatbot - PROTOTYPE

**⚠️ This is a prototype application for demonstration purposes.**

An empathetic, ethically designed AI companion web application built to support student mental health, especially for international and university students adjusting to new environments.

## 🚧 Prototype Status
- **Application Type**: Functional prototype/proof of concept
- **AI Integration**: Currently using mock responses (Azure OpenAI integration in development)
- **Deployment**: ✅ Live on Azure Static Web Apps
- **Production Ready**: ❌ Not yet - this is a demonstration prototype

## 🌐 Live Demo
**URL**: https://blue-moss-0657c250f.3.azurestaticapps.net

*Note: The chatbot currently provides pre-programmed responses for demonstration purposes. Real AI integration is planned for future development.*

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

## 🎯 Prototype Features

### Currently Implemented:
- ✅ **Chat Interface**: Functional messaging system with responsive UI
- ✅ **Navigation**: Multi-page application with chat, journal, settings, and crisis support
- ✅ **Security**: Production-grade security headers and rate limiting
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Crisis Resources**: Static crisis support information and resources

### Planned Features (In Development):
- 🔄 **Real AI Integration**: Azure OpenAI Service for personalized responses
- 🔄 **Voice Interaction**: Speech-to-text and text-to-speech capabilities
- 🔄 **Emotional Analysis**: Real-time sentiment and emotion detection
- 🔄 **Crisis Detection**: Automatic crisis detection with immediate resource provision
- 🔄 **Journaling**: Encrypted personal journaling with emotional insights
- 🔄 **Privacy-First**: Local encrypted storage with data anonymization
- 🔄 **Personalization**: Adaptive responses based on user history
- 🔄 **Coping Strategies**: Personalized mental health coping recommendations

## 🛠 Technology Stack

### Frontend (Implemented)
- React 18 with TypeScript
- Material-UI for design system
- Recharts for data visualization
- Responsive design with modern UI/UX

### Backend (Implemented)
- Node.js with Express.js
- RESTful API endpoints
- Security middleware (Helmet, CORS, Rate Limiting)
- Mock response system for demonstration

### Infrastructure (Deployed)
- Azure Static Web Apps for hosting
- GitHub Actions for CI/CD
- Production security configuration

### Planned Integrations
- Azure OpenAI Service (GPT-4) - *In Development*
- Azure AI Language (sentiment analysis) - *Planned*
- Azure Content Safety (crisis detection) - *Planned*
- Azure Speech Service (voice features) - *Planned*
- SQLite with AES-256 encryption - *Planned*

## 🚀 Quick Start

### Try the Live Prototype
Visit: **https://blue-moss-0657c250f.3.azurestaticapps.net**

No setup required! The prototype is fully deployed and functional.

### Local Development (Optional)

If you want to run the prototype locally:

#### Prerequisites
- Node.js 18+ and npm
- Git

#### Installation

1. Clone the repository:
```bash
git clone https://github.com/praniketkw/MindEase.git
cd MindEase
```

2. Install and run frontend:
```bash
cd frontend
npm install
npm start
```

3. Install and run backend:
```bash
cd ../backend
npm install
npm start
```

4. Open http://localhost:3000 in your browser

#### Note for Developers
- The current implementation uses mock responses for demonstration
- Azure AI services integration is in development
- Environment variables for Azure services are not required for basic functionality

## 🔧 Development Roadmap

### Phase 1: Prototype (Current)
- ✅ Basic chat interface and navigation
- ✅ Responsive UI with Material Design
- ✅ Azure deployment infrastructure
- ✅ Security and performance optimization

### Phase 2: AI Integration (In Progress)
- 🔄 Azure OpenAI Service integration
- 🔄 Real-time conversation capabilities
- 🔄 Crisis detection and response
- 🔄 Personalized mental health support

### Phase 3: Advanced Features (Planned)
- 📋 Voice interaction capabilities
- 📋 Emotional analysis and insights
- 📋 Encrypted journaling system
- 📋 Coping strategy recommendations
- 📋 Multi-language support

### Phase 4: Production (Future)
- 📋 Professional therapy integration
- 📋 Advanced privacy controls
- 📋 Analytics and reporting
- 📋 Mobile app development

## 🔒 Privacy & Security (Prototype)

### Current Implementation:
- ✅ **HTTPS Enforcement**: All communications are encrypted in transit
- ✅ **Security Headers**: Production-grade security headers implemented
- ✅ **Rate Limiting**: Protection against abuse and spam
- ✅ **No Data Storage**: Currently no user data is stored (prototype mode)

### Planned Security Features:
- 📋 **Local Encryption**: AES-256 encryption for user data
- 📋 **Data Anonymization**: Privacy-first approach to AI interactions
- 📋 **User Control**: Complete data ownership and deletion rights
- 📋 **Crisis Privacy**: Sensitive content handling protocols

**Note**: This prototype does not store any personal information or conversation history.

## 🤝 Contributing

This is currently a prototype project. If you're interested in contributing:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Test thoroughly
5. Submit a pull request with a clear description

### Areas for Contribution:
- UI/UX improvements
- Azure AI service integration
- Security enhancements
- Accessibility features
- Documentation improvements

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support & Feedback

**This is a prototype project for demonstration purposes.**

For questions or feedback:
- Create an issue in the repository
- Contact: [Your Contact Information]
- Review project specifications in `.kiro/specs/`

## 🙏 Acknowledgments

- Mental health professionals who provided guidance on ethical AI design
- Azure AI Services for the planned intelligent features
- The open-source community for foundational technologies
- University of Washington for educational support

---

**⚠️ Disclaimer**: This prototype is for demonstration purposes only and is not intended to replace professional mental health services. If you're experiencing a mental health crisis, please contact a qualified professional or emergency services immediately.