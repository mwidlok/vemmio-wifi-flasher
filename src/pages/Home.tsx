import { useEffect, useState } from "react";
import BuildList from "../components/BuildList";
import DropZone from "../components/DropZone";
import { Build, fetchBuilds } from "../api/Builds";
import { Spinner } from "../components/Spinner";

export default function Home() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));

  const DEVICE_TYPES = ["flood", "motion", "implant"] as const;
  const STAGES = ["staging", "production"] as const;

  const [device, setDevice] = useState<string>(
    params.get("device") ?? DEVICE_TYPES[0],
  );
  const [stage, setStage] = useState<string>(
    params.get("stage") ?? STAGES[0],
  );
  const [builds, setBuilds] = useState<Build[] | null>(null);

  useEffect(() => {
    fetchBuilds(stage, device).then(setBuilds).catch(() => setBuilds([]));
  }, [stage, device]);

  // Keep hash params in sync with current selection
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("device", device);
    params.set("stage", stage);
    location.hash = params.toString();
  }, [device, stage]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Vemmio Flasher</h1>
      <div className="mt-4 flex gap-4">
        <label className="text-sm">
          Device:
          <select
            className="ml-2 bg-white border border-gray-300 rounded px-2 py-1"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          >
            {DEVICE_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Stage:
          <select
            className="ml-2 bg-white border border-gray-300 rounded px-2 py-1"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      {builds === null ? (
        <div className="flex items-center mt-8 gap-2"><Spinner /> Ładowanie…</div>
      ) : (
        <BuildList builds={builds} />
      )}
      <DropZone />
    </div>
  );
}
