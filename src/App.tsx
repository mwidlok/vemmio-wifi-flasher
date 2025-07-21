import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { useJwt } from "./hooks/useJwt";

export default function App() {
  const { token } = useJwt();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={token ? <Home /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
