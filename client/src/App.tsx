import { Route, Routes } from "react-router-dom";

import Final from "./pages/Final";
import Lobby from "./pages/Lobby";
import Review from "./pages/Review";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/project/:slug" element={<Review />} />
      <Route path="/project/:slug/final" element={<Final />} />
      <Route path="*" element={<Lobby />} />
    </Routes>
  );
}
