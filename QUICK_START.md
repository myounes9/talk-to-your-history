# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Enable Chrome Built-in AI (Required)

1. Open a new tab and go to: `chrome://flags`
2. Search for and enable these flags:
   - `optimization-guide-on-device-model` → **Enabled**
   - `prompt-api-for-gemini-nano` → **Enabled**
   - `summarization-api-for-gemini-nano` → **Enabled**
   - `translation-api` → **Enabled**
   - `rewriter-api` → **Enabled**
3. Click **Relaunch** at the bottom
4. Wait 5-10 minutes for Gemini Nano model to download in background

**Verify Model Ready:**
Open DevTools Console (F12) and run:
```javascript
(await ai.languageModel.capabilities()).available
// Should return: "readily"
```

### Step 2: Build the Extension

```bash
cd "Chrome AI challenge"
npm install
npm run build
```

You should see:
```
✓ built in ~500ms
```

### Step 3: Load in Chrome

1. Open Chrome and go to: `chrome://extensions`
2. Toggle **Developer mode** (top right) to ON
3. Click **Load unpacked**
4. Navigate to and select: `Chrome AI challenge/dist` folder
5. Extension should now appear with a brain icon 🧠

### Step 4: First Time Setup

1. Click the extension icon in toolbar
2. Click the settings icon (⚙️) in popup
3. Click **Open Settings**
4. Toggle **Enable Indexing** to ON
5. Click **Save Settings**
6. Click **Trigger Scan Now** to start indexing

### Step 5: Test with Sample Data

#### Option A: Use Test Data
1. Click extension icon
2. Click settings icon (⚙️)
3. Click **Seed Test Data**
4. Try searching for:
   - "content planning"
   - "AI pricing"
   - "HubSpot shortcuts"

#### Option B: Index Real Pages
1. Visit these pages in new tabs:
   - https://www.notion.so
   - https://www.figma.com
   - https://tailwindcss.com
2. Wait 1-2 minutes for background scan
3. Try searching:
   - "design tool I saw today"
   - "CSS framework"
   - "note taking app"

### Step 6: Test Search

1. Click extension icon
2. Type: "tool for planning content"
3. Click **Search** or press Enter
4. View results with memory cards and tags
5. Click **Open** to visit the page

### Step 7: Test Voice Input

1. Click the microphone icon (🎤)
2. Allow microphone permission if prompted
3. Say: "the article about content planning"
4. Watch it transcribe and search automatically

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Extension loads without errors
- [ ] Options page opens and saves settings
- [ ] Manual scan processes pages
- [ ] Search returns results
- [ ] Voice input works
- [ ] Results can be opened in new tab
- [ ] URL copy button works

### AI Features
- [ ] Pages get summarized
- [ ] Memory cards are created
- [ ] Tags are extracted
- [ ] Natural language queries work
- [ ] Results are ranked by relevance

### Privacy Features
- [ ] Indexing is opt-in (disabled by default)
- [ ] Can add domains to ignore list
- [ ] Can erase all data
- [ ] No network requests to external services

## 🐛 Troubleshooting

### "Language Model API not available"

**Problem**: Chrome AI APIs not ready

**Solutions**:
1. Verify all flags are enabled in `chrome://flags`
2. Check model download status: `chrome://components` → Look for "Optimization Guide On Device Model"
3. Restart Chrome completely
4. Wait longer for model download (can take 10+ minutes)

### "No results found"

**Problem**: Nothing indexed yet

**Solutions**:
1. Enable indexing in settings
2. Visit some pages and wait 2-3 minutes
3. Trigger manual scan from options page
4. Use "Seed Test Data" for immediate testing

### Extension won't load

**Problem**: Build issue

**Solutions**:
1. Run `npm run build` again
2. Check for errors in terminal
3. Make sure you're loading the `dist` folder, not root
4. Try `rm -rf dist node_modules && npm install && npm run build`

### Voice input not working

**Problem**: Browser permissions or API support

**Solutions**:
1. Check microphone permission in `chrome://settings/content/microphone`
2. Try HTTPS pages only (required for some features)
3. Check browser console for errors

## 📊 Expected Behavior

### After First Scan
- 10-50 pages indexed (depending on browsing history)
- Takes 2-5 minutes for 10 pages
- Can see progress in options page stats

### Search Performance
- Results appear in < 2 seconds
- Top 3 results usually relevant
- Tags help identify page type

### Memory Cards Example
```
"Notion is a workspace for notes and collaboration. [productivity][notes][workspace][collaboration]"
```

## 🎯 Demo Scenarios

### Scenario 1: Find a Tool
1. Visit: productHunt.com, browse 3 products
2. Wait 3 minutes
3. Search: "productivity tool I saw earlier"
4. Should find recent ProductHunt pages

### Scenario 2: Technical Article
1. Visit: dev.to or medium.com, read 2 articles
2. Wait 3 minutes
3. Search: "the tutorial about React hooks"
4. Should find the article

### Scenario 3: Voice Search
1. Enable voice input
2. Say: "that website with the pricing page"
3. Should transcribe and find pricing pages visited

## 📸 Screenshots to Capture

For demo video:
1. Options page showing flags setup
2. Settings with indexing enabled
3. Stats showing indexed pages
4. Search with typed query
5. Results with memory cards
6. Voice input in action
7. Opening a result
8. Options showing erase data

## ⏱️ Demo Script (2:45 Target)

| Time | Action |
|------|--------|
| 0:00-0:15 | Title, problem statement |
| 0:15-0:30 | Show Chrome flags setup |
| 0:30-0:50 | Enable indexing, visit pages |
| 0:50-1:20 | Search query, show results |
| 1:20-1:45 | Voice input demo |
| 1:45-2:10 | Show offline works |
| 2:10-2:30 | Settings, stats, ignore domain |
| 2:30-2:45 | Privacy note, erase data, repo |

## 🎬 Ready to Record?

Checklist:
- [ ] Chrome flags enabled and model ready
- [ ] Extension built and loaded
- [ ] Test data seeded or real pages visited
- [ ] Search works correctly
- [ ] Voice input tested
- [ ] Screen recording software ready
- [ ] Demo script memorized
- [ ] Browser window sized for recording
- [ ] Closed irrelevant tabs

**Go time! 🚀**

