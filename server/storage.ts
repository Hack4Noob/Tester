import { 
  users, 
  posts, 
  stories, 
  groups, 
  conversations, 
  messages, 
  likes, 
  comments,
  type User, 
  type InsertUser,
  type Post,
  type InsertPost,
  type Story,
  type InsertStory,
  type Group,
  type InsertGroup,
  type Message,
  type InsertMessage,
  type Conversation
} from "@shared/schema";

// Enhanced storage interface for social media functionality
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(uid: string, updates: Partial<User>): Promise<User>;

  // Posts
  getPosts(limit?: number): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<Post>): Promise<Post>;
  deletePost(id: number): Promise<boolean>;
  togglePostLike(postId: number, userId: string): Promise<boolean>;

  // Stories
  getActiveStories(): Promise<Story[]>;
  getStory(id: number): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  deleteExpiredStories(): Promise<void>;

  // Groups
  getPublicGroups(): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  joinGroup(groupId: number, userId: string): Promise<boolean>;
  leaveGroup(groupId: number, userId: string): Promise<boolean>;

  // Messages & Conversations
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(participants: string[], isGroup?: boolean, name?: string): Promise<Conversation>;
  getConversationMessages(conversationId: number, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: string): Promise<void>;

  // Comments
  getPostComments(postId: number): Promise<any[]>;
  createComment(comment: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private stories: Map<number, Story>;
  private groups: Map<number, Group>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private likes: Map<string, { userId: string; postId: number; storyId?: number }>;
  private comments: Map<number, any>;
  private groupMembers: Map<string, { groupId: number; userId: string; role: string }>;
  private conversationParticipants: Map<string, { conversationId: number; userId: string }>;
  
  private currentUserId: number;
  private currentPostId: number;
  private currentStoryId: number;
  private currentGroupId: number;
  private currentConversationId: number;
  private currentMessageId: number;
  private currentCommentId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.stories = new Map();
    this.groups = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.groupMembers = new Map();
    this.conversationParticipants = new Map();
    
    this.currentUserId = 1;
    this.currentPostId = 1;
    this.currentStoryId = 1;
    this.currentGroupId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
    this.currentCommentId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username // Using email as username
    );
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.uid === uid
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(uid: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUserByUid(uid);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  // Posts
  async getPosts(limit = 20): Promise<Post[]> {
    const allPosts = Array.from(this.posts.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
    
    return allPosts;
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.currentPostId++;
    const post: Post = {
      ...insertPost,
      id,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date()
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) {
      throw new Error('Post not found');
    }
    
    const updatedPost = { ...post, ...updates };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }

  async togglePostLike(postId: number, userId: string): Promise<boolean> {
    const likeKey = `${userId}-${postId}`;
    const existing = this.likes.get(likeKey);
    
    const post = this.posts.get(postId);
    if (!post) return false;
    
    if (existing) {
      this.likes.delete(likeKey);
      post.likesCount = Math.max(0, post.likesCount - 1);
      this.posts.set(postId, post);
      return false; // unliked
    } else {
      this.likes.set(likeKey, { userId, postId });
      post.likesCount += 1;
      this.posts.set(postId, post);
      return true; // liked
    }
  }

  // Stories
  async getActiveStories(): Promise<Story[]> {
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => new Date(story.expiresAt) > now)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.currentStoryId++;
    const story: Story = {
      ...insertStory,
      id,
      viewsCount: 0,
      createdAt: new Date()
    };
    this.stories.set(id, story);
    return story;
  }

  async deleteExpiredStories(): Promise<void> {
    const now = new Date();
    for (const [id, story] of this.stories) {
      if (new Date(story.expiresAt) <= now) {
        this.stories.delete(id);
      }
    }
  }

  // Groups
  async getPublicGroups(): Promise<Group[]> {
    return Array.from(this.groups.values())
      .filter(group => group.isPublic)
      .sort((a, b) => b.memberCount - a.memberCount);
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.currentGroupId++;
    const group: Group = {
      ...insertGroup,
      id,
      memberCount: 1,
      createdAt: new Date()
    };
    this.groups.set(id, group);
    
    // Add creator as admin
    this.groupMembers.set(`${id}-${insertGroup.creatorId}`, {
      groupId: id,
      userId: insertGroup.creatorId,
      role: 'admin'
    });
    
    return group;
  }

  async joinGroup(groupId: number, userId: string): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) return false;
    
    const memberKey = `${groupId}-${userId}`;
    if (this.groupMembers.has(memberKey)) return false; // Already member
    
    this.groupMembers.set(memberKey, {
      groupId,
      userId,
      role: 'member'
    });
    
    group.memberCount += 1;
    this.groups.set(groupId, group);
    return true;
  }

  async leaveGroup(groupId: number, userId: string): Promise<boolean> {
    const memberKey = `${groupId}-${userId}`;
    if (!this.groupMembers.has(memberKey)) return false;
    
    this.groupMembers.delete(memberKey);
    
    const group = this.groups.get(groupId);
    if (group) {
      group.memberCount = Math.max(0, group.memberCount - 1);
      this.groups.set(groupId, group);
    }
    
    return true;
  }

  // Messages & Conversations
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const userConversations: Conversation[] = [];
    
    for (const participant of this.conversationParticipants.values()) {
      if (participant.userId === userId) {
        const conversation = this.conversations.get(participant.conversationId);
        if (conversation) {
          userConversations.push(conversation);
        }
      }
    }
    
    return userConversations.sort((a, b) => 
      new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    );
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(participants: string[], isGroup = false, name?: string): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = {
      id,
      isGroup,
      name: name || null,
      lastMessage: null,
      lastMessageAt: null,
      createdAt: new Date()
    };
    
    this.conversations.set(id, conversation);
    
    // Add participants
    participants.forEach(userId => {
      this.conversationParticipants.set(`${id}-${userId}`, {
        conversationId: id,
        userId
      });
    });
    
    return conversation;
  }

  async getConversationMessages(conversationId: number, limit = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
      .slice(-limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      isRead: false,
      createdAt: new Date()
    };
    
    this.messages.set(id, message);
    
    // Update conversation last message
    const conversation = this.conversations.get(insertMessage.conversationId);
    if (conversation) {
      conversation.lastMessage = insertMessage.content || "Media message";
      conversation.lastMessageAt = new Date();
      this.conversations.set(insertMessage.conversationId, conversation);
    }
    
    return message;
  }

  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    for (const [id, message] of this.messages) {
      if (message.conversationId === conversationId && message.senderId !== userId) {
        message.isRead = true;
        this.messages.set(id, message);
      }
    }
  }

  // Comments
  async getPostComments(postId: number): Promise<any[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createComment(comment: any): Promise<any> {
    const id = this.currentCommentId++;
    const newComment = {
      ...comment,
      id,
      createdAt: new Date()
    };
    
    this.comments.set(id, newComment);
    
    // Update post comment count
    const post = this.posts.get(comment.postId);
    if (post) {
      post.commentsCount += 1;
      this.posts.set(comment.postId, post);
    }
    
    return newComment;
  }
}

export const storage = new MemStorage();
