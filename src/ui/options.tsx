import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DBStats, Settings } from '@/types/models';
import { getSettings, updateSettings, getStats } from './lib/chromeApi';
import { SettingsForm } from './components/SettingsForm';
import { StatsCard } from './components/StatsCard';
import { DataManagement } from './components/DataManagement';
import './styles.css';

function Options() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const loadedStats = await getStats();
      setStats(loadedStats);
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const handleSaveSettings = async (newSettings: Partial<Settings>) => {
    await updateSettings(newSettings);
    await loadSettings();
  };

  const handleDataErased = () => {
    loadStats();
    loadSettings();
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-skeleton">
            <div className="h-10 bg-slate-700 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Talk To Your History</h1>
          <p className="text-muted">
            Configure your private, on-device history search powered by Chrome Built-in AI
          </p>
        </div>

        {/* Chrome AI Setup Notice */}
        <div className="card mb-6 bg-blue-900/20 border border-blue-700">
          <h3 className="font-semibold mb-2">⚙️ Chrome Built-in AI Setup Required</h3>
          <p className="text-sm text-muted mb-2">
            To use this extension, you need to enable Chrome's Built-in AI features:
          </p>
          <ol className="text-sm text-muted space-y-1 list-decimal list-inside ml-2">
            <li>Open <code className="bg-slate-800 px-1 rounded">chrome://flags</code> in a new tab</li>
            <li>Enable: <code className="bg-slate-800 px-1 rounded">#optimization-guide-on-device-model</code></li>
            <li>Enable: <code className="bg-slate-800 px-1 rounded">#prompt-api-for-gemini-nano</code></li>
            <li>Enable: <code className="bg-slate-800 px-1 rounded">#summarization-api-for-gemini-nano</code></li>
            <li>Enable: <code className="bg-slate-800 px-1 rounded">#translation-api</code></li>
            <li>Enable: <code className="bg-slate-800 px-1 rounded">#rewriter-api</code></li>
            <li>Restart Chrome and wait for Gemini Nano model to download (5-10 minutes)</li>
          </ol>
        </div>

        {/* Settings */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Settings</h2>
          {settings && <SettingsForm settings={settings} onSave={handleSaveSettings} />}
        </div>

        {/* Stats */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
          <StatsCard stats={stats} isLoading={isLoadingStats} onRefresh={loadStats} />
        </div>

        {/* Data Management */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Management</h2>
          <DataManagement onDataErased={handleDataErased} />
        </div>

        {/* Privacy Notice */}
        <div className="card bg-green-900/20 border border-green-700">
          <h3 className="font-semibold mb-2">🔒 Privacy First</h3>
          <ul className="text-sm text-muted space-y-1 list-disc list-inside ml-2">
            <li>All AI processing happens on your device using Gemini Nano</li>
            <li>No data is sent to external servers</li>
            <li>Incognito sessions are never indexed</li>
            <li>You can erase all data at any time</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted">
          <p>Talk To Your History v0.1.0</p>
          <p className="mt-1">Built for Chrome Built-in AI Challenge 2025</p>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>
  );
}

