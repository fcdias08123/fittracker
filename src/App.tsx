import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Treino from "./pages/Treino";
import DetalheTreino from "./pages/DetalheTreino";
import MontarTreino from "./pages/MontarTreino";
import TodosTreinos from "./pages/TodosTreinos";
import HistoricoTreinos from "./pages/HistoricoTreinos";
import Biblioteca from "./pages/Biblioteca";
import Perfil from "./pages/Perfil";
import ModelWorkoutDetail from "./pages/ModelWorkoutDetail";
import Evolucao from "./pages/Evolucao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastrar" element={<Signup />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/treino"
              element={
                <ProtectedRoute>
                  <Treino />
                </ProtectedRoute>
              }
            />
            <Route
              path="/detalhe-treino/:id"
              element={
                <ProtectedRoute>
                  <DetalheTreino />
                </ProtectedRoute>
              }
            />
            <Route
              path="/montar-treino"
              element={
                <ProtectedRoute>
                  <MontarTreino />
                </ProtectedRoute>
              }
            />
            <Route
              path="/todos-treinos"
              element={
                <ProtectedRoute>
                  <TodosTreinos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/historico-treinos"
              element={
                <ProtectedRoute>
                  <HistoricoTreinos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modelo-treino/:id"
              element={
                <ProtectedRoute>
                  <ModelWorkoutDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/biblioteca"
              element={
                <ProtectedRoute>
                  <Biblioteca />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evolucao"
              element={
                <ProtectedRoute>
                  <Evolucao />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
