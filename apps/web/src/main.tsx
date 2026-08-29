import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./app/App";
import "./styles/base.css";
import "./styles/auth.css";

const root = document.getElementById("root");
if (!root) throw new Error("BoardOps root element is missing");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
