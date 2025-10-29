import { useState } from 'react';
import { eraseAllData, triggerScan, seedTestData } from '../lib/chromeApi';

interface DataManagementProps {
  onDataErased: () => void;
}

export function DataManagement({ onDataErased }: DataManagementProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleEraseClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmErase = async () => {
    setIsErasing(true);
    try {
      await eraseAllData();
      setShowConfirm(false);
      onDataErased();
      alert('All data has been erased successfully');
    } catch (error) {
      console.error('Failed to erase data', error);
      alert('Failed to erase data');
    } finally {
      setIsErasing(false);
    }
  };

  const handleCancelErase = () => {
    setShowConfirm(false);
  };

  const handleSeedTestData = async () => {
    setIsSeeding(true);
    try {
      await seedTestData();
      alert('Test data seeded successfully! You can now search for:\n• "content planning"\n• "AI pricing"\n• "HubSpot shortcuts"');
      onDataErased(); // Refresh stats
    } catch (error) {
      console.error('Failed to seed test data', error);
      alert('Failed to seed test data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      await triggerScan();
      alert('Scan triggered successfully. Check back in a few minutes.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Scan failed:', error);
      
      // Show specific, actionable error
      if (message.includes('AI is not ready')) {
        alert('Chrome AI is not ready yet.\n\n' +
              '1. Enable flags at chrome://flags\n' +
              '2. Wait 5-10 minutes for model download\n' +
              '3. Check chrome://components for "Optimization Guide"');
      } else if (message.includes('Indexing is disabled')) {
        alert('Indexing is disabled. Please enable it in the settings above.');
      } else {
        alert(`Scan failed: ${message}\n\nCheck the service worker console for details.`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Data Management</h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Seed Test Data</h4>
          <p className="text-sm text-muted mb-3">
            Add 3 sample pages to test the extension. Works without AI! Search for "content planning" or "AI pricing" after seeding.
          </p>
          <button
            onClick={handleSeedTestData}
            disabled={isSeeding}
            className="btn btn-primary"
          >
            {isSeeding ? 'Seeding...' : 'Add Test Data'}
          </button>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-medium mb-2">Trigger Scan</h4>
          <p className="text-sm text-muted mb-3">
            Manually trigger a scan of your recent browsing history. This will index new pages
            and update existing ones. (Requires AI to be available)
          </p>
          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="btn btn-primary"
          >
            {isScanning ? 'Scanning...' : 'Trigger Scan Now'}
          </button>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-medium mb-2 text-red-400">Danger Zone</h4>
          <p className="text-sm text-muted mb-3">
            Permanently delete all indexed pages and settings. This action cannot be undone.
          </p>

          {!showConfirm ? (
            <button onClick={handleEraseClick} className="btn btn-danger">
              Erase All Data
            </button>
          ) : (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded">
              <p className="text-sm mb-3">
                Are you sure? This will permanently delete all indexed pages and settings.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmErase}
                  disabled={isErasing}
                  className="btn btn-danger text-sm"
                >
                  {isErasing ? 'Erasing...' : 'Yes, Erase Everything'}
                </button>
                <button
                  onClick={handleCancelErase}
                  disabled={isErasing}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

