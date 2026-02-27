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
  prompt: `Eres un asistente experto en productividad y coordinación de equipos.
Analiza estos horarios disponibles para una junta de amigos.
Total de personas en el grupo: {{peopleCount}}

Opciones disponibles:
{{#each slots}}
- Opción {{@index}}: {{lookup ../days day}} de {{startStr}} a {{endStr}} ({{count}}/{{../peopleCount}} personas libres). Quienes NO pueden: {{#each cannot}}{{name}}, {{/each}}
{{/each}}

Tu tarea:
1. Identifica la mejor opción basada en asistencia máxima y duración razonable.
2. Genera una recomendación persuasiva y amigable en español.
3. Devuelve el índice de la opción elegida.`,
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
