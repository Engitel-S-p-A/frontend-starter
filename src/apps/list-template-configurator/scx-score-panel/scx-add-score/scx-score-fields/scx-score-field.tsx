import { Component, ComponentInterface, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { Subscription } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { tt } from '../../../../../libs/i18n';
import { FieldToSend, Score } from '../../../list-template-configurator.interface';

@Component({
  tag: 'scx-score-field',
  styleUrl: 'scx-score-field.scss',
  shadow: true,
})
export class ScxScoreField implements ComponentInterface {
  private subscriptions = new Subscription();
  @Event() editScore!: EventEmitter<Score>;
  @Event() deleteScore!: EventEmitter<number>;
  @Event() editCheck!: EventEmitter<1 | 3 | null>;
  @Prop() field!: FieldToSend;
  @Prop() editMode!: boolean;
  @Prop() nScore!: number;
  @Prop() switch?: 1 | 3 | null;
  @Prop() otherScore: Score[] = [];
  @State() currentScore: Score = { score: 0 };
  private numericInput$ = new Subject<{ target?: HTMLFormElement; part?: 'from' | 'to' }>();
  private numericInputTo$ = new Subject<HTMLFormElement | null>();
  private destroy$ = new Subject<void>();

  connectedCallback() {
    this.subscriptions.add(
      this.numericInput$.pipe(debounceTime(200), takeUntil(this.destroy$)).subscribe((valore) => {
        if (valore.part && valore.target) {
          this.handleNumericScore(valore.part, valore.target);
        }
      })
    );

    this.subscriptions.add(
      this.numericInputTo$.pipe(debounceTime(200), takeUntil(this.destroy$)).subscribe((valore) => {
        if (valore) {
          this.handleNumericTo(valore);
        }
      })
    );
  }

  disconnectedCallback() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  emptyScore(score: Score) {
    const keys = Object.keys(score);
    return keys.length === 1 && keys[0] === 'score';
  }
  async componentWillLoad() {
    const current = this.field.scores.find((score) => score.score == this.nScore);
    if (current) this.currentScore = current;
    else this.currentScore.score = this.nScore;
  }

  @Watch('field')
  handleFieldChange() {
    const current = this.field.scores.find((score) => score.score == this.nScore);
    if (current) {
      this.currentScore = { ...current };
    } else {
      this.currentScore = { score: this.nScore };
    }
  }

  @Watch('switch')
  handleSwitchChange() {
    this.currentScore = {
      ...this.currentScore,
      boolValue: this.switch === this.nScore,
    };
  }

  clear() {
    this.currentScore = { score: this.nScore };
    this.editScore.emit(this.currentScore);
  }

  handleEditScore(value: string | number | boolean, part?: 'to' | 'from') {
    if ((this.field.type === 'Numeric' || this.field.type === 'Date') && part) {
      const current = this.currentScore.numericValue;
      if (part)
        this.currentScore = {
          score: this.nScore,
          numericValue: {
            ...current,
            [part]: value,
          },
        };
    } else if (this.field.type === 'String') {
      if (value == '') this.currentScore = { score: this.nScore };
      else {
        const str = String(value);
        this.currentScore = {
          score: this.nScore,
          arrayValue: str
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v !== ''),
        };
      }
    } else if (this.field.type === 'Boolean' && typeof value === 'boolean') {
      this.currentScore = {
        score: this.nScore,
        boolValue: value,
      };
      this.editCheck.emit(value ? (this.nScore as 1 | 3) : null);
    }
    this.editScore.emit(this.currentScore);
  }
  editTypeFromTo(val: string | Date | number) {
    let newVal = val;
    if (this.field.type === 'Date') {
      newVal = new Date(val);
    } else newVal = Number(val);
    return newVal;
  }

  handleNumericScore(part: 'from' | 'to', target: HTMLFormElement, validTo?: boolean) {
    let val = target.value;
    const isDuplicate = this.otherScore.some((score) => {
      let from = score.numericValue?.from;
      let to = score.numericValue?.to;
      if (from !== undefined && to !== undefined) {
        from = this.editTypeFromTo(from);
        to = this.editTypeFromTo(to);
        val = this.editTypeFromTo(val);
        return val >= from && val <= to;
      }
    });

    if (isDuplicate) {
      target.setCustomValidity('Valore già presente! Inserirne uno nuovo');
      target.reportValidity();
    } else if (validTo || part === 'from') {
      target.setCustomValidity('');
    }
    this.handleEditScore(target.value, part);
  }

  handleNumericTo(target: HTMLFormElement) {
    const value = this.editTypeFromTo(target.value);
    let validTo = false;
    let from = this.currentScore.numericValue?.from;
    from = from && this.editTypeFromTo(from);
    const isInvalidRange = from && value <= from;
    let zero = this.editTypeFromTo('0');
    let result = this.otherScore.reduce((acc, score) => {
      let scoreFrom = score.numericValue?.from;
      scoreFrom = scoreFrom && this.editTypeFromTo(scoreFrom);
      if (from && scoreFrom && from < scoreFrom) {
        if (acc != zero && scoreFrom > acc) {
          return acc;
        } else return scoreFrom;
      }
      return acc;
    }, zero);
    if (this.field.type === 'Date') {
      zero = (zero as Date).getTime();
      result = (result as Date).getTime();
    }
    if (isInvalidRange) {
      target.setCustomValidity('inserire valore maggiore di from');
      target.reportValidity();
    } else if ((result != zero && result <= value) || (result != zero && !value)) {
      target.setCustomValidity('Stai coprendo un range già esistente. Inserire valore corretto');
      target.reportValidity();
    } else validTo = true;
    this.handleNumericScore('to', target, validTo);
  }

  getComponent() {
    switch (this.field.type) {
      case 'Boolean':
        return this.editMode ? (
          this.editMode && (
            <sl-switch
              onsl-change={(e: Event) => {
                const target = e.target as HTMLFormElement & { value: boolean };
                this.handleEditScore(target.checked);
              }}
              disabled={this.nScore === 2}
              checked={this.currentScore.boolValue}
            >
              {tt('SM.SCORE.PANEL.BOOLEAN')}
            </sl-switch>
          )
        ) : (
          <p>{this.currentScore.boolValue ? 'true' : 'false'}</p>
        );
      case 'String':
        return this.editMode ? (
          <sl-input
            size="small"
            value={this.currentScore.arrayValue ? this.currentScore.arrayValue.join(',') : ''}
            label={this.field.name}
            onsl-input={(e: Event) => {
              const target = e.target as HTMLFormElement & { value: string };
              this.handleEditScore(target.value);
            }}
          ></sl-input>
        ) : (
          <p>{this.currentScore.arrayValue?.join(',')}</p>
        );
      case 'Numeric':
      case 'Date':
        return this.editMode ? (
          <div class="scorebox__header__numeric">
            <sl-input
              size="small"
              type={this.field.type === 'Numeric' ? 'number' : 'date'}
              label={tt('SM.SCORE.PANEL.FROM')}
              value={this.currentScore.numericValue?.from ?? ''}
              onsl-input={(e: Event) => {
                const target = e.target as HTMLFormElement & { value: number };
                this.numericInput$.next({ target: target, part: 'from' });
              }}
            ></sl-input>
            <sl-input
              size="small"
              type={this.field.type === 'Numeric' ? 'number' : 'date'}
              label={tt('SM.SCORE.PANEL.TO')}
              value={this.currentScore.numericValue?.to ?? ''}
              onsl-input={(e: Event) => {
                const target = e.target as HTMLFormElement & { value: number };
                this.numericInputTo$.next(target);
              }}
            ></sl-input>
          </div>
        ) : (
          <p>
            {this.currentScore.numericValue &&
              `${this.currentScore.numericValue?.from ?? ''} ${this.currentScore.numericValue?.to ? '- ' + this.currentScore.numericValue?.to : '+'} `}
          </p>
        );
    }
  }

  render() {
    return (
      <Host>
        {this.field.type !== '' && this.field.type !== 'Unset' && (
          <div class={`scorebox ${!this.editMode && 'closed'}`}>
            <div class="scorebox__header">
              {(this.editMode || (!this.editMode && !this.emptyScore(this.currentScore))) && (
                <div>
                  <sl-tag
                    size="medium"
                    variant={this.nScore === 1 ? `danger` : this.nScore === 2 ? `warning` : `success`}
                  >
                    {this.nScore}
                  </sl-tag>
                  <div>{this.getComponent()}</div>
                </div>
              )}
              {this.field.type !== 'Boolean' && this.editMode && (
                <sl-button variant="button" size="small" onClick={() => this.clear()}>
                  {tt('SM.SCORE.PANEL.CLEAR')}
                </sl-button>
              )}
            </div>
          </div>
        )}
      </Host>
    );
  }
}
