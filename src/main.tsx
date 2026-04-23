import App from "@/App";
import { Providers } from "@/Providers";
import { enableArrayMethods, enableMapSet } from "immer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

enableArrayMethods();
enableMapSet();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
