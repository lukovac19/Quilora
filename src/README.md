# QuoteQuest AI - AI-Powered Literary Analysis Platform

Complete SaaS web application for students and book lovers to analyze books using AI, built with React, TypeScript, Tailwind CSS, and Supabase.

## 🎨 Design System

### Colors
- **Background**: `#0A0F18` (Deep navy)
- **Navy Cards**: `#04245A`
- **Cyan Glow**: `#00CFFF`
- **Text**: `#E6F0FF`

### Typography
- **Headings**: Orbitron (Bold, 700-900)
- **Body**: Inter / Plus Jakarta Sans (300-700)

### Responsive Breakpoints
- **Desktop**: 1440px
- **Tablet**: 1024px
- **iPad**: 768px
- **Mobile**: 375px

## 🚀 Features

### Core Product
- **PDF Upload & Processing** - Upload books and get AI-ready content
- **AI Chat Interface** - Natural language Q&A with page references
- **Study Sessions** - Persistent chat history per book
- **Character Extraction** - Automatic entity detection
- **Question Generation** - AI-generated study questions
- **Save & Export** - Save quotes, questions, and essays

### Subscription Tiers

#### 🆓 Blitz Mode (Free)
- 5 questions per session
- 4-hour cooldown between sessions
- Limited PDFs
- No export

#### 💙 Normal Mode (€6/month)
- Unlimited questions
- Essay quizzes
- Export enabled
- More PDFs
- Mastery path

#### 💜 Hard Quest Mode (€12/month) - MOST POPULAR
- Deep detailed questions
- Timed essay generator
- MCQ generation
- Mind map visualization
- Source-verified answers
- Character focus mode

#### ⚡ Lifetime Deal (€80)
- Everything from Hard Quest
- One-time payment
- No monthly billing
- Future updates included

### Language Support
- 🇬🇧 English
- 🇧🇦 Bosanski
- 🇪🇸 Español

## 🏗️ Architecture

### Frontend
- React 18 with TypeScript
- React Router (Data Mode)
- Tailwind CSS v4
- Motion (Framer Motion)
- Context API for state management

### Backend
- Supabase Authentication
- Supabase Edge Functions (Hono server)
- Key-Value storage for data
- RESTful API endpoints

### File Structure
```
/
├── App.tsx                      # Main app with RouterProvider
├── routes.tsx                   # Route configuration
├── context/
│   └── AppContext.tsx          # Global state management
├── pages/
│   ├── LandingPage.tsx         # Hero + Features + Pricing
│   ├── AuthPage.tsx            # Sign Up / Log In / Forgot Password
│   ├── DashboardPage.tsx       # Dashboard with sidebar
│   ├── StudySessionPage.tsx    # Chat interface (main product)
│   ├── MyPDFsPage.tsx          # PDF library grid
│   ├── SavedOutputsPage.tsx    # Saved items with tabs
│   └── SettingsPage.tsx        # User preferences
├── components/
│   ├── ModernNavbar.tsx        # Navbar with language selector
│   └── ProtectedRoute.tsx      # Auth guard
├── lib/
│   └── translations.ts         # Multi-language support
├── supabase/functions/server/
│   └── index.tsx               # Backend API routes
└── styles/
    └── globals.css             # Theme tokens + scrollbar
```

## 🔐 Authentication Flow

1. User visits landing page (no auth required)
2. Clicks "Start Free" or "Sign Up"
3. Redirected to `/auth` page (full-screen, 50/50 split)
4. After successful auth → `/dashboard`
5. Protected routes check for user session

## 📡 API Endpoints

All endpoints prefixed with `/make-server-5a3d4811/`

### Auth
- `POST /auth/signup` - Create account
- `POST /auth/login` - Sign in
- `GET /auth/me` - Get current user

### PDFs
- `POST /pdfs/upload` - Upload PDF metadata
- `GET /pdfs` - Get user's PDFs
- `DELETE /pdfs/:pdfId` - Delete PDF + sessions

### Sessions
- `POST /sessions` - Create study session
- `GET /sessions` - Get user's sessions
- `GET /sessions/:sessionId` - Get session details

### Chat
- `POST /chat/:sessionId` - Send message
- `GET /chat/:sessionId` - Get chat history

### Saved Items
- `POST /saved` - Save quote/question/essay
- `GET /saved` - Get all saved items
- `DELETE /saved/:itemId` - Delete saved item

### Subscription
- `POST /subscription/upgrade` - Upgrade plan

### Questions
- `POST /questions/generate` - Generate study questions

## 🎯 User Flow

1. **Landing** → Browse features, pricing, how it works
2. **Sign Up** → Create account (email confirmed automatically)
3. **Dashboard** → See recent sessions, stats, quick actions
4. **New Session** → Upload PDF → Wait for processing
5. **Chat** → Ask questions → Get AI responses with page refs
6. **Save** → Save important quotes/answers
7. **Library** → Manage PDFs and sessions
8. **Saved** → Review and export saved items
9. **Upgrade** → Choose subscription tier

## 💾 Data Storage

Uses Supabase KV store with these key patterns:
```
user:{userId}              # User profile + subscription
pdf:{pdfId}               # PDF metadata
session:{sessionId}        # Session info
chat:{sessionId}          # Message history
saved:{itemId}            # Saved item
user_pdfs:{userId}        # User's PDF IDs
user_sessions:{userId}    # User's session IDs
user_saved:{userId}       # User's saved item IDs
pdf_sessions:{pdfId}      # PDF's session IDs
```

## 🎨 Design Philosophy

- **Futuristic Tech** - Navy blue + cyan neon aesthetics
- **Clean & Minimal** - Not cluttered, focused on content
- **Glassmorphism** - Subtle backdrop blur effects
- **Smooth Transitions** - 0.12s duration for hovers
- **Cyan Glow** - Box shadows on hover for depth
- **Orbitron Headers** - Strong, tech-forward typography
- **Responsive First** - Works beautifully on all devices

## 🔮 Future Features (Hard Quest+)

- **Author Monetized Review Packs** - Spotify for mastery materials
- **Mindmap Merge** - Unified knowledge visualization
- **Social Login** - Google, Facebook, GitHub integration
- **Real-time Collaboration** - Study with friends
- **Advanced Analytics** - Reading progress tracking

## 🛠️ Development

### State Management
- `AppContext` provides global state
- `localStorage` for persistence
- Backend for sync across devices

### Styling
- Tailwind utility-first approach
- Custom CSS variables for theme
- Orbitron for headings, Inter for body
- Plus Jakarta Sans as alternative

### Animations
- Motion (Framer Motion) for page transitions
- CSS transitions for micro-interactions
- Skeleton loaders for loading states

## 📝 Translation System

All UI text goes through `t(key, language)` function:
```typescript
import { t } from '../lib/translations';

t('hero.title', language)
// EN: "Master Any Book with AI-Powered Analysis"
// BS: "Ovladaj bilo kojom knjigom uz AI analizu"
// ES: "Domina cualquier libro con análisis impulsado por IA"
```

## 🎓 Product Vision

QuoteQuest AI transforms book studying from passive reading to active mastery. Students upload their textbooks, novels, or research papers, then engage in natural conversations with AI to deeply understand characters, themes, and literary devices. The platform generates personalized study materials and tracks learning progress, making literature analysis accessible and engaging.

---

**Built with ❤️ for students and book lovers worldwide**
