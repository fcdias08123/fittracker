import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dumbbell, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Por favor, insira um e-mail válido" })
    .nonempty({ message: "E-mail é obrigatório" }),
  password: z
    .string()
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" })
    .nonempty({ message: "Senha é obrigatória" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Email ou senha incorretos.");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      // Obter o usuário logado
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user || userError) {
        setErrorMessage("Não foi possível obter o usuário autenticado.");
        return;
      }

      // Buscar se existe perfil para este usuário
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
      }

      const hasProfile = profiles && profiles.length > 0;

      setShowSuccessAlert(true);
      toast({
        title: "Login realizado com sucesso!",
        description: hasProfile 
          ? "Redirecionando para a página inicial..." 
          : "Complete seu cadastro para continuar...",
      });

      setTimeout(() => {
        // Se não tem perfil, vai para onboarding. Se tem, vai para home.
        navigate(hasProfile ? "/home" : "/onboarding");
      }, 1000);
    } catch (error) {
      setErrorMessage("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Dumbbell className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">FitTracker</h1>
          </div>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Faça login para continuar.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm space-y-6">
          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Erro ao fazer login</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {showSuccessAlert && (
            <Alert className="border-primary/30 bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <AlertTitle className="text-lg font-semibold text-primary">
                Login realizado com sucesso!
              </AlertTitle>
              <AlertDescription className="text-foreground/80">
                Redirecionando...
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Sua senha"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Não possui cadastro?{" "}
              <Link
                to="/cadastrar"
                className="text-primary font-medium hover:underline"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
