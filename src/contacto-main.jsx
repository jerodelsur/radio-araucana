import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ContactoApp from "./contacto/ContactoApp.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ContactoApp />
  </StrictMode>,
);
