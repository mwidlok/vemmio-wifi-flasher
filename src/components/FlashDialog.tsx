import { useState } from "react";
import JSZip from "jszip";
import { Build } from "../api/Builds";
import { Spinner } from "./Spinner";

// register web-component
import "esp-web-tools/dist/web/install-button.js";

interface Props {
  build: Build;
}

type Phase = "idle" | "preparing" | "ready";

export function FlashDialog({ build }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [open, setOpen] = useState(false);
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  async function buildManifestUrl() {
    // 1. Download ZIP through worker proxy to avoid CORS
    const zipArrayBuffer = await fetch(build.zipUrl, {
      credentials: "include",
    }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} while downloading ZIP`);
      return r.arrayBuffer();
    });
    const zip = await JSZip.loadAsync(zipArrayBuffer);

    // 2. Locate manifest.json
    const mf = zip.file(/manifest\.json$/i)?.[0];
    if (!mf) throw new Error("Missing manifest.json in ZIP.");
    const manifest = JSON.parse(await mf.async("string"));

    // 3. Prepare blob URLs for binary files
    const binNames = [
      "bootloader.bin",
      "partition-table.bin",
      "otadata.bin",
      "firmware.bin",
    ] as const;
    const blobs: Record<string, string> = {};
    for (const name of binNames) {
      const zf = zip.file(new RegExp(`(^|/)${name}$`, "i"))[0];
      if (!zf) throw new Error(`Missing ${name} in ZIP.`);
      const blob = await zf.async("blob");
      blobs[name] = URL.createObjectURL(blob);
    }

    // 4. Replace paths in manifest.builds[0].parts
    const parts = manifest?.builds?.[0]?.parts;
    if (!Array.isArray(parts) || !parts.length) {
      throw new Error("Manifest does not contain builds[0].parts.");
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
        // if unusual name (e.g. application.bin) fallback to firmware.bin
        p.path = blobs["firmware.bin"];
      }
    }

    // 5. Serialize manifest and create blob URL
    const blob = new Blob([JSON.stringify(manifest)], {
      type: "application/json",
    });
    return URL.createObjectURL(blob);
  }

  async function prepare() {
    setPhase("preparing");
    setLog([]);

    try {
      const url = await buildManifestUrl();
      setManifestUrl(url);
      setPhase("ready");
      setLog(["Manifest prepared. Connect device to flash."]);
    } catch (err) {
      setLog((l) => [...l, `❌ Error: ${String(err)}`]);
      console.error(err);
      setPhase("idle");
    }
  }

  function openDialog() {
    setOpen(true);
    prepare();
  }

  function closeDialog() {
    setOpen(false);
    setPhase("idle");
    setManifestUrl(null);
  }

  // Render
  return (
    <>
      <button
        disabled={phase === "preparing"}
        className="px-4 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        onClick={openDialog}
      >
        {phase === "preparing" ? <Spinner /> : "Prepare & Flash"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white text-slate-900 p-4 rounded w-96">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold">Flash {build.version}</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeDialog();
                }}
              >
                &times;
              </button>
            </div>

            {phase === "preparing" && (
              <div className="flex items-center gap-2"><Spinner /> Preparing…</div>
            )}

            {phase === "ready" && manifestUrl && (
              <esp-web-install-button manifest={manifestUrl}>
                <button className="px-4 py-1 rounded bg-indigo-600 hover:bg-indigo-700">
                  Connect
                </button>
              </esp-web-install-button>
            )}

            {log.length > 0 && (
              <pre className="mt-2 p-2 bg-gray-200 text-xs max-h-48 overflow-auto rounded">
                {log.join("\n")}
              </pre>
            )}
          </div>
        </div>
      )}
    </>
  );
}
