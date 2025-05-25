import { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PostCardProps {
  post: {
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
  };
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleLike = () => {
    onLike(post.id);
    if (!post.isLiked) {
      toast({
        title: "Post curtido!",
        variant: "success",
      });
    }
  };

  const handleMusicPlay = async () => {
    if (!post.musicTrackId) return;

    try {
      if (isPlaying && audioElement) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        // Fetch Deezer preview URL
        const deezerUrl = `https://cdns-preview-7.deezer.com/stream/7-${post.musicTrackId}.mp3`;
        
        if (audioElement) {
          audioElement.pause();
        }

        const audio = new Audio(deezerUrl);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          toast({
            title: "Erro ao reproduzir música",
            description: "Não foi possível carregar a prévia da música",
            variant: "destructive",
          });
          setIsPlaying(false);
        };

        await audio.play();
        setAudioElement(audio);
        setIsPlaying(true);
      }
    } catch (error) {
      toast({
        title: "Erro ao reproduzir música",
        description: "Não foi possível reproduzir a música",
        variant: "destructive",
      });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.photoURL} alt={post.author.name} />
              <AvatarFallback>
                {post.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-sm">{post.author.name}</h4>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Salvar post</DropdownMenuItem>
              <DropdownMenuItem>Ocultar post</DropdownMenuItem>
              {post.authorId === user?.uid && (
                <>
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Post Media */}
        {post.mediaURL && (
          <div className="relative">
            <img
              src={post.mediaURL}
              alt="Post media"
              className="w-full h-80 object-cover"
            />
          </div>
        )}

        {/* Music Integration */}
        {post.musicTrackId && (
          <div className="px-4 py-3 border-t bg-muted/50">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleMusicPlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="flex-1">
                <p className="text-sm font-medium">Música do Post</p>
                <p className="text-xs text-muted-foreground">Prévia de 30 segundos</p>
              </div>
            </div>
          </div>
        )}

        {/* Post Actions */}
        <div className="px-4 py-3 border-t">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className={`flex items-center space-x-2 hover:bg-muted rounded-lg px-3 py-2 ${
                post.isLiked ? "text-primary" : ""
              }`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
              <span className="text-sm">Curtir</span>
              {post.likesCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {post.likesCount}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-muted rounded-lg px-3 py-2"
              onClick={() => onComment(post.id)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Comentar</span>
              {post.commentsCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {post.commentsCount}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-muted rounded-lg px-3 py-2"
              onClick={() => onShare(post.id)}
            >
              <Share className="h-4 w-4" />
              <span className="text-sm">Compartilhar</span>
              {post.sharesCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {post.sharesCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
