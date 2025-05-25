import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { TopNavigation } from "@/components/Navigation/TopNavigation";
import { BottomNavigation } from "@/components/Navigation/BottomNavigation";
import { StoriesBar } from "@/components/Feed/StoriesBar";
import { CreatePost } from "@/components/Feed/CreatePost";
import { PostCard } from "@/components/Feed/PostCard";
import { StoryEditor } from "@/components/Stories/StoryEditor";
import { MessagesModal } from "@/components/Messages/MessagesModal";
import { ModalidadesModal } from "@/components/Categories/ModalidadesModal";
import { GroupsModal } from "@/components/Groups/GroupsModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, TrendingUp } from "lucide-react";

interface Post {
  id: string;
  authorId: string;
  author: {
    name: string;
    photoURL?: string;
  };
  content: string;
  mediaURL?: string;
  musicTrackId?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  isLiked?: boolean;
  likes?: string[];
}

interface Story {
  id: string;
  authorId: string;
  author: {
    name: string;
    photoURL?: string;
  };
  mediaURL: string;
  viewsCount: number;
  createdAt: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Modal states
  const [isStoryEditorOpen, setIsStoryEditorOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isModalidadesOpen, setIsModalidadesOpen] = useState(false);
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Load posts from Firestore
  useEffect(() => {
    if (!user) return;

    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          isLiked: data.likes?.includes(user.uid) || false,
          likesCount: data.likes?.length || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Post;
      });
      setPosts(postsData);
    }, (error) => {
      console.error("Erro ao carregar posts:", error);
      setPosts([]);
    });

    return unsubscribe;
  }, [user]);

  // Load stories from Firestore
  useEffect(() => {
    if (!user) return;

    const storiesQuery = query(
      collection(db, "stories"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
      const storiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Story;
      });
      setStories(storiesData);
    }, (error) => {
      console.error("Erro ao carregar stories:", error);
      setStories([]);
    });

    return unsubscribe;
  }, [user]);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCreatePost = async (postData: {
    content: string;
    mediaURL?: string;
    musicTrackId?: string;
    visibility: string;
  }) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        author: {
          name: `${user.name} ${user.surname}`,
          photoURL: user.photoURL,
        },
        content: postData.content,
        mediaURL: postData.mediaURL,
        musicTrackId: postData.musicTrackId,
        visibility: postData.visibility,
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error("Falha ao criar post");
    }
  };

  const handleCreateStory = async (storyData: {
    mediaURL: string;
    musicTrackId?: string;
  }) => {
    if (!user) return;

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await addDoc(collection(db, "stories"), {
        authorId: user.uid,
        author: {
          name: `${user.name} ${user.surname}`,
          photoURL: user.photoURL,
        },
        mediaURL: storyData.mediaURL,
        musicTrackId: storyData.musicTrackId,
        views: [],
        reactions: [],
        expiresAt: expiresAt,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      throw new Error("Falha ao criar story");
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const postRef = doc(db, "posts", postId);
      
      if (post.isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível curtir o post",
        variant: "destructive",
      });
    }
  };

  const handleCommentPost = (postId: string) => {
    // Implementation for commenting would go here
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Os comentários serão implementados em breve",
    });
  };

  const handleSharePost = (postId: string) => {
    // Implementation for sharing would go here
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O compartilhamento será implementado em breve",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation
        onMessagesClick={() => setIsMessagesOpen(true)}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
      />

      <div className="pt-14 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Sidebar - Navigation */}
            <div className="hidden lg:block">
              <div className="bg-card rounded-lg p-4 shadow-sm sticky top-20 space-y-4">
                <h3 className="font-semibold mb-4">Menu</h3>
                <nav className="space-y-2">
                  <Button 
                    variant={activeTab === "home" ? "secondary" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("home")}
                  >
                    <i className="fas fa-home mr-3 text-primary"></i>
                    Início
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setIsModalidadesOpen(true)}
                  >
                    <i className="fas fa-th-large mr-3 text-primary"></i>
                    Modalidades
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setIsGroupsOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-3 text-primary" />
                    Grupos
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setIsMessagesOpen(true)}
                  >
                    <i className="fas fa-comments mr-3 text-primary"></i>
                    Mensagens
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <i className="fas fa-calendar mr-3 text-primary"></i>
                    Eventos
                  </Button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stories */}
              <StoriesBar
                stories={stories}
                onCreateStory={() => setIsStoryEditorOpen(true)}
                onViewStory={(storyId) => {
                  // Implementation for viewing story would go here
                  toast({
                    title: "Funcionalidade em desenvolvimento",
                    description: "Visualização de stories será implementada em breve",
                  });
                }}
              />

              {/* Create Post */}
              <CreatePost onSubmit={handleCreatePost} />

              {/* Posts Feed */}
              <div className="space-y-6">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLikePost}
                      onComment={handleCommentPost}
                      onShare={handleSharePost}
                    />
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <div className="text-muted-foreground">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum post ainda</h3>
                      <p>Seja o primeiro a compartilhar algo com a comunidade!</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden xl:block">
              <div className="space-y-6">
                {/* Suggested Friends */}
                <Card className="shadow-sm sticky top-20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Sugestões de Amizade</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face" />
                          <AvatarFallback>MS</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Maria Santos</p>
                          <p className="text-xs text-muted-foreground">3 amigos em comum</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trending Topics */}
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Tendências
                    </h3>
                    <div className="space-y-3">
                      <div className="hover:bg-muted p-2 rounded-lg transition-colors cursor-pointer">
                        <p className="font-semibold text-sm">#TechNews</p>
                        <p className="text-muted-foreground text-xs">2.1k posts</p>
                      </div>
                      <div className="hover:bg-muted p-2 rounded-lg transition-colors cursor-pointer">
                        <p className="font-semibold text-sm">#VidaSaudável</p>
                        <p className="text-muted-foreground text-xs">1.8k posts</p>
                      </div>
                      <div className="hover:bg-muted p-2 rounded-lg transition-colors cursor-pointer">
                        <p className="font-semibold text-sm">#Fotografia</p>
                        <p className="text-muted-foreground text-xs">956 posts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Online Users */}
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Online Agora</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || ""} />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <p className="font-semibold text-sm">{user.name} {user.surname}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMessagesClick={() => setIsMessagesOpen(true)}
        onModalidadesClick={() => setIsModalidadesOpen(true)}
        onGroupsClick={() => setIsGroupsOpen(true)}
      />

      {/* Modals */}
      <StoryEditor
        isOpen={isStoryEditorOpen}
        onClose={() => setIsStoryEditorOpen(false)}
        onPublish={handleCreateStory}
      />

      <MessagesModal
        isOpen={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
      />

      <ModalidadesModal
        isOpen={isModalidadesOpen}
        onClose={() => setIsModalidadesOpen(false)}
      />

      <GroupsModal
        isOpen={isGroupsOpen}
        onClose={() => setIsGroupsOpen(false)}
      />
    </div>
  );
}
