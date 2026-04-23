import { Navigate, Route, Routes } from "react-router-dom";

import AllReports from "./pages/AllReports";
import Final from "./pages/Final";
import Gate from "./pages/Gate";
import Lobby from "./pages/Lobby";
import Review from "./pages/Review";

import { useExpertIdentity } from "./hooks/useExpertId";

function RequireExpert({ children }: { children: React.ReactNode }) {
  const { expert } = useExpertIdentity();
  if (!expert) return <Navigate to="/start" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/start" element={<Gate />} />
      <Route path="/" element={<RequireExpert><Lobby /></RequireExpert>} />
      <Route path="/project/:slug" element={<RequireExpert><Review /></RequireExpert>} />
      <Route path="/project/:slug/final" element={<RequireExpert><Final /></RequireExpert>} />
      <Route path="/all-reports" element={<RequireExpert><AllReports /></RequireExpert>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
