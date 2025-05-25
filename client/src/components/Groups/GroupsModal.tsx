import { useState, useEffect } from "react";
import { X, Plus, Users, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface Group {
  id: string;
  name: string;
  description: string;
  coverImageURL?: string;
  creatorId: string;
  isPublic: boolean;
  memberCount: number;
  isJoined?: boolean;
  createdAt: string;
}

interface GroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GroupsModal({ isOpen, onClose }: GroupsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    isPublic: true,
    coverImage: null as File | null,
  });

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    try {
      // In real implementation, fetch from API
      const mockGroups: Group[] = [
        {
          id: "1",
          name: "Programadores Angola",
          description: "Grupo para discussão sobre programação e tecnologia em Angola",
          coverImageURL: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop",
          creatorId: "user1",
          isPublic: true,
          memberCount: 1234,
          isJoined: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Fotógrafos de Luanda",
          description: "Compartilhe suas melhores fotos e aprenda técnicas de fotografia",
          coverImageURL: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=200&fit=crop",
          creatorId: "user2",
          isPublic: true,
          memberCount: 567,
          isJoined: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Empreendedores Angola",
          description: "Rede de empreendedores locais para troca de experiências e oportunidades",
          coverImageURL: "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=400&h=200&fit=crop",
          creatorId: "user3",
          isPublic: true,
          memberCount: 890,
          isJoined: false,
          createdAt: new Date().toISOString(),
        },
      ];
      setGroups(mockGroups);
    } catch (error) {
      toast({
        title: "Erro ao carregar grupos",
        description: "Não foi possível carregar a lista de grupos",
        variant: "destructive",
      });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      // In real implementation, make API call
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, isJoined: true, memberCount: group.memberCount + 1 }
          : group
      ));
      
      toast({
        title: "Grupo participado!",
        description: "Você agora faz parte deste grupo",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro ao participar do grupo",
        description: "Não foi possível participar do grupo",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      // In real implementation, make API call
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, isJoined: false, memberCount: group.memberCount - 1 }
          : group
      ));
      
      toast({
        title: "Grupo deixado",
        description: "Você não faz mais parte deste grupo",
      });
    } catch (error) {
      toast({
        title: "Erro ao sair do grupo",
        description: "Não foi possível sair do grupo",
        variant: "destructive",
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      let coverImageURL: string | undefined;

      if (newGroupData.coverImage) {
        const result = await uploadToCloudinary(newGroupData.coverImage, "vimbalambi");
        coverImageURL = result.secure_url;
      }

      const newGroup: Group = {
        id: Date.now().toString(),
        name: newGroupData.name,
        description: newGroupData.description,
        coverImageURL,
        creatorId: user?.uid || "",
        isPublic: newGroupData.isPublic,
        memberCount: 1,
        isJoined: true,
        createdAt: new Date().toISOString(),
      };

      setGroups(prev => [newGroup, ...prev]);
      setIsCreateDialogOpen(false);
      setNewGroupData({
        name: "",
        description: "",
        isPublic: true,
        coverImage: null,
      });

      toast({
        title: "Grupo criado!",
        description: "Seu grupo foi criado com sucesso",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro ao criar grupo",
        description: "Não foi possível criar o grupo",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCoverImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewGroupData(prev => ({ ...prev, coverImage: file }));
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-surface h-full w-full max-w-6xl overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <h2 className="text-xl font-semibold">Grupos</h2>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Grupo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Nome do Grupo</Label>
                    <Input
                      id="groupName"
                      value={newGroupData.name}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome do grupo..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="groupDescription">Descrição</Label>
                    <Textarea
                      id="groupDescription"
                      value={newGroupData.description}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o propósito do grupo..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="coverImage">Imagem de Capa</Label>
                    <Input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageSelect}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateGroup}
                      disabled={isCreating}
                    >
                      {isCreating ? "Criando..." : "Criar Grupo"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar grupos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Groups Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Cover Image */}
                <div className="relative h-32 bg-muted">
                  {group.coverImageURL ? (
                    <img
                      src={group.coverImageURL}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {group.creatorId === user?.uid && (
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      Criador
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{group.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {group.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{group.memberCount} membros</span>
                      </div>
                      <Badge variant={group.isPublic ? "secondary" : "outline"}>
                        {group.isPublic ? "Público" : "Privado"}
                      </Badge>
                    </div>

                    <div className="flex space-x-2">
                      {group.isJoined ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleLeaveGroup(group.id)}
                          >
                            Sair
                          </Button>
                          <Button size="sm" className="flex-1">
                            Ver Grupo
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleJoinGroup(group.id)}
                        >
                          Participar
                        </Button>
                      )}
                      
                      {group.creatorId === user?.uid && (
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Tente pesquisar com outros termos"
                  : "Seja o primeiro a criar um grupo!"
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Grupo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
