import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../../constants/translations/en.json';
import id from '../../constants/translations/id.json';

const LANGUAGE_KEY = '@app_language';

const resources = {
  en: { translation: en },
  id: { translation: id },
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  if (!savedLanguage) {
    const deviceLanguage = Localization.getLocales()[0].languageCode;
    savedLanguage = deviceLanguage === 'id' ? 'id' : 'en';
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, 
      },
      compatibilityJSON: 'v4', 
    });
};

export { initI18n, LANGUAGE_KEY };
export default i18n;
