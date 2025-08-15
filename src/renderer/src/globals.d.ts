import {ChatAPI, ModelProviderAPI} from '../../preload/api';

declare global {
    interface Window {
        chatAPI: ChatAPI;
        modelProviderAPI: ModelProviderAPI;
    }
}
