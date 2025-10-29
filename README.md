# Talk To Your History

> Private, on-device search of your browsing history using natural language, powered by Chrome Built-in AI with Gemini Nano.

![Chrome Built-in AI](https://img.shields.io/badge/Chrome-Built--in%20AI-blue)
![License MIT](https://img.shields.io/badge/License-MIT-green)

## 🎯 Problem

Finding a page from memory is slow. You remember the intent or topic, but not exact titles or URLs. Traditional history search by keywords fails when you remember fuzzy details like:

- "Two weeks ago I viewed a SaaS for content planning"
- "That article about AI agents pricing models I saw last month"
- "The FAQ page with HubSpot shortcuts from yesterday"

## 💡 Solution

A **local memory layer** over Chrome history. The extension:

1. **Summarizes** visited pages using on-device AI
2. **Creates memory cards** with tags and semantic descriptions
3. **Understands natural language queries** to find the right pages
4. **Ranks results** based on relevance
5. **Works completely offline** after initial indexing

## ✨ Features

- 🧠 **Natural Language Search** - Ask in plain English, not keywords
- 🎤 **Voice Input** - Speak your queries using PROMPT API Audio and fallback Web Speech API (not fully working because API unstable) 
- 🔒 **Privacy First** - All AI processing happens on your device
- 🚀 **Fast** - Results in under 2 seconds on typical databases
- 🎨 **Modern UI** - Dark mode, responsive design
- ⚙️ **Customizable** - Domain ignore list, language preferences
- 📊 **Statistics** - Track your indexed pages and database size

## 🏗️ Architecture

### Components

- **Background Service Worker** - Schedules scans, processes pages
- **Content Script** - Extracts readable text from web pages
- **IndexedDB** - Local storage for page records
- **React UI** - Popup and options pages
- **Chrome Built-in AI APIs** - Prompt, Summarizer, Rewriter, Translator

### Data Flow

```
Chrome History → Extract Text → Summarize → Memory Card → IndexedDB
User Query → Interpret → Search DB → Rank → Display Results
```

## 🚀 Installation

### Prerequisites

You need Chrome 127+ with Built-in AI features enabled.

### Enable Chrome Built-in AI

1. Open `chrome://flags` in a new tab
2. Enable the following flags:
   - `#optimization-guide-on-device-model` - Enabled
   - `#prompt-api-for-gemini-nano` - Enabled
   - `#summarization-api-for-gemini-nano` - Enabled
   - `#translation-api` - Enabled
   - `#rewriter-api` - Enabled
3. Restart Chrome
4. Wait 5-10 minutes for Gemini Nano model to download

To check if the model is ready, open DevTools Console and run:
```javascript
(await ai.languageModel.capabilities()).available
// Should return "readily"
```

### Install Extension

#### From Source

```bash
# Clone repository
git clone https://github.com/yourusername/talk-to-your-history.git
cd talk-to-your-history

# Install dependencies
npm install

# Build extension
npm run build

# Load in Chrome
1. Open chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder
```

#### Development Mode

```bash
# Start dev server with hot reload
npm run dev

# In Chrome, load the `dist` folder as unpacked extension
```

## 🎬 Usage

### First Run

1. Open the extension options page
2. Enable indexing (opt-in)
3. Configure ignored domains if needed
4. Trigger a manual scan or wait for automatic scanning

### Searching

1. Click the extension icon to open the popup
2. Type your query in natural language, e.g.:
   - "Last week I read about content planning tools"
   - "The pricing page for AI APIs"
   - "Documentation I saw yesterday"
3. Or click the microphone icon to speak your query
4. View ranked results with memory cards
5. Click "Open" to visit the page

### Test Data

To try the extension immediately:

1. Click the settings icon (⚙️) in the popup
2. Click "Seed Test Data"
3. Try searching for:
   - "content planning"
   - "AI pricing"
   - "HubSpot shortcuts"

## 🔧 Development

### Project Structure

```
/src
  /background      # Service worker, indexer, AI services
  /content         # Content script for text extraction
  /ui              # React components and pages
    /components    # Reusable UI components
    /hooks         # Custom React hooks
    /store         # Zustand state management
    /lib           # Chrome API wrappers
  /types           # TypeScript type definitions
  /utils           # Utility functions
```

### Scripts

```bash
npm run dev      # Development mode with HMR
npm run build    # Production build
npm run test     # Run tests
npm run lint     # Lint code
npm run format   # Format code with Prettier
npm run zip      # Create distributable .zip
```

### Tech Stack

- **Build**: Vite, @crxjs/vite-plugin
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB with idb
- **State**: Zustand
- **Content Extraction**: Mozilla Readability
- **Testing**: Vitest, Testing Library

## 🔒 Privacy

### Guarantees

- ✅ All AI processing happens on-device with Gemini Nano
- ✅ No data sent to external servers for AI features
- ✅ Incognito sessions are never indexed
- ✅ You can erase all data at any time
- ✅ Open source - audit the code yourself

### What Data is Stored?

- Page URL, title, visit timestamps
- AI-generated summaries and memory cards (500-1000 characters)
- Extracted tags
- User settings (in chrome.storage.sync)

### What Data is NOT Stored?

- Full page content (only summaries)
- Incognito browsing data
- Passwords or sensitive form data
- Third-party tracking cookies

## 🧪 Testing

### Manual Testing

1. **First Run**: Verify opt-in screen, indexing disabled by default
2. **Indexing**: Enable indexing, visit 3 pages, trigger scan, verify summarization
3. **Search**: Query with natural language, verify results ranked correctly
4. **Voice**: Use voice input, verify transcript and results
5. **Offline**: Disconnect network, verify search works from cache
6. **Privacy**: Add domain to ignore list, visit page, verify not indexed
7. **Erase**: Erase all data, verify database cleared

### Automated Tests

```bash
npm run test          # Run all tests
npm run test:ui       # Run with UI
npm run test:coverage # Generate coverage report
```

## 🚧 Troubleshooting

### AI APIs Not Available

**Symptom**: Search fails with "Language Model API not available"

**Solutions**:
1. Check chrome://flags are enabled correctly
2. Restart Chrome completely
3. Wait for Gemini Nano model download (check chrome://components)
4. Verify Chrome version is 127+

### No Results Found

**Symptom**: Search returns empty results

**Solutions**:
1. Check if indexing is enabled in settings
2. Trigger a manual scan
3. Verify pages were visited recently (default: last 48 hours)
4. Check if domains are in ignore list
5. Try seeding test data to verify search works

### Extension Won't Load

**Symptom**: Error loading extension

**Solutions**:
1. Run `npm run build` to regenerate dist folder
2. Check console for build errors
3. Ensure all dependencies installed: `npm install`
4. Try loading in a fresh Chrome profile

## 🗺️ Roadmap

- [ ] Better readability extraction for dynamic content
- [ ] Better Voice input
- [ ] Keyword index for faster candidate lookup
- [ ] Result clustering by topic
- [ ] Export/import data functionality
- [ ] Multi-profile support
- [ ] Browser action badge with index count
- [ ] On-page command palette (Ctrl+K)
- [ ] Smart folders and collections

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm run format`
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🏆 Chrome Built-in AI Challenge 2025

This extension was built for the Chrome Built-in AI Challenge 2025.

**APIs Used**:
- ✅ Prompt API (Gemini Nano) - Query interpretation and ranking
- ✅ Summarizer API - Page content summarization
- ✅ Rewriter API - Memory card creation
- ✅ Translator API - Language detection

**Problem Solved**: Finding pages from memory using natural language instead of exact keywords, with complete privacy and on-device processing.

## 📧 Contact

- GitHub Issues: [Report bugs or request features](https://github.com/myounes9/talk-to-your-history/issues)
- Email: quantumautomations.ai@gmail.com

---

Made with ❤️ and 🤖 Chrome Built-in AI 
-Younes :)

