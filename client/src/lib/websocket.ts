import { User } from "@shared/schema";

interface WebSocketMessage {
  type: 'message' | 'user_online' | 'user_offline' | 'typing' | 'call_request' | 'call_response';
  data: any;
  timestamp: number;
}

class WebSocketManager {
  private socket: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private listeners: Map<string, Function[]> = new Map();
  private currentUser: User | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected', true);
        
        // Send user identification if logged in
        if (this.currentUser) {
          this.send('user_online', { userId: this.currentUser.uid });
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.emit(message.type, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('connected', false);
        this.reconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached', true);
    }
  }

  public send(type: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: type as any,
        data,
        timestamp: Date.now()
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  public setUser(user: User | null) {
    this.currentUser = user;
    if (user && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('user_online', { userId: user.uid });
    }
  }

  public sendMessage(conversationId: number, content: string, mediaUrl?: string) {
    this.send('message', {
      conversationId,
      content,
      mediaUrl,
      senderId: this.currentUser?.uid
    });
  }

  public sendTyping(conversationId: number, isTyping: boolean) {
    this.send('typing', {
      conversationId,
      isTyping,
      userId: this.currentUser?.uid
    });
  }

  public initiateCall(userId: string, callType: 'voice' | 'video') {
    this.send('call_request', {
      targetUserId: userId,
      callType,
      callerId: this.currentUser?.uid
    });
  }

  public respondToCall(callId: string, accept: boolean) {
    this.send('call_response', {
      callId,
      accept,
      userId: this.currentUser?.uid
    });
  }

  public disconnect() {
    if (this.currentUser) {
      this.send('user_offline', { userId: this.currentUser.uid });
    }
    
    if (this.socket) {
      this.socket.close();
    }
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

export default wsManager;
