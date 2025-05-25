import { useState, useEffect, useRef } from "react";
import { X, Phone, Video, Send, Paperclip, Smile, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import wsManager from "@/lib/websocket";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: number;
  isGroup: boolean;
  name?: string;
  participants: Array<{
    uid: string;
    name: string;
    photoURL?: string;
    isOnline?: boolean;
  }>;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  conversationId: number;
  senderId: string;
  content?: string;
  mediaURL?: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file';
  createdAt: string;
}

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesModal({ isOpen, onClose }: MessagesModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Load conversations
  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
    }
  }, [isOpen, user]);

  // WebSocket listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleNewMessage = (data: any) => {
      if (data.conversationId === activeConversation?.id) {
        setMessages(prev => [...prev, {
          id: data.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          mediaURL: data.mediaURL,
          messageType: data.messageType || 'text',
          createdAt: data.createdAt
        }]);
      }
    };

    const handleUserOnline = (data: { userId: string }) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    };

    const handleUserOffline = (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    const handleTyping = (data: { conversationId: number; userId: string; isTyping: boolean }) => {
      if (data.conversationId === activeConversation?.id && data.userId !== user?.uid) {
        setIsTyping(data.isTyping);
      }
    };

    wsManager.on('message', handleNewMessage);
    wsManager.on('user_online', handleUserOnline);
    wsManager.on('user_offline', handleUserOffline);
    wsManager.on('typing', handleTyping);

    return () => {
      wsManager.off('message', handleNewMessage);
      wsManager.off('user_online', handleUserOnline);
      wsManager.off('user_offline', handleUserOffline);
      wsManager.off('typing', handleTyping);
    };
  }, [isOpen, activeConversation, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      // In real implementation, fetch from API
      const mockConversations: Conversation[] = [
        {
          id: 1,
          isGroup: false,
          participants: [
            {
              uid: "user2",
              name: "Maria Santos",
              photoURL: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
              isOnline: true
            }
          ],
          lastMessage: "Oi! Como você está?",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 2
        },
        {
          id: 2,
          isGroup: false,
          participants: [
            {
              uid: "user3",
              name: "Carlos Mendes",
              photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
              isOnline: false
            }
          ],
          lastMessage: "Viu o projeto novo?",
          lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 0
        }
      ];
      setConversations(mockConversations);
    } catch (error) {
      toast({
        title: "Erro ao carregar conversas",
        description: "Não foi possível carregar suas conversas",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      // In real implementation, fetch from API
      const mockMessages: Message[] = [
        {
          id: "1",
          conversationId,
          senderId: "user2",
          content: "Oi! Como você está?",
          messageType: "text",
          createdAt: new Date(Date.now() - 600000).toISOString()
        },
        {
          id: "2",
          conversationId,
          senderId: user?.uid || "",
          content: "Oi! Estou bem, obrigado. E você?",
          messageType: "text",
          createdAt: new Date(Date.now() - 300000).toISOString()
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      toast({
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive",
      });
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversation(conversation);
    loadMessages(conversation.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation || !user) return;

    try {
      // Send via WebSocket
      wsManager.sendMessage(activeConversation.id, newMessage.trim());
      
      // Add message to local state optimistically
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversation.id,
        senderId: user.uid,
        content: newMessage.trim(),
        messageType: "text",
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator
    if (activeConversation) {
      wsManager.sendTyping(activeConversation.id, value.length > 0);
    }
  };

  const initiateVoiceCall = () => {
    if (activeConversation && !activeConversation.isGroup) {
      const targetUser = activeConversation.participants[0];
      wsManager.initiateCall(targetUser.uid, 'voice');
      toast({
        title: "Chamada iniciada",
        description: `Chamando ${targetUser.name}...`,
      });
    }
  };

  const initiateVideoCall = () => {
    if (activeConversation && !activeConversation.isGroup) {
      const targetUser = activeConversation.participants[0];
      wsManager.initiateCall(targetUser.uid, 'video');
      toast({
        title: "Videochamada iniciada",
        description: `Chamando ${targetUser.name}...`,
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-surface h-full w-full max-w-6xl flex">
        {/* Conversations List */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-lg">Mensagens</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants[0];
              const isOnline = onlineUsers.has(otherParticipant.uid);
              
              return (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-muted border-b border-border ${
                    activeConversation?.id === conversation.id ? "bg-muted" : ""
                  }`}
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.name} />
                        <AvatarFallback>
                          {otherParticipant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold truncate">{otherParticipant.name}</h4>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                              addSuffix: false,
                              locale: ptBR,
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center text-xs p-0">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={activeConversation.participants[0].photoURL} 
                      alt={activeConversation.participants[0].name} 
                    />
                    <AvatarFallback>
                      {activeConversation.participants[0].name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{activeConversation.participants[0].name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {onlineUsers.has(activeConversation.participants[0].uid) 
                        ? "Online agora" 
                        : "Offline"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={initiateVoiceCall}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={initiateVideoCall}>
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user?.uid;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground rounded-tr-md"
                            : "bg-muted rounded-tl-md"
                        }`}
                      >
                        {message.content && (
                          <p className="text-sm">{message.content}</p>
                        )}
                        {message.mediaURL && (
                          <img
                            src={message.mediaURL}
                            alt="Shared media"
                            className="rounded-lg max-w-full h-auto"
                          />
                        )}
                        <p className={`text-xs mt-1 ${
                          isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Button type="button" variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="icon">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
                <p>Escolha uma conversa para começar a mensagem</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
