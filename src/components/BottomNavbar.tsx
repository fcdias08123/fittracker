import { Home, Dumbbell, Library, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/home", icon: Home, label: "Home", matchPaths: ["/home"] },
    { to: "/treino", icon: Dumbbell, label: "Treino", matchPaths: ["/treino", "/detalhe-treino", "/modelo-treino"] },
    { to: "/biblioteca", icon: Library, label: "Biblioteca", matchPaths: ["/biblioteca"] },
    { to: "/perfil", icon: User, label: "Perfil", matchPaths: ["/perfil"] },
  ];

  const isActive = (matchPaths: string[]) => {
    return matchPaths.some(path => location.pathname.startsWith(path));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-colors",
              isActive(item.matchPaths) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavbar;
