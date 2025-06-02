// Tauri API imports
const { invoke } = window.__TAURI__.core;

class VLMRealtimeApp {
    constructor() {
        this.webcamStream = null;
        this.webcamActive = false;
        this.currentModel = null;
        this.frameCount = 0;
        this.lastFrameTime = Date.now();
        this.captureCanvas = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadAvailableModels();
        this.setupCanvas();
    }

    initializeElements() {
        this.elements = {
            modelSelect: document.getElementById('modelSelect'),
            loadModelBtn: document.getElementById('loadModelBtn'),
            modelStatus: document.getElementById('modelStatus'),
            webcamVideo: document.getElementById('webcamVideo'),
            webcamCanvas: document.getElementById('webcamCanvas'),
            toggleWebcam: document.getElementById('toggleWebcam'),
            webcamStatus: document.getElementById('webcamStatus'),
            frameRate: document.getElementById('frameRate'),
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            includeWebcam: document.getElementById('includeWebcam')
        };
    }

    setupCanvas() {
        // Create a hidden canvas for capturing frames
        this.captureCanvas = document.createElement('canvas');
        this.captureCanvas.style.display = 'none';
        document.body.appendChild(this.captureCanvas);
    }

    bindEvents() {
        this.elements.loadModelBtn.addEventListener('click', () => this.loadModel());
        this.elements.toggleWebcam.addEventListener('click', () => this.toggleWebcam());
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Update frame rate display
        setInterval(() => this.updateFrameRate(), 1000);
    }

    async loadAvailableModels() {
        try {
            const models = await invoke('get_models');
            this.elements.modelSelect.innerHTML = '<option value="">Select Model...</option>';
            
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                this.elements.modelSelect.appendChild(option);
            });
        } catch (error) {
            this.showError('Failed to load available models: ' + error);
        }
    }

    async loadModel() {
        const selectedModel = this.elements.modelSelect.value;
        if (!selectedModel) {
            this.showError('Please select a model first');
            return;
        }

        this.elements.loadModelBtn.disabled = true;
        this.elements.modelStatus.textContent = 'Loading...';
        this.elements.modelStatus.className = 'status loading';

        try {
            const result = await invoke('load_model', { modelName: selectedModel });
            this.currentModel = selectedModel;
            this.elements.modelStatus.textContent = 'Model loaded successfully';
            this.elements.modelStatus.className = 'status';
            this.elements.modelStatus.style.background = '#d4edda';
            this.elements.modelStatus.style.color = '#155724';
            
            this.addMessage('system', `Model "${selectedModel}" loaded successfully`);
        } catch (error) {
            this.elements.modelStatus.textContent = 'Failed to load model';
            this.elements.modelStatus.style.background = '#f8d7da';
            this.elements.modelStatus.style.color = '#721c24';
            this.showError('Failed to load model: ' + error);
        } finally {
            this.elements.loadModelBtn.disabled = false;
        }
    }

    async toggleWebcam() {
        if (this.webcamActive) {
            this.stopWebcam();
        } else {
            await this.startWebcam();
        }
    }

    async startWebcam() {
        try {
            this.webcamStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });
            
            this.elements.webcamVideo.srcObject = this.webcamStream;
            this.webcamActive = true;
            this.elements.toggleWebcam.textContent = 'Stop Webcam';
            this.elements.webcamStatus.textContent = 'Webcam Active';
            this.elements.webcamStatus.style.background = 'rgba(34, 197, 94, 0.8)';
            
            this.startFrameCapture();
        } catch (error) {
            this.showError('Failed to access webcam: ' + error.message);
        }
    }

    stopWebcam() {
        if (this.webcamStream) {
            this.webcamStream.getTracks().forEach(track => track.stop());
            this.webcamStream = null;
        }
        
        this.webcamActive = false;
        this.elements.webcamVideo.srcObject = null;
        this.elements.toggleWebcam.textContent = 'Start Webcam';
        this.elements.webcamStatus.textContent = 'Webcam Off';
        this.elements.webcamStatus.style.background = 'rgba(0, 0, 0, 0.7)';
        this.elements.frameRate.textContent = '';
    }

    startFrameCapture() {
        if (!this.webcamActive) return;
        
        this.frameCount++;
        
        // Capture frame every 100ms for responsiveness
        setTimeout(() => this.startFrameCapture(), 100);
    }

    updateFrameRate() {
        if (this.webcamActive) {
            const now = Date.now();
            const elapsed = now - this.lastFrameTime;
            const fps = Math.round((this.frameCount * 1000) / elapsed);
            this.elements.frameRate.textContent = `${fps} FPS`;
            
            // Reset counters every 5 seconds
            if (elapsed > 5000) {
                this.frameCount = 0;
                this.lastFrameTime = now;
            }
        }
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message) return;

        if (!this.currentModel) {
            this.showError('Please load a model first');
            return;
        }

        this.elements.messageInput.value = '';
        this.elements.sendBtn.disabled = true;
        
        // Add user message to chat
        this.addMessage('user', message);
        
        // Show loading message
        const loadingId = this.addMessage('assistant', 'Thinking...', true);

        try {
            const includeWebcam = this.elements.includeWebcam.checked && this.webcamActive;
            let webcamData = null;
            
            if (includeWebcam) {
                webcamData = await this.captureWebcamFrame();
            }
            
            const response = await invoke('run_inference', {
                instruction: message,
                includeWebcam: includeWebcam,
                webcamData: webcamData
            });

            // Remove loading message and add response
            this.removeMessage(loadingId);
            this.addMessage('assistant', response.response, false, {
                model: response.model_used,
                processingTime: response.processing_time_ms + 'ms',
                hasImage: includeWebcam ? 'Yes' : 'No'
            });

        } catch (error) {
            this.removeMessage(loadingId);
            this.addMessage('assistant', 'Error: ' + error);
            this.showError('Inference failed: ' + error);
        } finally {
            this.elements.sendBtn.disabled = false;
        }
    }

    addMessage(sender, content, isLoading = false, meta = null) {
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.id = messageId;
        
        if (isLoading) {
            messageDiv.innerHTML = `
                <div class="loading"></div>
                <span>${content}</span>
            `;
        } else {
            messageDiv.textContent = content;
            
            if (meta) {
                const metaDiv = document.createElement('div');
                metaDiv.className = 'message-meta';
                let metaText = `Model: ${meta.model} | Processing: ${meta.processingTime}`;
                if (meta.hasImage) {
                    metaText += ` | Image: ${meta.hasImage}`;
                }
                metaDiv.textContent = metaText;
                messageDiv.appendChild(metaDiv);
            }
        }

        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        return messageId;
    }

    removeMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.remove();
        }
    }

    showError(message) {
        console.error(message);
        
        // Create a temporary error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            max-width: 400px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }

    async captureWebcamFrame() {
        if (!this.webcamActive || !this.elements.webcamVideo.videoWidth) return null;
        
        try {
            const video = this.elements.webcamVideo;
            const canvas = this.captureCanvas;
            const context = canvas.getContext('2d');
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw current video frame to canvas
            context.drawImage(video, 0, 0);
            
            // Convert to blob and then to array buffer
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(null);
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = () => {
                        const arrayBuffer = reader.result;
                        const uint8Array = new Uint8Array(arrayBuffer);
                        resolve(Array.from(uint8Array));
                    };
                    reader.readAsArrayBuffer(blob);
                }, 'image/jpeg', 0.8);
            });
        } catch (error) {
            console.error('Failed to capture webcam frame:', error);
            return null;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VLMRealtimeApp();
});