import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavbar from "@/components/BottomNavbar";
import { getDataHojeLocalISODate, formatarDataPtBr } from "@/lib/dateUtils";

type Exercise = {
  id: string;
  nome: string;
  grupo_muscular: string;
  dificuldade: string;
  explicacao: string;
};

type WorkoutExercise = {
  id: string;
  ordem: number;
  series: number;
  repeticoes: number;
  carga: number | null;
  observacoes: string | null;
  exercise: Exercise;
};

type Workout = {
  id: string;
  nome: string;
  dias_semana: string[];
};

const DetalheTreino = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const workoutIdFromState = location.state?.workoutId;
  const modoVisualizacao = location.state?.modoVisualizacao || false;
  const dataHistorico = location.state?.dataHistorico;
  
  const workoutId = id || workoutIdFromState;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [jaFinalizadoHoje, setJaFinalizadoHoje] = useState(false);

  useEffect(() => {
    if (!workoutId) {
      toast({
        title: "Erro",
        description: "ID do treino não fornecido.",
        variant: "destructive",
      });
      navigate("/treino");
      return;
    }

    loadWorkoutDetails();
  }, [workoutId]);

  const loadWorkoutDetails = async () => {
    try {
      setIsLoading(true);

      // Buscar dados do treino
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", workoutId)
        .eq("user_id", userData.user.id)
        .single();

      if (workoutError || !workoutData) {
        toast({
          title: "Erro",
          description: "Treino não encontrado.",
          variant: "destructive",
        });
        navigate("/treino");
        return;
      }

      setWorkout(workoutData);

      // Verificar se já foi finalizado hoje (apenas se não for modo visualização)
      if (!modoVisualizacao) {
        const dataHoje = getDataHojeLocalISODate();
        const { data: historicoHoje } = await supabase
          .from("workout_history")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("workout_id", workoutId)
          .eq("data_realizado", dataHoje)
          .limit(1);

        if (historicoHoje && historicoHoje.length > 0) {
          setJaFinalizadoHoje(true);
        }
      }

      // Buscar exercícios do treino
      const { data: workoutExercises, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", workoutId)
        .order("ordem", { ascending: true });

      if (exercisesError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar exercícios.",
          variant: "destructive",
        });
        return;
      }

      // Buscar detalhes de cada exercício
      const exercisesWithDetails = await Promise.all(
        workoutExercises.map(async (we) => {
          const { data: exerciseData } = await supabase
            .from("exercises")
            .select("*")
            .eq("id", we.exercise_id)
            .single();

          return {
            ...we,
            exercise: exerciseData as Exercise,
          };
        })
      );

      setExercises(exercisesWithDetails as WorkoutExercise[]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do treino.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishWorkout = async () => {
    try {
      setIsFinishing(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado.",
          variant: "destructive",
        });
        return;
      }

      const dataHoje = getDataHojeLocalISODate();

      // Verificar novamente antes de inserir (evitar race condition)
      const { data: historicoExistente } = await supabase
        .from("workout_history")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("workout_id", workoutId)
        .eq("data_realizado", dataHoje)
        .limit(1);

      if (historicoExistente && historicoExistente.length > 0) {
        toast({
          title: "Aviso",
          description: "Este treino já foi finalizado hoje.",
          variant: "destructive",
        });
        setJaFinalizadoHoje(true);
        setShowFinishDialog(false);
        return;
      }

      const { error } = await supabase.from("workout_history").insert({
        user_id: userData.user.id,
        workout_id: workoutId,
        data_realizado: dataHoje,
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao salvar treino no histórico.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Treino concluído!",
        description: "Treino salvo no histórico com sucesso.",
        className: "bg-green-500 text-white",
      });

      setJaFinalizadoHoje(true);
      setShowFinishDialog(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao finalizar treino.",
        variant: "destructive",
      });
    } finally {
      setIsFinishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <BottomNavbar />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Treino não encontrado.</p>
        <BottomNavbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/treino")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{workout.nome}</h1>
          <p className="text-muted-foreground mt-1">
            Dias: {workout.dias_semana.join(", ")}
          </p>
        </div>

        {/* Lista de exercícios */}
        <div className="space-y-4">
          {exercises.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Nenhum exercício cadastrado neste treino.
                </p>
              </CardContent>
            </Card>
          ) : (
            exercises.map((item, index) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-3">
                    <Dumbbell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div>{item.exercise.nome}</div>
                      <div className="text-sm font-normal text-muted-foreground mt-1">
                        {item.exercise.grupo_muscular} • {item.exercise.dificuldade}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Séries:</span>
                      <p className="font-semibold">{item.series}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Repetições:</span>
                      <p className="font-semibold">{item.repeticoes}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carga:</span>
                      <p className="font-semibold">
                        {item.carga ? `${item.carga} kg` : "—"}
                      </p>
                    </div>
                  </div>
                  {item.observacoes && (
                    <div className="text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Observações:</span>
                      <p className="mt-1">{item.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Botão Finalizar Treino ou Informação de Histórico */}
        {modoVisualizacao ? (
          <div className="w-full p-4 text-center rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">
              Treino finalizado em {dataHistorico ? formatarDataPtBr(dataHistorico) : "—"}
            </p>
          </div>
        ) : jaFinalizadoHoje ? (
          <Button
            disabled
            className="w-full h-12 text-base"
            size="lg"
            variant="secondary"
          >
            Treino já finalizado hoje
          </Button>
        ) : (
          <Button
            onClick={() => setShowFinishDialog(true)}
            className="w-full h-12 text-base"
            size="lg"
          >
            Finalizar treino
          </Button>
        )}
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar treino</AlertDialogTitle>
            <AlertDialogDescription>
              Você concluiu este treino hoje? Ele será salvo no seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinishing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinishWorkout}
              disabled={isFinishing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isFinishing ? "Finalizando..." : "Finalizar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavbar />
    </div>
  );
};

export default DetalheTreino;
