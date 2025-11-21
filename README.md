# FitTracker

Aplicativo web para acompanhamento de treinos, evolução de peso e gestão de hábitos saudáveis. Desenvolvido como Trabalho de Conclusão de Curso.

## Sobre o Projeto

O FitTracker permite aos usuários:
- Criar e gerenciar treinos personalizados
- Acompanhar evolução de peso com gráficos
- Registrar histórico de treinos realizados
- Acessar biblioteca de exercícios categorizados
- Receber sugestões de treinos baseadas no perfil

## Tecnologias Utilizadas

- **Frontend**: React 18 com TypeScript
- **Build Tool**: Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (banco de dados PostgreSQL + autenticação)
- **Roteamento**: React Router v6
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Recharts

## Como Executar Localmente

### Pré-requisitos

- Node.js 16+ e npm instalados ([instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Conta no Supabase (para configurar o backend)

### Passos

```sh
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>

# 2. Entre no diretório do projeto
cd fittracker

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
# Crie um arquivo .env na raiz com as credenciais do Supabase:
# VITE_SUPABASE_URL=sua_url
# VITE_SUPABASE_ANON_KEY=sua_chave

# 5. Inicie o servidor de desenvolvimento
npm run dev

# 6. Acesse http://localhost:8080 no navegador
```

## Scripts Disponíveis

```sh
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Gera build de produção
npm run preview  # Visualiza build de produção localmente
npm run lint     # Executa linter
```

## Estrutura do Projeto

```
src/
├── components/        # Componentes reutilizáveis
│   └── ui/           # Componentes base (shadcn)
├── contexts/         # Contextos React (Auth, etc)
├── data/             # Dados estáticos e constantes
├── hooks/            # Custom hooks
├── integrations/     # Integrações externas (Supabase)
├── lib/              # Utilitários e helpers
├── pages/            # Páginas da aplicação
└── utils/            # Funções auxiliares
```

## Funcionalidades Principais

### Autenticação
- Cadastro e login de usuários
- Recuperação de senha
- Perfil personalizável

### Treinos
- Montagem de treinos personalizados
- Biblioteca de exercícios com filtros
- Treinos modelo por objetivo e nível
- Histórico de treinos realizados

### Evolução
- Registro de peso com fotos
- Gráfico de evolução temporal
- Histórico editável

## Banco de Dados

O projeto utiliza Supabase com as seguintes tabelas principais:
- `profiles`: Dados dos usuários
- `exercises`: Catálogo de exercícios
- `workouts`: Treinos dos usuários
- `workout_exercises`: Exercícios de cada treino
- `workout_history`: Histórico de treinos realizados
- `progress_entries`: Registros de evolução
- `model_workouts`: Modelos de treino

## Deploy

Para fazer deploy do projeto, você pode utilizar:
- **Vercel**: `npm run build` e conectar o repositório
- **Netlify**: Build command: `npm run build`, publish dir: `dist`
- **Outros**: Qualquer serviço que suporte aplicações Vite/React

## Contribuindo

Este é um projeto acadêmico (TCC). Contribuições são bem-vindas através de pull requests.

## Licença

Este projeto foi desenvolvido para fins educacionais.
