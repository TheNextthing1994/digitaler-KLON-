import {createRoot} from 'react-dom/client';
import App from './App.tsx';

console.log("main.tsx executing...");

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log("Root element found, rendering...");
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found!");
}
