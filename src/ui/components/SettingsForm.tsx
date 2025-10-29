import React, { useState } from 'react';
import { Settings } from '@/types/models';

interface SettingsFormProps {
  settings: Settings;
  onSave: (settings: Partial<Settings>) => Promise<void>;
}

export function SettingsForm({ settings, onSave }: SettingsFormProps) {
  const [formData, setFormData] = useState<Settings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await onSave(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDomainsChange = (value: string) => {
    const domains = value.split('\n').filter((d) => d.trim());
    setFormData({ ...formData, ignoredDomains: domains });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.indexingEnabled}
            onChange={(e) => setFormData({ ...formData, indexingEnabled: e.target.checked })}
            className="w-5 h-5 rounded border-gray-700 bg-secondary text-primary 
                     focus:ring-2 focus:ring-primary"
          />
          <div>
            <div className="font-medium">Enable Indexing</div>
            <div className="text-sm text-muted">
              Allow the extension to index and summarize your browsing history
            </div>
          </div>
        </label>
      </div>

      <div>
        <label className="block mb-2 font-medium">Ignored Domains</label>
        <textarea
          value={formData.ignoredDomains.join('\n')}
          onChange={(e) => handleDomainsChange(e.target.value)}
          placeholder="example.com&#10;social-media.com"
          rows={5}
          className="textarea"
        />
        <p className="text-sm text-muted mt-1">One domain per line</p>
      </div>

      <div>
        <label className="block mb-2 font-medium">Preferred Language</label>
        <select
          value={formData.preferredLanguage}
          onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
          className="input"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
        </select>
      </div>

      <div>
        <label className="block mb-2 font-medium">Max Pages Per Day</label>
        <input
          type="number"
          min="10"
          max="1000"
          value={formData.maxPagesPerDay}
          onChange={(e) =>
            setFormData({ ...formData, maxPagesPerDay: parseInt(e.target.value) })
          }
          className="input"
        />
        <p className="text-sm text-muted mt-1">
          Maximum number of pages to index per day (10-1000)
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="btn btn-primary"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

        {saveStatus === 'success' && (
          <div className="flex items-center text-green-500 text-sm">
            ✓ Settings saved
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="flex items-center text-red-500 text-sm">
            ✗ Failed to save
          </div>
        )}
      </div>
    </form>
  );
}

