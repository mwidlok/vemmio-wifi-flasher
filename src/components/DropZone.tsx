import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
// @ts-ignore
import { flash } from "esp-web-tools/dist/flash";
import JSZip from "jszip";

export default function DropZone() {
  const [log, setLog] = useState<string[]>([]);

  const onDrop = useCallback(async (files: File[]) => {
    setLog([]);
    try {
      const zip = await JSZip.loadAsync(files[0]);

      const mf = zip.file(/manifest\.json$/i)?.[0];
      if (!mf) throw new Error("Brak manifest.json w ZIP.");
      const manifest = JSON.parse(await mf.async("string"));

      const parts = manifest?.builds?.[0]?.parts;
      if (!Array.isArray(parts) || !parts.length) {
        throw new Error("Manifest nie zawiera builds[0].parts.");
      }

      // przygotuj blob:URL-e dla wszystkich plików .bin
      const get = (name: string) => {
        const f = zip.file(new RegExp(`^${name}$`, "i"))[0];
        if (!f) throw new Error(`Brak ${name} w ZIP.`);
        return f.async("blob");
      };
      const blobs = {
        "bootloader.bin": await get("bootloader.bin"),
        "partition-table.bin": await get("partition-table.bin"),
        "otadata.bin": await get("otadata.bin"),
        "firmware.bin": await get("firmware.bin"),
      };

      for (const p of parts) {
        if (typeof p.path !== "string") continue;
        const k =
            ["bootloader.bin", "partition-table.bin", "otadata.bin", "firmware.bin"].find((n) =>
                p.path.toLowerCase().endsWith(n)
            ) ?? "firmware.bin";
        p.path = URL.createObjectURL(blobs[k as keyof typeof blobs]);
      }

      await flash({ manifestString }, setLog);
      setLog((l) => [...l, "✔ Zakończono"]);
    } catch (err) {
      setLog((l) => [...l, `❌ Błąd: ${String(err)}`]);
      console.error(err);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/zip": [".zip"] },
  });

  return (
      <div
          {...getRootProps()}
          className={`mt-8 p-6 border-2 rounded-lg border-dashed ${
              isDragActive ? "border-indigo-500" : "border-gray-500"
          }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
            <p>Upuść ZIP tutaj…</p>
        ) : (
            <p>Przeciągnij ZIP z firmware lub kliknij by wybrać.</p>
        )}
        {log.length > 0 && (
            <pre className="mt-4 text-xs max-h-48 overflow-auto bg-gray-200 p-2 rounded">{log.join("\n")}</pre>
        )}
      </div>
  );
}
