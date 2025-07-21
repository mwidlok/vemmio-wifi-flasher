import { z } from "zod";

export const BuildSchema = z.object({
  device: z.string(),
  version: z.string(),
  stage: z.string(),
  zipUrl: z.string(),            // względny URL do artefaktu (proxy Worker)
  manifestUrl: z.string().optional(), // opcjonalny – gdy istnieje zewnętrzny plik .manifest.json
});
export type Build = z.infer<typeof BuildSchema>;

export async function fetchBuilds(stage: string, device: string): Promise<Build[]> {
  const res = await fetch(`/api/builds?stage=${stage}&device=${device}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Nie można pobrać listy buildów");
  const payload = await res.json();
  return z.array(BuildSchema).parse(payload);
}