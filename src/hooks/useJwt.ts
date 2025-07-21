import { useEffect, useState } from "react";

export function useJwt() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch("/api/login", { credentials: "include" });
        if (res.ok) {
          const { token } = await res.json();
          setToken(token);
        }
      } catch {
        setToken(null);
      }
    }
    refresh();
  }, []);

  return { token };
}
