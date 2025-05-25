import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect to home if already logged in
    if (!loading && user) {
      setLocation("/home");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-blue-700">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in duration-500">
        <CardContent className="p-8 text-center">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          
          <h1 className="text-3xl font-bold text-primary mb-2">VIMBALAMBI NEWS</h1>
          <p className="text-muted-foreground mb-8">Conecte-se com sua comunidade</p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => setLocation("/login")}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Entrar
            </Button>
            
            <Button 
              onClick={() => setLocation("/register")}
              variant="outline"
              className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-lg font-semibold transition-all duration-200"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Criar Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
