interface TabNavigationProps {
  activeTab: 'search' | 'saved';
  onTabChange: (tab: 'search' | 'saved') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex border-b border-gray-800">
      <button
        onClick={() => onTabChange('search')}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
          activeTab === 'search'
            ? 'text-foreground border-b-2 border-blue-500'
            : 'text-muted hover:text-foreground'
        }`}
      >
        Search
      </button>
      <button
        onClick={() => onTabChange('saved')}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
          activeTab === 'saved'
            ? 'text-foreground border-b-2 border-blue-500'
            : 'text-muted hover:text-foreground'
        }`}
      >
        Saved
      </button>
    </div>
  );
}

