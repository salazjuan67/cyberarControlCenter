import * as cheerio from "cheerio";
import {
  extractWebsiteFromNotas,
  getDomainFromUrl,
  normalizeWebsiteUrl,
} from "@/lib/sponsors/website-parser";

const CONTACT_PATHS = [
  "",
  "/contacto",
  "/contact",
  "/contact-us",
  "/contactanos",
  "/institucional",
  "/institutional",
  "/about/contact",
];

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT =
  "CyberAR-Enrichment/1.0 (institutional contact discovery; +https://cyber.ar)";

const BLOCKED_LOCALPARTS = new Set([
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "mailer-daemon",
  "postmaster",
  "webmaster",
  "sentry",
  "wix",
  "example",
  "test",
  "newsletter",
]);

const BLOCKED_DOMAINS = new Set([
  "sentry.io",
  "wixpress.com",
  "example.com",
  "email.com",
  "domain.com",
  "yourdomain.com",
]);

export type EmailConfidence = "high" | "medium" | "low";

export interface ScrapedEmailCandidate {
  email: string;
  confidence: EmailConfidence;
  sourceUrl: string;
}

export interface ScrapeWebsiteResult {
  websiteUrl: string | null;
  candidates: ScrapedEmailCandidate[];
  error?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shouldBlockEmail(email: string): boolean {
  const lower = email.toLowerCase();
  const [local, domain] = lower.split("@");
  if (!local || !domain) return true;
  if (BLOCKED_DOMAINS.has(domain)) return true;
  if (BLOCKED_LOCALPARTS.has(local)) return true;
  if (domain.endsWith(".png") || domain.endsWith(".jpg")) return true;
  if (local.includes("noreply") || local.includes("no-reply")) return true;
  return false;
}

function scoreEmail(email: string, siteDomain: string | null, fromMailto: boolean): EmailConfidence {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (fromMailto && siteDomain && (domain === siteDomain || domain.endsWith(`.${siteDomain}`))) {
    return "high";
  }
  if (siteDomain && (domain === siteDomain || domain.endsWith(`.${siteDomain}`))) {
    return "medium";
  }
  return "low";
}

function extractEmailsFromHtml(
  html: string,
  pageUrl: string,
  siteDomain: string | null
): ScrapedEmailCandidate[] {
  const found = new Map<string, ScrapedEmailCandidate>();
  const $ = cheerio.load(html);

  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const raw = href.replace(/^mailto:/i, "").split("?")[0].trim();
    if (!raw || !isValidEmailFormat(raw) || shouldBlockEmail(raw)) return;
    const email = raw.toLowerCase();
    found.set(email, {
      email,
      confidence: scoreEmail(email, siteDomain, true),
      sourceUrl: pageUrl,
    });
  });

  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const text = $.text();
  for (const match of text.match(regex) ?? []) {
    const email = match.toLowerCase();
    if (!isValidEmailFormat(email) || shouldBlockEmail(email)) continue;
    if (!found.has(email)) {
      found.set(email, {
        email,
        confidence: scoreEmail(email, siteDomain, false),
        sourceUrl: pageUrl,
      });
    }
  }

  return [...found.values()];
}

async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function buildPageUrls(baseUrl: string): string[] {
  const normalized = normalizeWebsiteUrl(baseUrl);
  const urls = new Set<string>();

  for (const path of CONTACT_PATHS) {
    try {
      urls.add(path ? new URL(path, normalized).href : normalized);
    } catch {
      // ignore invalid combinations
    }
  }

  return [...urls];
}

export async function scrapeEmailsFromNotas(notas: string): Promise<ScrapeWebsiteResult> {
  const websiteUrl = extractWebsiteFromNotas(notas);
  if (!websiteUrl) {
    return { websiteUrl: null, candidates: [], error: "Sin URL de sitio en notas" };
  }

  return scrapeEmailsFromWebsite(websiteUrl);
}

export async function scrapeEmailsFromWebsite(websiteUrl: string): Promise<ScrapeWebsiteResult> {
  const siteDomain = getDomainFromUrl(websiteUrl);
  const pages = buildPageUrls(websiteUrl);
  const allCandidates = new Map<string, ScrapedEmailCandidate>();

  for (const pageUrl of pages) {
    const html = await fetchPage(pageUrl);
    if (!html) {
      await sleep(400);
      continue;
    }

    for (const candidate of extractEmailsFromHtml(html, pageUrl, siteDomain)) {
      const existing = allCandidates.get(candidate.email);
      if (!existing || rankConfidence(candidate.confidence) > rankConfidence(existing.confidence)) {
        allCandidates.set(candidate.email, candidate);
      }
    }

    await sleep(400);
  }

  const candidates = [...allCandidates.values()].sort(
    (a, b) => rankConfidence(b.confidence) - rankConfidence(a.confidence)
  );

  if (candidates.length === 0) {
    return {
      websiteUrl,
      candidates: [],
      error: "No se encontraron emails en el sitio",
    };
  }

  return { websiteUrl, candidates };
}

function rankConfidence(c: EmailConfidence): number {
  if (c === "high") return 3;
  if (c === "medium") return 2;
  return 1;
}

export function pickBestCandidate(candidates: ScrapedEmailCandidate[]): ScrapedEmailCandidate | null {
  if (candidates.length === 0) return null;
  return candidates[0];
}
