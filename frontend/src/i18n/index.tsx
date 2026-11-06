import i18next from "i18next";
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';
import de from './locales/de.json';
import it from './locales/it.json';

export const SUPPORTED_LANGUAGES = ['en', 'ru', 'uk', 'de', 'it'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ru: { translation: ru },
            uk: { translation: uk },
            de: { translation: de },
            it: { translation: it },
        },
        supportedLngs: SUPPORTED_LANGUAGES,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'language',
            caches: ['localStorage'],
        },
    });

    export default i18next;