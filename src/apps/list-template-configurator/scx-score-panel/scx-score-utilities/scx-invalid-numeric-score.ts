import { Score } from '../../list-template-configurator.interface';

export interface NumericScoreValidationParams {
  target: HTMLFormElement;
  part: 'from' | 'to';
  type: 'Numeric' | 'Date';
  currentScore: Score;
  otherScores: Score[];
}

export function validateNumericScore({ target, part, type, currentScore, otherScores }: NumericScoreValidationParams) {
  const val = editType(target.value, type);
  let from = currentScore.numericValue?.from;
  from = from && editType(from, type);
  let currentPart = currentScore.numericValue?.[part === 'from' ? 'to' : 'from'];
  currentPart = currentPart && editType(currentPart, type);
  const isInvalidRange = currentPart && (part === 'from' ? val >= currentPart : val <= currentPart);
  let zero = editType('0', type);

  if (currentScore.numericValue?.from !== undefined && currentScore.numericValue?.to !== undefined) {
    let result = otherScores.reduce((acc, score) => {
      let scoreFrom = score.numericValue?.from;
      scoreFrom = scoreFrom && editType(scoreFrom, type);
      if (from && scoreFrom && from < scoreFrom) {
        if (acc != zero && scoreFrom > acc) {
          return acc;
        } else return scoreFrom;
      }
      return acc;
    }, zero);
    if (type === 'Date') {
      zero = (zero as Date).getTime();
      result = (result as Date).getTime();
    }
    if ((result != zero && result <= currentScore.numericValue?.to) || (result != zero && !val)) {
      target.setCustomValidity('Stai coprendo un range già esistente. Inserire valore corretto');
      target.reportValidity();
      return;
    } else target.setCustomValidity('');
  }
  const isDuplicate = otherScores.some((score) => {
    let from = score.numericValue?.from;
    let to = score.numericValue?.to;
    if (from !== undefined && to !== undefined) {
      from = editType(from, type);
      to = editType(to, type);
      return val >= from && val <= to;
    }
  });
  if (isInvalidRange && target.value !== '') {
    target.setCustomValidity(part === 'to' ? 'Inserire valore maggiore di from' : 'Inserire valore minore di to');
    target.reportValidity();
    return;
  } else if (isDuplicate) {
    target.setCustomValidity('Valore già presente! Inserirne uno nuovo');
    target.reportValidity();
  } else target.setCustomValidity('');
}

export function editType(val: string | Date | number, type: 'Numeric' | 'Date') {
  let newVal = val;
  if (type === 'Date') {
    newVal = new Date(val);
  } else newVal = Number(val);
  return newVal;
}
