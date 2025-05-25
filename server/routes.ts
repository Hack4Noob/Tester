import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

interface WebSocketMessage {
  type: 'message' | 'user_online' | 'user_offline' | 'typing' | 'call_request' | 'call_response';
  data: any;
  timestamp: number;
}

interface ConnectedUser {
  ws: WebSocket;
  userId: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });
  
  const connectedUsers = new Map<string, ConnectedUser>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'user_online':
            const userId = message.data.userId;
            connectedUsers.set(userId, { ws, userId });
            
            // Broadcast user online status
            broadcast({
              type: 'user_online',
              data: { userId },
              timestamp: Date.now()
            }, userId);
            break;
            
          case 'user_offline':
            const offlineUserId = message.data.userId;
            connectedUsers.delete(offlineUserId);
            
            // Broadcast user offline status
            broadcast({
              type: 'user_offline',
              data: { userId: offlineUserId },
              timestamp: Date.now()
            }, offlineUserId);
            break;
            
          case 'message':
            // Store message in database (would use storage interface)
            const messageData = {
              ...message.data,
              timestamp: Date.now()
            };
            
            // Broadcast to conversation participants
            broadcast({
              type: 'message',
              data: messageData,
              timestamp: Date.now()
            });
            break;
            
          case 'typing':
            // Broadcast typing indicator
            broadcast({
              type: 'typing',
              data: message.data,
              timestamp: Date.now()
            }, message.data.userId);
            break;
            
          case 'call_request':
            // Handle WebRTC call initiation
            const targetUser = connectedUsers.get(message.data.targetUserId);
            if (targetUser && targetUser.ws.readyState === WebSocket.OPEN) {
              targetUser.ws.send(JSON.stringify({
                type: 'call_request',
                data: message.data,
                timestamp: Date.now()
              }));
            }
            break;
            
          case 'call_response':
            // Handle WebRTC call response
            broadcast({
              type: 'call_response',
              data: message.data,
              timestamp: Date.now()
            }, message.data.userId);
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Remove from connected users
      for (const [userId, user] of connectedUsers) {
        if (user.ws === ws) {
          connectedUsers.delete(userId);
          broadcast({
            type: 'user_offline',
            data: { userId },
            timestamp: Date.now()
          }, userId);
          break;
        }
      }
    });
  });

  function broadcast(message: WebSocketMessage, excludeUserId?: string) {
    const messageStr = JSON.stringify(message);
    
    connectedUsers.forEach((user, userId) => {
      if (userId !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(messageStr);
      }
    });
  }

  // API Routes for social media functionality
  
  // Users
  app.get('/api/users/profile/:uid', async (req, res) => {
    try {
      const user = await storage.getUserByUid(req.params.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Posts
  app.get('/api/posts', async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/posts', async (req, res) => {
    try {
      const post = await storage.createPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/posts/:id/like', async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.togglePostLike(parseInt(req.params.id), userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Stories
  app.get('/api/stories', async (req, res) => {
    try {
      const stories = await storage.getActiveStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/stories', async (req, res) => {
    try {
      const story = await storage.createStory(req.body);
      res.status(201).json(story);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Groups
  app.get('/api/groups', async (req, res) => {
    try {
      const groups = await storage.getPublicGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/groups', async (req, res) => {
    try {
      const group = await storage.createGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Messages
  app.get('/api/conversations/:userId', async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(req.params.userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/conversations/:id/messages', async (req, res) => {
    try {
      const messages = await storage.getConversationMessages(parseInt(req.params.id));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/conversations/:id/messages', async (req, res) => {
    try {
      const message = await storage.createMessage({
        ...req.body,
        conversationId: parseInt(req.params.id)
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // External API proxy endpoints for CORS issues
  app.get('/api/proxy/deezer/:trackId', async (req, res) => {
    try {
      const response = await fetch(`https://api.deezer.com/track/${req.params.trackId}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch from Deezer API' });
    }
  });

  app.get('/api/proxy/nasa/apod', async (req, res) => {
    try {
      const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch from NASA API' });
    }
  });

  app.get('/api/proxy/weather/:city', async (req, res) => {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || 'your_api_key';
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${req.params.city}&appid=${apiKey}&units=metric`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch weather data' });
    }
  });

  return httpServer;
}
