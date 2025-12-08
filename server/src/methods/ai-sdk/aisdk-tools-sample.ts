import { tool } from "ai";
import _ from "lodash";
import z from "zod";

export const getWeather = tool({
  description: 'Get the current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('The location to get weather for'),
    unit: z.enum(['celsius', 'fahrenheit']).describe('Temperature unit')
  }),
  async *execute({ location }, opts) {
    yield { status: 'loading' as const, text: 'fetch weather started' }; // output will be changed later
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield { location, temperature: 25, description: 'Sunny' }
  }
});