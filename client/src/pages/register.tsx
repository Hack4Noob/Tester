import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ArrowLeft, ArrowRight, User, Mail, Lock, Calendar, Camera } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    birthDate: "",
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.surname || !formData.gender || !formData.birthDate) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Senhas não coincidem",
          description: "As senhas devem ser iguais",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.password.length < 6) {
        toast({
          title: "Senha muito curta",
          description: "A senha deve ter pelo menos 6 caracteres",
          variant: "destructive",
        });
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      let photoURL: string | undefined;
      
      if (profileImage) {
        const result = await uploadToCloudinary(profileImage, "vimbalambi");
        photoURL = result.secure_url;
      }

      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        surname: formData.surname,
        gender: formData.gender,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        photoURL,
      });

      toast({
        title: "Conta criada com sucesso! 🎉",
        description: "Bem-vindo ao Vimbalambi News",
        variant: "success",
      });
      
      setTimeout(() => {
        setLocation("/home");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl animate-in fade-in duration-500">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Criar Conta</h2>
            <p className="text-muted-foreground">Junte-se à nossa comunidade</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Etapa {currentStep} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Nome"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Sobrenome</Label>
                  <Input
                    id="surname"
                    placeholder="Sobrenome"
                    value={formData.surname}
                    onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Account Information */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Seu email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Profile Photo (Optional) */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Foto de Perfil</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Adicione uma foto para personalizar seu perfil (opcional)
                </p>
                
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full"
                      onClick={() => document.getElementById('profileImage')?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('profileImage')?.click()}
                  >
                    Escolher Foto
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? () => setLocation("/") : handlePrevStep}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? "Voltar" : "Anterior"}
            </Button>
            
            {currentStep < totalSteps ? (
              <Button onClick={handleNextStep}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? "Criando..." : "Criar Conta"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
