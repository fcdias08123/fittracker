import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from "@/components/BackButton";
import { Target, Award, Calendar } from "lucide-react";

type Exercise = {
  nome: string;
  series: number;
  repeticoes: number;
  grupo_muscular?: string;
};

type WorkoutDay = {
  dia: string;
  nome: string;
  exercicios: Exercise[];
};

type ModelWorkout = {
  id: string;
  titulo: string;
  descricao_curta: string | null;
  objetivo: string;
  nivel: string;
  dias_semana_sugeridos: number | null;
  tipo_divisao: string | null;
  estrutura: {
    treinos?: WorkoutDay[];
  };
};

const ModelWorkoutDetail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [modelWorkout, setModelWorkout] = useState<ModelWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadModelWorkout();
  }, [id]);

  const loadModelWorkout = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("model_workouts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar treino modelo.",
          variant: "destructive",
        });
        navigate("/treino");
        return;
      }

      setModelWorkout(data as ModelWorkout);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar treino modelo.",
        variant: "destructive",
      });
      navigate("/treino");
    } finally {
      setIsLoading(false);
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

  const handleImportWorkout = async () => {
    if (!modelWorkout) return;

    try {
      setIsImporting(true);

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado para importar um treino.",
          variant: "destructive",
        });
        return;
      }

      // Get user profile to read dias_treino
      const { data: profile } = await supabase
        .from('profiles')
        .select('dias_treino')
        .eq('user_id', user.id)
        .single();

      const userDiasTreino = profile?.dias_treino || [];

      // Get all exercises from database
      const { data: allExercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('id, nome, explicacao');

      if (exercisesError) throw exercisesError;

      // Create maps for quick lookup (normalize names)
      const exerciseIdMap = new Map(
        allExercises.map(ex => [ex.nome.toLowerCase().trim(), ex.id])
      );
      const exerciseExplicacaoMap = new Map(
        allExercises.map(ex => [ex.nome.toLowerCase().trim(), ex.explicacao])
      );

      // Process treinos from model structure
      const treinos = modelWorkout.estrutura?.treinos || [];
      
      if (treinos.length === 0) {
        toast({
          title: "Erro",
          description: "Este modelo não possui treinos definidos.",
          variant: "destructive",
        });
        return;
      }

      // Check existing workouts to handle duplicates
      const { data: existingWorkouts } = await supabase
        .from('workouts')
        .select('nome')
        .eq('user_id', user.id);

      const existingNames = new Set(existingWorkouts?.map(w => w.nome) || []);

      // Helper to generate unique name
      const getUniqueName = (baseName: string) => {
        if (!existingNames.has(baseName)) return baseName;
        let counter = 2;
        while (existingNames.has(`${baseName} (${counter})`)) {
          counter++;
        }
        return `${baseName} (${counter})`;
      };

      // Distribute dias_semana among treinos
      const distributeDias = (numTreinos: number): string[][] => {
        // Regra específica para treinos 3x/semana
        if (modelWorkout.dias_semana_sugeridos === 3) {
          if (numTreinos === 1) {
            return [["seg", "qua", "sex"]];
          } else if (numTreinos === 2) {
            return [["seg", "sex"], ["qua"]];
          } else if (numTreinos === 3) {
            return [["seg"], ["qua"], ["sex"]];
          }
        }
        
        // Se não houver dias do usuário, retorna vazio
        if (userDiasTreino.length === 0) {
          return Array(numTreinos).fill([]);
        }
        
        // Distribuição padrão baseada nos dias do perfil do usuário
        const result: string[][] = Array(numTreinos).fill(null).map(() => []);
        userDiasTreino.forEach((dia, index) => {
          const treinoIndex = index % numTreinos;
          result[treinoIndex].push(dia);
        });
        
        return result;
      };

      const diasDistribuidos = distributeDias(treinos.length);
      const createdWorkoutIds: string[] = [];
      let totalExercisesInserted = 0;

      try {
        // Create workouts for each treino (A, B, C, etc.)
        for (let i = 0; i < treinos.length; i++) {
          const treino = treinos[i];
          const baseName = treinos.length > 1 
            ? `${modelWorkout.titulo} - ${treino.dia}`
            : modelWorkout.titulo;
          
          const workoutName = getUniqueName(baseName);
          existingNames.add(workoutName); // Prevent duplicates in this batch

          // Create workout
          const { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .insert({
              user_id: user.id,
              nome: workoutName,
              dias_semana: diasDistribuidos[i],
            })
            .select()
            .single();

          if (workoutError) throw workoutError;
          createdWorkoutIds.push(workout.id);

          // Process exercises for this treino
          const exercisesToInsert: any[] = [];
          let ordem = 1;

          for (const exercicio of treino.exercicios) {
            const normalizedName = exercicio.nome.toLowerCase().trim();
            const exerciseId = exerciseIdMap.get(normalizedName);
            const exerciseExplicacao = exerciseExplicacaoMap.get(normalizedName);
            
            if (exerciseId) {
              // Parse repeticoes - pode ser string ou number
              let repeticoes = 10; // default
              const reps = exercicio.repeticoes as any;
              if (typeof reps === 'number') {
                repeticoes = reps;
              } else if (typeof reps === 'string') {
                // Try to extract first number from string like "8-12" or "30s"
                const match = reps.match(/\d+/);
                if (match) {
                  repeticoes = parseInt(match[0]);
                }
              }

              // Montar observacoes com explicação e descanso
              const observacoesParts: string[] = [];
              
              // Opcional: incluir bloco/dia no início
              if (treino.nome) {
                observacoesParts.push(`${treino.dia} - ${treino.nome}`);
              }
              
              // Adicionar explicação do exercício
              if (exerciseExplicacao) {
                observacoesParts.push(`Execução: ${exerciseExplicacao}`);
              }
              
              // Adicionar descanso se existir no modelo (cast para any para acessar propriedade dinâmica)
              const exercicioAny = exercicio as any;
              if (exercicioAny.descanso) {
                observacoesParts.push(`Descanso: ${exercicioAny.descanso}`);
              }
              
              const observacoes = observacoesParts.join('. ') || null;

              exercisesToInsert.push({
                workout_id: workout.id,
                exercise_id: exerciseId,
                ordem: ordem++,
                series: exercicio.series || 3,
                repeticoes: repeticoes,
                carga: null,
                observacoes: observacoes,
              });
            } else {
              console.warn(`Exercício não encontrado: ${exercicio.nome}`);
            }
          }

          if (exercisesToInsert.length > 0) {
            const { error: insertError } = await supabase
              .from('workout_exercises')
              .insert(exercisesToInsert);

            if (insertError) throw insertError;
            totalExercisesInserted += exercisesToInsert.length;
          }
        }

        // Check if at least some exercises were inserted
        if (totalExercisesInserted === 0) {
          // Rollback: delete all created workouts
          await supabase
            .from('workouts')
            .delete()
            .in('id', createdWorkoutIds)
            .eq('user_id', user.id);

          toast({
            title: "Aviso",
            description: "Nenhum exercício compatível foi encontrado para importar.",
            variant: "destructive",
          });
          return;
        }

        // Success
        const successMessage = treinos.length > 1
          ? `${treinos.length} treinos adicionados com sucesso!`
          : `Treino adicionado com sucesso!`;

        toast({
          title: successMessage,
          description: `${totalExercisesInserted} exercícios foram importados.`,
        });

        // Navigate to all workouts page
        setTimeout(() => {
          navigate("/todos-treinos");
        }, 1000);

      } catch (innerError) {
        // Rollback: delete all created workouts
        if (createdWorkoutIds.length > 0) {
          await supabase
            .from('workouts')
            .delete()
            .in('id', createdWorkoutIds)
            .eq('user_id', user.id);
        }
        throw innerError;
      }

    } catch (error) {
      console.error('Error importing workout:', error);
      toast({
        title: "Erro ao importar treino",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!modelWorkout) {
    return null;
  }

  const treinos = modelWorkout.estrutura?.treinos || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <BackButton />

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {modelWorkout.titulo}
            </h1>
            {modelWorkout.descricao_curta && (
              <p className="text-muted-foreground mt-2">
                {modelWorkout.descricao_curta}
              </p>
            )}
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {getObjetivoLabel(modelWorkout.objetivo)}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              {getNivelLabel(modelWorkout.nivel)}
            </Badge>
            {modelWorkout.dias_semana_sugeridos && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {modelWorkout.dias_semana_sugeridos}x por semana
              </Badge>
            )}
          {modelWorkout.tipo_divisao && (
              <Badge variant="outline">
                {modelWorkout.tipo_divisao}
              </Badge>
            )}
          </div>
        </div>

        {/* Import Button */}
        <div className="pt-4">
          <Button
            onClick={handleImportWorkout}
            disabled={isImporting}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isImporting ? "Importando..." : "Usar este treino"}
          </Button>
        </div>

        {/* Workout days */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Estrutura do treino
          </h2>

          {treinos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Nenhum treino disponível neste modelo.
                </p>
              </CardContent>
            </Card>
          ) : (
            treinos.map((treino, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {treino.dia} {treino.nome && `— ${treino.nome}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {treino.exercicios.map((exercicio, exIndex) => (
                      <li
                        key={exIndex}
                        className="text-foreground flex items-start"
                      >
                        <span className="text-primary mr-2">•</span>
                        <span>
                          {exercicio.nome} – {exercicio.series}x
                          {exercicio.repeticoes}
                          {exercicio.grupo_muscular && (
                            <span className="text-muted-foreground text-sm ml-2">
                              ({exercicio.grupo_muscular})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info note */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Este é um treino modelo sugerido. Você pode usá-lo como base para
              criar seu próprio treino personalizado na aba "Montar treino".
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModelWorkoutDetail;
