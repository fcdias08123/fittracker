import { useState, useMemo, useEffect } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { muscleGroups } from "@/data/exercises";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Exercise {
  id: string;
  nome: string;
  grupo_muscular: string;
  dificuldade: string;
  explicacao: string;
}

interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

const daysOfWeek = [
  { key: "seg", label: "Seg" },
  { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" },
  { key: "sab", label: "Sáb" },
  { key: "dom", label: "Dom" },
];

const MontarTreino = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const workoutId = searchParams.get("id");
  const isEditMode = !!workoutId;

  // Workout info
  const [workoutName, setWorkoutName] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);

  // Load workout data if in edit mode
  const { data: workoutData } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      if (!workoutId) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .eq('user_id', user.id)
        .single();
      
      if (workoutError) throw workoutError;

      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('workout_id', workoutId)
        .order('ordem');
      
      if (exercisesError) throw exercisesError;

      return { workout, exercises };
    },
    enabled: isEditMode && !!workoutId,
  });

  useEffect(() => {
    if (workoutData) {
      setWorkoutName(workoutData.workout.nome);
      setSelectedDays(workoutData.workout.dias_semana);
      
      const exercises: WorkoutExercise[] = workoutData.exercises.map((ex: any) => ({
        exercise: {
          id: ex.exercise.id,
          nome: ex.exercise.nome,
          grupo_muscular: ex.exercise.grupo_muscular,
          dificuldade: ex.exercise.dificuldade,
          explicacao: ex.exercise.explicacao,
        },
        sets: ex.series,
        reps: ex.repeticoes,
        weight: ex.carga,
        notes: ex.observacoes || "",
      }));
      setWorkoutExercises(exercises);
    }
  }, [workoutData]);

  // Exercise selection modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("Todos");

  // Exercise configuration
  const [configuringExercise, setConfiguringExercise] = useState<Exercise | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");

  // Query exercises from Supabase
  const { data: allExercises = [] } = useQuery({
    queryKey: ['exercises', searchTerm, selectedMuscleGroup],
    queryFn: async () => {
      let query = supabase
        .from('exercises')
        .select('*')
        .order('grupo_muscular')
        .order('nome');

      if (searchTerm) {
        query = query.ilike('nome', `%${searchTerm}%`);
      }

      if (selectedMuscleGroup !== "Todos") {
        query = query.eq('grupo_muscular', selectedMuscleGroup);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredExercises = allExercises;

  const toggleDay = (dayKey: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const openExerciseSelection = () => {
    setIsModalOpen(true);
    setSearchTerm("");
    setSelectedMuscleGroup("Todos");
  };

  const selectExercise = (exercise: Exercise) => {
    setConfiguringExercise(exercise);
    setIsModalOpen(false);
    // Reset configuration fields
    setSets(3);
    setReps(10);
    setWeight(undefined);
    setNotes("");
    setEditingIndex(null);
  };

  const confirmExercise = () => {
    if (!configuringExercise) return;

    const newExercise: WorkoutExercise = {
      exercise: configuringExercise,
      sets,
      reps,
      weight,
      notes,
    };

    if (editingIndex !== null) {
      // Update existing exercise
      const updated = [...workoutExercises];
      updated[editingIndex] = newExercise;
      setWorkoutExercises(updated);
      toast({ title: "Exercício atualizado!" });
    } else {
      // Add new exercise
      setWorkoutExercises([...workoutExercises, newExercise]);
      toast({ title: "Exercício adicionado!" });
    }

    cancelConfiguration();
  };

  const cancelConfiguration = () => {
    setConfiguringExercise(null);
    setEditingIndex(null);
    setSets(3);
    setReps(10);
    setWeight(undefined);
    setNotes("");
  };

  const editExercise = (index: number) => {
    const exercise = workoutExercises[index];
    setConfiguringExercise(exercise.exercise);
    setSets(exercise.sets);
    setReps(exercise.reps);
    setWeight(exercise.weight);
    setNotes(exercise.notes || "");
    setEditingIndex(index);
  };

  const removeExercise = (index: number) => {
    if (window.confirm("Tem certeza que deseja remover este exercício?")) {
      setWorkoutExercises(workoutExercises.filter((_, i) => i !== index));
      toast({ title: "Exercício removido!" });
    }
  };

  const saveWorkoutMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (isEditMode && workoutId) {
        // Update existing workout
        const { error: workoutError } = await supabase
          .from('workouts')
          .update({
            nome: workoutName,
            dias_semana: selectedDays,
          })
          .eq('id', workoutId)
          .eq('user_id', user.id);

        if (workoutError) throw workoutError;

        // Delete old exercises
        const { error: deleteError } = await supabase
          .from('workout_exercises')
          .delete()
          .eq('workout_id', workoutId);

        if (deleteError) throw deleteError;

        // Insert new exercises
        const exercisesToInsert = workoutExercises.map((ex, index) => ({
          workout_id: workoutId,
          exercise_id: ex.exercise.id,
          ordem: index + 1,
          series: ex.sets,
          repeticoes: ex.reps,
          carga: ex.weight,
          observacoes: ex.notes || null,
        }));

        const { error: insertError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert);

        if (insertError) throw insertError;

        return { isEdit: true };
      } else {
        // Create new workout
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            nome: workoutName,
            dias_semana: selectedDays,
          })
          .select()
          .single();

        if (workoutError) throw workoutError;

        // Insert exercises
        const exercisesToInsert = workoutExercises.map((ex, index) => ({
          workout_id: workout.id,
          exercise_id: ex.exercise.id,
          ordem: index + 1,
          series: ex.sets,
          repeticoes: ex.reps,
          carga: ex.weight,
          observacoes: ex.notes || null,
        }));

        const { error: insertError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert);

        if (insertError) throw insertError;

        return { isEdit: false };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      
      if (data.isEdit) {
        toast({
          title: "Treino atualizado com sucesso!",
          description: `${workoutName} foi atualizado.`,
        });
      } else {
        toast({
          title: "Treino criado com sucesso!",
          description: `${workoutName} foi criado.`,
        });
      }

      setTimeout(() => {
        navigate("/todos-treinos");
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar treino",
        variant: "destructive",
      });
    },
  });

  const saveWorkout = () => {
    // Validation
    if (!workoutName.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome do treino.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDays.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um dia da semana.",
        variant: "destructive",
      });
      return;
    }

    if (workoutExercises.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    saveWorkoutMutation.mutate();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Iniciante":
        return "bg-green-500";
      case "Intermediário":
        return "bg-yellow-500";
      case "Avançado":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? "Editar treino" : "Montar treino"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode
              ? "Atualize as informações do seu treino."
              : "Crie um treino personalizado e organize seus exercícios."}
          </p>
        </div>

        {/* Workout Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do treino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workout Name */}
            <div className="space-y-2">
              <Label htmlFor="workout-name">Nome do treino</Label>
              <Input
                id="workout-name"
                placeholder="Ex.: Treino A – Peito e Tríceps"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
              />
            </div>

            {/* Days of Week */}
            <div className="space-y-2">
              <Label>Dias da semana</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.key}
                    variant={selectedDays.includes(day.key) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day.key)}
                    className={
                      selectedDays.includes(day.key)
                        ? ""
                        : "border-border text-muted-foreground hover:bg-accent"
                    }
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercises Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Exercícios do treino</h2>

          {/* Add Exercise Button */}
          {!configuringExercise && (
            <Button onClick={openExerciseSelection} className="w-full" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Adicionar exercício
            </Button>
          )}

          {/* Exercise Configuration Card */}
              {configuringExercise && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-primary">{configuringExercise.nome}</CardTitle>
                <CardDescription>{configuringExercise.grupo_muscular}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sets">Séries</Label>
                    <Input
                      id="sets"
                      type="number"
                      min="1"
                      placeholder="Ex.: 3"
                      value={sets}
                      onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reps">Repetições</Label>
                    <Input
                      id="reps"
                      type="number"
                      min="1"
                      placeholder="Ex.: 10"
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Carga (kg) - Opcional</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    placeholder="Ex.: 20"
                    value={weight || ""}
                    onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações - Opcional</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ex.: descanso de 60s entre séries"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={confirmExercise} className="flex-1">
                    {editingIndex !== null ? "Atualizar" : "Confirmar"}
                  </Button>
                  <Button onClick={cancelConfiguration} variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* List of Added Exercises */}
          {workoutExercises.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">
                Exercícios adicionados ({workoutExercises.length})
              </h3>
              {workoutExercises.map((item, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-base text-primary">
                          {item.exercise.nome}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {item.exercise.grupo_muscular}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editExercise(index)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExercise(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 text-sm text-foreground">
                      <p>
                        <strong>Séries × Repetições:</strong> {item.sets}×{item.reps}
                      </p>
                      {item.weight && (
                        <p>
                          <strong>Carga:</strong> {item.weight} kg
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-muted-foreground">
                          <strong>Obs:</strong> {item.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button onClick={saveWorkout} className="w-full" size="lg">
          {isEditMode ? "Salvar alterações" : "Salvar treino"}
        </Button>
      </div>

      {/* Exercise Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Escolher exercício</DialogTitle>
            <DialogDescription>
              Busque e selecione um exercício da biblioteca
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <Input
              placeholder="Buscar exercício..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Muscle Group Filter */}
            <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo muscular" />
              </SelectTrigger>
              <SelectContent>
                {muscleGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Exercise List */}
            <div className="space-y-2">
              {filteredExercises.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum exercício encontrado.
                </p>
              ) : (
                filteredExercises.map((exercise) => (
                  <Card
                    key={exercise.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => selectExercise(exercise)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{exercise.nome}</CardTitle>
                          <CardDescription className="text-sm">
                            {exercise.grupo_muscular}
                          </CardDescription>
                        </div>
                        <Badge className={getDifficultyColor(exercise.dificuldade)}>
                          {exercise.dificuldade}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavbar />
    </div>
  );
};

export default MontarTreino;
