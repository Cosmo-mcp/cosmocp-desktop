'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Provider, Model } from '../lib/types';
import {Button} from "@/components/ui/button";

function ProviderForm({ provider, onSave, onDelete }: {
  provider?: Provider | null;
  onSave: (provider: Provider) => Promise<void>;
  onDelete?: (providerId: string) => Promise<void>;
}) {
  const [name, setName] = useState(provider?.name || '');
  const [apiKey, setApiKey] = useState(provider?.apiKey || '');
  const [baseURL, setBaseURL] = useState(provider?.baseURL || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProvider: Provider = {
      id: provider?.id || Date.now().toString(),
      name,
      apiKey,
      baseURL,
      models: provider?.models || [],
    };
    onSave(newProvider);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Provider Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
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
      <div className="mb-4">
        <label htmlFor="base-url" className="block text-sm font-medium text-gray-700">
          Base URL (optional)
        </label>
        <input
          type="text"
          id="base-url"
          value={baseURL}
          onChange={(e) => setBaseURL(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="flex justify-end gap-2">
        {provider && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => onDelete(provider.id)}
          >
            Delete
          </Button>
        )}
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export function ManageProvidersDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const getProviders = window.chatAPI.getProviders;

  useEffect(() => {
    if (open) {
      getProviders().then(setProviders);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-3/4 flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Providers</DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex">
          <div className="w-1/4 border-r pr-4">
            <h3 className="text-lg font-semibold mb-4">Providers</h3>
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => setSelectedProvider(null)}
            >
              New Provider
            </Button>
            <ul>
              {providers.map((provider) => (
                <li
                  key={provider.id}
                  className={`cursor-pointer p-2 rounded ${
                    selectedProvider?.id === provider.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedProvider(provider)}
                >
                  {provider.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-3/4 pl-4">
            {selectedProvider ? (
              <ProviderForm
                provider={selectedProvider}
                onSave={async (provider) => {
                  await window.chatAPI.updateProvider(provider);
                  const updatedProviders = await getProviders();
                  setProviders(updatedProviders);
                }}
                onDelete={async (providerId) => {
                  await window.chatAPI.deleteProvider(providerId);
                  const updatedProviders = await getProviders();
                  setProviders(updatedProviders);
                  setSelectedProvider(null);
                }}
              />
            ) : (
              <ProviderForm
                onSave={async (provider) => {
                  await window.chatAPI.addProvider(provider);
                  const updatedProviders = await getProviders();
                  setProviders(updatedProviders);
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}