# MindEase

A privacy-first mental health chatbot powered by Anthropic's Claude AI.

## Overview

MindEase is a web-based mental health support application designed to provide empathetic, AI-powered conversations while maintaining complete user privacy. The application uses a stateless backend architecture with client-side storage, ensuring that conversations remain private and under user control.

## Key Features

- Privacy-first architecture with no server-side conversation storage
- Empathetic AI responses powered by Claude 3.5 Haiku
- Automatic crisis detection with immediate resource provision
- Client-side conversation persistence using browser LocalStorage
- Modern, responsive user interface
- No user authentication or tracking required

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- Anthropic SDK for Claude AI integration
- Security middleware (Helmet, CORS, rate limiting)

### Frontend
- React 18 with TypeScript
- Material-UI component library
- React Router for navigation
- LocalStorage for data persistence

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Anthropic API key

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

5. Build the TypeScript code:
```bash
npm run build
```

6. Start the development server:
```bash
npm run dev
```

The backend will start on http://localhost:3001

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will start on http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Begin typing your message in the chat interface
3. The AI will respond with empathetic, context-aware messages
4. Your conversation history is automatically saved in your browser
5. Access crisis support resources at any time via the navigation menu

## Privacy Architecture

MindEase implements privacy by design:

- All conversations are stored exclusively in the user's browser using LocalStorage
- The backend maintains no database or persistent storage
- Each API request is stateless and independent
- No user authentication or tracking mechanisms
- Conversation history is sent with each request to maintain context
- Users can clear their history at any time

## Crisis Support

The application includes automatic crisis detection that identifies concerning language patterns and provides immediate access to mental health resources:

- 988 Suicide and Crisis Lifeline
- Crisis Text Line
- International crisis resources
- Emergency services information

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm start
```

### Building for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
```

## Deployment

The application can be deployed to any platform supporting Node.js and static hosting:

- Backend: Railway, Render, Heroku, DigitalOcean, or any VPS
- Frontend: Vercel, Netlify, GitHub Pages, or any static hosting service

Ensure environment variables are properly configured in your deployment platform.

## API Costs

The application uses Anthropic's Claude 3.5 Haiku model:
- Approximately $0.0001 per conversation
- Cost-effective for personal and small-scale deployments
- New Anthropic accounts receive free credits for testing

## Security

The application implements multiple security measures:

- HTTPS enforcement in production
- CORS protection
- Rate limiting to prevent abuse
- Security headers via Helmet middleware
- Input validation and sanitization
- No sensitive data storage

## License

MIT License

## Disclaimer

MindEase is a supportive tool and not a replacement for professional mental health care. If you are experiencing a mental health crisis, please contact emergency services or a qualified mental health professional immediately.

## Support

For issues, questions, or contributions, please refer to the project repository.
