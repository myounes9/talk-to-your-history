import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useSearchStore } from './store/searchStore';
import { useSavedStore } from './store/savedStore';
import { SearchInput } from './components/SearchInput';
import { ResultCard } from './components/ResultCard';
import { EmptyState } from './components/EmptyState';
import { SkeletonLoader } from './components/SkeletonLoader';
import { TabNavigation } from './components/TabNavigation';
import { SavedView } from './components/SavedView';
import { SaveButton } from './components/SaveButton';
import { seedTestData } from './lib/chromeApi';
import './styles.css';

function Popup() {
  const { query, results, isSearching, error, setQuery, search, loadSettings, settings } =
    useSearchStore();
  const { loadFolders } = useSavedStore();
  const [hasSearched, setHasSearched] = useState(false);
  const [showTestButton, setShowTestButton] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [currentTabInfo, setCurrentTabInfo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    loadSettings();
    loadFolders();
    
    // Get current tab info for "Save Current Tab" feature
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentTabInfo({
          url: tabs[0].url || '',
          title: tabs[0].title || '',
        });
      }
    });
  }, [loadSettings, loadFolders]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setHasSearched(true);
    await search(query);
  };

  const handleSeedTest = async () => {
    try {
      await seedTestData();
      alert('Test data seeded! Try searching for "content planning" or "AI pricing"');
    } catch (error) {
      console.error('Failed to seed test data', error);
      alert('Failed to seed test data');
    }
  };

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="w-[600px] h-[500px] flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Talk To Your History</h1>
          <div className="flex items-center gap-2">
            {currentTabInfo && activeTab === 'saved' && (
              <SaveButton
                url={currentTabInfo.url}
                title={currentTabInfo.title}
                sourceType="current-tab"
                onSaved={() => {
                  // Optionally reload saved items
                }}
              />
            )}
            <button
              onClick={() => setShowTestButton(!showTestButton)}
              className="text-muted hover:text-foreground text-sm"
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
        
        {activeTab === 'search' && (
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            isLoading={isSearching}
          />
        )}

        {showTestButton && (
          <div className="flex gap-2 mt-2">
            <button onClick={handleSeedTest} className="btn btn-secondary text-xs">
              Seed Test Data
            </button>
            <button onClick={handleOpenOptions} className="btn btn-secondary text-xs">
              Open Settings
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      {activeTab === 'search' ? (
        <>
          {/* Status Messages */}
          {settings && !settings.indexingEnabled && !hasSearched && (
            <div className="mx-4 mt-4 p-3 bg-amber-900/30 border border-amber-700 rounded text-sm">
              ⚠️ Indexing is disabled. Enable it in{' '}
              <button onClick={handleOpenOptions} className="underline">
                settings
              </button>{' '}
              to search your history.
            </div>
          )}

          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-900/30 border border-red-700 rounded text-sm">
              ❌ {error}
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {isSearching ? (
              <SkeletonLoader />
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            ) : (
              <EmptyState hasSearched={hasSearched} />
            )}
          </div>
        </>
      ) : (
        <SavedView />
      )}

      {/* Footer */}
      <div className="p-2 border-t border-gray-800 text-center text-xs text-muted">
        Powered by Chrome Built-in AI • All processing on-device
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}

