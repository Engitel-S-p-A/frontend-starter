import type { BehaviorSubject } from 'rxjs';

export interface Score {
  score: number;
  numericValue?: { from?: number | Date; to?: number | Date };
  arrayValue?: string[];
  boolValue?: boolean;
}

export interface FieldToSend {
  id: number;
  name: string;
  type: string;
  weight: number;
  scores: Score[];
}

export interface FormToSend {
  contactability: FieldToSend[];
  propensity: FieldToSend[];
}

export interface Model {
  id: string;
  name: string;
  fileName: string;
  properties: CSVJSONItems[];
}

export interface MappingItem {
  csvField: string;
  aliasName: string;
  mappingField: string;
}

export interface CSVJSONItems {
  name: string;
  type?: string | string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
  dateFormat?: string;
  description?: string;
  entityType?: string;
  alias?: string; // Add alias to CSVJSONItems
  recency?: boolean; // Add recency to CSVJSONItems
  monetary?: boolean; // Add monetary to CSVJSONItems
  frequency?: boolean; // Add frequency to CSVJSONItems
  mandatory?: boolean; // Add mandatory to CSVJSONItems
  hidden?: boolean; // Add hidden to CSVJSONItems
}

export type CSVJSONFieldDefinition = Omit<CSVJSONItems, 'name'>;

export interface IListTemplateConfiguratorService {
  mappingItems$: BehaviorSubject<MappingItem[]>;
  JSONFields$: BehaviorSubject<CSVJSONItems[]>;
  UserModel$: BehaviorSubject<Model | null>;
  fieldsToSend$: BehaviorSubject<FieldToSend[]>;
  totalweight$: BehaviorSubject<number>;
  formToSend$: BehaviorSubject<FormToSend>;
  totalweightContactability$: BehaviorSubject<number>;
  totalweightPropensity$: BehaviorSubject<number>;

  saveMapping(value: CSVJSONItems[]): Promise<void>;

  /**
   * Load mapping fields from JSON
   *
   * @returns Promise that always resolves (never throws)
   */
  loadMappingFields(): Promise<CSVJSONItems[]>;
  LoadcsvJson(): Promise<string>;
  saveModel(model: Model): Promise<void>;
  updateModelFileName(fileName: string): Promise<boolean>;
  deleteModel(): Promise<void>;
  addFieldToSend(field: FieldToSend, scope: 'Contactability' | 'Propensity'): void;
  editFieldsToSend(field: FieldToSend, key: number, scope: 'Contactability' | 'Propensity'): Promise<void>;
  editTotalWeight(scope: 'Contactability' | 'Propensity'): void;
  normalize(scope: 'Contactability' | 'Propensity'): void;
  deleteField(key: number, scope: 'Contactability' | 'Propensity'): void;
}
