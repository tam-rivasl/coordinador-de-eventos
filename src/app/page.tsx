"use client";

import { useState, useMemo, useEffect } from "react";
import { useScheduler } from "@/hooks/use-scheduler";
import { DAYS_NAMES, type SchedulerState, type SlotResult } from "@/types/scheduler";
import { colorFromId, fromMin, toMin } from "@/lib/scheduler-utils";
import { recommendMeeting } from "@/ai/flows/recommend-meeting-flow";
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
  Sparkles, 
  RotateCcw, 
  Clock, 
  X,
  UserPlus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Home() {
  const { toast } = useToast();
  const { 
    state, 
    addPerson, 
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
  const [aiRecommendation, setAiRecommendation] = useState<{ text: string, idx: number } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [filterDay, setFilterDay] = useState<number | null>(null);

  const results = useMemo(() => computeResults(filterDay ?? undefined), [state, filterDay]);

  useEffect(() => {
    if (state?.people.length && !selectedPersonId) {
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
    setAiRecommendation(null);
  };

  const getAiHelp = async () => {
    if (!results.alternatives.length) return;
    setIsAiLoading(true);
    try {
      const res = await recommendMeeting({ 
        slots: results.alternatives.slice(0, 10), 
        peopleCount: state?.people.length || 0 
      });
      setAiRecommendation({ text: res.recommendation, idx: res.bestSlotIdx });
    } catch (e) {
      toast({ title: "Error de IA", description: "No pude procesar la recomendación ahora.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!state) return null;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        
        {/* Header Hero */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Agenda Inteligente
            </div>
            <h1 className="text-5xl font-headline font-bold tracking-tight">TiempoJuntos</h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Coordinar amigos no debería ser un trabajo. Registra tus <span className="text-destructive font-semibold">bloqueos</span> y deja que la IA encuentre el hueco perfecto.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => {
              const name = prompt("Nombre del amigo:");
              if (name) addPerson(name);
            }} className="rounded-full gap-2">
              <UserPlus className="w-4 h-4" /> Añadir Amigo
            </Button>
            <Button variant="ghost" size="sm" onClick={resetAll} className="rounded-full text-muted-foreground hover:text-destructive">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="input" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              1. Registrar Bloqueos
            </TabsTrigger>
            <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              2. Ver Disponibilidad
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
                    <CardDescription>Indica cuándo NO estás disponible.</CardDescription>
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
                    <Button onClick={handleAddSlot} className="w-full h-12 text-md font-semibold" variant="destructive">
                      Bloquear Horario
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" /> Amigos en la Junta
                  </h3>
                  <div className="space-y-2">
                    {state.people.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border group">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: colorFromId(p.id) }} />
                          <span className="font-medium">{p.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removePerson(p.id)} className="opacity-0 group-hover:opacity-100 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                      <CardDescription>Vista semanal del amigo seleccionado.</CardDescription>
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
                            <div className="min-h-[200px] bg-muted/20 rounded-lg p-1 space-y-1">
                              {slots.map((s, idx) => (
                                <div key={idx} className="relative group/block bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-2 text-[10px] font-bold">
                                  {fromMin(s.fromMin)} - {fromMin(s.toMin)}
                                  <button onClick={() => removeSlot(selectedPersonId, i, idx)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover/block:opacity-100">
                                    <X className="w-2 h-2" />
                                  </button>
                                </div>
                              ))}
                              {slots.length === 0 && (
                                <div className="h-full flex items-center justify-center opacity-20 italic text-[10px]">Sin bloqueos</div>
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
              
              {/* Filter and Quick Stats */}
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

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-5 h-5" />
                      <h4 className="font-bold">Análisis Experto</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Utilizamos un algoritmo de barrido de tiempo para encontrar huecos donde la asistencia es máxima.
                    </p>
                    <Button onClick={getAiHelp} disabled={isAiLoading || !results.alternatives.length} className="w-full bg-primary hover:bg-primary/90">
                      {isAiLoading ? "Analizando..." : "Recomendación IA"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Main Results View */}
              <div className="lg:col-span-9 space-y-6">
                {aiRecommendation && (
                  <Card className="border-accent bg-accent/5 overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-1 bg-accent flex items-center justify-center text-[10px] font-black text-white uppercase tracking-[0.2em]">Sugerencia de la IA</div>
                    <CardContent className="p-6 flex gap-6 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white shrink-0">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium leading-snug">{aiRecommendation.text}</p>
                        <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/20">
                          Opción #{aiRecommendation.idx + 1} del listado
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.alternatives.length > 0 ? (
                    results.alternatives.map((alt, i) => (
                      <Card key={i} className={cn(
                        "group hover:border-primary/50 transition-all duration-300 cursor-default overflow-hidden",
                        alt.count === state.people.length ? "border-primary/40 bg-primary/5" : "border-border"
                      )}>
                        <CardContent className="p-0">
                          <div className="flex items-stretch h-full">
                            <div className={cn(
                              "w-12 flex flex-col items-center justify-center font-black text-[10px] uppercase [writing-mode:vertical-lr] rotate-180",
                              alt.count === state.people.length ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                              {DAYS_NAMES[alt.day]}
                            </div>
                            <div className="flex-1 p-5 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="text-2xl font-headline font-bold flex items-center gap-2">
                                    {fromMin(alt.start)} - {fromMin(alt.end)}
                                    {alt.count === state.people.length && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Duración: {((alt.end - alt.start) / 60).toFixed(1)} horas
                                  </p>
                                </div>
                                <Badge variant={alt.count === state.people.length ? "default" : "secondary"}>
                                  {alt.count} / {state.people.length} libres
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {alt.can.map(p => (
                                    <div key={p.id} className="w-2 h-2 rounded-full" title={p.name} style={{ backgroundColor: colorFromId(p.id) }} />
                                  ))}
                                </div>
                                {alt.cannot.length > 0 && (
                                  <div className="flex items-center gap-2 text-[10px] text-destructive font-medium uppercase tracking-wider">
                                    <AlertCircle className="w-3 h-3" />
                                    No pueden: {alt.cannot.map(p => p.name).join(", ")}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="w-10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <ChevronRight className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-border rounded-3xl">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">Sin huecos comunes</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">Prueba a eliminar algunos bloqueos o revisa si alguien tiene todo el día ocupado.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
