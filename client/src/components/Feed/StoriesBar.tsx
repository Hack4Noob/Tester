import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

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

interface StoriesBarProps {
  stories: Story[];
  onCreateStory: () => void;
  onViewStory: (storyId: string) => void;
}

export function StoriesBar({ stories, onCreateStory, onViewStory }: StoriesBarProps) {
  const { user } = useAuth();

  if (!user || !user.name) {
    return (
      <Card className="w-full shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Carregando stories...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-4">
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Create Story */}
          <div className="flex-shrink-0 text-center">
            <Button
              variant="ghost"
              className="p-0 h-auto flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
              onClick={onCreateStory}
            >
              <div className="relative">
                <Avatar className="h-16 w-16 ring-2 ring-dashed ring-primary">
                  <AvatarImage src={user.photoURL || ""} alt={user.name || "Usuário"} />
                  <AvatarFallback>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <Plus className="h-3 w-3" />
                </div>
              </div>
              <span className="text-xs font-medium">Seu Story</span>
            </Button>
          </div>

          {/* Stories List */}
          {stories.map((story) => (
            <div key={story.id} className="flex-shrink-0 text-center">
              <Button
                variant="ghost"
                className="p-0 h-auto flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
                onClick={() => onViewStory(story.id)}
              >
                <div className="relative">
                  {/* Story Ring */}
                  <div className="p-1 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                    <div className="p-1 bg-white rounded-full">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={story.author.photoURL || ""} alt={story.author.name} />
                        <AvatarFallback>
                          {story.author.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium max-w-[4rem] truncate">
                  {story.author.name?.split(" ")[0] || 'Usuário'}
                </span>
              </Button>
            </div>
          ))}

          {/* Empty State */}
          {stories.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Nenhum story disponível</p>
                <p className="text-xs">Seja o primeiro a compartilhar!</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
