'use server';
/**
 * @fileOverview AI agent to recommend the best meeting time.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SlotResult, DAYS_NAMES } from '@/types/scheduler';
import { fromMin } from '@/lib/scheduler-utils';

const RecommendInputSchema = z.object({
  slots: z.array(z.any()),
  peopleCount: z.number(),
});

const RecommendOutputSchema = z.object({
  recommendation: z.string().describe('Una explicación amigable de por qué este horario es el mejor.'),
  bestSlotIdx: z.number().describe('El índice del slot recomendado.'),
});

export async function recommendMeeting(input: { slots: SlotResult[], peopleCount: number }) {
  return recommendMeetingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendMeetingPrompt',
  input: { schema: RecommendInputSchema },
  output: { schema: RecommendOutputSchema },
  prompt: `Eres un asistente experto en coordinación de equipos.
Analiza estas opciones de horarios para una junta. 
REGLA DE ORO: Si una opción tiene gente en la lista "Quienes NO pueden", es una opción de compromiso. Prioriza SIEMPRE las opciones donde TODOS pueden (100% de asistencia).

Total de personas: {{peopleCount}}

Opciones (ordenadas por algoritmo):
{{#each slots}}
- Opción {{@index}}: {{lookup ../days day}} de {{startStr}} a {{endStr}} ({{count}}/{{../peopleCount}} personas). {{#if cannot.length}}AVISO: {{#each cannot}}{{name}}, {{/each}} NO pueden.{{else}}¡ASISTENCIA COMPLETA!{{/if}}
{{/each}}

Tu tarea:
1. Elige la mejor opción. Si hay una con asistencia completa y duración decente (1-3h), esa es la ganadora.
2. Si sugieres una opción donde alguien falta, justifica por qué es mejor que las de asistencia completa (ej: es un horario mucho más razonable).
3. Sé breve, persuasivo y muy claro sobre quién falta si es que falta alguien.`,
});

const recommendMeetingFlow = ai.defineFlow(
  {
    name: 'recommendMeetingFlow',
    inputSchema: RecommendInputSchema,
    outputSchema: RecommendOutputSchema,
  },
  async input => {
    const preparedSlots = input.slots.map(s => ({
      ...s,
      startStr: fromMin(s.start),
      endStr: fromMin(s.end),
    }));

    const { output } = await prompt({
      slots: preparedSlots,
      peopleCount: input.peopleCount,
      days: DAYS_NAMES
    });
    return output!;
  }
);
