import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = process.env.SPACES_BUCKET!;
const ENDPOINT = `https://${process.env.SPACES_REGION}.digitaloceanspaces.com`;

// DigitalOcean Spaces: region w SDK może być cokolwiek – używamy "us-east-1".
const client = new S3Client({
  region: "us-east-1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.SPACES_KEY!,
    secretAccessKey: process.env.SPACES_SECRET!,
  },
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function unauthorized(): Response {
  return new Response("Unauthorized", {
    status: 401,
  });
}

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    /* ----------------------------------------------------------
       GET /api/builds?stage=staging&device=flood
       Struktura: stage/device/<version>/{manifest.json, *.zip}
    ---------------------------------------------------------- */
    if (url.pathname === "/api/builds") {
      const stage = url.searchParams.get("stage") ?? "staging";
      const device = url.searchParams.get("device") ?? "flood";
      const prefix = `${stage}/${device}/`;

      const cmd = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix });
      const res = await client.send(cmd);

      type Group = { zip?: string; manifest?: string; lastModified?: Date };
      const groups: Record<string, Group> = {};

      for (const o of res.Contents ?? []) {
        const key = o.Key!;
        if (!key.startsWith(prefix) || key.endsWith("/")) continue;

        // np: "staging/flood/0.3.0/manifest.json"
        //     "staging/flood/0.3.0/vemmio-flood-esp32c3-v0.3.0+20250709-g8f5d2c.zip"
        const rest = key.slice(prefix.length); // "0.3.0/..."
        const slash = rest.indexOf("/");
        if (slash === -1) continue; // niespodziewany format
        const version = rest.slice(0, slash);
        const filename = rest.slice(slash + 1);

        const g = (groups[version] ??= {});
        if (/manifest\.json$/i.test(filename)) g.manifest = key;
        else if (/\.zip$/i.test(filename)) {
          g.zip = key;
          g.lastModified = o.LastModified;
        }
      }

      const list = Object.entries(groups)
          .filter(([, g]) => g.zip) // wymagamy ZIP; manifest opcjonalny
          .map(([version, g]) => ({
            stage,
            device,
            version,
            date: g.lastModified!.toISOString(),
            zipUrl: `/api/artifact?key=${encodeURIComponent(g.zip!)}`,
            ...(g.manifest
                ? { manifestUrl: `/api/artifact?key=${encodeURIComponent(g.manifest)}` }
                : {}),
          }));

      return json(list);
    }

    /* ----------------------------------------------------------
       GET /api/artifact?key=<urlencoded-s3-key>
       Proxy do Spaces (rozwiązuje CORS)
    ---------------------------------------------------------- */
    if (url.pathname === "/api/artifact") {
      const key = url.searchParams.get("key");
      if (!key) return new Response("key required", { status: 400 });

      const obj = await client.send(
          new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      );

      let ct = "application/octet-stream";
      if (key.endsWith("manifest.json")) ct = "application/json";
      else if (/\.zip$/i.test(key)) ct = "application/zip";

      return new Response(obj.Body as any, {
        headers: {
          "content-type": ct,
          "access-control-allow-origin": "*", // DEV; zawęź w PROD
          "cache-control": "no-store",
        },
      });
    }

    /* ----------------------------------------------------------
       /api/login
       POST BasicAuth -> JWT cookie
       GET  sprawdzenie sesji
    ---------------------------------------------------------- */
    if (url.pathname === "/api/login") {
      if (req.method === "POST") {
        const auth = req.headers.get("authorization") ?? "";
        if (!auth.startsWith("Basic ")) return unauthorized();
        const [, encoded] = auth.split(" ");
        const [user, pass] = atob(encoded).split(":");
        if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
          return unauthorized();
        }
        const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 4; // 4h
        const token = await crypto.subtle
            .digest(
                "SHA-256",
                new TextEncoder().encode(`${user}:${exp}:${process.env.JWT_SECRET}`),
            )
            .then((buf) => btoa(String.fromCharCode(...new Uint8Array(buf))));
        return new Response(JSON.stringify({ token }), {
          headers: {
            "content-type": "application/json",
            "Set-Cookie": `jwt=${token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=14400`,
          },
        });
      }

      // GET -> weryfikacja
      const cookie = req.headers.get("cookie") || "";
      const m = cookie.match(/(?:^|;\s*)jwt=([^;]+)/);
      if (!m) return unauthorized();
      return json({ token: m[1] });
    }

    return new Response("Not found", { status: 404 });
  },
};
