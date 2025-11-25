import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element with id 'root' was not found in the document.");
}

createRoot(rootElement).render(
	<StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</StrictMode>
);
