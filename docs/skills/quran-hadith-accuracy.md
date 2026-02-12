# Quran & hadith accuracy skill

**When to use:** Adding or changing any Islamic text: hadiths, Quran quotes, or scholarly attributions. Ensures correct wording, source, and grading; avoids fabrication.

---

## What to check

- **Exact wording**: Hadith and Quran text matches a verified printed or digital source (e.g. Sunnah.com, official print editions). No paraphrasing presented as direct quote.
- **Source**: Each hadith has correct book and number (e.g. Sahih Muslim 666, Sunan Abi Dawud 561). Links go to the correct Sunnah.com (or equivalent) page.
- **Grading**: If grading is shown (e.g. “Sahih”), it matches a recognized scholar or grading body; state source of grading if possible.
- **Context**: No hadith used out of context in a way that changes meaning. Short excerpts should not imply the full hadith says something it doesn’t.
- **Quran**: Any Quranic verse has surah and ayah; translation source noted if applicable.
- **No fabrication**: Never invent a hadith or verse; if in doubt, remove or replace with a verified reference.

---

## Where to look

| Area | Path |
|------|------|
| Hadith tooltips & data | `src/components/HadithTooltip.tsx` (VERIFIED_HADITHS) |
| Rewards hadiths | `src/pages/Rewards.tsx` (hadithKeys, typeConfig) |
| Sunnah page | `src/pages/SunnahPage.tsx` |
| Blog hadith usage | `src/lib/blog-data.ts` (any hadith quotes in posts) |
| Active walk / dashboard quotes | `src/pages/ActiveWalk.tsx` (SUNNAH_QUOTES), Dashboard hadith refs |
| Step counter “Too fast” | `src/lib/step-counter.ts` (sunnahLink) |

---

## How to iterate

1. For every hadith: look up the same hadith on Sunnah.com (or the cited source) and compare Arabic and translation.
2. Check every link: open each `sunnah.com` (or similar) URL and confirm it points to the correct hadith.
3. If adding new text: add only after verifying in a trusted source; add source and (if applicable) grading to the data structure.
4. Document the verification source in code or in this skill (e.g. “Sunnah.com, accessed YYYY-MM”).
5. Do not add “inspiring” quotes that cannot be traced to a real, verifiable hadith or verse.
