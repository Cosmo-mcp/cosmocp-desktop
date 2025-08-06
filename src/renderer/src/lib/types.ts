export interface Model {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  apiKey: string;
  baseURL?: string;
  models: Model[];
}