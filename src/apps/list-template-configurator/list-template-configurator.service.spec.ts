import { Container } from 'inversify';
import 'reflect-metadata';
import { LOGGER_TYPES } from '../../di/types';
import type { ILogger } from '../../libs/logger';
import { StarterDebugNamespaces } from '../../libs/logger';
import type { CSVJSONItems, FieldToSend, Model } from './list-template-configurator.interface';
import { ListTemplateConfiguratorService } from './list-template-configurator.service';
import { LIST_TEMPLATE_CONFIGURATOR_TYPES } from './list-template-configurator.types';

describe('ListTemplateConfiguratorService', () => {
  let container: Container;
  let service: ListTemplateConfiguratorService;
  let mockLogger: jest.Mocked<ILogger>;
  let mockLoggerInstance: {
    debug: jest.Mock;
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    mockLoggerInstance = {
      debug: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    mockLogger = {
      getLogger: jest.fn().mockReturnValue(mockLoggerInstance),
    };

    container = new Container();
    container.bind(LOGGER_TYPES.Logger).toConstantValue(mockLogger);
    container.bind(LIST_TEMPLATE_CONFIGURATOR_TYPES.TemplateConfiguratorService).to(ListTemplateConfiguratorService);

    service = container.get<ListTemplateConfiguratorService>(
      LIST_TEMPLATE_CONFIGURATOR_TYPES.TemplateConfiguratorService
    );
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      expect(service.mappingItems$.value).toEqual([]);
      expect(service.JSONFields$.value).toEqual([]);
      expect(service.UserModel$.value).toBeNull();
      expect(service.fieldsToSend$.value).toEqual([]);
      expect(service.formToSend$.value).toEqual({ contactability: [], propensity: [] });
      expect(service.totalweight$.value).toBe(0);
      expect(service.totalweightContactability$.value).toBe(0);
      expect(service.totalweightPropensity$.value).toBe(0);
    });

    it('should get logger with TemplateConfigurator namespace', () => {
      expect(mockLogger.getLogger).toHaveBeenCalledWith(StarterDebugNamespaces.TemplateConfigurator);
    });
  });

  describe('LoadcsvJson', () => {
    it('should load json text successfully', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('{"items":{"properties":{}}}'),
      });
      global.fetch = mockFetch as typeof fetch;

      const result = await service.LoadcsvJson();

      expect(mockFetch).toHaveBeenCalledWith('../../assets/data/leads-schema.json');
      expect(result).toBe('{"items":{"properties":{}}}');
    });

    it('should return empty string when fetch fails', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch as typeof fetch;

      const result = await service.LoadcsvJson();

      expect(result).toBe('');
    });
  });

  describe('loadMappingFields', () => {
    it('should load mapping fields successfully', async () => {
      jest.spyOn(service, 'LoadcsvJson').mockResolvedValue(`{
        "items": {
          "properties": {
            "id_lista": {
              "type": "integer",
              "minimum": 3,
              "maximum": 3,
              "alias": "list_id",
              "recency": true,
              "mandatory": true
            },
            "email": {
              "type": "string",
              "format": "email",
              "entityType": "email",
              "hidden": false
            }
          }
        }
      }`);

      const result = await service.loadMappingFields();

      expect(result).toEqual([
        {
          name: 'id_lista',
          type: 'integer',
          minimum: 3,
          maximum: 3,
          minLength: undefined,
          maxLength: undefined,
          format: undefined,
          dateFormat: undefined,
          description: undefined,
          entityType: undefined,
          alias: 'list_id',
          recency: true,
          monetary: undefined,
          frequency: undefined,
          mandatory: true,
          hidden: undefined,
        },
        {
          name: 'email',
          type: 'string',
          minimum: undefined,
          maximum: undefined,
          minLength: undefined,
          maxLength: undefined,
          format: 'email',
          dateFormat: undefined,
          description: undefined,
          entityType: 'email',
          alias: undefined,
          recency: undefined,
          monetary: undefined,
          frequency: undefined,
          mandatory: undefined,
          hidden: false,
        },
      ]);
      expect(service.JSONFields$.value).toEqual(result);
    });

    it('should return empty array when no data is loaded', async () => {
      jest.spyOn(service, 'LoadcsvJson').mockResolvedValue('');

      const result = await service.loadMappingFields();

      expect(result).toEqual([]);
      expect(service.JSONFields$.value).toEqual([]);
      expect(mockLoggerInstance.error).toHaveBeenCalled();
    });

    it('should return empty array for invalid json', async () => {
      jest.spyOn(service, 'LoadcsvJson').mockResolvedValue('{invalid json}');

      const result = await service.loadMappingFields();

      expect(result).toEqual([]);
      expect(mockLoggerInstance.error).toHaveBeenCalled();
    });
  });

  describe('saveMapping', () => {
    const mappingFields: CSVJSONItems[] = [
      { name: 'phone', entityType: 'landline', alias: 'telephone', mandatory: true },
      { name: 'customer_email', entityType: 'email', hidden: true },
    ];

    it('should save json fields and mapping items', async () => {
      await service.saveMapping(mappingFields);

      expect(service.JSONFields$.value).toEqual(mappingFields);
      expect(service.mappingItems$.value).toEqual([
        { csvField: 'phone', aliasName: 'telephone', mappingField: 'landline' },
        { csvField: 'customer_email', aliasName: '', mappingField: 'email' },
      ]);
    });

    it('should update current user model properties if a model exists', async () => {
      const model: Model = {
        id: 'model-1',
        name: 'My Model',
        fileName: 'model.csv',
        properties: [],
      };
      await service.saveModel(model);

      await service.saveMapping(mappingFields);

      expect(service.UserModel$.value).toEqual({
        ...model,
        properties: mappingFields,
      });
    });
  });

  describe('model management', () => {
    it('should save model with existing properties', async () => {
      const model: Model = {
        id: 'model-1',
        name: 'My Model',
        fileName: 'model.csv',
        properties: [{ name: 'field_1', type: 'string' }],
      };

      await service.saveModel(model);

      expect(service.UserModel$.value).toEqual(model);
    });

    it('should default model properties from JSONFields when missing', async () => {
      const jsonFields: CSVJSONItems[] = [{ name: 'field_1', type: 'string' }];
      service.JSONFields$.next(jsonFields);

      await service.saveModel({
        id: 'model-1',
        name: 'My Model',
        fileName: 'model.csv',
        properties: undefined as unknown as CSVJSONItems[],
      });

      expect(service.UserModel$.value).toEqual({
        id: 'model-1',
        name: 'My Model',
        fileName: 'model.csv',
        properties: jsonFields,
      });
    });

    it('should delete model', async () => {
      await service.saveModel({
        id: 'model-1',
        name: 'My Model',
        fileName: 'model.csv',
        properties: [],
      });

      await service.deleteModel();

      expect(service.UserModel$.value).toBeNull();
    });

    it('should update model fileName when a model exists', async () => {
      await service.saveModel({
        id: 'model-1',
        name: 'My Model',
        fileName: 'model.csv',
        properties: [],
      });

      const result = await service.updateModelFileName('updated-model.csv');

      expect(result).toBe(true);
      expect(service.UserModel$.value?.fileName).toBe('updated-model.csv');
    });

    it('should return false when updating fileName without model', async () => {
      const result = await service.updateModelFileName('updated-model.csv');

      expect(result).toBe(false);
      expect(mockLoggerInstance.warn).toHaveBeenCalledWith('Cannot update fileName: no model is loaded');
    });
  });

  describe('field state management', () => {
    const contactabilityField: FieldToSend = {
      id: 1,
      name: 'contactability_score',
      type: 'number',
      weight: 30,
      scores: [],
    };

    const propensityField: FieldToSend = {
      id: 2,
      name: 'propensity_score',
      type: 'number',
      weight: 70,
      scores: [],
    };

    it('should add field to contactability scope', () => {
      service.addFieldToSend(contactabilityField, 'Contactability');

      expect(service.formToSend$.value.contactability).toEqual([contactabilityField]);
      expect(service.formToSend$.value.propensity).toEqual([]);
    });

    it('should add field to propensity scope', () => {
      service.addFieldToSend(propensityField, 'Propensity');

      expect(service.formToSend$.value.propensity).toEqual([propensityField]);
      expect(service.formToSend$.value.contactability).toEqual([]);
    });

    it('should edit field in contactability scope', async () => {
      service.addFieldToSend(contactabilityField, 'Contactability');

      const updatedField: FieldToSend = { ...contactabilityField, weight: 50 };
      await service.editFieldsToSend(updatedField, 0, 'Contactability');

      expect(service.formToSend$.value.contactability).toEqual([updatedField]);
    });

    it('should edit field in propensity scope', async () => {
      service.addFieldToSend(propensityField, 'Propensity');

      const updatedField: FieldToSend = { ...propensityField, weight: 90 };
      await service.editFieldsToSend(updatedField, 0, 'Propensity');

      expect(service.formToSend$.value.propensity).toEqual([updatedField]);
    });

    it('should delete field from contactability scope', () => {
      service.addFieldToSend(contactabilityField, 'Contactability');
      service.deleteField(0, 'Contactability');

      expect(service.formToSend$.value.contactability).toEqual([]);
    });

    it('should delete field from propensity scope', () => {
      service.addFieldToSend(propensityField, 'Propensity');
      service.deleteField(0, 'Propensity');

      expect(service.formToSend$.value.propensity).toEqual([]);
    });
  });

  describe('weight management', () => {
    beforeEach(() => {
      service.formToSend$.next({
        contactability: [
          { id: 1, name: 'field_1', type: 'number', weight: 20, scores: [] },
          { id: 2, name: 'field_2', type: 'number', weight: 30, scores: [] },
        ],
        propensity: [
          { id: 3, name: 'field_3', type: 'number', weight: 10, scores: [] },
          { id: 4, name: 'field_4', type: 'number', weight: 15, scores: [] },
        ],
      });
    });

    it('should calculate total weight for contactability', () => {
      service.editTotalWeight('Contactability');

      expect(service.totalweightContactability$.value).toBe(50);
    });

    it('should calculate total weight for propensity', () => {
      service.editTotalWeight('Propensity');

      expect(service.totalweightPropensity$.value).toBe(25);
    });

    it('should normalize weights for contactability to 100', () => {
      service.editTotalWeight('Contactability');
      service.normalize('Contactability');

      const weights = service.formToSend$.value.contactability.map((field) => field.weight);
      expect(weights.reduce((sum, weight) => sum + weight, 0)).toBe(100);
    });

    it('should normalize weights for propensity to 100', () => {
      service.editTotalWeight('Propensity');
      service.normalize('Propensity');

      const weights = service.formToSend$.value.propensity.map((field) => field.weight);
      expect(weights.reduce((sum, weight) => sum + weight, 0)).toBe(100);
    });

    it('should calculate normalized values through calcolo', () => {
      const result = service.calcolo(
        [
          { id: 1, name: 'field_1', type: 'number', weight: 20, scores: [] },
          { id: 2, name: 'field_2', type: 'number', weight: 30, scores: [] },
        ],
        50
      );

      expect(result).toEqual([
        { id: 1, name: 'field_1', type: 'number', weight: 40, scores: [] },
        { id: 2, name: 'field_2', type: 'number', weight: 60, scores: [] },
      ]);
    });
  });

  describe('BehaviorSubject state management', () => {
    it('should emit initial values to subscribers', (done) => {
      service.JSONFields$.subscribe((fields) => {
        expect(Array.isArray(fields)).toBe(true);
        done();
      });
    });

    it('should emit updates to all subscribers', async () => {
      const emissions: CSVJSONItems[][] = [];
      const mappingFields: CSVJSONItems[] = [{ name: 'field_1', type: 'string' }];
      service.JSONFields$.subscribe((fields) => emissions.push([...fields]));

      await service.saveMapping(mappingFields);

      expect(emissions.length).toBeGreaterThan(1);
      expect(emissions[emissions.length - 1]).toEqual(mappingFields);
    });
  });
});
