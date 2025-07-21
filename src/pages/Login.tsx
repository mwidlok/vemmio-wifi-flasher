import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Authorization": `Basic ${btoa(`${user}:${pass}`)}` },
    });
    if (res.ok) {
      navigate("/");
    } else {
      setErr("Błędne dane logowania");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-sm mx-auto mt-40"
    >
      <h1 className="text-2xl font-bold text-center">Logowanie</h1>
      <input
        className="px-3 py-2 rounded bg-slate-800"
        placeholder="Użytkownik"
        value={user}
        onChange={(e) => setUser(e.target.value)}
      />
      <input
        type="password"
        className="px-3 py-2 rounded bg-slate-800"
        placeholder="Hasło"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      {err && <p className="text-red-500 text-sm">{err}</p>}
      <button className="rounded bg-indigo-600 hover:bg-indigo-700 py-2 mt-2" type="submit">
        Zaloguj
      </button>
    </form>
  );
}
