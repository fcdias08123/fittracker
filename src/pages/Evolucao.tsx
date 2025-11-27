import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Save, X, Camera, Trash2, Image as ImageIcon, Pencil } from "lucide-react";
import BottomNavbar from "@/components/BottomNavbar";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getDataHojeLocalISODate, formatarDataPtBr } from "@/lib/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type ProgressEntry = {
  id: string;
  data_registro: string;
  peso: number;
  observacoes: string | null;
  foto_url: string | null;
  created_at: string;
};

const Evolucao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<ProgressEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<ProgressEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<ProgressEntry | null>(null);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    data_registro: "",
    peso: "",
    observacoes: "",
  });

  const [formData, setFormData] = useState({
    data_registro: getDataHojeLocalISODate(),
    peso: "",
    observacoes: "",
  });

  useEffect(() => {
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("progress_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("data_registro", { ascending: true });

      if (error) throw error;

      setEntries(data || []);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
      toast({
        title: "Erro ao carregar registros de evolução",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Escolha uma imagem (JPG, PNG ou WEBP).",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "A foto é muito grande",
        description: "Escolha uma imagem de até 5 MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPhoto(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para salvar um registro.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.peso || parseFloat(formData.peso) <= 0) {
      toast({
        title: "Peso inválido",
        description: "Por favor, informe um peso válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      let fotoUrl: string | null = null;

      // Se houver foto, fazer upload
      if (selectedPhoto) {
        const fileExt = selectedPhoto.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('progress_photos')
          .upload(fileName, selectedPhoto, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          toast({
            title: "Erro ao fazer upload da foto",
            description: "Tente novamente.",
            variant: "destructive",
          });
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('progress_photos')
          .getPublicUrl(fileName);

        fotoUrl = publicUrlData?.publicUrl || null;
      }

      const { error } = await supabase.from("progress_entries").insert({
        user_id: user.id,
        data_registro: formData.data_registro,
        peso: parseFloat(formData.peso),
        observacoes: formData.observacoes.trim() || null,
        foto_url: fotoUrl,
      });

      if (error) throw error;

      toast({
        title: "Registro salvo com sucesso!",
        description: "Seu progresso foi atualizado.",
      });

      // Limpar formulário
      setFormData({
        data_registro: getDataHojeLocalISODate(),
        peso: "",
        observacoes: "",
      });
      handleRemovePhoto();

      // Recarregar dados
      await loadEntries();
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      toast({
        title: "Erro ao salvar o registro de evolução",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setFormData({
      data_registro: getDataHojeLocalISODate(),
      peso: "",
      observacoes: "",
    });
    handleRemovePhoto();
  };

  const handleEditClick = (entry: ProgressEntry) => {
    setEditingEntry(entry);
    setEditFormData({
      data_registro: entry.data_registro,
      peso: entry.peso.toString(),
      observacoes: entry.observacoes || "",
    });
    setEditPhotoPreview(entry.foto_url);
    setEditPhoto(null);
  };

  const handleEditPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Escolha uma imagem (JPG, PNG ou WEBP).",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "A foto é muito grande",
        description: "Escolha uma imagem de até 5 MB.",
        variant: "destructive",
      });
      return;
    }

    setEditPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEditPhoto = () => {
    setEditPhoto(null);
    setEditPhotoPreview(null);
  };

  const handleEditSave = async () => {
    if (!user || !editingEntry) return;

    if (!editFormData.peso || parseFloat(editFormData.peso) <= 0) {
      toast({
        title: "Peso inválido",
        description: "Por favor, informe um peso válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      let fotoUrl: string | null = editingEntry.foto_url;

      // Se o usuário selecionou uma nova foto
      if (editPhoto) {
        const fileExt = editPhoto.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('progress_photos')
          .upload(fileName, editPhoto, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          toast({
            title: "Erro ao fazer upload da foto",
            description: "Tente novamente.",
            variant: "destructive",
          });
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('progress_photos')
          .getPublicUrl(fileName);

        fotoUrl = publicUrlData?.publicUrl || null;
      } else if (editPhotoPreview === null) {
        // Usuário removeu a foto
        fotoUrl = null;
      }

      const { error } = await supabase
        .from("progress_entries")
        .update({
          data_registro: editFormData.data_registro,
          peso: parseFloat(editFormData.peso),
          observacoes: editFormData.observacoes.trim() || null,
          foto_url: fotoUrl,
        })
        .eq("id", editingEntry.id);

      if (error) throw error;

      toast({
        title: "Registro atualizado com sucesso!",
      });

      setEditingEntry(null);
      setEditPhoto(null);
      setEditPhotoPreview(null);
      await loadEntries();
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
      toast({
        title: "Erro ao atualizar o registro de evolução",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteEntry) return;

    try {
      const { error } = await supabase
        .from("progress_entries")
        .delete()
        .eq("id", deleteEntry.id);

      if (error) throw error;

      toast({
        title: "Registro excluído com sucesso!",
      });

      setDeleteEntry(null);
      await loadEntries();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      toast({
        title: "Erro ao excluir o registro",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Preparar dados para o gráfico
  const chartData = entries.map((entry) => ({
    data: new Date(entry.data_registro).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
    peso: entry.peso,
  }));

  // Ordenar entries por data decrescente para a lista
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime()
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <BackButton />
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Evolução
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seus registros de peso ao longo do tempo.
          </p>
          <p className="text-sm text-muted-foreground">
            Quanto mais registros você fizer, mais completo ficará o seu gráfico.
          </p>
        </div>

        {/* Gráfico de evolução do peso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gráfico de evolução</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : entries.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="data" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 space-y-2">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground">
                  Você ainda não adicionou nenhum registro de evolução.
                </p>
                <p className="text-sm text-muted-foreground">
                  Comece adicionando seu peso atual no formulário abaixo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário para novo registro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar novo registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data_registro">Data do registro</Label>
              <Input
                id="data_registro"
                type="date"
                value={formData.data_registro}
                onChange={(e) =>
                  setFormData({ ...formData, data_registro: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                step="0.1"
                placeholder="Ex: 80.5"
                value={formData.peso}
                onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Ex: Semana de treino intenso, fiz mini cut, voltei de lesão, etc."
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foto">Foto de progresso (opcional)</Label>
              <div className="space-y-3">
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Input
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('foto')?.click()}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Escolher foto
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                disabled={isSaving}
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de registros */}
        {!isLoading && entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de registros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-muted/30 rounded-lg space-y-2 border border-border"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {formatarDataPtBr(entry.data_registro)}
                  </p>
                  <p className="text-foreground">
                    <span className="font-medium">Peso:</span>{" "}
                    {entry.peso.toFixed(1)} kg
                  </p>
                  {entry.observacoes && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Observações:</span>{" "}
                      {entry.observacoes}
                    </p>
                  )}
                  {entry.foto_url && (
                    <div className="mt-3">
                      <button
                        onClick={() => setLightboxPhoto(entry)}
                        className="relative group"
                      >
                        <img
                          src={entry.foto_url}
                          alt="Foto de progresso"
                          className="w-20 h-20 object-cover rounded-lg border-2 border-border hover:border-primary transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white" />
                        </div>
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2 justify-end mt-3 pt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(entry)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteEntry(entry)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Modal / Lightbox para foto ampliada */}
        <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Foto de progresso</DialogTitle>
            </DialogHeader>
            {lightboxPhoto && (
              <div className="space-y-4">
                <img
                  src={lightboxPhoto.foto_url!}
                  alt="Foto de progresso ampliada"
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-semibold">Data:</span>{" "}
                    {formatarDataPtBr(lightboxPhoto.data_registro)}
                  </p>
                  <p className="text-foreground">
                    <span className="font-semibold">Peso:</span>{" "}
                    {lightboxPhoto.peso.toFixed(1)} kg
                  </p>
                  {lightboxPhoto.observacoes && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">Observações:</span>{" "}
                      {lightboxPhoto.observacoes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de edição */}
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar registro</DialogTitle>
              <DialogDescription>
                Altere os dados do registro de evolução.
              </DialogDescription>
            </DialogHeader>
            {editingEntry && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_data_registro">Data do registro</Label>
                  <Input
                    id="edit_data_registro"
                    type="date"
                    value={editFormData.data_registro}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, data_registro: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_peso">Peso (kg)</Label>
                  <Input
                    id="edit_peso"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 80.5"
                    value={editFormData.peso}
                    onChange={(e) => setEditFormData({ ...editFormData, peso: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="edit_observacoes"
                    placeholder="Ex: Semana de treino intenso, fiz mini cut, voltei de lesão, etc."
                    value={editFormData.observacoes}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, observacoes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_foto">Foto de progresso (opcional)</Label>
                  <div className="space-y-3">
                    {editPhotoPreview ? (
                      <div className="relative">
                        <img 
                          src={editPhotoPreview} 
                          alt="Preview" 
                          className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={handleRemoveEditPhoto}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Input
                          id="edit_foto"
                          type="file"
                          accept="image/*"
                          onChange={handleEditPhotoSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('edit_foto')?.click()}
                          className="w-full"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Escolher foto
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingEntry(null)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEditSave}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AlertDialog de confirmação de exclusão */}
        <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir registro</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este registro de evolução?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default Evolucao;
