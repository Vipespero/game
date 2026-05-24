/// <reference types="vite/client" />

// Permite importar archivos CSS sin error de TypeScript
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
