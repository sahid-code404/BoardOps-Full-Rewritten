import { Navigate, Route, Routes } from "react-router";

import { AccountPage } from "../features/auth/AccountPage";
import { AuthPage } from "../features/auth/AuthPage";
import { FoundationPage } from "../features/foundation/FoundationPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/design" element={<FoundationPage />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
