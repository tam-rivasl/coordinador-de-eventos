
"use client";

import { useState, useMemo, useEffect } from "react";
import { useScheduler } from "@/hooks/use-scheduler";
import { DAYS_NAMES, Person } from "@/types/scheduler";
import { colorFromId, fromMin, toMin, uid } from "@/lib/scheduler-utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  RotateCcw,
  Clock,
  X,
  UserPlus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Edit2,
  Share2,
  Info,
  Ban,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const { toast } = useToast();
  const [roomId, setRoomId] = useState<string | null>(null);

  // Inicialización segura del Room ID en el cliente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let rId = params.get("room");
    
    if (!rId) {
      rId = uid();
      const newUrl = `${window.location.pathname}?room=${rId}`;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
    setRoomId(rId);
  }, []);

  const {
    state,
    loading,
    addPerson,
    updatePerson,
    removePerson,
    addSlot,
    removeSlot,
    computeResults,
    resetAll,
  } = useScheduler(roomId);

  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("0");
  const [fromTime, setFromTime] = useState<string>("09:00");
  const [toTime, setToTime] = useState<string>("11:00");
  const [activeTab, setActiveTab] = useState<string>("input");
  const [daySearch, setDaySearch] = useState("");
  const [filterDay, setFilterDay] = useState<number | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [tempName, setTempName] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Asegurar que haya una persona seleccionada por defecto
  useEffect(() => {
    if (state?.people?.length && !selectedPersonId) {
      setSelectedPersonId(state.people[0].id);
    }
  }, [state, selectedPersonId]);

  // Manejo de búsqueda de día
  useEffect(() => {
    const q = daySearch.trim().toLowerCase();
    if (!q) {
      setFilterDay(null);
      return;
    }
    const matchedIndex = DAYS_NAMES.findIndex((d) => d.toLowerCase().includes(q));
    setFilterDay(matchedIndex >= 0 ? matchedIndex : -1);
  }, [daySearch]);

  const results = useMemo(() => {
    if (filterDay === -1) return { alternatives: [] };
    return computeResults(filterDay ?? undefined);
  }, [filterDay, computeResults]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Enlace copiado",
      description: "Comparte este link para que tus amigos se unan a la sala.",
    });
  };

  const handleAddSlot = async () => {
    if (!selectedPersonId) return;
    const from = toMin(fromTime);
    const to = toMin(toTime);

    if (to <= from) {
      toast({
        title: "Error",
        description: "El horario de fin debe ser posterior al de inicio.",
        variant: "destructive",
      });
      return;
    }

    await addSlot(selectedPersonId, parseInt(selectedDay, 10), from, to);
    toast({
      title: "Horario bloqueado",
      description: "Se ha registrado tu ocupación correctamente.",
    });
  };

  const handleBlockFullDay = async () => {
    if (!selectedPersonId) return;
    await addSlot(selectedPersonId, parseInt(selectedDay, 10), 0, 1439);
    toast({
      title: "Día Bloqueado",
      description: "Has marcado todo el día como ocupado.",
    });
  };

  const handleAddPersonSubmit = async () => {
    if (!tempName.trim()) return;
    await addPerson(tempName.trim());
    setTempName("");
    setIsAddModalOpen(false);
    toast({ title: "Amigo añadido" });
  };

  const handleEditPersonSubmit = async () => {
    if (!editingPerson || !tempName.trim()) return;
    await updatePerson(editingPerson.id, tempName.trim());
    setTempName("");
    setEditingPerson(null);
    setIsEditModalOpen(false);
    toast({ title: "Nombre actualizado" });
  };

  const handleResetConfirm = async () => {
    await resetAll();
    setIsResetModalOpen(false);
    toast({ title: "Sala reiniciada", description: "Se han borrado todos los datos de esta sala." });
  };

  if (loading || !state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="animate-pulse text-muted-foreground font-medium">Sincronizando sala...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase">
              <Users className="w-3 h-3" /> Tiempo Real
            </div>
            <h1 className="text-5xl font-headline font-bold">TiempoJuntos</h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Registra cuándo <span className="text-destructive font-bold">NO PUEDES</span> y encontraremos el hueco perfecto para todos.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCopyLink} className="rounded-full gap-2 bg-accent text-accent-foreground hover:bg-accent/80">
              <Share2 className="w-4 h-4" /> Compartir Sala
            </Button>
            <Button variant="outline" onClick={() => { setTempName(""); setIsAddModalOpen(true); }} className="rounded-full gap-2">
              <UserPlus className="w-4 h-4" /> Añadir Amigo
            </Button>
            <Button variant="ghost" onClick={() => setIsResetModalOpen(true)} className="rounded-full text-muted-foreground hover:text-destructive">
              <RotateCcw className="w-4 h-4" /> Reiniciar
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="input" className="rounded-lg">1. Mis Bloqueos</TabsTrigger>
            <TabsTrigger value="results" className="rounded-lg">2. Huecos Comunes</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" /> Nuevo Bloqueo
                    </CardTitle>
                    <CardDescription>Indica cuándo estarás ocupado.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">¿Quién?</label>
                      <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {state.people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Día</label>
                      <Select value={selectedDay} onValueChange={setSelectedDay}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAYS_NAMES.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Desde</label>
                        <Input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Hasta</label>
                        <Input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <Button onClick={handleAddSlot} className="w-full h-12" variant="destructive">Bloquear Horario</Button>
                      <Button onClick={handleBlockFullDay} variant="outline" className="w-full h-8 text-xs gap-2">
                        <Ban className="w-3 h-3" /> Bloquear Día Completo
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground">Amigos Registrados</h3>
                  <div className="space-y-2">
                    {state.people.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card border group">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: colorFromId(p.id) }} />
                          <span className="font-medium">{p.name} {idx === 0 && "(Tú)"}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPerson(p); setTempName(p.name); setIsEditModalOpen(true); }}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {idx !== 0 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => removePerson(p.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Resumen Semanal</CardTitle>
                      <CardDescription>Tus bloqueos registrados en la nube.</CardDescription>
                    </div>
                    <Badge variant="outline">{state.people.find(p => p.id === selectedPersonId)?.name}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                      {DAYS_NAMES.map((name, i) => {
                        const slots = state.availability[selectedPersonId]?.[i] || [];
                        return (
                          <div key={i} className="space-y-2">
                            <div className="text-center pb-2 border-b"><span className="text-[10px] font-bold text-muted-foreground uppercase">{name}</span></div>
                            <div className="min-h-[300px] bg-muted/20 rounded-lg p-1 space-y-1">
                              {slots.map((s, idx) => (
                                <div key={idx} className="relative group/slot bg-destructive/10 text-destructive border border-destructive/20 rounded p-1 text-[9px] font-bold">
                                  {fromMin(s.fromMin)}-{fromMin(s.toMin)}
                                  <button onClick={() => removeSlot(selectedPersonId, i, idx)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover/slot:opacity-100"><X className="w-2 h-2" /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase">Filtrar Día</h3>
                  <div className="relative">
                    <Input placeholder="Ej: Lunes..." value={daySearch} onChange={(e) => setDaySearch(e.target.value)} className="pl-9" />
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Disponibilidad Total</h4>
                  <p className="text-xs text-muted-foreground">Solo mostramos horarios donde <strong>absolutamente todos</strong> los amigos registrados están libres.</p>
                </div>
              </div>

              <div className="lg:col-span-9 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.alternatives.length > 0 ? (
                    results.alternatives.map((alt, i) => (
                      <Card key={i} className="border-primary/20 bg-primary/5 hover:border-primary/50 transition-colors">
                        <CardContent className="p-0 flex h-full">
                          <div className="w-10 bg-primary flex items-center justify-center [writing-mode:vertical-lr] rotate-180 text-[10px] font-bold text-primary-foreground uppercase">{DAYS_NAMES[alt.day]}</div>
                          <div className="flex-1 p-5 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="text-2xl font-bold">{fromMin(alt.start)} - {fromMin(alt.end)}</div>
                              <Badge>Todos libres</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 border-t pt-2">
                              {alt.can.map(p => <Badge key={p.id} variant="outline" className="text-[9px] bg-background">{p.name}</Badge>)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed rounded-3xl bg-muted/5">
                      <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-xl font-bold">Sin coincidencia total</h3>
                        <p className="text-muted-foreground text-sm">No hay un momento en el que todos estén libres. Alguien tendrá que ceder un bloqueo.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Añadir Amigo</DialogTitle><DialogDescription>Se sincronizará con todos en la sala.</DialogDescription></DialogHeader>
          <Input placeholder="Nombre..." value={tempName} onChange={(e) => setTempName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && handleAddPersonSubmit()} />
          <DialogFooter><Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button><Button onClick={handleAddPersonSubmit}>Añadir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Nombre</DialogTitle></DialogHeader>
          <Input value={tempName} onChange={(e) => setTempName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && handleEditPersonSubmit()} />
          <DialogFooter><Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button><Button onClick={handleEditPersonSubmit}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-destructive">¿Reiniciar Sala?</DialogTitle><DialogDescription>Esto borrará TODOS los amigos y bloqueos para TODOS los que usen este link.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="ghost" onClick={() => setIsResetModalOpen(false)}>Cancelar</Button><Button variant="destructive" onClick={handleResetConfirm}>Reiniciar Todo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
