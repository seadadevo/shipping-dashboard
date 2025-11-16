import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ui/theme-provider.tsx';

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<ThemeProvider attribute="class" defaultTheme="light">
      			<App />
    		</ThemeProvider>
		</BrowserRouter>
	</StrictMode>
);
