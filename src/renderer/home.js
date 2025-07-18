if (window.electronAPI) {
    const nameInput = document.getElementById('nameInput');
    const sendButton = document.getElementById('sendButton');
    const responseDisplay = document.getElementById('response-display');

    sendButton.addEventListener('click', async () => {
        const name = nameInput.value || 'Anonymous';
        responseDisplay.innerText = 'Requesting message...';
        try {
            const message = await window.electronAPI.getHelloMessage(name);
            responseDisplay.innerText = message;
        } catch (error) {
            console.error('Error getting message from main process:', error);
            responseDisplay.innerText = `Error: ${error.message}`;
        }
    });
} else {
    console.error('electronAPI not found on window object. Preload script might not be loaded correctly or contextIsolation is disabled.');
}