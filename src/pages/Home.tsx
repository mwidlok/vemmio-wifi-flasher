import { useEffect, useState } from "react";
import BuildList from "../components/BuildList";
import DropZone from "../components/DropZone";
import { Build, fetchBuilds } from "../api/Builds";
import { Spinner } from "../components/Spinner";

export default function Home() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const device = params.get("device") ?? "flood";
  const stage = params.get("stage") ?? "staging";
  const [builds, setBuilds] = useState<Build[] | null>(null);

  useEffect(() => {
    fetchBuilds(stage, device).then(setBuilds).catch(() => setBuilds([]));
  }, [stage, device]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Vemmio Flasher</h1>
      <p className="mt-2 text-slate-400">Device: {device} | Stage: {stage}</p>
      {builds === null ? (
        <div className="flex items-center mt-8 gap-2"><Spinner /> Ładowanie…</div>
      ) : (
        <BuildList builds={builds} />
      )}
      <DropZone />
    </div>
  );
}
