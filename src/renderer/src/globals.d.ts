import { ChatAPI } from '../../preload/api';

declare global {
    interface Window {
        chatAPI: ChatAPI;
    }
}
