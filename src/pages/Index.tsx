import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Dumbbell className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-primary">
              FitTracker
            </h1>
            <p className="text-lg text-muted-foreground">
              Seu treino personalizado, onde e quando você quiser.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <Link to="/login" className="block">
              <Button 
                size="lg" 
                className="w-full text-base font-semibold"
              >
                Entrar
              </Button>
            </Link>
            
            <Link to="/cadastrar" className="block">
              <Button 
                variant="secondary"
                size="lg" 
                className="w-full text-base font-semibold border-2 border-primary"
              >
                Cadastrar
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4">
        <p className="text-center text-sm text-muted-foreground">
          Desenvolvido para ajudar você a sair do sedentarismo.
        </p>
      </footer>
    </div>
  );
};

export default Index;
