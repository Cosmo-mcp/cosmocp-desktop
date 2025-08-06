
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {useEffect, useState} from 'react';

const modelProviders = [
  'OpenAI',
  'Google',
  'Microsoft',
  'Anthropic',
  'Cohere',
  'Mistral',
];

export function AddModelDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    if (selectedProvider) {
      const model = models.find((m) => m.provider === selectedProvider);
      if (model) {
        setApiEndpoint(model.endpoint || '');
        setApiKey(model.apiKey || '');
      } else {
        setApiEndpoint('');
        setApiKey('');
      }
    }
  }, [selectedProvider, models]);

  const handleSave = () => {
    if (selectedProvider) {
      window.chatAPI.saveModel({
        provider: selectedProvider,
        endpoint: apiEndpoint,
        apiKey: apiKey,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-3/4 flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Model</DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex">
          <div className="w-1/4 border-r pr-4">
            <h3 className="text-lg font-semibold mb-4">Model Providers</h3>
            <ul>
              {modelProviders.map((provider) => (
                <li
                  key={provider}
                  className={`cursor-pointer p-2 rounded ${
                    selectedProvider === provider ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedProvider(provider)}
                >
                  {provider}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-3/4 pl-4">
            {selectedProvider ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {selectedProvider}
                </h3>
                <form>
                  <div className="mb-4">
                    <label
                      htmlFor="api-endpoint"
                      className="block text-sm font-medium text-gray-700"
                    >
                      API Endpoint/URL
                    </label>
                    <input
                      type="text"
                      id="api-endpoint"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="api-key"
                      className="block text-sm font-medium text-gray-700"
                    >
                      API Key
                    </label>
                    <input
                      type="password"
                      id="api-key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <Button onClick={handleSave}>Save</Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  Select a provider to configure a new model.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
