/** Asegura HTML completo usable por Resend y por el iframe de preview */
export function normalizeNewsletterHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";

  if (/<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;">
${trimmed}
</body>
</html>`;
}

export function estimateHtmlSizeKb(html: string): number {
  return Math.round((new Blob([html]).size / 1024) * 10) / 10;
}
