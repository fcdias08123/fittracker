import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavbar from "@/components/BottomNavbar";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { startOfWeek, endOfWeek, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type WeekDay = {
  day: string;
  trained: boolean;
};

const Home = () => {
  const navigate = useNavigate();
  const [weekDays, setWeekDays] = useState<WeekDay[]>([
    { day: "SEG", trained: false },
    { day: "TER", trained: false },
    { day: "QUA", trained: false },
    { day: "QUI", trained: false },
    { day: "SEX", trained: false },
    { day: "SÁB", trained: false },
    { day: "DOM", trained: false },
  ]);
  const [trainedDays, setTrainedDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWorkouts, setHasWorkouts] = useState(true);

  useEffect(() => {
    loadWeekProgress();
  }, []);

  const loadWeekProgress = async () => {
    try {
      setIsLoading(true);

      // Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Erro ao obter usuário:", userError);
        return;
      }

      // Verificar se usuário tem treinos criados
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (workoutsError) {
        console.error("Erro ao verificar treinos:", workoutsError);
      } else {
        setHasWorkouts((workouts?.length ?? 0) > 0);
      }

      // Calcular início e fim da semana (segunda a domingo)
      const hoje = new Date();
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // 1 = segunda
      const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

      const dataInicio = format(inicioSemana, 'yyyy-MM-dd');
      const dataFim = format(fimSemana, 'yyyy-MM-dd');

      // Buscar histórico da semana
      const { data: historicoSemana, error: historicoError } = await supabase
        .from('workout_history')
        .select('data_realizado')
        .eq('user_id', user.id)
        .gte('data_realizado', dataInicio)
        .lte('data_realizado', dataFim);

      if (historicoError) {
        console.error("Erro ao buscar histórico:", historicoError);
        return;
      }

      // Mapear dias treinados
      const diasTreinados = new Set<number>();
      historicoSemana?.forEach((item) => {
        const data = parseISO(item.data_realizado);
        const diaSemana = data.getDay(); // 0=dom, 1=seg, ...
        diasTreinados.add(diaSemana);
      });

      // Atualizar estado dos dias da semana
      const updatedWeekDays = weekDays.map((item, index) => {
        // index 0=SEG(1), 1=TER(2), ..., 5=SÁB(6), 6=DOM(0)
        const diaSemanaNum = index === 6 ? 0 : index + 1;
        return {
          ...item,
          trained: diasTreinados.has(diaSemanaNum)
        };
      });

      setWeekDays(updatedWeekDays);
      setTrainedDays(diasTreinados.size);
    } catch (error) {
      console.error("Erro ao carregar progresso:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalDays = 7;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <BottomNavbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Saudação */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Bem-vindo de volta! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está o resumo da sua semana de treinos.
          </p>
        </div>

        {/* Mensagem se não tiver treinos criados */}
        {!hasWorkouts && (
          <Card className="p-4 bg-muted/50 border-muted">
            <p className="text-sm text-muted-foreground text-center">
              Você ainda não montou nenhum treino. Comece criando um na aba Treino.
            </p>
          </Card>
        )}

        {/* Card de Progresso Semanal */}
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Progresso Semanal
            </h2>
            <p className="text-sm text-muted-foreground">
              {trainedDays === 0 
                ? "Você ainda não treinou nesta semana"
                : `Treinos realizados: ${trainedDays} / ${totalDays} dias nesta semana`
              }
            </p>
          </div>

          {/* Grid dos dias da semana */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((item) => (
              <div
                key={item.day}
                className="flex flex-col items-center space-y-1"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.trained ? "bg-primary/10" : "bg-muted"
                }`}>
                  {item.trained ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <span className={`text-xs ${
                  item.trained ? "text-primary font-medium" : "text-muted-foreground"
                }`}>
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Resumo rápido */}
        {trainedDays > 0 && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Esta semana você já treinou {trainedDays} {trainedDays === 1 ? "dia" : "dias"}.</p>
          </div>
        )}

        {/* Botão Iniciar Treino */}
        <Button
          size="lg"
          className="w-full text-base"
          onClick={() => navigate("/treino")}
        >
          Iniciar treino do dia
        </Button>

        {/* Mensagem motivacional */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-sm text-center text-foreground/80 italic">
            "Lembre-se: consistência vale mais do que intensidade."
          </p>
        </Card>
      </div>

      <BottomNavbar />
    </div>
  );
};

export default Home;
