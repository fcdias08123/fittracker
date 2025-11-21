import { useEffect, useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Target, Award, Calendar } from "lucide-react";
import { recommendModelWorkout } from "@/utils/workoutRecommendation";
import { Database } from "@/integrations/supabase/types";

type Exercise = {
  id: string;
  nome: string;
  grupo_muscular: string;
};

type WorkoutExercise = {
  id: string;
  series: number;
  repeticoes: number;
  exercise: Exercise;
};

type TodayWorkout = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
};

type ModelWorkout = Database["public"]["Tables"]["model_workouts"]["Row"];

type Profile = {
  objetivo: string | null;
  nivel: string | null;
  dias_treino: string[] | null;
};

const Treino = () => {
  const navigate = useNavigate();
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userWorkoutsCount, setUserWorkoutsCount] = useState<number>(0);
  const [recommendedWorkout, setRecommendedWorkout] = useState<ModelWorkout | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  // Get current date formatted in Portuguese
  const getCurrentDate = () => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const today = new Date();
    return `${days[today.getDay()]}, ${today.getDate()} de ${months[today.getMonth()]}`;
  };

  // Get current day of week in slug format (dom, seg, ter, etc.) to match database
  const getDiaSemanaAtualSlug = () => {
    const hoje = new Date();
    const dia = hoje.getDay(); // 0 = domingo, 1 = segunda, ... 6 = sábado
    const nomes = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return nomes[dia];
  };

  useEffect(() => {
    loadTodayWorkout();
    loadRecommendation();
  }, []);

  const loadTodayWorkout = async () => {
    try {
      setIsLoading(true);

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

      const currentDay = getDiaSemanaAtualSlug();

      // Buscar todos os treinos do usuário para contar
      const { data: allWorkouts, error: countError } = await supabase
        .from("workouts")
        .select("id")
        .eq("user_id", userData.user.id);

      if (!countError && allWorkouts) {
        setUserWorkoutsCount(allWorkouts.length);
      }

      // Buscar treino do dia
      const { data: workouts, error: workoutError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userData.user.id)
        .contains("dias_semana", [currentDay])
        .order("created_at", { ascending: true })
        .limit(1);

      if (workoutError) {
        toast({
          title: "Erro",
          description: "Erro ao buscar treino de hoje.",
          variant: "destructive",
        });
        setTodayWorkout(null);
        return;
      }

      if (!workouts || workouts.length === 0) {
        setTodayWorkout(null);
        return;
      }

      const workout = workouts[0];

      // Buscar exercícios do treino
      const { data: workoutExercises, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", workout.id)
        .order("ordem", { ascending: true });

      if (exercisesError) {
        toast({
          title: "Erro",
          description: "Erro ao buscar exercícios do treino.",
          variant: "destructive",
        });
        return;
      }

      // Buscar detalhes dos exercícios
      const exercisesWithDetails = await Promise.all(
        workoutExercises.map(async (we) => {
          const { data: exerciseData } = await supabase
            .from("exercises")
            .select("*")
            .eq("id", we.exercise_id)
            .single();

          return {
            id: we.id,
            series: we.series,
            repeticoes: we.repeticoes,
            exercise: exerciseData as Exercise,
          };
        })
      );

      setTodayWorkout({
        id: workout.id,
        name: workout.nome,
        exercises: exercisesWithDetails as WorkoutExercise[],
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar treino de hoje.",
        variant: "destructive",
      });
      setTodayWorkout(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendation = async () => {
    try {
      setIsLoadingRecommendation(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("objetivo, nivel, dias_treino")
        .eq("user_id", userData.user.id)
        .single();

      if (profileError || !profileData) return;

      // Buscar todos os modelos de treino
      const { data: modelWorkouts, error: modelsError } = await supabase
        .from("model_workouts")
        .select("*");

      if (modelsError || !modelWorkouts) return;

      // Recomendar melhor treino
      const recommended = recommendModelWorkout(
        profileData as Profile,
        modelWorkouts as ModelWorkout[]
      );

      setRecommendedWorkout(recommended);
    } catch (error) {
      // Silently fail - recommendation is optional
      console.error("Error loading recommendation:", error);
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  const getObjetivoLabel = (objetivo: string) => {
    const labels: Record<string, string> = {
      emagrecimento: "Emagrecimento",
      hipertrofia: "Hipertrofia",
      forca: "Força",
      saude_condicionamento: "Saúde e Condicionamento",
    };
    return labels[objetivo] || objetivo;
  };

  const getNivelLabel = (nivel: string) => {
    const labels: Record<string, string> = {
      iniciante: "Iniciante",
      intermediario: "Intermediário",
      avancado: "Avançado",
    };
    return labels[nivel] || nivel;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Treino</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe, monte e gerencie seus treinos.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/montar-treino")}
            className="w-full h-12 text-base"
            size="lg"
          >
            Montar treino
          </Button>
          <Button
            onClick={() => navigate("/todos-treinos")}
            variant="outline"
            className="w-full h-12 text-base border-primary text-primary hover:bg-primary/10"
            size="lg"
          >
            Todos os treinos
          </Button>
          <Button
            onClick={() => navigate("/historico-treinos")}
            variant="outline"
            className="w-full h-12 text-base border-primary text-primary hover:bg-primary/10"
            size="lg"
          >
            Histórico de treinos
          </Button>
        </div>

        {/* Today's Workout Section */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Treino de hoje</h2>
            <p className="text-sm text-muted-foreground">{getCurrentDate()}</p>
            <p className="text-xs text-muted-foreground mt-1">Dia atual detectado: {getDiaSemanaAtualSlug()}</p>
          </div>

          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : todayWorkout ? (
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/detalhe-treino/${todayWorkout.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{todayWorkout.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2">
                  {todayWorkout.exercises.map((item) => (
                    <li key={item.id} className="text-foreground flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>
                        {item.exercise.nome} – {item.series}x{item.repeticoes}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Este é o treino planejado para hoje.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Você ainda não tem treino planejado para hoje.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommended Workout Section - Only show if user has no workouts */}
        {userWorkoutsCount === 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Treino sugerido para você
              </h2>
            </div>

            {isLoadingRecommendation ? (
              <Skeleton className="h-64 w-full" />
            ) : recommendedWorkout ? (
              <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {recommendedWorkout.titulo}
                  </CardTitle>
                  {recommendedWorkout.descricao_curta && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {recommendedWorkout.descricao_curta}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {getObjetivoLabel(recommendedWorkout.objetivo)}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {getNivelLabel(recommendedWorkout.nivel)}
                    </Badge>
                    {recommendedWorkout.dias_semana_sugeridos && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {recommendedWorkout.dias_semana_sugeridos}x por semana
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => navigate(`/modelo-treino/${recommendedWorkout.id}`)}
                    className="w-full"
                  >
                    Ver treino sugerido
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Recomendado com base no seu perfil
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default Treino;
