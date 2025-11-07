/**
 * Impact2D Engine - Internationalization (i18n)
 * Simple localization system with localStorage persistence
 */

class I18n {
  constructor() {
    this.currentLang = 'en';
    this.translations = {};
    this.fallbackLang = 'en';
    
    // Try to load saved language preference
    const savedLang = localStorage.getItem('impact2d_lang');
    if (savedLang) {
      this.currentLang = savedLang;
    }
  }

  async loadLanguage(lang) {
    try {
      const response = await fetch(`../i18n/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang}`);
      const data = await response.json();
      this.translations[lang] = data;
      return true;
    } catch (e) {
      console.error(`[i18n] Failed to load language: ${lang}`, e);
      return false;
    }
  }

  async setLanguage(lang) {
    if (!this.translations[lang]) {
      const loaded = await this.loadLanguage(lang);
      if (!loaded && lang !== this.fallbackLang) {
        await this.loadLanguage(this.fallbackLang);
        lang = this.fallbackLang;
      }
    }
    this.currentLang = lang;
    localStorage.setItem('impact2d_lang', lang);
  }

  t(key, vars = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    
    // Try to find the key in current language
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Fallback to default language
    if (value === undefined && this.currentLang !== this.fallbackLang) {
      value = this.translations[this.fallbackLang];
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          value = key;
          break;
        }
      }
    }

    // If still not found, return the key itself
    if (value === undefined) {
      value = key;
    }

    // Replace variables
    if (typeof value === 'string') {
      for (const [varKey, varValue] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${varKey}\\}`, 'g'), varValue);
      }
    }

    return value;
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  getAvailableLanguages() {
    return Object.keys(this.translations);
  }
}

// Global singleton instance
export const i18n = new I18n();

// Export class for custom instances
export { I18n };
