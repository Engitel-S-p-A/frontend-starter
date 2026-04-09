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
  alias?: string;
  recency?: boolean;
  monetary?: boolean;
  frequency?: boolean;
  mandatory?: boolean;
  hidden?: boolean;
}

export type CSVJSONFieldDefinition = Omit<CSVJSONItems, 'name'>;

export interface IListTemplateConfiguratorService {
  mappingItems$: BehaviorSubject<MappingItem[]>;
  jsonFields$: BehaviorSubject<CSVJSONItems[]>;
  userModel$: BehaviorSubject<Model | null>;
  fieldsToSend$: BehaviorSubject<FieldToSend[]>;
  totalweight$: BehaviorSubject<number>;
  formToSend$: BehaviorSubject<FormToSend>;
  totalweightContactability$: BehaviorSubject<number>;
  totalweightPropensity$: BehaviorSubject<number>;

  saveMapping(value: CSVJSONItems[]): Promise<void>;
  loadMappingFields(): Promise<CSVJSONItems[]>;
  loadcsvJson(): Promise<string>;
  saveModel(model: Model): Promise<void>;
  updateModelFileName(fileName: string): Promise<boolean>;
  deleteModel(): Promise<void>;
  addFieldToSend(field: FieldToSend, scope: 'Contactability' | 'Propensity'): void;
  editFieldsToSend(field: FieldToSend, key: number, scope: 'Contactability' | 'Propensity'): Promise<void>;
  editTotalWeight(scope: 'Contactability' | 'Propensity'): void;
  normalize(scope: 'Contactability' | 'Propensity'): void;
  deleteField(key: number, scope: 'Contactability' | 'Propensity'): void;
}
