"use client";

import { useState, useMemo } from "react";
import { useScheduler } from "@/hooks/use-scheduler";
import { DAYS_NAMES, type SchedulerState } from "@/types/scheduler";
import { colorFromId, toMin, fromMin } from "@/lib/scheduler-utils";
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
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Download, 
  Upload, 
  RotateCcw, 
  Users, 
  Clock, 
  Calendar as CalendarIcon,
  X,
  Edit2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const { 
    state, 
    addPerson, 
    removePerson, 
    renamePerson, 
    addSlot, 
    removeSlot, 
    computeResults, 
    resetAll, 
    importData 
  } = useScheduler();

  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("0");
  const [fromTime, setFromTime] = useState<string>("18:00");
  const [toTime, setToTime] = useState<string>("21:00");
  const [computed, setComputed] = useState(false);

  // Results are memoized based on state
  const results = useMemo(() => computeResults(), [state]);

  if (!state) return null;

  // Auto select first person if none selected
  if (!selectedPersonId && state.people.length > 0) {
    setSelectedPersonId(state.people[0].id);
  }

  const handleAddSlot = () => {
    const from = toMin(fromTime);
    const to = toMin(toTime);
    if (to <= from) {
      toast({
        title: "Error",
        description: "La hora 'Hasta' debe ser mayor que 'Desde'.",
        variant: "destructive",
      });
      return;
    }
    addSlot(selectedPersonId, parseInt(selectedDay), from, to);
    setComputed(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    navigator.clipboard.writeText(dataStr);
    toast({
      title: "Exportado",
      description: "Datos JSON copiados al portapapeles.",
    });
  };

  const handleImport = () => {
    const raw = prompt("Pega el JSON de respaldo:");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SchedulerState;
      if (!parsed.people || !parsed.availability) throw new Error();
      importData(parsed);
      setComputed(false);
      toast({ title: "Importado", description: "Datos cargados correctamente." });
    } catch (e) {
      toast({ title: "Error", description: "El JSON proporcionado no es válido.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline tracking-tight">TiempoJuntos</h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Coordinar con amigos nunca fue tan fácil. Agrega disponibilidad, calcula el mejor horario y ¡listo! 
            Tus datos se guardan solo en tu navegador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-code py-1.5 px-3 border-accent/20 bg-accent/5">
            ⏱️ Bloques: 30m
          </Badge>
          <Badge variant="outline" className="font-code py-1.5 px-3 border-accent/20 bg-accent/5">
            🗓️ 7 Días
          </Badge>
          <Badge variant="outline" className="font-code py-1.5 px-3 border-accent/20 bg-accent/5">
            💾 Local Storage
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-border/40 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <CalendarIcon size={120} />
            </div>
            <CardHeader className="border-b border-border/40 bg-card/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Agregar Disponibilidad
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const name = prompt("Nombre del nuevo amigo:");
                      if (name) addPerson(name);
                    }}
                    className="h-8 gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Amigo
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      if (confirm("¿Seguro que quieres borrar todo?")) resetAll();
                    }}
                    className="h-8 text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Add Slot Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amigo</label>
                  <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                    <SelectTrigger className="bg-background/40">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.people.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Día</label>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger className="bg-background/40">
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_NAMES.map((d, i) => (
                        <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Desde</label>
                  <Input 
                    type="time" 
                    value={fromTime} 
                    onChange={e => setFromTime(e.target.value)}
                    className="bg-background/40 font-code" 
                  />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hasta</label>
                  <Input 
                    type="time" 
                    value={toTime} 
                    onChange={e => setToTime(e.target.value)}
                    className="bg-background/40 font-code" 
                  />
                </div>
                <div className="lg:col-span-1">
                  <Button onClick={handleAddSlot} className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    Añadir
                  </Button>
                </div>
              </div>

              {/* Weekly View for Selected Person */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {DAYS_NAMES.map((name, i) => {
                  const slots = state.availability[selectedPersonId]?.[i] || [];
                  return (
                    <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border border-border/40 bg-background/20 min-h-[100px]">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{name}</span>
                      <div className="flex flex-col gap-1.5">
                        {slots.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground/40 italic">Libre</span>
                        ) : (
                          slots.sort((a,b) => a.fromMin - b.fromMin).map((s, idx) => (
                            <div key={idx} className="group/slot flex items-center justify-between gap-1 bg-primary/10 text-primary-foreground p-1.5 rounded-lg border border-primary/20 text-[10px] font-code">
                              <span className="truncate">{fromMin(s.fromMin)}-{fromMin(s.toMin)}</span>
                              <button 
                                onClick={() => removeSlot(selectedPersonId, i, idx)}
                                className="opacity-0 group-hover/slot:opacity-100 hover:text-destructive transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* People Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.people.map(p => {
              const totalDays = Object.keys(state.availability[p.id] || {}).length;
              return (
                <Card key={p.id} className="border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: colorFromId(p.id, 0.2), color: colorFromId(p.id) }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          {p.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {totalDays} días con disponibilidad
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-40 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        const newName = prompt("Nuevo nombre para " + p.name + ":", p.name);
                        if (newName) renamePerson(p.id, newName);
                      }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removePerson(p.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Results Panel */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-border/40 shadow-2xl relative overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-card/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-accent" />
                  Resultados
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport} className="h-8 bg-background/40">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleImport} className="h-8 bg-background/40">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {!computed ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-headline text-lg">¿Listo para calcular?</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Analizaremos todos los bloques horarios para encontrar la mejor coincidencia.
                    </p>
                  </div>
                  <Button onClick={() => setComputed(true)} className="bg-accent hover:bg-accent/90">
                    Calcular mejor horario
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* Best Match */}
                  <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 relative">
                    <div className="absolute top-4 right-4 text-xs font-code text-accent font-bold px-2 py-1 rounded bg-accent/20">
                      Top Match
                    </div>
                    {results.best ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-accent uppercase tracking-widest">Mejor Opción</h3>
                          <div className="text-3xl font-headline flex items-baseline gap-2">
                            <span>{DAYS_NAMES[results.best.day]}</span>
                            <span className="text-muted-foreground text-xl">{fromMin(results.best.start)} - {fromMin(results.best.end)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent font-bold">
                            {results.best.count} / {state.people.length} Amigos
                          </Badge>
                          <span>{((results.best.count / state.people.length) * 100).toFixed(0)}% de asistencia</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {results.best.can.map(p => (
                            <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 border border-border/40 text-xs font-medium">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorFromId(p.id) }} />
                              {p.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4 italic">No se encontraron coincidencias.</p>
                    )}
                  </div>

                  {/* Alternatives */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Otras alternativas</h3>
                    <div className="space-y-3">
                      {results.alternatives.length > 0 ? (
                        results.alternatives.map((alt, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/20 hover:bg-card/40 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className="text-center w-12 border-r border-border/40 pr-4">
                                <span className="block text-xs font-bold uppercase">{DAYS_NAMES[alt.day]}</span>
                                <span className="block text-[10px] text-muted-foreground font-code">{fromMin(alt.start)}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-sm font-medium">{alt.count} personas disponibles</span>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">
                                  {alt.can.map(p => p.name).join(", ")}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                              {alt.count} / {state.people.length}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No hay más alternativas viables.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <footer className="text-center space-y-4">
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Los datos se guardan localmente. Si cambias de navegador o borras la caché, perderás el progreso. 
              ¡Usa la función de Exportar para respaldar!
            </p>
            <div className="flex justify-center gap-4">
              <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-accent hover:opacity-80">Privacidad Local</a>
              <span className="text-muted-foreground/20">•</span>
              <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-accent hover:opacity-80">v1.0 TiempoJuntos</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
