import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type OnboardingData = {
  nome: string;
  objectives: string[];
  level: string;
  idade: string;
  sexo: string;
  weight: string;
  height: string;
  daysPerWeek: string;
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictingObjective, setConflictingObjective] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    nome: "",
    objectives: [],
    level: "",
    idade: "",
    sexo: "",
    weight: "",
    height: "",
    daysPerWeek: "",
  });

  const objectives = [
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

  const daysOptions = [1, 2, 3, 4, 5, 6, 7];

  const toggleObjective = (objectiveId: string) => {
    // Definir objetivos conflitantes
    const conflictingPairs = [
      { a: "muscle", b: "lose-weight" },
    ];

    // Se está desmarcando, permitir
    if (data.objectives.includes(objectiveId)) {
      setData((prev) => ({
        ...prev,
        objectives: prev.objectives.filter((id) => id !== objectiveId),
      }));
      return;
    }

    // Verificar se há conflito com objetivos já selecionados
    const hasConflict = conflictingPairs.some((pair) => {
      const isSelectingA = objectiveId === pair.a;
      const isSelectingB = objectiveId === pair.b;
      const hasA = data.objectives.includes(pair.a);
      const hasB = data.objectives.includes(pair.b);

      return (isSelectingA && hasB) || (isSelectingB && hasA);
    });

    if (hasConflict) {
      setConflictingObjective(objectiveId);
      setShowConflictDialog(true);
      return;
    }

    // Se não há conflito, adicionar normalmente
    setData((prev) => ({
      ...prev,
      objectives: [...prev.objectives, objectiveId],
    }));
  };

  const handleReplaceObjective = () => {
    if (!conflictingObjective) return;

    // Remover o objetivo conflitante e adicionar o novo
    const conflictingPairs = [
      { a: "muscle", b: "lose-weight" },
    ];

    const pair = conflictingPairs.find(
      (p) => p.a === conflictingObjective || p.b === conflictingObjective
    );

    if (pair) {
      const toRemove = conflictingObjective === pair.a ? pair.b : pair.a;
      setData((prev) => ({
        ...prev,
        objectives: prev.objectives
          .filter((id) => id !== toRemove)
          .concat(conflictingObjective),
      }));
    }

    setShowConflictDialog(false);
    setConflictingObjective(null);
  };

  const handleCancelConflict = () => {
    setShowConflictDialog(false);
    setConflictingObjective(null);
  };

  const isStep1Valid = data.nome.trim() !== "" && data.objectives.length > 0;
  const isStep2Valid = data.level !== "";
  const isStep3Valid = 
    data.idade !== "" && !isNaN(Number(data.idade)) && 
    Number(data.idade) >= 12 && Number(data.idade) <= 100 &&
    data.sexo !== "" &&
    data.weight !== "" && data.height !== "" && 
    !isNaN(Number(data.weight)) && !isNaN(Number(data.height)) &&
    Number(data.weight) > 0 && Number(data.height) > 0;
  const isStep4Valid = data.daysPerWeek !== "";

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);

    try {
      // Garantir que o usuário está autenticado antes de salvar
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;
      
      if (!user || userError) {
        toast({
          title: "Sessão expirou",
          description: "Sua sessão expirou. Faça login novamente para continuar.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      // Preparar dados para salvar usando user.id
      const userId = user.id;
      const profileData = {
        user_id: userId,
        nome: data.nome.trim(),
        objetivo: data.objectives.join(", "),
        nivel: data.level,
        idade: parseInt(data.idade),
        sexo: data.sexo,
        peso: parseFloat(data.weight),
        altura: parseFloat(data.height),
        dias_treino: [data.daysPerWeek],
      };

      // Verificar se já existe perfil (upsert)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingProfile) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Criar novo perfil
        const { error } = await supabase
          .from("profiles")
          .insert(profileData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Dados salvos com sucesso!",
      });

      setTimeout(() => {
        navigate("/home");
      }, 500);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Dumbbell className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">FitTracker</h1>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8 space-y-2">
          <p className="text-sm text-secondary text-center">
            Passo {currentStep} de 4
          </p>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1 - Name and Objectives */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Vamos começar!
              </h2>
              <p className="text-secondary text-sm">
                Como podemos te chamar?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome" className="text-foreground">
                Nome
              </Label>
              <Input
                id="nome"
                type="text"
                placeholder="Digite seu nome"
                value={data.nome}
                onChange={(e) => setData({ ...data, nome: e.target.value })}
                className="text-lg"
              />
            </div>

            <div className="text-center space-y-2 mt-8">
              <h3 className="text-xl font-semibold text-foreground">
                Qual é o seu objetivo?
              </h3>
              <p className="text-secondary text-sm">
                Você pode selecionar objetivos compatíveis
              </p>
            </div>

            <div className="space-y-3">
              {objectives.map((objective) => (
                <button
                  key={objective.id}
                  onClick={() => toggleObjective(objective.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    data.objectives.includes(objective.id)
                      ? "border-primary bg-primary/10 text-foreground font-medium"
                      : "border-input bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  {objective.label}
                </button>
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={!isStep1Valid}
              className="w-full"
              size="lg"
            >
              Avançar
            </Button>
          </div>
        )}

        {/* Step 2 - Level */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Qual é o seu nível atual de treino?
              </h2>
            </div>

            <RadioGroup
              value={data.level}
              onValueChange={(value) => setData({ ...data, level: value })}
              className="space-y-3"
            >
              {levels.map((level) => (
                <label
                  key={level.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    data.level === level.id
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={level.id} id={level.id} />
                  <span className="text-foreground font-medium">
                    {level.label}
                  </span>
                </label>
              ))}
            </RadioGroup>

            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Voltar
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStep2Valid}
                className="flex-1"
                size="lg"
              >
                Avançar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 - Personal Data */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Agora, nos conte um pouco mais sobre você
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idade" className="text-foreground">
                  Idade
                </Label>
                <Input
                  id="idade"
                  type="number"
                  placeholder="Digite sua idade"
                  value={data.idade}
                  onChange={(e) =>
                    setData({ ...data, idade: e.target.value })
                  }
                  className="text-lg"
                />
                {data.idade && (Number(data.idade) < 12 || Number(data.idade) > 100) && (
                  <p className="text-sm text-destructive">
                    Por favor, informe uma idade entre 12 e 100 anos.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sexo" className="text-foreground">
                  Sexo
                </Label>
                <Select value={data.sexo} onValueChange={(value) => setData({ ...data, sexo: value })}>
                  <SelectTrigger className="text-lg">
                    <SelectValue placeholder="Selecione seu sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                    <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-foreground">
                  Peso (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Ex: 70"
                  value={data.weight}
                  onChange={(e) =>
                    setData({ ...data, weight: e.target.value })
                  }
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-foreground">
                  Altura (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Ex: 175"
                  value={data.height}
                  onChange={(e) =>
                    setData({ ...data, height: e.target.value })
                  }
                  className="text-lg"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Voltar
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStep3Valid}
                className="flex-1"
                size="lg"
              >
                Avançar
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 - Days per Week */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Quantos dias por semana você pode treinar?
              </h2>
              <p className="text-secondary text-sm">
                Escolha entre 1 e 7 dias
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {daysOptions.map((day) => (
                <button
                  key={day}
                  onClick={() =>
                    setData({ ...data, daysPerWeek: day.toString() })
                  }
                  className={`aspect-square rounded-lg border-2 text-xl font-bold transition-all ${
                    data.daysPerWeek === day.toString()
                      ? "border-primary bg-primary text-white"
                      : "border-input bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Voltar
              </Button>
              <Button
                onClick={handleFinish}
                disabled={!isStep4Valid || isLoading}
                className="flex-1"
                size="lg"
              >
                {isLoading ? "Salvando..." : "Finalizar"}
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Dialog de conflito de objetivos */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Combinação complexa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Ganhar massa muscular e emagrecer simultaneamente exige estratégias 
                distintas de dieta e treino. Como iniciante, recomendamos escolher um 
                objetivo principal para obter resultados mais consistentes.
              </p>
              <p className="text-sm">
                Você pode alterar seus objetivos a qualquer momento em Perfil → Saúde.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelConflict}>
              Voltar e escolher
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReplaceObjective}
              className="bg-primary hover:bg-primary/90"
            >
              Trocar objetivo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Onboarding;
