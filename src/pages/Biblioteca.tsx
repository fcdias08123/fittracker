import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import BottomNavbar from "@/components/BottomNavbar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { muscleGroups } from "@/data/exercises";

const Biblioteca = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("Todos");
  const [offset, setOffset] = useState(0);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const limit = 20;

  // Query para buscar exercícios do Supabase
  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', searchTerm, selectedMuscleGroup, offset],
    queryFn: async () => {
      let query = supabase
        .from('exercises')
        .select('*')
        .order('grupo_muscular')
        .order('nome')
        .range(offset, offset + limit - 1);

      // Aplicar filtro de busca
      if (searchTerm) {
        query = query.ilike('nome', `%${searchTerm}%`);
      }

      // Aplicar filtro de grupo muscular
      if (selectedMuscleGroup !== "Todos") {
        query = query.eq('grupo_muscular', selectedMuscleGroup);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true // Garante que a query execute automaticamente
  });

  // Atualizar lista acumulada quando novos exercícios chegam
  useEffect(() => {
    if (exercises && offset > 0) {
      setAllExercises(prev => [...prev, ...exercises]);
    }
  }, [exercises, offset]);

  // Reset offset quando filtros mudam
  useEffect(() => {
    setOffset(0);
    setAllExercises([]);
  }, [searchTerm, selectedMuscleGroup]);

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  const hasMore = exercises && exercises.length === limit;
  
  // Usar exercícios da query diretamente na primeira carga (offset === 0)
  // e exercícios acumulados quando carregando mais (offset > 0)
  const displayExercises = offset === 0 ? (exercises || []) : allExercises;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Iniciante":
        return "bg-green-100 text-green-800 border-green-200";
      case "Intermediário":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Avançado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca de Exercícios</h1>
          <p className="text-muted-foreground mt-1">
            Explore exercícios e aprenda a executá-los corretamente.
          </p>
        </div>

        {/* Barra de pesquisa */}
        <Input
          type="text"
          placeholder="Buscar exercício..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />

        {/* Filtro por grupo muscular */}
        <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
          <SelectTrigger className="w-full">
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

        {/* Lista de exercícios */}
        <div className="space-y-4">
          {isLoading && offset === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Carregando exercícios...
            </p>
          ) : displayExercises.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum exercício encontrado para os filtros atuais.
            </p>
          ) : (
            displayExercises.map((exercise) => (
              <Card key={exercise.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-primary">{exercise.nome}</CardTitle>
                      <CardDescription>{exercise.grupo_muscular}</CardDescription>
                    </div>
                    <Badge variant="outline" className={getDifficultyColor(exercise.dificuldade)}>
                      {exercise.dificuldade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{exercise.explicacao}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Botão Exibir mais */}
        {hasMore && !isLoading && (
          <Button onClick={handleLoadMore} variant="outline" className="w-full">
            Exibir mais
          </Button>
        )}
        {isLoading && offset > 0 && (
          <p className="text-center text-muted-foreground py-4">
            Carregando mais exercícios...
          </p>
        )}
      </div>

      <BottomNavbar />
    </div>
  );
};

export default Biblioteca;
