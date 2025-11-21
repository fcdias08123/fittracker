export interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  difficulty: string;
  explanation: string;
}

export const allExercises: Exercise[] = [
  {
    id: 1,
    name: "Supino Reto",
    muscleGroup: "Peito",
    difficulty: "Intermediário",
    explanation: "Deite-se no banco, segure a barra com as mãos afastadas na largura dos ombros e empurre para cima até estender os braços.",
  },
  {
    id: 2,
    name: "Crucifixo Inclinado",
    muscleGroup: "Peito",
    difficulty: "Intermediário",
    explanation: "Deite-se em um banco inclinado, segure os halteres e abra os braços lateralmente, depois feche na linha do peito.",
  },
  {
    id: 3,
    name: "Remada Curvada",
    muscleGroup: "Costas",
    difficulty: "Intermediário",
    explanation: "Incline o tronco para frente, segure a barra e puxe em direção ao abdômen, mantendo os cotovelos próximos ao corpo.",
  },
  {
    id: 4,
    name: "Barra Fixa",
    muscleGroup: "Costas",
    difficulty: "Avançado",
    explanation: "Segure a barra acima da cabeça e puxe o corpo para cima até o queixo ultrapassar a barra.",
  },
  {
    id: 5,
    name: "Rosca Direta",
    muscleGroup: "Braços",
    difficulty: "Iniciante",
    explanation: "Segure a barra com as palmas para cima e flexione os cotovelos, levando a barra até os ombros.",
  },
  {
    id: 6,
    name: "Tríceps Testa",
    muscleGroup: "Braços",
    difficulty: "Intermediário",
    explanation: "Deite-se no banco, segure a barra acima da cabeça e flexione os cotovelos levando a barra em direção à testa.",
  },
  {
    id: 7,
    name: "Abdominal Supra",
    muscleGroup: "Abdômen",
    difficulty: "Iniciante",
    explanation: "Deite-se de costas, flexione os joelhos e eleve o tronco em direção aos joelhos, contraindo o abdômen.",
  },
  {
    id: 8,
    name: "Prancha",
    muscleGroup: "Abdômen",
    difficulty: "Iniciante",
    explanation: "Apoie-se nos antebraços e pontas dos pés, mantendo o corpo reto e contraindo o abdômen.",
  },
  {
    id: 9,
    name: "Agachamento Livre",
    muscleGroup: "Pernas",
    difficulty: "Intermediário",
    explanation: "Com a barra nas costas, desça flexionando os joelhos até que as coxas fiquem paralelas ao chão e suba novamente.",
  },
  {
    id: 10,
    name: "Leg Press",
    muscleGroup: "Pernas",
    difficulty: "Iniciante",
    explanation: "Sentado no aparelho, empurre a plataforma com os pés até estender as pernas completamente.",
  },
  {
    id: 11,
    name: "Elevação de Panturrilha",
    muscleGroup: "Panturrilha",
    difficulty: "Iniciante",
    explanation: "Em pé, eleve os calcanhares do chão, ficando na ponta dos pés, e depois desça lentamente.",
  },
  {
    id: 12,
    name: "Panturrilha Sentado",
    muscleGroup: "Panturrilha",
    difficulty: "Iniciante",
    explanation: "Sentado no aparelho, coloque peso sobre os joelhos e eleve os calcanhares contraindo a panturrilha.",
  },
  {
    id: 13,
    name: "Desenvolvimento com Halteres",
    muscleGroup: "Ombros",
    difficulty: "Intermediário",
    explanation: "Sentado, segure os halteres na altura dos ombros e empurre para cima até estender os braços.",
  },
  {
    id: 14,
    name: "Elevação Lateral",
    muscleGroup: "Ombros",
    difficulty: "Iniciante",
    explanation: "Em pé, segure os halteres ao lado do corpo e eleve lateralmente até a altura dos ombros.",
  },
  {
    id: 15,
    name: "Elevação Pélvica",
    muscleGroup: "Glúteos",
    difficulty: "Iniciante",
    explanation: "Deite-se de costas, flexione os joelhos e eleve o quadril, contraindo os glúteos no topo do movimento.",
  },
  {
    id: 16,
    name: "Stiff",
    muscleGroup: "Glúteos",
    difficulty: "Intermediário",
    explanation: "Com as pernas levemente flexionadas, incline o tronco para frente segurando a barra, descendo até sentir alongamento posterior.",
  },
  {
    id: 17,
    name: "Flexão de Braço",
    muscleGroup: "Peito",
    difficulty: "Iniciante",
    explanation: "Apoie as mãos no chão na largura dos ombros, desça o corpo flexionando os cotovelos e suba novamente.",
  },
  {
    id: 18,
    name: "Pulldown",
    muscleGroup: "Costas",
    difficulty: "Iniciante",
    explanation: "Sentado no aparelho, puxe a barra em direção ao peito, mantendo os cotovelos para baixo.",
  },
  {
    id: 19,
    name: "Rosca Martelo",
    muscleGroup: "Braços",
    difficulty: "Iniciante",
    explanation: "Segure os halteres com as palmas voltadas uma para a outra e flexione os cotovelos alternadamente.",
  },
  {
    id: 20,
    name: "Cadeira Extensora",
    muscleGroup: "Pernas",
    difficulty: "Iniciante",
    explanation: "Sentado no aparelho, estenda as pernas levantando o peso até que fiquem completamente estendidas.",
  },
];

export const muscleGroups = [
  "Todos",
  "Peito",
  "Costas",
  "Braços",
  "Abdômen",
  "Pernas",
  "Panturrilha",
  "Ombros",
  "Glúteos",
  "Corpo Inteiro",
  "Cardio",
];
