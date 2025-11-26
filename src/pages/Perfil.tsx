import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Edit2, 
  Check, 
  X, 
  User,  
  Cake, 
  UserCircle,
  LogOut,
  Mail,
  Lock
} from "lucide-react";
import BottomNavbar from "@/components/BottomNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type UserData = {
  nome: string;
  idade: string;
  sexo: string;
};

const Perfil = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  
  const [userData, setUserData] = useState<UserData>({
    nome: "",
    idade: "",
    sexo: "",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempData, setTempData] = useState<UserData>(userData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  // Carregar dados do perfil ao montar o componente
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (profile) {

          const profileData: UserData = {
            nome: profile.nome || "",
            idade: profile.idade?.toString() || "",
            sexo: profile.sexo || "",
          };

          setUserData(profileData);
          setTempData(profileData);
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar seus dados.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, toast]);

  const handleEdit = (field: string) => {
    setEditingField(field);
    setTempData(userData);
  };

  const handleSave = async () => {
    // Validações básicas
    if (editingField === "idade") {
      const idade = Number(tempData.idade);
      if (!tempData.idade || isNaN(idade) || idade < 12 || idade > 100) {
        toast({
          title: "Idade inválida",
          description: "Por favor, informe uma idade entre 12 e 100 anos.",
          variant: "destructive",
        });
        return;
      }
    }

    if (editingField === "sexo" && !tempData.sexo) {
      return;
    }

    if (editingField === "nome" && tempData.nome.trim() === "") {
      toast({
        title: "Nome inválido",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    try {
      const updateData: any = {};

      if (editingField === "nome") {
        updateData.nome = tempData.nome.trim();
      } else if (editingField === "idade") {
        updateData.idade = parseInt(tempData.idade);
      } else if (editingField === "sexo") {
        updateData.sexo = tempData.sexo;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      setUserData(tempData);
      setEditingField(null);
      
      toast({
        title: "Alteração salva",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar suas informações.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setTempData(userData);
    setEditingField(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Helper para renderizar item de lista editável
  const renderEditableItem = (
    field: string,
    icon: React.ReactNode,
    label: string,
    value: string | React.ReactNode,
    editContent: React.ReactNode
  ) => (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="text-muted-foreground mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0">
            <Label className="text-sm text-muted-foreground mb-1 block">
              {label}
            </Label>
            {editingField === field ? (
              <div className="space-y-3 mt-2">
                {editContent}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="flex-1">
                    <Check className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground font-medium break-words">{value}</p>
            )}
          </div>
        </div>
        {editingField !== field && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(field)}
            className="text-primary shrink-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6">
          <User className="w-16 h-16 text-primary mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Complete seu cadastro inicial
            </h2>
            <p className="text-muted-foreground">
              Para personalizar seu treino, precisamos conhecer um pouco mais sobre você.
            </p>
          </div>
          <Button onClick={() => navigate("/onboarding")} size="lg">
            Ir para Onboarding
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border-2 border-primary/30">
                <span className="text-3xl font-bold text-primary">
                  {userData.nome ? userData.nome.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
                </span>
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground break-words">
                  {userData.nome || "Usuário"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Perfil do usuário
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção: Informações pessoais */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
            Informações pessoais
          </h2>
          <Card>
            <CardContent className="p-4">
              {renderEditableItem(
                "nome",
                <User className="h-5 w-5" />,
                "Nome",
                userData.nome,
                <Input
                  type="text"
                  value={tempData.nome}
                  onChange={(e) => setTempData({ ...tempData, nome: e.target.value })}
                  placeholder="Digite seu nome"
                />
              )}

              {renderEditableItem(
                "idade",
                <Cake className="h-5 w-5" />,
                "Idade",
                `${userData.idade} anos`,
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={tempData.idade}
                      onChange={(e) => setTempData({ ...tempData, idade: e.target.value })}
                      placeholder="Digite sua idade"
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">anos</span>
                  </div>
                  {tempData.idade && (Number(tempData.idade) < 12 || Number(tempData.idade) > 100) && (
                    <p className="text-sm text-destructive">
                      Por favor, informe uma idade entre 12 e 100 anos.
                    </p>
                  )}
                </>
              )}

              {renderEditableItem(
                "sexo",
                <UserCircle className="h-5 w-5" />,
                "Sexo",
                userData.sexo,
                <Select 
                  value={tempData.sexo} 
                  onValueChange={(value) => setTempData({ ...tempData, sexo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                    <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seção: Conta */}
        <div className="pt-4">
          <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
            Conta
          </h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled
              >
                <Mail className="h-5 w-5 mr-2" />
                Alterar e-mail
                <span className="ml-auto text-xs text-muted-foreground">(Em breve)</span>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled
              >
                <Lock className="h-5 w-5 mr-2" />
                Alterar senha
                <span className="ml-auto text-xs text-muted-foreground">(Em breve)</span>
              </Button>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLogout}
                  className="w-full border-2 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sair da conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default Perfil;
