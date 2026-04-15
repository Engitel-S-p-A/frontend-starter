import { editType, validateNumericScore } from './scx-invalid-numeric-score';

describe('scx-invalid-numeric-score utilities', () => {
  let target: HTMLFormElement;
  let setCustomValiditySpy: jest.SpyInstance;
  let reportValiditySpy: jest.SpyInstance;

  beforeEach(() => {
    // Create a mock form element
    target = document.createElement('form');
    // Mock setCustomValidity and reportValidity
    setCustomValiditySpy = jest.spyOn(target, 'setCustomValidity');
    reportValiditySpy = jest.spyOn(target, 'reportValidity');
    // Add a value property to simulate input
    Object.defineProperty(target, 'value', {
      value: '5',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('editType', () => {
    it('should convert to number for Numeric type', () => {
      expect(editType('10', 'Numeric')).toBe(10);
      expect(editType(20, 'Numeric')).toBe(20);
    });
    it('should convert to Date for Date type', () => {
      const date = new Date('2023-01-01');
      expect(editType('2023-01-01', 'Date')).toEqual(date);
      expect(editType(date, 'Date')).toEqual(date);
    });
  });

  describe('validateNumericScore', () => {
    const baseScore = {
      numericValue: { from: 1, to: 10 },
    };
    const otherScores = [{ numericValue: { from: 11, to: 20 } }, { numericValue: { from: 21, to: 30 } }];

    it('should set validity error for duplicate value', () => {
      Object.defineProperty(target, 'value', { value: '12' });
      validateNumericScore({
        target,
        part: 'from',
        type: 'Numeric',
        currentScore: baseScore as any,
        otherScores: otherScores as any,
      });
      expect(setCustomValiditySpy).toHaveBeenCalledWith('Valore già presente! Inserirne uno nuovo');
      expect(reportValiditySpy).toHaveBeenCalled();
    });

    it('should set validity error for invalid range', () => {
      Object.defineProperty(target, 'value', { value: '15' });
      validateNumericScore({
        target,
        part: 'from',
        type: 'Numeric',
        currentScore: { numericValue: { from: 20, to: 10 } } as any,
        otherScores: [] as any,
      });
      expect(setCustomValiditySpy).toHaveBeenCalledWith('Inserire valore minore di to');
      expect(reportValiditySpy).toHaveBeenCalled();
    });

    it('should clear validity if value is valid', () => {
      Object.defineProperty(target, 'value', { value: '5' });
      validateNumericScore({
        target,
        part: 'from',
        type: 'Numeric',
        currentScore: { numericValue: { from: 5, to: 10 } } as any,
        otherScores: [] as any,
      });
      expect(setCustomValiditySpy).toHaveBeenCalledWith('');
    });
  });
});
