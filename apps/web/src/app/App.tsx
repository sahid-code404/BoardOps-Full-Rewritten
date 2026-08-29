import { Navigate, Route, Routes } from "react-router";
import { FoundationPage } from "../features/foundation/FoundationPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<FoundationPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
