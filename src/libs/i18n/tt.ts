// Embedded translations - developers add their keys here
const translations: Record<string, Record<string, string>> = {
  en: {
    // Shell
    'SM.SHELL.INITIALIZING': 'Initializing...',

    // Outbound Manager
    'SM.OUTBOUND.TITLE': 'Outbound Manager',
    'SM.OUTBOUND.LOADING': 'Loading campaigns...',
    'SM.OUTBOUND.NO_CAMPAIGNS': 'No campaigns available',
    'SM.OUTBOUND.CAMPAIGN.STATUS': 'Status',
    'SM.OUTBOUND.CAMPAIGN.DIALED': 'Dialed',
    'SM.OUTBOUND.CAMPAIGN.CONNECTED': 'Connected',
    'SM.OUTBOUND.CAMPAIGN.START': 'Start Campaign',
    'SM.OUTBOUND.CAMPAIGN.PAUSE': 'Pause Campaign',
    'SM.OUTBOUND.CAMPAIGN.SELECTED': 'Selected: {{name}}',

    // Buttons
    'SM.BUTTON.SAVE': 'Save',
    'SM.BUTTON.CANCEL': 'Cancel',
    'SM.BUTTON.CONFIRM': 'Confirm',

    // List Template Configurator
    'SM.TEMPLATE.CONFIGURATOR.RADIO.MAPPING': 'Mapping',
    'SM.TEMPLATE.CONFIGURATOR.RADIO.SCORING': 'Scoring',
    'SM.TEMPLATE.CONFIGURATOR.RADIO.OPTIONS': 'Options',
    'SM.TEMPLATE.CONFIGURATOR.MODAL_TITLE': 'Add model list',

    //SCORING
    'SM.SCORING.PANEL.CONTACTABILITY': 'Contactability Score (CS)',
    'SM.SCORING.PANEL.PROPENSITY': 'Propensity Score (PS)',
    'SM.SCORING.PANEL.ADD': 'Add Score',
    'SM.SCORING.PANEL.TOTAL': 'Total Weight:',
    'SM.SCORING.PANEL.EMPTY.CONTACTABILITY':
      'Apply at least one score to reach 100% of{br} Contactability Score (CS) weight',
    'SM.SCORING.PANEL.EMPTY.PROPENSITY': 'Apply at least one score to reach 100% of{br} Propensity Score (CS) weight',
    'SM.SCORING.PANEL.EMPTY.SCORE': 'No scores applied yet',
    'SM.ADD.SCORE.SELECT': 'Select field',
    'SM.ADD.SCORE.WEIGHT': 'Weight',
    'SM.ADD.SCORE.TYPE': 'Field type',
    'SM.ADD.SCORE.UNSET': 'Unset',
    'SM.ADD.SCORE.NUMERIC': 'Numeric',
    'SM.ADD.SCORE.DATE': 'Date',
    'SM.ADD.SCORE.STRING': 'String',
    'SM.ADD.SCORE.BOOLEAN': 'Boolean',
    'SM.ADD.SCORE.DISCLAIMER': 'Assign score 1-3 based on field value. Missing values automatically get score 2.',
    'SM.SCORE.PANEL.FROM': 'From',
    'SM.SCORE.PANEL.TO': 'to',
    'SM.SCORE.PANEL.CLEAR': 'Clear',
    'SM.SCORE.PANEL.BOOLEAN': 'Has Value',
    //MAPPING
    'SM.MAPPING.MODEL.MODEL_NAME': 'Model Name',
    'SM.MAPPING.MODEL.MODEL_TEXT': 'Insert model name',
    'SM.MAPPING.MODEL.MODEL_ERROR': 'Model name is required.',
    'SM.MAPPING.MODEL.FILE_UPLOAD_EMPTY': 'Drag and drop your model list here',
    'SM.MAPPING.MODEL.FILE_UPLOAD_FORMATS': 'Supported formats: .XLSX .CSV',
    'SM.MAPPING.MODEL.FILE_UPLOAD_ERROR': 'Uploading model file is required.',
    'SM.MAPPING.TABLE.COLUMN.CSV_FIELDS': 'CSV Fields',
    'SM.MAPPING.TABLE.COLUMN.RENAME_FIELD': 'Rename field',
    'SM.MAPPING.TABLE.COLUMN.ID': 'ID',
    'SM.MAPPING.TABLE.COLUMN.PHONE': 'Phone',
    'SM.MAPPING.TABLE.COLUMN.MOBILE': 'Mobile',
    'SM.MAPPING.TABLE.COLUMN.EMAIL': 'E-mail',
    'SM.MAPPING.TABLE.COLUMN.RECENCY': 'Recency (R)',
    'SM.MAPPING.TABLE.COLUMN.MONETARY': 'Monetary (M)',
    'SM.MAPPING.TABLE.COLUMN.FREQUENCY': 'Frequency (F)',
    'SM.MAPPING.TABLE.COLUMN.MANDATORY': 'Mandatory',
    'SM.MAPPING.TABLE.COLUMN.HIDDEN': 'Hidden',
    'SM.MAPPING.TABLE.HEADER': 'Field Mapping Configuration',
  },
  it: {
    'SM.SHELL.INITIALIZING': 'Inizializzazione...',
    'SM.OUTBOUND.TITLE': 'Gestione Outbound',
    'SM.OUTBOUND.LOADING': 'Caricamento campagne...',
    'SM.OUTBOUND.NO_CAMPAIGNS': 'Nessuna campagna disponibile',
    'SM.OUTBOUND.CAMPAIGN.STATUS': 'Stato',
    'SM.OUTBOUND.CAMPAIGN.DIALED': 'Chiamate',
    'SM.OUTBOUND.CAMPAIGN.CONNECTED': 'Connesse',
    'SM.OUTBOUND.CAMPAIGN.START': 'Avvia Campagna',
    'SM.OUTBOUND.CAMPAIGN.PAUSE': 'Pausa Campagna',
    'SM.OUTBOUND.CAMPAIGN.SELECTED': 'Selezionata: {{name}}', // Example with interpolation

    //MAPPING
    'SM.MAPPING.MODEL.MODEL_NAME': 'Nome modello',
    'SM.MAPPING.MODEL.MODEL_TEXT': 'Inserisci il nome del modello',
    'SM.MAPPING.MODEL.MODEL_ERROR': 'Il nome del modello è obbligatorio.',
    'SM.MAPPING.MODEL.FILE_UPLOAD_EMPTY': 'Trascina qui l’elenco del modello',
    'SM.MAPPING.MODEL.FILE_UPLOAD_FORMATS': 'Formati supportati: .XLSX .CSV',
    'SM.MAPPING.MODEL.FILE_UPLOAD_ERROR': 'Il caricamento del file del modello è obbligatorio.',
    'SM.MAPPING.TABLE.COLUMN.CSV_FIELDS': 'Campi CSV',
    'SM.MAPPING.TABLE.COLUMN.RENAME_FIELD': 'Rinomina campo',
    'SM.MAPPING.TABLE.COLUMN.ID': 'ID',
    'SM.MAPPING.TABLE.COLUMN.PHONE': 'Telefono',
    'SM.MAPPING.TABLE.COLUMN.MOBILE': 'Cellulare',
    'SM.MAPPING.TABLE.COLUMN.EMAIL': 'E-mail',
    'SM.MAPPING.TABLE.COLUMN.RECENCY': 'Recency (R)',
    'SM.MAPPING.TABLE.COLUMN.MONETARY': 'Valore (M)',
    'SM.MAPPING.TABLE.COLUMN.FREQUENCY': 'Frequenza (F)',
    'SM.MAPPING.TABLE.COLUMN.MANDATORY': 'Obbligatorio',
    'SM.MAPPING.TABLE.COLUMN.HIDDEN': 'Nascosto',
    'SM.MAPPING.TABLE.HEADER': 'Configurazione mappatura campi',
  },
};

// Current language (defaults to English)
let currentLang = 'en';

/**
 * Translate a key to the current language with optional mustache interpolation
 *
 * @param key Translation key (e.g., 'SM.OUTBOUND.TITLE')
 * @param opts Optional variables for {{mustache}} interpolation (e.g., { name: 'John', count: '5' })
 * @returns Translated string or key if not found
 *
 * @example
 * // Simple translation
 * tt('SM.OUTBOUND.TITLE')
 * // Returns: "Outbound Manager"
 *
 * @example
 * // Translation with interpolation
 * tt('SM.OUTBOUND.WELCOME', { name: 'John' })
 * // If template is "Welcome {{name}}"
 * // Returns: "Welcome John"
 */
export function tt(key: string, opts?: Record<string, string>): string {
  const template = translations[currentLang]?.[key] || key;

  // If no variables provided, return template as-is
  if (!opts) {
    return template;
  }

  // Mustache interpolation: replace {{varname}} with opts.varname
  return template.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
    return opts[varName] || '';
  });
}

/**
 * Change the current language
 *
 * @param lang Language code ('en', 'it', etc.)
 */
export function setLanguage(lang: string): void {
  if (translations[lang]) {
    currentLang = lang;
  }
}

/**
 * Get the current language code
 */
export function getCurrentLanguage(): string {
  return currentLang;
}

/**
 * Get all available language codes
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(translations);
}
