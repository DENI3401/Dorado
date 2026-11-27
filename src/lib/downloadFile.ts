/** Pobiera tekst jako plik (bez backendu): Blob → tymczasowy link → kliknięcie. */
export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType = "application/json",
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Część przeglądarek zaczyna pobieranie asynchronicznie — zwalniamy URL chwilę później.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
