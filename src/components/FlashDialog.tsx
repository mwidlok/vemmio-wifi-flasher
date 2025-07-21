import { useState } from "react";
import JSZip from "jszip";
import { Build } from "../api/Builds";
import { Spinner } from "./Spinner";

// rejestruje web-component
import "esp-web-tools/dist/web/install-button.js";

interface Props {
  build: Build;
}

type Phase = "idle" | "preparing" | "ready";

export function FlashDialog({ build }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  async function prepare() {
    setPhase("preparing");
    setLog([]);

    try {
      // 1. Pobierz ZIP (proxy Worker -> brak CORS)
      const zipBuf = await fetch(build.zipUrl, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} przy pobieraniu ZIP`);
        return r.arrayBuffer();
      });
      const zip = await JSZip.loadAsync(zipBuf);

      // 2. Znajdź manifest.json
      const mf = zip.file(/manifest\.json$/i)?.[0];
      if (!mf) throw new Error("Brak manifest.json w ZIP.");
      const manifest = JSON.parse(await mf.async("string"));

      // 3. Przygotuj blob:URL-e dla plików binarnych
      const binNames = [
        "bootloader.bin",
        "partition-table.bin",
        "otadata.bin",
        "firmware.bin",
      ] as const;
      const blobs: Record<string, string> = {};
      for (const name of binNames) {
        const zf = zip.file(new RegExp(`(^|/)${name}$`, "i"))[0];
        if (!zf) throw new Error(`Brak ${name} w ZIP.`);
        const blob = await zf.async("blob");
        blobs[name] = URL.createObjectURL(blob);
      }

      // 4. Podmień ścieżki w manifest.builds[0].parts
      const parts = manifest?.builds?.[0]?.parts;
      if (!Array.isArray(parts) || !parts.length) {
        throw new Error("Manifest nie zawiera builds[0].parts.");
      }
      for (const p of parts) {
        if (typeof p.path !== "string") continue;
        const lower = p.path.toLowerCase();
        let matched = false;
        for (const [name, blobUrl] of Object.entries(blobs)) {
          if (lower.endsWith(name)) {
            p.path = blobUrl;
            matched = true;
            break;
          }
        }
        if (!matched) {
          // jeżeli nazwa nietypowa (np. application.bin) przypnij firmware.bin
          p.path = blobs["firmware.bin"];
        }
      }

      // 5. Zserializuj i utwórz blob URL manifestu
      const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      setManifestUrl(url);
      setPhase("ready");
      setLog(["Manifest przygotowany. Kliknij «Flashuj» aby rozpocząć."]);
    } catch (err) {
      setLog((l) => [...l, `❌ Błąd: ${String(err)}`]);
      console.error(err);
      setPhase("idle");
    }
  }

  // Render
  if (phase === "ready" && manifestUrl) {
    // Pokazujemy natywny przycisk ESP Web Tools; slot text → nasz UI
    return (
        <>
          <esp-web-install-button manifest={manifestUrl}>
            <button className="px-4 py-1 rounded bg-indigo-600 hover:bg-indigo-700">
              Flashuj {build.version}
            </button>
          </esp-web-install-button>
          {log.length > 0 && (
              <pre className="mt-2 p-2 bg-slate-900 text-xs max-h-48 overflow-auto rounded">
            {log.join("\n")}
          </pre>
          )}
        </>
    );
  }

  // idle / preparing
  return (
      <>
        <button
            disabled={phase === "preparing"}
            className="px-4 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            onClick={prepare}
        >
          {phase === "preparing" ? <Spinner /> : "Przygotuj & Flashuj"}
        </button>
        {log.length > 0 && (
            <pre className="mt-2 p-2 bg-slate-900 text-xs max-h-48 overflow-auto rounded">
          {log.join("\n")}
        </pre>
        )}
      </>
  );
}
