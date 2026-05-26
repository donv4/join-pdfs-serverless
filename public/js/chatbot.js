// public/js/chatbot.js - INDEPENDENT CORE ASSISTANT CONTROLLER
document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('pageChatMessages');
    const chatInput = document.getElementById('pageChatInput');
    const sendButton = document.getElementById('pageSendButton');
    
    if (!chatMessages || !chatInput || !sendButton) {
        console.warn('Dedicated assistant page components missing from current view layout context.');
        return;
    }

    let currentTopic = null;
    let chatHistory = [];
    
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = message;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        addMessage(message, true);
        chatInput.value = '';
        setLoadingState(true);
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    history: chatHistory,
                    currentTopic: currentTopic
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.response) {
                addMessage(data.response);
                if (data.context?.detectedTopic) {
                    currentTopic = data.context.detectedTopic;
                }
                chatHistory.push({ role: 'user', content: message });
                chatHistory.push({ role: 'assistant', content: data.response });
            } else {
                addMessage('Sorry, I encountered an issue verifying your request token parameter models. Please try again.');
            }
        } catch (error) {
            console.error('Connection Dropped:', error);
            addMessage('Connection issue. Please verify your local network status and try again.');
        } finally {
            setLoadingState(false);
        }
    }
    
    function setLoadingState(isLoading) {
        sendButton.disabled = isLoading;
        chatInput.disabled = isLoading;
        if (isLoading) {
            sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
        }
    }
    
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    chatInput.focus();
    console.log('Isolated serverless chat controller loaded safely.');
});
