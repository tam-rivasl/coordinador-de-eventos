"use client";

import { useState, useMemo, useEffect } from "react";
import { useScheduler } from "@/hooks/use-scheduler";
import { DAYS_NAMES, Person } from "@/types/scheduler";
import { colorFromId, fromMin, toMin } from "@/lib/scheduler-utils";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Clock, 
  X,
  UserPlus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info,
  Ban,
  Users,
  Edit2
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
  const { 
    state, 
    addPerson, 
    updatePerson,
    removePerson, 
    addSlot, 
    removeSlot, 
    computeResults, 
    resetAll 
  } = useScheduler();

  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("0");
  const [fromTime, setFromTime] = useState<string>("09:00");
  const [toTime, setToTime] = useState<string>("11:00");
  const [activeTab, setActiveTab] = useState<string>("input");
  const [filterDay, setFilterDay] = useState<number | null>(null);

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [tempName, setTempName] = useState("");

  const results = useMemo(() => {
    return computeResults(filterDay ?? undefined);
  }, [state, filterDay, computeResults]);

  useEffect(() => {
    if (state?.people.length && (!selectedPersonId || !state.people.some(p => p.id === selectedPersonId))) {
      setSelectedPersonId(state.people[0].id);
    }
  }, [state, selectedPersonId]);

  const handleAddSlot = () => {
    const from = toMin(fromTime);
    const to = toMin(toTime);
    if (to <= from) {
      toast({ title: "Error", description: "El fin debe ser después del inicio.", variant: "destructive" });
      return;
    }
    addSlot(selectedPersonId, parseInt(selectedDay), from, to);
    toast({ title: "Horario bloqueado", description: "El bloqueo se ha registrado correctamente." });
  };

  const handleBlockFullDay = () => {
    addSlot(selectedPersonId, parseInt(selectedDay), 0, 1439);
    toast({ title: "Día Bloqueado", description: "Se ha marcado el día completo como ocupado." });
  };

  const handleAddPersonSubmit = () => {
    if (tempName.trim()) {
      addPerson(tempName.trim());
      setTempName("");
      setIsAddModalOpen(false);
      toast({ title: "Amigo añadido", description: "Se ha agregado a la lista correctamente." });
    }
  };

  const handleEditPersonSubmit = () => {
    if (editingPerson && tempName.trim()) {
      updatePerson(editingPerson.id, tempName.trim());
      setTempName("");
      setEditingPerson(null);
      setIsEditModalOpen(false);
      toast({ title: "Nombre actualizado", description: "Se ha guardado el cambio correctamente." });
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Estás seguro de que deseas limpiar todos los datos? Esto no se puede deshacer.")) {
      resetAll();
      toast({ title: "Datos limpiados", description: "La aplicación ha vuelto a su estado inicial." });
    }
  };

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Cargando...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        
        {/* Header Hero */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Users className="w-3 h-3" /> Coordinación de Grupos
            </div>
            <h1 className="text-5xl font-headline font-bold tracking-tight">TiempoJuntos</h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Encuentra el momento exacto donde <span className="text-primary font-semibold">todos están libres</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)} className="rounded-full gap-2">
              <UserPlus className="w-4 h-4" /> Añadir Amigo
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} className="rounded-full text-muted-foreground hover:text-destructive">
              <RotateCcw className="w-4 h-4" /> Limpiar Datos
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="input" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              1. Registrar Bloqueos
            </TabsTrigger>
            <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              2. Disponibilidad Común
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Side */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-border shadow-xl overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" /> Nuevo Bloqueo
                    </CardTitle>
                    <CardDescription>Indica cuándo NO están disponibles.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">¿Quién?</label>
                      <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {state.people.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
                        <Input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Hasta</label>
                        <Input type="time" value={toTime} onChange={e => setToTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      <Button onClick={handleAddSlot} className="w-full h-12 text-md font-semibold" variant="destructive">
                        Bloquear Horario
                      </Button>
                      <Button onClick={handleBlockFullDay} variant="outline" className="w-full gap-2 text-xs h-8">
                        <Ban className="w-3 h-3" /> Bloquear Día Completo
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" /> Amigos Registrados
                  </h3>
                  <div className="space-y-2">
                    {state.people.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border group">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: colorFromId(p.id) }} />
                          <span className="font-medium">{p.name} {idx === 0 && "(Yo)"}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setEditingPerson(p);
                              setTempName(p.name);
                              setIsEditModalOpen(true);
                            }} 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {idx !== 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                if (window.confirm(`¿Eliminar a ${p.name}?`)) {
                                  removePerson(p.id);
                                }
                              }} 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visualization Side */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="border-border shadow-xl h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">Resumen de Bloqueos</CardTitle>
                      <CardDescription>Vista semanal de la persona seleccionada.</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-code">
                      {state.people.find(p => p.id === selectedPersonId)?.name}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                      {DAYS_NAMES.map((name, i) => {
                        const slots = state.availability[selectedPersonId]?.[i] || [];
                        return (
                          <div key={i} className="space-y-2">
                            <div className="text-center pb-2 border-b border-border">
                              <span className="text-[10px] font-black uppercase text-muted-foreground">{name}</span>
                            </div>
                            <div className="min-h-[300px] bg-muted/20 rounded-lg p-1 space-y-1">
                              {slots.map((s, idx) => (
                                <div key={idx} className="relative group/block bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-2 text-[10px] font-bold">
                                  {fromMin(s.fromMin)} - {fromMin(s.toMin)}
                                  <button onClick={() => removeSlot(selectedPersonId, i, idx)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover/block:opacity-100">
                                    <X className="w-2 h-2" />
                                  </button>
                                </div>
                              ))}
                              {slots.length === 0 && (
                                <div className="h-full flex items-center justify-center opacity-20 italic text-[10px] py-10">Libre</div>
                              )}
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
                  <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Filtrar Día</h3>
                  <div className="flex flex-col gap-2">
                    <Button variant={filterDay === null ? "default" : "outline"} onClick={() => setFilterDay(null)} className="justify-start">Todos los días</Button>
                    {DAYS_NAMES.map((d, i) => (
                      <Button 
                        key={i} 
                        variant={filterDay === i ? "default" : "outline"} 
                        onClick={() => setFilterDay(i)}
                        className="justify-start gap-2"
                      >
                        <Calendar className="w-4 h-4" /> {d}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Intersección Perfecta
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Estos son los momentos donde <strong>todos</strong> están libres simultáneamente.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-9 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.alternatives.length > 0 ? (
                    results.alternatives.map((alt, i) => (
                      <Card key={i} className="group hover:border-primary/50 transition-all duration-300 border-primary/40 bg-primary/5 shadow-md">
                        <CardContent className="p-0">
                          <div className="flex items-stretch h-full">
                            <div className="w-12 flex flex-col items-center justify-center font-black text-[10px] uppercase [writing-mode:vertical-lr] rotate-180 bg-primary text-primary-foreground">
                              {DAYS_NAMES[alt.day]}
                            </div>
                            <div className="flex-1 p-5 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="text-2xl font-headline font-bold flex items-center gap-2">
                                    {fromMin(alt.start)} - {fromMin(alt.end)}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Ventana de {((alt.end - alt.start) / 60).toFixed(1)} horas
                                  </p>
                                </div>
                                <Badge className="bg-primary text-primary-foreground">
                                  {alt.count} / {state.people.length} disponibles
                                </Badge>
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-primary/10">
                                {alt.can.map(p => (
                                  <Badge key={p.id} variant="outline" className="text-[10px] font-medium border-primary/20 bg-background/50">
                                    {p.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="w-10 flex items-center justify-center">
                              <ChevronRight className="w-5 h-5 opacity-20" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-border rounded-3xl bg-muted/10">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">Sin coincidencias totales</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                          Parece que no hay un horario donde todos estén libres. Prueba a eliminar algún bloqueo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Añadir Amigo */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir Amigo</DialogTitle>
            <DialogDescription>
              Introduce el nombre de la persona que quieres incluir en la coordinación.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <label htmlFor="name" className="sr-only">Nombre</label>
              <Input
                id="name"
                placeholder="Nombre del amigo..."
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPersonSubmit()}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddPersonSubmit}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Amigo */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Nombre</DialogTitle>
            <DialogDescription>
              Cambia el nombre de este participante.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Input
                placeholder="Nombre del amigo..."
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditPersonSubmit()}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleEditPersonSubmit}>
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
