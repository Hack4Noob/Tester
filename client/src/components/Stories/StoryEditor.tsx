import { useState, useRef, useEffect } from "react";
import { X, Type, Music, Image as ImageIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface StoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (storyData: {
    mediaURL: string;
    musicTrackId?: string;
  }) => void;
}

export function StoryEditor({ isOpen, onClose, onPublish }: StoryEditorProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabric, setFabric] = useState<any>(null);
  const [canvas, setCanvas] = useState<any>(null);
  
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [musicTrackId, setMusicTrackId] = useState("");
  const [textToAdd, setTextToAdd] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Load Fabric.js dynamically
  useEffect(() => {
    const loadFabric = async () => {
      if (typeof window !== 'undefined') {
        const fabricModule = await import('fabric');
        setFabric(fabricModule.fabric);
      }
    };

    if (isOpen) {
      loadFabric();
    }
  }, [isOpen]);

  // Initialize canvas when fabric is loaded
  useEffect(() => {
    if (fabric && canvasRef.current && isOpen && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 300,
        height: 500,
        backgroundColor: '#f0f0f0'
      });
      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
        setCanvas(null);
      };
    }
  }, [fabric, isOpen, canvas]);

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && canvas) {
      setBackgroundImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgURL = e.target?.result as string;
        fabric.Image.fromURL(imgURL, (img: any) => {
          // Scale image to fit canvas
          img.scaleToWidth(300);
          img.scaleToHeight(500);
          img.set({
            left: 0,
            top: 0,
            selectable: false
          });
          
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addTextToCanvas = () => {
    if (!canvas || !textToAdd.trim()) return;

    const text = new fabric.Text(textToAdd, {
      left: 50,
      top: 100,
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      shadow: 'rgba(0,0,0,0.5) 2px 2px 4px'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    setTextToAdd("");
  };

  const addEmoji = (emoji: string) => {
    if (!canvas) return;

    const emojiText = new fabric.Text(emoji, {
      left: 100,
      top: 200,
      fontSize: 48,
      selectable: true
    });

    canvas.add(emojiText);
    canvas.setActiveObject(emojiText);
  };

  const handlePublish = async () => {
    if (!canvas) {
      toast({
        title: "Erro",
        description: "Canvas não está pronto",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      // Export canvas as image
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.8
      });

      // Convert dataURL to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();
      const file = new File([blob], 'story.png', { type: 'image/png' });

      // Upload to Cloudinary
      const result = await uploadToCloudinary(file, "stories");

      await onPublish({
        mediaURL: result.secure_url,
        musicTrackId: musicTrackId || undefined
      });

      toast({
        title: "Story publicado!",
        description: "Seu story foi publicado com sucesso",
        variant: "success",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao publicar story",
        description: "Não foi possível publicar seu story. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-surface h-full w-full max-w-4xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-surface">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-lg">Editor de Stories</h2>
          <Button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-primary hover:bg-primary/90"
          >
            {isPublishing ? "Publicando..." : "Publicar"}
          </Button>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center bg-gray-900 p-4">
            <div className="bg-white rounded-lg p-2">
              <canvas
                ref={canvasRef}
                width={300}
                height={500}
                className="border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Tools Sidebar */}
          <div className="w-80 bg-surface p-4 overflow-y-auto border-l">
            <div className="space-y-6">
              {/* Background Upload */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Imagem de Fundo</Label>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Adicionar Imagem
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  className="hidden"
                />
              </div>

              {/* Text Tools */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Adicionar Texto</Label>
                <div className="flex space-x-2">
                  <Input
                    value={textToAdd}
                    onChange={(e) => setTextToAdd(e.target.value)}
                    placeholder="Digite seu texto..."
                    className="flex-1"
                  />
                  <Button onClick={addTextToCanvas} size="icon">
                    <Type className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Music Integration */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Música (Deezer)</Label>
                <Input
                  value={musicTrackId}
                  onChange={(e) => setMusicTrackId(e.target.value)}
                  placeholder="ID da música (ex: 3135556)"
                />
                {musicTrackId && (
                  <div className="mt-2 p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">
                      Prévia de 30s será reproduzida no story
                    </p>
                  </div>
                )}
              </div>

              {/* Emojis and Stickers */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Emojis & Stickers</Label>
                <div className="grid grid-cols-4 gap-2">
                  {['😀', '❤️', '🎉', '🔥', '👍', '✨', '🌟', '💯'].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      className="text-2xl p-2 h-auto"
                      onClick={() => addEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Canvas Controls */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Controles</Label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => canvas?.clear()}
                  >
                    Limpar Tudo
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const activeObject = canvas?.getActiveObject();
                      if (activeObject) {
                        canvas.remove(activeObject);
                      }
                    }}
                  >
                    Remover Selecionado
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
