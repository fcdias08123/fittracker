import { useState } from "react";
import BottomNavbar from "@/components/BottomNavbar";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Calendar, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Workout {
  id: string;
  nome: string;
  dias_semana: string[];
  exerciseCount: number;
}

const TodosTreinos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);

  // Query workouts from Supabase
  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          nome,
          dias_semana,
          workout_exercises(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((workout: any) => ({
        id: workout.id,
        nome: workout.nome,
        dias_semana: workout.dias_semana,
        exerciseCount: workout.workout_exercises[0]?.count || 0,
      }));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast({
        title: "Treino excluído com sucesso.",
      });
      setWorkoutToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir treino",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (workout: Workout) => {
    setWorkoutToDelete(workout);
  };

  const confirmDelete = () => {
    if (workoutToDelete) {
      deleteMutation.mutate(workoutToDelete.id);
    }
  };

  const handleEdit = (workoutId: string) => {
    navigate(`/montar-treino?id=${workoutId}`);
  };

  const getDayLabel = (dayKey: string) => {
    const dayLabels: Record<string, string> = {
      seg: "Seg",
      ter: "Ter",
      qua: "Qua",
      qui: "Qui",
      sex: "Sex",
      sab: "Sáb",
      dom: "Dom",
    };
    return dayLabels[dayKey] || dayKey;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold text-foreground">Todos os treinos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os treinos que você já criou.
          </p>
        </div>

        {/* Workouts List */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">
            Carregando treinos...
          </div>
        ) : workouts.length > 0 ? (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <Card key={workout.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{workout.nome}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{workout.dias_semana.map(getDayLabel).join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Dumbbell className="h-4 w-4" />
                    <span>{workout.exerciseCount} exercícios</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workout.id)}
                      className="flex-1 border-primary text-primary hover:bg-primary/10"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workout)}
                      className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-muted-foreground text-center">
              Você ainda não criou nenhum treino.
            </p>
            <Button onClick={() => navigate("/montar-treino")}>
              Montar primeiro treino
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!workoutToDelete} onOpenChange={() => setWorkoutToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o treino '{workoutToDelete?.nome}'? 
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavbar />
    </div>
  );
};

export default TodosTreinos;
