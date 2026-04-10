import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const fallbackDevApiBaseUrl = import.meta.env.DEV ? "http://localhost:4001" : null;

setBaseUrl(configuredApiBaseUrl ?? fallbackDevApiBaseUrl);

createRoot(document.getElementById("root")!).render(<App />);
