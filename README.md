# 🚀 Synth AI

<div align="center">
  
  ![Synth AI](https://img.shields.io/badge/Synth_AI-Build_with_Natural_Language-6366f1?style=for-the-badge&logo=react&logoColor=white)
  
  <h3>Transform your ideas into Next.js applications using natural language</h3>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Claude AI](https://img.shields.io/badge/Claude_AI-Powered-8B5CF6?style=flat-square&logo=anthropic&logoColor=white)](https://www.anthropic.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
  
  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-demo">Demo</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#-contributing">Contributing</a>
  </p>

</div>

---

## 🎯 What is Synth AI?

**Synth AI** is an innovative AI-powered development platform that transforms natural language descriptions into fully functional Next.js applications. Simply describe what you want to build, and watch as Claude AI generates, compiles, and deploys your application in real-time.

<div align="center">
  <img src="https://via.placeholder.com/800x400/6366f1/ffffff?text=Synth+AI+Demo" alt="Synth AI Demo" width="100%" />
</div>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 AI-Powered Generation

- Natural language to code transformation
- Intelligent code structuring
- Automatic component creation
- Smart dependency management

</td>
<td width="50%">

### ⚡ Real-Time Development

- Live code generation preview
- Hot reload functionality
- Instant error detection
- Automatic compilation

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Modern Interface

- Clean, intuitive design
- Dark/Light theme support
- Responsive layout
- Real-time terminal output

</td>
<td width="50%">

### 🔧 Smart Error Handling

- Automatic error detection
- AI-powered error fixing
- Build optimization
- Code validation

</td>
</tr>
</table>

## 🛠️ Tech Stack

<div align="center">

| Layer              | Technologies                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**       | ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Emotion](https://img.shields.io/badge/Emotion-11-DB7093?style=flat-square&logo=styled-components&logoColor=white) ![Socket.io](https://img.shields.io/badge/Socket.io-4.5-010101?style=flat-square&logo=socket.io&logoColor=white) |
| **Backend**        | ![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat-square&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white) ![Claude AI](https://img.shields.io/badge/Claude_AI-3.0-8B5CF6?style=flat-square)                                                                                                                                                      |
| **Generated Apps** | ![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white) ![Shadcn/ui](https://img.shields.io/badge/Shadcn/ui-Latest-000000?style=flat-square)                                                                                                                                             |

</div>

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Node.js 18+
npm or yarn
Anthropic API key (for production)
```

### Installation

<details>
<summary><b>1️⃣ Clone & Install</b></summary>

```bash
# Clone the repository
git clone https://github.com/yourusername/synth-ai.git
cd synth-ai

# Install backend dependencies
cd backend_node
npm install

# Install frontend dependencies
cd ../client
npm install
```

</details>

<details>
<summary><b>2️⃣ Environment Setup</b></summary>

Create `.env` in `backend_node` directory:

```env
# API Keys
ANTHROPIC_API_KEY=sk-ant-api-xxxxx
OPENROUTER_API_KEY=sk-or-xxxxx

# Development Settings
FORCE_PRODUCTION_MODE=false
```

</details>

<details>
<summary><b>3️⃣ Run the Application</b></summary>

```bash
# Terminal 1 - Start backend (port 5001)
cd backend_node
npm start

# Terminal 2 - Start frontend (port 3000)
cd client
npm start
```

🎉 **Open [http://localhost:3000](http://localhost:3000) to start building!**

</details>

## 📖 Documentation

### 🎮 How to Use

<table>
<tr>
<td width="33%" align="center">
  
  **Step 1**
  
  <img src="https://via.placeholder.com/200x150/6366f1/ffffff?text=Describe" alt="Step 1" />
  
  Describe your app idea
  
</td>
<td width="33%" align="center">
  
  **Step 2**
  
  <img src="https://via.placeholder.com/200x150/8B5CF6/ffffff?text=Generate" alt="Step 2" />
  
  AI generates the code
  
</td>
<td width="33%" align="center">
  
  **Step 3**
  
  <img src="https://via.placeholder.com/200x150/10B981/ffffff?text=Deploy" alt="Step 3" />
  
  Your app is ready!
  
</td>
</tr>
</table>

### 💡 Example Prompts

```markdown
✅ "Create a todo app with add, edit, and delete functionality"
✅ "Build a weather dashboard that shows current temperature and forecast"
✅ "Make a portfolio website with projects section and contact form"
✅ "Create a calculator with basic arithmetic operations"
✅ "Build a timer app with start, stop, and reset buttons"
```

### 📁 Project Structure

```
synth-ai/
│
├── 📂 client/                    # Frontend React application
│   ├── 📂 src/
│   │   ├── 📂 components/        # Reusable UI components
│   │   ├── 📂 pages/            # Page components
│   │   ├── 📂 context/          # React context providers
│   │   ├── 📂 hooks/            # Custom React hooks
│   │   └── 📂 utils/            # Utility functions
│   └── 📂 user-projects/        # Generated user projects
│
├── 📂 backend_node/              # Backend Express server
│   ├── 📂 routes/               # API route handlers
│   ├── 📂 services/             # Business logic services
│   │   ├── claude-service.js   # Claude AI integration
│   │   ├── task-generator.js   # Task-based generation
│   │   └── compiler.js         # Compilation checker
│   └── 📂 mcp-servers/          # Model Context Protocol
│
└── 📄 README.md                  # You are here!
```

### 🔌 API Endpoints

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| `POST` | `/api/initialize-project` | Create a new project    |
| `POST` | `/api/update-project-v2`  | Update existing project |
| `GET`  | `/api/list-projects`      | List all projects       |
| `POST` | `/api/validate-key`       | Validate API key        |
| `GET`  | `/api/running-projects`   | Get running projects    |
| `POST` | `/api/stop-project`       | Stop a project          |

## 🔐 Security & Production

### Production Mode Features

- ✅ **User-provided API keys** - No shared keys in production
- ✅ **Session-based storage** - Secure key management
- ✅ **Automatic cleanup** - Keys removed on disconnect
- ✅ **No persistence** - Keys never saved to disk

### Testing Production Mode Locally

```bash
# Method 1: Environment variable
FORCE_PRODUCTION_MODE=true npm start

# Method 2: URL parameter
http://localhost:3000?forceProduction=true
```

## 🤝 Contributing

We love contributions! Here's how you can help:

<div align="center">

| Type                    | Description            |
| ----------------------- | ---------------------- |
| 🐛 **Bug Reports**      | Report issues and bugs |
| 💡 **Feature Requests** | Suggest new features   |
| 📖 **Documentation**    | Improve documentation  |
| 🔧 **Code**             | Submit pull requests   |

</div>

### Development Workflow

```bash
1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request
```

## 🎯 Roadmap

- [x] Basic code generation
- [x] Real-time compilation
- [x] Error auto-fixing
- [x] Dark/Light theme
- [x] Production API key system
- [ ] User authentication
- [ ] Database integration
- [ ] Project templates
- [ ] Team collaboration
- [ ] Cloud deployment
- [ ] Version control

## ❓ FAQ

<details>
<summary><b>Do I need coding knowledge to use Synth AI?</b></summary>

No! Synth AI is designed to work with natural language descriptions. Simply describe what you want to build in plain English.

</details>

<details>
<summary><b>What types of applications can I build?</b></summary>

You can build any web application that Next.js supports - from simple landing pages to complex dashboards, e-commerce sites, and SaaS applications.

</details>

<details>
<summary><b>Is my API key secure?</b></summary>

Yes! In production mode, your API key is stored only in your browser's session storage and server memory. It's never persisted to disk or logged.

</details>

<details>
<summary><b>Can I modify the generated code?</b></summary>

Absolutely! The generated code is standard Next.js/React code that you can modify, extend, and customize as needed.

</details>

## 📊 Stats

<div align="center">

![Code Size](https://img.shields.io/github/languages/code-size/yourusername/synth-ai?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/yourusername/synth-ai?style=flat-square)
![Issues](https://img.shields.io/github/issues/yourusername/synth-ai?style=flat-square)
![Pull Requests](https://img.shields.io/github/issues-pr/yourusername/synth-ai?style=flat-square)

</div>

## 👨‍💻 Author

<div align="center">
  
  **Created by Sayed Abdul Karim**
  
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/saykarim)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/saykarim)
  
</div>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- 🤖 [Anthropic](https://www.anthropic.com/) for Claude AI
- ⚛️ [React](https://reactjs.org/) team
- ▲ [Vercel](https://vercel.com/) for Next.js
- 🎨 [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
- 💻 All open-source contributors

---

<div align="center">
  
  
  <sub>Built with ❤️ and AI</sub>
  
</div>
