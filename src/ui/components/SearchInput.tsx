import React, { useState } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function SearchInput({ value, onChange, onSubmit, isLoading }: SearchInputProps) {
  const [showVoiceHint, setShowVoiceHint] = useState(false);

  const handleVoiceResult = (text: string) => {
    if (text) {
      onChange(text);
      // Auto-submit after transcription
      setTimeout(() => {
        onSubmit();
      }, 100);
    }
  };

  const { isListening, isSupported, interimText, startListening, stopListening } =
    useVoiceInput(handleVoiceResult);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const displayValue = isListening && interimText ? interimText : value;

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about pages you've visited..."
          className="input flex-1"
          disabled={isListening || isLoading}
        />
        
        {isSupported && (
          <button
            onClick={isListening ? stopListening : startListening}
            onMouseEnter={() => setShowVoiceHint(true)}
            onMouseLeave={() => setShowVoiceHint(false)}
            disabled={isLoading}
            className={`btn ${
              isListening ? 'bg-red-600 hover:bg-red-700' : 'btn-secondary'
            } px-4`}
            aria-label={isListening ? 'Stop recording' : 'Voice input'}
            title={isListening ? 'Click to stop recording' : 'Click to start voice input'}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
        )}
        
        <button
          onClick={onSubmit}
          disabled={!value.trim() || isLoading || isListening}
          className="btn btn-primary px-6"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-2 text-center text-sm text-blue-400">
          {interimText || 'Recording... (Click button or wait 10s to stop)'}
        </div>
      )}
      
      {showVoiceHint && !isListening && (
        <div className="absolute top-full left-0 right-0 mt-2 text-center text-xs text-muted">
          Uses Chrome AI for on-device transcription
        </div>
      )}
    </div>
  );
}

