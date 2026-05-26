// public/js/chat_widget.js - SERVERLESS FLOATING ASSISTANT WIDGET
class PDFChatWidget {
    constructor() {
        this.isOpen = false;
        this.chatHistory = [];
        this.currentTopic = null;
        this.init();
    }
    
    init() {
        this.createWidget();
        this.bindEvents();
        console.log('PDF Chat Widget initialized with Serverless Route namespaces');
    }
    
    createWidget() {
        this.container = document.createElement('div');
        this.container.id = 'pdf-chat-widget-root';
        this.container.innerHTML = `
            <div class="chat-widget-toggle" id="widgetChatToggle" style="position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: linear-gradient(135deg, #4a6cf7, #667eea); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.15); z-index: 999999; transition: transform 0.2s;">
                <span class="chat-icon">🤖</span>
            </div>
            <div class="chat-widget-container" id="widgetChatContainer" style="display: none; position: fixed; bottom: 20px; right: 20px; width: 350px; height: 450px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; z-index: 999999; overflow: hidden; font-family: system-ui, sans-serif;">
                <div class="chat-header" style="background: linear-gradient(135deg, #4a6cf7, #667eea); color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                    <h5 style="margin: 0; font-size: 16px;"><a href="/chatbot" target="_blank" style="color: inherit; text-decoration: none;">PDF Assistant <i class="fas fa-external-link-alt" style="font-size: 12px;"></i></a></h5>
                    <button class="close-chat" id="widgetCloseChat" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer; line-height: 1;">×</button>
                </div>
                <div class="chat-messages" id="widgetChatMessages" style="height: 290px; overflow-y: auto; padding: 15px; background: #f8fafc; display: flex; flex-direction: column; gap: 10px; text-align: left;">
                    <div class="message bot" style="align-self: flex-start; max-width: 85%;">
                        <div class="message-content" style="background: white; color: #334155; padding: 10px 14px; border-radius: 12px 12px 12px 4px; font-size: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); line-height: 1.4;">
                            Hello! I'm your PDF Tools Assistant. Ask me about merging, splitting, compressing, or premium features!
                        </div>
                    </div>
                </div>
                <div class="chat-input" style="padding: 10px; background: white; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;">
                    <input type="text" id="widgetChatInput" placeholder="Type your message..." style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; outline: none;" />
                    <button id="widgetSendMessage" style="background: #4a6cf7; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">Send</button>
                </div>
                <div class="chat-footer" style="padding: 4px 10px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
                    <a href="/chatbot" target="_blank" style="color: #4a6cf7; text-decoration: none; font-weight: 500;">Open full chat</a>
                    <span style="font-size: 10px; opacity: 0.8;">Privacy-First AI</span>
                </div>
            </div>
        `;
        document.body.appendChild(this.container);
    }
    
    bindEvents() {
        document.getElementById('widgetChatToggle').addEventListener('click', () => this.toggleChat());
        document.getElementById('widgetCloseChat').addEventListener('click', () => this.toggleChat());
        document.getElementById('widgetSendMessage').addEventListener('click', () => this.sendMessage());
        document.getElementById('widgetChatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }
    
    toggleChat() {
        this.isOpen = !this.isOpen;
        const container = document.getElementById('widgetChatContainer');
        const toggle = document.getElementById('widgetChatToggle');
        
        if (this.isOpen) {
            container.style.display = 'block';
            toggle.style.display = 'none';
            document.getElementById('widgetChatInput').focus();
        } else {
            container.style.display = 'none';
            toggle.style.display = 'flex';
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('widgetChatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addMessage(message, 'user');
        input.value = '';
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: message,
                    history: this.chatHistory,
                    currentTopic: this.currentTopic
                })
            });
            
            const data = await response.json();
            
            if (data.response) {
                this.addMessage(data.response, 'bot');
                
                if (data.context?.detectedTopic) {
                    this.currentTopic = data.context.detectedTopic;
                }
                this.chatHistory.push({ role: 'user', content: message });
                this.chatHistory.push({ role: 'assistant', content: data.response });
            } else {
                this.addMessage('Sorry, I encountered an operational network loop error. Please retry.', 'bot');
            }
        } catch (error) {
            this.addMessage('Connection issue. Please verify your local network status and try again.', 'bot');
        }
    }
    
    addMessage(text, sender) {
        const messagesDiv = document.getElementById('widgetChatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';
        messageDiv.style.maxWidth = '85%';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.style.cssText = sender === 'user' 
            ? 'background: linear-gradient(135deg, #4a6cf7, #667eea); color: white; padding: 10px 14px; border-radius: 12px 12px 4px 12px; font-size: 14px; box-shadow: 0 2px 4px rgba(74,108,247,0.15); line-height: 1.4;'
            : 'background: white; color: #334155; padding: 10px 14px; border-radius: 12px 12px 12px 4px; font-size: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); line-height: 1.4;';
        
        contentDiv.textContent = text;
        
        messageDiv.appendChild(contentDiv);
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        if (sender === 'bot' && !this.isOpen) {
            this.toggleChat();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pdfChatWidget = new PDFChatWidget();
});
