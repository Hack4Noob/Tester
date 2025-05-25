import { useState, useRef } from "react";
import { Image, Video, Music, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { uploadToCloudinary, uploadVideoToCloudinary } from "@/lib/cloudinary";

interface CreatePostProps {
  onSubmit: (postData: {
    content: string;
    mediaURL?: string;
    musicTrackId?: string;
    visibility: string;
  }) => void;
}

export function CreatePost({ onSubmit }: CreatePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [musicTrackId, setMusicTrackId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const preview = URL.createObjectURL(file);
      setMediaPreview(preview);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !mediaFile) {
      toast({
        title: "Post vazio",
        description: "Adicione algum conteúdo ou mídia ao seu post",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let mediaURL: string | undefined;

      if (mediaFile) {
        if (mediaFile.type.startsWith("video/")) {
          const result = await uploadVideoToCloudinary(mediaFile, "vimbalambi");
          mediaURL = result.secure_url;
        } else {
          const result = await uploadToCloudinary(mediaFile, "vimbalambi");
          mediaURL = result.secure_url;
        }
      }

      await onSubmit({
        content: content.trim(),
        mediaURL,
        musicTrackId: musicTrackId || undefined,
        visibility,
      });

      // Reset form
      setContent("");
      setMusicTrackId("");
      setVisibility("public");
      handleRemoveMedia();

      toast({
        title: "Post publicado!",
        description: "Seu post foi publicado com sucesso",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro ao publicar",
        description: "Não foi possível publicar seu post. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info and Visibility */}
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoURL || ""} alt={user?.name} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold">{user?.name}</h4>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-32 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="friends">Amigos</SelectItem>
                  <SelectItem value="private">Apenas eu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Textarea */}
          <Textarea
            placeholder="No que você está pensando?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] border-0 text-lg resize-none focus:ring-0"
          />

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative">
              {mediaFile?.type.startsWith("video/") ? (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full rounded-lg max-h-96 object-contain"
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full rounded-lg max-h-96 object-contain"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemoveMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Music Track ID Input */}
          {musicTrackId && (
            <div className="p-3 bg-muted rounded-lg">
              <label className="text-sm font-medium">ID da Música (Deezer)</label>
              <input
                type="text"
                value={musicTrackId}
                onChange={(e) => setMusicTrackId(e.target.value)}
                placeholder="Ex: 3135556"
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-4 w-4 text-green-500" />
                <span className="text-sm">Foto</span>
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="h-4 w-4 text-red-500" />
                <span className="text-sm">Vídeo</span>
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => setMusicTrackId(musicTrackId ? "" : "3135556")}
              >
                <Music className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Música</span>
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Local</span>
              </Button>
            </div>

            <Button
              type="submit"
              disabled={isUploading || (!content.trim() && !mediaFile)}
              className="bg-primary hover:bg-primary/90"
            >
              {isUploading ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
