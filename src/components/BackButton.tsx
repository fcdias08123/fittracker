import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  label?: string;
}

const BackButton = ({ label = "Voltar" }: BackButtonProps) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      onClick={() => navigate(-1)}
      className="mb-4 -ml-2 hover:bg-primary text-foreground"
    >
      <ArrowLeft className="h-5 w-5 mr-2" />
      {label}
    </Button>
  );
};

export default BackButton;