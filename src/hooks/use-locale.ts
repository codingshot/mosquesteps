import { useState, useCallback } from "react";
import { getLocale, setLocale as setLocaleStorage, t as translate, isRTL, type Locale, type Translations } from "@/lib/i18n";

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleStorage(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key: keyof Translations) => translate(key, locale),
    [locale]
  );

  return { locale, setLocale, t, isRTL: isRTL(locale) };
}
