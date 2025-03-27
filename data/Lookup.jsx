const Lookup = {
  SUGGSTIONS: [
    'Create a modern e-commerce platform with CSS animations',
    'Build an interactive portfolio with hover effects',
    'Design an advanced analytics dashboard with charts',
    'Develop a responsive landing page with smooth transitions',
    'Create a blog with dynamic comments and user auth'
  ],
  HERO_HEADING: 'Transform Ideas into Dynamic Websites Instantly',
  HERO_DESC: 'Describe your vision, and let AI craft interactive, responsive web apps. Customize, preview, and deploy seamlessly.',
  INPUT_PLACEHOLDER: 'Tell me about the web app you want to create...',
  SIGNIN_HEADING: 'Welcome to WebGen Pro',
  SIGNIN_SUBHEADING: 'Sign in to unlock advanced features, save projects, and deploy stunning websites with ease.',
  SIGNIn_AGREEMENT_TEXT: 'By proceeding, you accept our Terms of Service and Privacy Policy.',
  PRICING_DESC: 'Select a plan tailored to your needs. Enjoy unlimited access to WebGen\'s cutting-edge features, no surprises.',

  DEFAULT_FILE: {
    '/public/index.html': {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebGen Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
    },
    '/App.js': {
      code: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 text-center hover:shadow-xl transition-all duration-300">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to WebGen Pro
        </h1>
        <p className="text-gray-600 mb-6">
          Tell me your idea in the chat, and watch me build a responsive app for you!
        </p>
        <div className="flex justify-center">
          <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors duration-300">
            Let's Create Something Amazing
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;`
    },
    '/App.css': {
      code: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
}

#root {
  min-height: 100vh;
}

/* Custom animation for subtle hover effects */
@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
}

.float {
  animation: float 3s infinite ease-in-out;
}

.hover-float:hover {
  animation: float 1.5s infinite ease-in-out;
}`
    },
    '/tailwind.config.js': {
      code: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        accent: '#6B7280', // Custom gray for subtle accents
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}`
    },
    '/postcss.config.js': {
      code: `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;`
    }
  },

  DEPENDANCY: {
    "postcss": "^8",
    "tailwindcss": "^3.4.1", 
    "autoprefixer": "^10.0.0",
    "uuid4": "^2.0.3",
    "tailwind-merge": "^2.4.0", 
    "lucide-react": "^0.469.0",
    "react-router-dom": "^7.1.1"
  },

  PRICING_OPTIONS: [
    {
      name: 'Basic',
      tokens: 50000,
      value: 50000,
      desc: 'Perfect for hobbyists exploring AI-driven web creation with light usage.',
      price: 4.99
    },
    {
      name: 'Starter',
      tokens: 120000,
      value: 120000,
      desc: 'Great for freelancers building animated, responsive sites a few times weekly.',
      price: 9.99
    },
    {
      name: 'Pro',
      tokens: 2500000,
      value: 2500000,
      desc: 'Ideal for teams needing advanced animations, 3D effects, and frequent generation.',
      price: 19.99
    },
    {
      name: 'Unlimited',
      tokens: 999999999,
      value: 999999999,
      desc: 'Unlimited power for agencies and enterprises with high-volume, complex projects.',
      price: 49.99
    }
  ]
};

export default Lookup;