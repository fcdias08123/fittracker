import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavbar from "@/components/BottomNavbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatarDataPtBr } from "@/lib/dateUtils";

type HistoryItem = {
  id: string;
  workout_id: string;
  data_realizado: string;
  workout_name: string;
};

const HistoricoTreinos = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
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

      const { data: historyData, error: historyError } = await supabase
        .from("workout_history")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("data_realizado", { ascending: false })
        .order("created_at", { ascending: false });

      if (historyError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar histórico de treinos.",
          variant: "destructive",
        });
        return;
      }

      // Buscar nomes dos treinos
      const historyWithNames = await Promise.all(
        historyData.map(async (item) => {
          const { data: workoutData } = await supabase
            .from("workouts")
            .select("nome")
            .eq("id", item.workout_id)
            .eq("user_id", userData.user.id)
            .single();

          return {
            id: item.id,
            workout_id: item.workout_id,
            data_realizado: item.data_realizado,
            workout_name: workoutData?.nome || "Treino removido",
          };
        })
      );

      setHistory(historyWithNames);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayedWorkouts = history.slice(0, displayCount);
  const hasMore = displayCount < history.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 10);
  };

  const handleWorkoutClick = (workoutId: string, dataRealizado: string) => {
    navigate(`/detalhe-treino/${workoutId}`, {
      state: {
        modoVisualizacao: true,
        dataHistorico: dataRealizado,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Histórico de treinos
        </h1>
        <p className="text-muted-foreground mb-6">
          Acompanhe todos os treinos que você já realizou.
        </p>

        {/* Lista de treinos ou estado vazio */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Você ainda não concluiu nenhum treino.
            </p>
            <Button onClick={() => navigate("/montar-treino")}>
              Começar agora
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayedWorkouts.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleWorkoutClick(item.workout_id, item.data_realizado)}
                >
                  <h3 className="font-semibold text-foreground mb-1">
                    {item.workout_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Concluído em {formatarDataPtBr(item.data_realizado)}
                  </p>
                </Card>
              ))}
            </div>

            {/* Botão Exibir mais */}
            {hasMore && (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={handleLoadMore}>
                  Exibir mais
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default HistoricoTreinos;
