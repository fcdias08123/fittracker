import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Dumbbell, 
  Edit2, 
  Check, 
  X, 
  User, 
  Calendar, 
  Scale, 
  Ruler, 
  Award, 
  Cake, 
  UserCircle,
  LogOut,
  Activity,
  Droplet,
  Flame,
  Pizza,
  TrendingUp
} from "lucide-react";
import BottomNavbar from "@/components/BottomNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  calcularIMC, 
  classificarIMC, 
  calcularAguaDiaria, 
  calcularCaloriasDiarias, 
  calcularMacros 
} from "@/utils/healthCalculations";

type UserData = {
  nome: string;
  objectives: string[];
  level: string;
  idade: string;
  sexo: string;
  weight: string;
  height: string;
  daysPerWeek: string;
};

const Perfil = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  
  const [userData, setUserData] = useState<UserData>({
    nome: "",
    objectives: [],
    level: "",
    idade: "",
    sexo: "",
    weight: "",
    height: "",
    daysPerWeek: "",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempData, setTempData] = useState<UserData>(userData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  const objectivesMap = {
    muscle: "Ganhar massa muscular",
    "lose-weight": "Emagrecer / perder gordura",
    strength: "Ganhar força",
    endurance: "Melhorar resistência / condicionamento",
    health: "Manter a saúde",
  };

  const levelsMap = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
  };

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
          // Converter objetivos de string para array
          const objectives = profile.objetivo 
            ? profile.objetivo.split(", ").map((obj: string) => {
                const objMap: Record<string, string> = {
                  "Ganhar massa muscular": "muscle",
                  "Emagrecer / perder gordura": "lose-weight",
                  "Ganhar força": "strength",
                  "Melhorar resistência / condicionamento": "endurance",
                  "Manter a saúde": "health",
                };
                return objMap[obj] || obj;
              })
            : [];

          const profileData: UserData = {
            nome: profile.nome || "",
            objectives,
            level: profile.nivel || "",
            idade: profile.idade?.toString() || "",
            sexo: profile.sexo || "",
            weight: profile.peso?.toString() || "",
            height: profile.altura?.toString() || "",
            daysPerWeek: profile.dias_treino?.[0] || "",
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

  const allObjectives = [
    { id: "muscle", label: "Ganhar massa muscular" },
    { id: "lose-weight", label: "Emagrecer / perder gordura" },
    { id: "strength", label: "Ganhar força" },
    { id: "endurance", label: "Melhorar resistência / condicionamento" },
    { id: "health", label: "Manter a saúde" },
  ];

  const levels = [
    { id: "beginner", label: "Iniciante" },
    { id: "intermediate", label: "Intermediário" },
    { id: "advanced", label: "Avançado" },
  ];

  const handleEdit = (field: string) => {
    setEditingField(field);
    setTempData(userData);
  };

  const handleSave = async () => {
    // Validações básicas
    if (editingField === "weight" || editingField === "height") {
      const value = editingField === "weight" ? tempData.weight : tempData.height;
      if (!value || isNaN(Number(value)) || Number(value) <= 0) {
        return;
      }
    }
    
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
    
    if (editingField === "objectives" && tempData.objectives.length === 0) {
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
      // Preparar dados para atualizar
      const updateData: any = {};

      if (editingField === "nome") {
        updateData.nome = tempData.nome.trim();
      } else if (editingField === "objectives") {
        updateData.objetivo = tempData.objectives
          .map((id) => objectivesMap[id as keyof typeof objectivesMap])
          .join(", ");
      } else if (editingField === "level") {
        updateData.nivel = tempData.level;
      } else if (editingField === "idade") {
        updateData.idade = parseInt(tempData.idade);
      } else if (editingField === "sexo") {
        updateData.sexo = tempData.sexo;
      } else if (editingField === "weight") {
        updateData.peso = parseFloat(tempData.weight);
      } else if (editingField === "height") {
        updateData.altura = parseFloat(tempData.height);
      } else if (editingField === "daysPerWeek") {
        updateData.dias_treino = [tempData.daysPerWeek];
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

  const toggleObjective = (objectiveId: string) => {
    setTempData((prev) => ({
      ...prev,
      objectives: prev.objectives.includes(objectiveId)
        ? prev.objectives.filter((id) => id !== objectiveId)
        : [...prev.objectives, objectiveId],
    }));
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
          <Dumbbell className="w-16 h-16 text-primary mx-auto" />
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
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border-2 border-primary/30">
                <span className="text-3xl font-bold text-primary">
                  {userData.nome ? userData.nome.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
                </span>
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-2xl font-bold text-foreground mb-1 break-words">
                  {userData.nome || "Usuário"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Objetivo:</span>{" "}
                  {userData.objectives.length > 0
                    ? userData.objectives
                        .map((id) => objectivesMap[id as keyof typeof objectivesMap])
                        .join(", ")
                    : "Ainda não definido"}
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

        {/* Seção: Dados físicos e treino */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
            Dados físicos e treino
          </h2>
          <Card>
            <CardContent className="p-4">
              {renderEditableItem(
                "weight",
                <Scale className="h-5 w-5" />,
                "Peso",
                `${userData.weight} kg`,
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tempData.weight}
                    onChange={(e) => setTempData({ ...tempData, weight: e.target.value })}
                    placeholder="Digite seu peso"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground text-sm">kg</span>
                </div>
              )}

              {renderEditableItem(
                "height",
                <Ruler className="h-5 w-5" />,
                "Altura",
                `${userData.height} cm`,
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tempData.height}
                    onChange={(e) => setTempData({ ...tempData, height: e.target.value })}
                    placeholder="Digite sua altura"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground text-sm">cm</span>
                </div>
              )}

              {renderEditableItem(
                "level",
                <Award className="h-5 w-5" />,
                "Nível",
                levelsMap[userData.level as keyof typeof levelsMap],
                <RadioGroup
                  value={tempData.level}
                  onValueChange={(value) => setTempData({ ...tempData, level: value })}
                >
                  {levels.map((level) => (
                    <div key={level.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={level.id} id={level.id} />
                      <Label htmlFor={level.id} className="cursor-pointer">
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {renderEditableItem(
                "daysPerWeek",
                <Calendar className="h-5 w-5" />,
                "Dias de treino/semana",
                `${userData.daysPerWeek} ${Number(userData.daysPerWeek) === 1 ? "dia" : "dias"}`,
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <Button
                      key={day}
                      variant={tempData.daysPerWeek === String(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTempData({ ...tempData, daysPerWeek: String(day) })}
                      className="aspect-square"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seção: Sua evolução */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
            Sua evolução
          </h2>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Acompanhe seu progresso ao longo do tempo registrando seu peso e evolução.
              </p>
              <Button 
                onClick={() => navigate("/evolucao")} 
                size="lg" 
                className="w-full"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Ver evolução
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção: Objetivos */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
            Seus objetivos
          </h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Dumbbell className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground mb-1 block">
                        Objetivos
                      </Label>
                      {editingField === "objectives" ? (
                        <div className="space-y-3 mt-2">
                          <div className="space-y-2">
                            {allObjectives.map((objective) => (
                              <div key={objective.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={objective.id}
                                  checked={tempData.objectives.includes(objective.id)}
                                  onCheckedChange={() => toggleObjective(objective.id)}
                                />
                                <label
                                  htmlFor={objective.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {objective.label}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSave}
                              className="flex-1"
                              disabled={tempData.objectives.length === 0}
                            >
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
                        <p className="text-foreground font-medium">
                          {userData.objectives.length > 0
                            ? userData.objectives
                                .map((id) => objectivesMap[id as keyof typeof objectivesMap])
                                .join(", ")
                            : "Nenhum objetivo definido"}
                        </p>
                      )}
                    </div>
                  </div>
                  {editingField !== "objectives" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit("objectives")}
                      className="text-primary shrink-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção: Resumo de saúde */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
            Resumo de saúde
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card IMC */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">IMC</h3>
                    {(() => {
                      const peso = userData.weight ? parseFloat(userData.weight) : null;
                      const altura = userData.height ? parseFloat(userData.height) : null;
                      const imc = calcularIMC(peso, altura);
                      const classificacao = classificarIMC(imc);
                      
                      if (imc === null) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            {classificacao}
                          </p>
                        );
                      }
                      
                      return (
                        <>
                          <p className="text-3xl font-bold text-foreground mb-1">
                            {imc}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Classificação: {classificacao}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Água diária */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Droplet className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      Água diária recomendada
                    </h3>
                    {(() => {
                      const peso = userData.weight ? parseFloat(userData.weight) : null;
                      const agua = calcularAguaDiaria(peso);
                      
                      if (agua === null) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            Preencha seu peso para ver a recomendação de água
                          </p>
                        );
                      }
                      
                      return (
                        <>
                          <p className="text-3xl font-bold text-foreground mb-1">
                            {agua} L
                          </p>
                          <p className="text-sm text-muted-foreground">
                            por dia
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Calorias diárias */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Flame className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      Calorias diárias estimadas
                    </h3>
                    {(() => {
                      const peso = userData.weight ? parseFloat(userData.weight) : null;
                      const altura = userData.height ? parseFloat(userData.height) : null;
                      const idade = userData.idade ? parseInt(userData.idade) : null;
                      
                      const resultado = calcularCaloriasDiarias({
                        peso,
                        altura,
                        idade,
                        sexo: userData.sexo,
                        nivel: userData.level,
                        objetivo: userData.objectives
                          .map((id) => objectivesMap[id as keyof typeof objectivesMap])
                          .join(", "),
                      });
                      
                      if (resultado === null) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            Complete seu peso, altura e idade para ver as calorias estimadas
                          </p>
                        );
                      }
                      
                      return (
                        <>
                          <p className="text-3xl font-bold text-foreground mb-1">
                            {resultado.calories.toLocaleString()} kcal
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {resultado.description}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Macronutrientes */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Pizza className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      Distribuição de macronutrientes
                    </h3>
                    {(() => {
                      const peso = userData.weight ? parseFloat(userData.weight) : null;
                      const altura = userData.height ? parseFloat(userData.height) : null;
                      const idade = userData.idade ? parseInt(userData.idade) : null;
                      
                      const caloriesResult = calcularCaloriasDiarias({
                        peso,
                        altura,
                        idade,
                        sexo: userData.sexo,
                        nivel: userData.level,
                        objetivo: userData.objectives
                          .map((id) => objectivesMap[id as keyof typeof objectivesMap])
                          .join(", "),
                      });
                      
                      if (caloriesResult === null) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            Complete seus dados para ver a distribuição de macros
                          </p>
                        );
                      }
                      
                      const macros = calcularMacros({
                        calorias: caloriesResult.calories,
                        peso,
                        objetivo: userData.objectives
                          .map((id) => objectivesMap[id as keyof typeof objectivesMap])
                          .join(", "),
                      });
                      
                      if (macros === null) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            Complete seus dados para ver a distribuição de macros
                          </p>
                        );
                      }
                      
                      return (
                        <div className="space-y-1">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">Carboidratos:</span> {macros.carbs} g/dia
                          </p>
                          <p className="text-sm text-foreground">
                            <span className="font-medium">Proteínas:</span> {macros.protein} g/dia
                          </p>
                          <p className="text-sm text-foreground">
                            <span className="font-medium">Gorduras:</span> {macros.fat} g/dia
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção: Conta */}
        <div className="pt-4">
          <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
            Conta
          </h2>
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
      </div>
      <BottomNavbar />
    </div>
  );
};

export default Perfil;
