import { inject, injectable } from 'inversify';
import { BehaviorSubject } from 'rxjs';
import { LOGGER_TYPES } from '../../di/types';
import type { ILogger } from '../../libs/logger';
import { StarterDebugNamespaces } from '../../libs/logger';
import {
  CSVJSONFieldDefinition,
  CSVJSONItems,
  FieldToSend,
  FormToSend,
  IListTemplateConfiguratorService,
  MappingItem,
  Model,
} from './list-template-configurator.interface';

@injectable()
export class ListTemplateConfiguratorService implements IListTemplateConfiguratorService {
  private logger = this.loggerService.getLogger(StarterDebugNamespaces.TemplateConfigurator);
  mappingItems$ = new BehaviorSubject<MappingItem[]>([]);
  jsonFields$ = new BehaviorSubject<CSVJSONItems[]>([]);
  userModel$ = new BehaviorSubject<Model | null>(null);
  fieldsToSend$ = new BehaviorSubject<FieldToSend[]>([]);
  formToSend$ = new BehaviorSubject<FormToSend>({ contactability: [], propensity: [] });
  totalweightContactability$ = new BehaviorSubject<number>(0);
  totalweightPropensity$ = new BehaviorSubject<number>(0);
  totalweight$ = new BehaviorSubject<number>(0);

  constructor(@inject(LOGGER_TYPES.Logger) private loggerService: ILogger) {
    this.logger.log('ListTemplateConfiguratorService initialized');
  }

  async loadcsvJson(): Promise<string> {
    const filePath = '/assets/data/leads-schema.json';
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error('Failed to fetch JSON file');
      const jsonText = await response.text();
      return jsonText;
    } catch (error) {
      this.logger.error('Failed to load mapping fields from constant file:', error);
      return '';
    }
  }

  async loadMappingFields(): Promise<CSVJSONItems[]> {
    this.logger.debug('Loading mapping fields from JSON...');
    try {
      const jsonText = await this.loadcsvJson();
      if (!jsonText || jsonText.trim() === '') throw new Error('No JSON data loaded');

      const schema = JSON.parse(jsonText) as {
        items?: {
          properties?: Record<string, CSVJSONFieldDefinition>;
        };
      };
      const properties: Record<string, CSVJSONFieldDefinition> = schema?.items?.properties ?? {};

      const jsonFields = Object.entries(properties).map(([name, value]) => ({
        name,
        type: value.type,
        minimum: value.minimum,
        maximum: value.maximum,
        minLength: value.minLength,
        maxLength: value.maxLength,
        format: value.format,
        dateFormat: value.dateFormat,
        description: value.description,
        entityType: value.entityType,
        alias: value.alias,
        recency: value.recency,
        monetary: value.monetary,
        frequency: value.frequency,
        mandatory: value.mandatory,
        hidden: value.hidden,
      }));

      this.jsonFields$.next(jsonFields);
      return jsonFields;
    } catch (error) {
      this.logger.error('Failed to load mapping fields from JSON:', error);
      return [];
    }
  }

  async saveMapping(value: CSVJSONItems[]): Promise<void> {
    this.logger.debug('Saving mapping configuration...');

    this.jsonFields$.next(value);

    const currentModel = this.userModel$.getValue();
    if (currentModel) {
      this.userModel$.next({
        ...currentModel,
        properties: [...value],
      });
    }

    this.logger.log('Saved mapping configuration:', value);

    //Populate mappingItems$ based on value for using in scoring configuration
    const mappingItems = value.map((item) => ({
      csvField: item.name,
      aliasName: item.alias || '',
      mappingField: item.entityType || '',
    }));
    this.mappingItems$.next(mappingItems);
  }

  async saveModel(model: Model): Promise<void> {
    const normalizedModel: Model = {
      ...model,
      properties: model.properties ?? this.jsonFields$.getValue(),
    };

    this.logger.debug('Saving model...', normalizedModel);
    this.userModel$.next(normalizedModel);
  }

  async updateModelFileName(fileName: string): Promise<boolean> {
    const currentModel = this.userModel$.getValue();
    if (!currentModel) {
      this.logger.warn('Cannot update fileName: no model is loaded');
      return false;
    }

    const updatedModel: Model = {
      ...currentModel,
      fileName,
    };

    this.userModel$.next(updatedModel);
    return true;
  }

  async deleteModel(): Promise<void> {
    this.logger.debug('Deleting model...');
    this.userModel$.next(null);
  }

  addFieldToSend(field: FieldToSend, scope?: string) {
    const current = this.formToSend$.getValue();
    if (scope == 'Contactability')
      this.formToSend$.next({ ...current, contactability: [...current.contactability, field] });
    else this.formToSend$.next({ ...current, propensity: [...current.propensity, field] });
  }

  async editFieldsToSend(newField: FieldToSend, key: number, scope?: string) {
    const current = this.formToSend$.getValue();
    if (scope == 'Contactability') {
      const updated = current.contactability.map((field, index) => (index == key ? newField : field));
      this.formToSend$.next({ ...current, contactability: updated });
    } else {
      const updated = current.propensity.map((field, index) => (index == key ? newField : field));
      this.formToSend$.next({ ...current, propensity: updated });
    }
  }

  deleteField(key: number, scope?: string) {
    const current = this.formToSend$.getValue();
    if (scope == 'Contactability') {
      const updated = current.contactability.filter((_, index) => index != key);
      this.formToSend$.next({ ...current, contactability: updated });
    } else {
      const updated = current.propensity.filter((_, index) => index != key);
      this.formToSend$.next({ ...current, propensity: updated });
    }
  }

  editTotalWeight(scope: 'Contactability' | 'Propensity') {
    if (scope === 'Contactability') {
      const current = this.formToSend$.getValue().contactability;
      const total = current.reduce((sum, field) => sum + field.weight, 0);
      this.totalweightContactability$.next(total);
    } else {
      const current = this.formToSend$.getValue().propensity;
      const total = current.reduce((sum, field) => sum + field.weight, 0);
      this.totalweightPropensity$.next(total);
    }
  }

  calcolo(current: FieldToSend[], tot: number) {
    let diff = 0;

    const normalized = current.map((field, index) => {
      if (index == current.length - 1) {
        return {
          ...field,
          weight: 100 - diff,
        };
      } else {
        diff += Math.round((field.weight * 100) / tot);
        return {
          ...field,
          weight: Math.round((field.weight * 100) / tot),
        };
      }
    });
    return normalized;
  }

  normalize(scope: 'Contactability' | 'Propensity') {
    const current = this.formToSend$.getValue();
    if (scope === 'Contactability') {
      const tot = this.totalweightContactability$.getValue();
      const normalize = this.calcolo(current.contactability, tot);
      this.formToSend$.next({ ...current, contactability: normalize });
    } else {
      const tot = this.totalweightPropensity$.getValue();
      const normalize = this.calcolo(current.propensity, tot);
      this.formToSend$.next({ ...current, propensity: normalize });
    }
  }
}
