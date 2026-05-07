export function flagForLanguage(language: string) {
  const flags: Record<string, string> = {
    ar: "🇸🇦",
    en: "🇺🇸",
    ru: "🇷🇺",
    tr: "🇹🇷",
    fr: "🇫🇷",
    es: "🇪🇸",
    de: "🇩🇪",
    it: "🇮🇹",
    pt: "🇵🇹",
    zh: "🇨🇳",
    ja: "🇯🇵",
    ko: "🇰🇷",
    hi: "🇮🇳",
    ur: "🇵🇰",
    fa: "🇮🇷",
    he: "🇮🇱",
    id: "🇮🇩",
    ms: "🇲🇾",
    uk: "🇺🇦",
    pl: "🇵🇱",
    nl: "🇳🇱",
    sv: "🇸🇪",
    el: "🇬🇷",
    vi: "🇻🇳",
    th: "🇹🇭",
  };

  return flags[language] ?? "🌐";
}
