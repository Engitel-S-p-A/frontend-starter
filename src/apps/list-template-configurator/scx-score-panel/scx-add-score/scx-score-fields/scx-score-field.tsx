import {
  Component,
  ComponentInterface,
  Element,
  Event,
  EventEmitter,
  Host,
  Method,
  Prop,
  State,
  Watch,
  h,
} from '@stencil/core';
import { Subscription } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { tt } from '../../../../../libs/i18n';
import { FieldToSend, Score } from '../../../list-template-configurator.interface';
import { editType, validateNumericScore } from '../../scx-score-utilities/scx-invalid-numeric-score';

@Component({
  tag: 'scx-score-field',
  styleUrl: 'scx-score-field.scss',
  shadow: true,
})
export class ScxScoreField implements ComponentInterface {
  private subscriptions = new Subscription();
  @Element() hostEl!: HTMLElement;
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
  private destroy$ = new Subject<void>();

  connectedCallback() {
    this.subscriptions.add(
      this.numericInput$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe((valore) => {
        if (valore.part && valore.target) {
          this.handleNumericScore(valore.part, valore.target);
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

  handleEditScore(value: string, part?: 'to' | 'from') {
    if ((this.field.type === 'Numeric' || this.field.type === 'Date') && part) {
      const current = this.currentScore.numericValue;
      if (part)
        this.currentScore = {
          score: this.nScore,
          numericValue: {
            ...current,
            [part]: this.field.type === 'Numeric' ? editType(value, 'Numeric') : value,
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

  handleNumericScore(part: 'from' | 'to', target: HTMLFormElement) {
    this.handleEditScore(target.value, part);
    validateNumericScore({
      target,
      part,
      type: this.field.type as 'Numeric' | 'Date',
      currentScore: this.currentScore,
      otherScores: this.otherScore,
    });
  }
  @Method()
  async validateAndReport(): Promise<boolean> {
    if (!this.editMode || (this.field.type !== 'Numeric' && this.field.type !== 'Date')) {
      return true;
    }
    const fromInput = this.hostEl.shadowRoot?.querySelector('sl-input[data-part="from"]') as
      | (HTMLFormElement & {
          value: string;
          checkValidity: () => boolean;
          reportValidity: () => boolean;
          setCustomValidity: (msg: string) => void;
        })
      | null;
    const toInput = this.hostEl.shadowRoot?.querySelector('sl-input[data-part="to"]') as
      | (HTMLFormElement & {
          value: string;
          checkValidity: () => boolean;
          reportValidity: () => boolean;
          setCustomValidity: (msg: string) => void;
        })
      | null;

    const fromValue =
      typeof fromInput?.value === 'string' ? fromInput.value.trim() : String(fromInput?.value ?? '').trim();
    const toValue = typeof toInput?.value === 'string' ? toInput.value.trim() : String(toInput?.value ?? '').trim();

    if (fromInput && !fromValue) fromInput.setCustomValidity('');
    if (toInput && !toValue) toInput.setCustomValidity('');

    if (fromInput && fromValue) {
      validateNumericScore({
        target: fromInput,
        part: 'from',
        type: this.field.type as 'Numeric' | 'Date',
        currentScore: this.currentScore,
        otherScores: this.otherScore,
      });
    }

    if (toInput && toValue) {
      validateNumericScore({
        target: toInput,
        part: 'to',
        type: this.field.type as 'Numeric' | 'Date',
        currentScore: this.currentScore,
        otherScores: this.otherScore,
      });
    }

    const fromValid = fromInput ? !fromValue || fromInput.checkValidity() : true;
    const toValid = toInput ? !toValue || toInput.checkValidity() : true;

    if (!fromValid && fromInput) {
      fromInput.reportValidity();
      return false;
    }

    if (!toValid && toInput) {
      toInput.reportValidity();
      return false;
    }

    return true;
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
              data-part="from"
              size="small"
              type={this.field.type === 'Numeric' ? 'number' : 'date'}
              label={tt('SM.SCORE.PANEL.FROM')}
              value={this.currentScore.numericValue?.from ?? ''}
              onsl-input={(e: Event) => {
                const target = e.target as HTMLFormElement & { value: number };
                if (this.field.type === 'Numeric') this.numericInput$.next({ target: target, part: 'from' });
              }}
              onsl-change={(e: Event) => {
                if (this.field.type === 'Date') {
                  const target = e.target as HTMLFormElement;
                  if (!isNaN(new Date(target.value).getTime())) {
                    this.handleNumericScore('from', target);
                  } else {
                    target.setCustomValidity('');
                    target.reportValidity();
                  }
                }
              }}
            ></sl-input>
            <sl-input
              data-part="to"
              size="small"
              type={this.field.type === 'Numeric' ? 'number' : 'date'}
              label={tt('SM.SCORE.PANEL.TO')}
              value={this.currentScore.numericValue?.to ?? ''}
              onsl-input={(e: Event) => {
                const target = e.target as HTMLFormElement & { value: number };
                if (this.field.type === 'Numeric') this.numericInput$.next({ target: target, part: 'to' });
              }}
              onsl-change={(e: Event) => {
                if (this.field.type === 'Date') {
                  const target = e.target as HTMLFormElement;
                  if (!isNaN(new Date(target.value).getTime())) {
                    this.handleNumericScore('to', target);
                  } else {
                    target.setCustomValidity('');
                    target.reportValidity();
                  }
                }
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
