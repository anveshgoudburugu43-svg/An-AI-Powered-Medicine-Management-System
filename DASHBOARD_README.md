# Zenith Medical Dashboard

## Overview
A responsive medical dashboard implementation based on the Figma design with an integrated AI-powered medical chatbot.

## Features

### Dashboard Components
- **Sidebar Navigation**: Fixed sidebar with navigation menu
- **New Patients Card**: Shows patient count and avatars
- **Medicine Requests**: Displays urgent medicine requests
- **Activity Chart**: Visual representation of medical activity
- **Income Tracking**: Financial overview with charts
- **Patients Chart**: Weekly patient statistics
- **Calendar**: Monthly calendar view
- **Appointments Panel**: Upcoming and previous appointments

### Medical Chatbot
- **AI-Powered**: Uses Google Gemini API for intelligent responses
- **Responsive Design**: Adapts to mobile and desktop screens
- **Medical Focus**: Specialized for health-related queries
- **Real-time Chat**: Instant messaging interface
- **Floating Interface**: Non-intrusive bottom-right positioning

## Technical Implementation

### Technologies Used
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Google Generative AI**: Gemini API integration
- **Lucide React**: Icon library

### File Structure
```
app/
├── dashboard/
│   ├── page.tsx                    # Main dashboard page
│   └── components/
│       └── MedicalChatbot.tsx      # AI chatbot component
├── page.tsx                        # Home page with navigation
└── globals.css                     # Global styles
```

### Environment Variables
```
GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

## Responsive Design
- **Mobile**: Stacked layout with full-width components
- **Tablet**: 2-column grid layout
- **Desktop**: 12-column grid with fixed sidebars
- **Chatbot**: Full-screen on mobile, floating window on desktop

## Usage

### Development
```bash
npm run dev
```
Visit `http://localhost:3000` and navigate to `/dashboard`

### Production
```bash
npm run build
npm start
```

## Chatbot Features
- Medical information and advice
- Symptom guidance
- Wellness tips
- Health education
- Professional consultation reminders

## Security Notes
- API keys are properly configured for client-side use
- Chatbot includes disclaimers about professional medical advice
- All user interactions are handled securely

## Future Enhancements
- Real patient data integration
- Advanced chart interactions
- Appointment scheduling
- Medical record management
- Multi-language support
