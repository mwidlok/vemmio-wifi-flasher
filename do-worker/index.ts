import worker from '../worker/index.ts';

/**
 * DigitalOcean Functions handler that delegates to the existing Worker logic.
 * The worker object exports an async `fetch(req: Request): Response` function.
 */
export default async function handler(req: Request): Promise<Response> {
  return worker.fetch(req);
}
