// Geração de ID local. Arquivo não listado na seção 6 original — adição
// pequena e óbvia, documentada no PROGRESS.md junto da Fase 4.

export function generateId(): string {
  return crypto.randomUUID();
}
