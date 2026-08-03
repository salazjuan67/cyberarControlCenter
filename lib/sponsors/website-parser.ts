/** Extrae URLs del campo notas (formato CyberAR) o texto libre */
export function extractWebsiteFromNotas(notas: string): string | null {
  if (!notas?.trim()) return null;

  const patterns = [
    /Sitio:\s*(https?:\/\/[^\s\n]+)/i,
    /Sitio oficial:\s*(https?:\/\/[^\s\n]+)/i,
    /https?:\/\/[^\s\n"'<>]+/i,
  ];

  for (const pattern of patterns) {
    const match = notas.match(pattern);
    if (match) {
      const url = (match[1] ?? match[0]).trim().replace(/[.,;)]+$/, "");
      if (isValidHttpUrl(url)) return url;
    }
  }

  return null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeWebsiteUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname}`;
}

export function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
