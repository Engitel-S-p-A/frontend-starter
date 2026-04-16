import {
  Component,
  ComponentInterface,
  Element,
  Event,
  EventEmitter,
  Fragment,
  Listen,
  Prop,
  State,
  Watch,
  h,
} from '@stencil/core';
import { starter } from '../../../../di/containers';
import { tt } from '../../../../libs/i18n';
import { FieldToSend, Score } from '../../list-template-configurator.interface';

type ScoreFieldElement = HTMLElement & {
  validateAndReport?: () => Promise<boolean>;
  refreshCurrentScore?: () => Promise<void>;
};

@Component({
  tag: 'scx-add-score',
  styleUrl: 'scx-add-score.scss',
  shadow: true,
})
export class ScxAddScore implements ComponentInterface {
  private templateService = starter.templateConfiguratorService;
  private scoringService = starter.templateConfiguratorService;
  private initField: FieldToSend = {
    id: 0,
    name: '',
    type: '',
    weight: 0,
    scores: [],
  };
  @Event() addField!: EventEmitter<FieldToSend>;
  @Event() deleteField!: EventEmitter<number>;
  @Event() editField!: EventEmitter<{ field: FieldToSend; key: number }>;
  @Event() closeNewDialog!: EventEmitter;
  @State() editMode = false;
  @State() checkSwitch: 1 | 3 | null = null;
  @State() fieldScore: FieldToSend = { ...this.initField };
  @State() scores: Score[] = [];
  @Prop() addNewField?: boolean;
  @Prop() fieldIndex = 0;
  @Prop() scope!: 'Contactability' | 'Propensity';
  @Prop() field: FieldToSend = { ...this.initField };
  @Element() hostEl!: HTMLElement;

  async componentWillLoad() {
    this.fieldScore = { ...this.field };
    this.scores = [...this.fieldScore.scores];
    if (this.addNewField) this.editMode = true;
    if (this.field.type === 'Boolean') {
      const value = this.field.scores.find((score) => score.boolValue)?.score;
      if (value == 1 || value == 3) this.checkSwitch = value;
      else this.checkSwitch = null;
    }
  }

  @Watch('field')
  watchFieldHandler() {
    this.fieldScore = { ...this.field };
  }

  selectNameFilter(used: Set<string>) {
    const all = this.templateService.mappingItems$.getValue();
    return all.filter((f) => {
      const name = f.aliasName ? f.aliasName : f.csvField;
      return !used.has(name) || name === this.fieldScore.name;
    });
  }

  get selectOptions() {
    if (this.scope == 'Contactability') {
      const used = new Set(this.scoringService.formToSend$.getValue().contactability.map((f) => f.name));
      return this.selectNameFilter(used);
    } else {
      const used = new Set(this.scoringService.formToSend$.getValue().propensity.map((f) => f.name));
      return this.selectNameFilter(used);
    }
  }

  async handleAdd() {
    this.fieldScore = {
      ...this.fieldScore,
      scores: this.scores,
    };
    this.addField.emit(this.fieldScore);
    this.editMode = false;
    await this.refreshScoreFields();
  }

  async refreshScoreFields(): Promise<void> {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const scoreFields = Array.from(
      this.hostEl.shadowRoot?.querySelectorAll('scx-score-field') ?? []
    ) as ScoreFieldElement[];

    await Promise.all(
      scoreFields.map((scoreField) =>
        scoreField.refreshCurrentScore ? scoreField.refreshCurrentScore() : Promise.resolve()
      )
    );
  }

  handleDelete() {
    this.deleteField.emit(this.fieldIndex);
    this.closeDialog();
  }

  async closeDialog() {
    this.editMode = false;
    this.fieldScore = { ...this.field };
    this.scores = [...this.fieldScore.scores];
    if (this.addNewField) {
      this.closeNewDialog.emit();
    }
    await this.refreshScoreFields();
  }

  async handleChange() {
    this.fieldScore = {
      ...this.fieldScore,
      scores: this.scores,
    };
    this.editField.emit({
      field: this.fieldScore,
      key: this.fieldIndex,
    });
    this.editMode = false;
    await this.refreshScoreFields();
  }

  getScores(nScore: number) {
    return (
      <scx-score-field
        field={this.fieldScore}
        scores={this.scores.length > 0 ? this.scores.filter((score) => score.score === nScore)[0] : undefined}
        nScore={nScore}
        editMode={this.editMode}
        switch={nScore != 2 ? this.checkSwitch : null}
        otherScore={this.scores.filter((score) => score.score != nScore)}
      ></scx-score-field>
    );
  }

  totalWeightEdit(e: Event) {
    const target = e.target as HTMLInputElement;

    if (target) {
      this.fieldScore = {
        ...this.fieldScore,
        weight: Number(target.value),
      };

      if (!this.addNewField && !this.editMode) {
        this.editField.emit({
          field: this.fieldScore,
          key: this.fieldIndex,
        });
      }
    }
  }

  emptyScore(score: Score) {
    const keys = Object.keys(score);
    return keys.length === 1 && keys[0] === 'score';
  }

  @Listen('editCheck')
  handleEditCheck(event: CustomEvent<1 | 3 | null>) {
    this.checkSwitch = event.detail;
  }

  @Listen('editScore')
  handleEditScores(event: CustomEvent<Score>) {
    const newScore = event.detail;
    const updatedScores = [...this.scores];
    const index = updatedScores.findIndex((s) => s.score === newScore.score);

    if (index !== -1) {
      if (this.emptyScore(newScore)) updatedScores.splice(index, 1);
      else updatedScores[index] = newScore;
    } else updatedScores.push(newScore);

    const type = this.fieldScore.type;
    this.scores = updatedScores.filter((score) => {
      if (type == 'String' && score.arrayValue) return true;
      else if (type == 'Numeric' && score.numericValue && typeof score.numericValue.from === 'number') return true;
      else if (type == 'Date' && score.numericValue && typeof score.numericValue.from === 'string') return true;
      else if (type == 'Boolean' && score.boolValue && score.score === this.checkSwitch) return true;
    });
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const scoreFields = Array.from(form.querySelectorAll('scx-score-field')) as ScoreFieldElement[];
    const customValidationResults = await Promise.all(
      scoreFields.map((scoreField) =>
        scoreField.validateAndReport ? scoreField.validateAndReport() : Promise.resolve(true)
      )
    );
    if (customValidationResults.some((isValid) => !isValid)) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (this.addNewField) {
      this.handleAdd();
    } else {
      this.handleChange();
    }
  }

  render() {
    return (
      <Fragment>
        <sl-card class="card-header">
          <div slot="header" class={`card-header__header ${!this.editMode && 'closed'}`}>
            <div class="card-header__content">
              <sl-icon
                name={
                  this.fieldScore.type === 'String'
                    ? 'cv-form-input-string'
                    : this.fieldScore.type === 'Numeric'
                      ? 'cv-form-input-number'
                      : this.fieldScore.type === 'Date'
                        ? 'cv-form-data'
                        : 'cv-confirm'
                }
                label="Settings"
              ></sl-icon>
              {this.editMode && !this.fieldScore.name ? (
                <h4>{tt('SM.SCORING.PANEL.ADD')}</h4>
              ) : (
                <h4>{this.fieldScore.name}</h4>
              )}
            </div>
            <div class="card-header__contentright">
              {!this.editMode && (
                <sl-icon name="cv-write-strong" label="Edit" onClick={() => (this.editMode = true)}></sl-icon>
              )}
              {!this.addNewField && <sl-icon name="cv-bin" onClick={() => this.handleDelete()}></sl-icon>}
            </div>
          </div>
          <div class="card-body">
            <form
              onSubmit={(e: Event) => {
                this.handleSubmit(e);
              }}
            >
              <div class="card-body__div">
                {this.editMode && (
                  <>
                    <div class="card-body__select">
                      <h5>
                        {tt('SM.ADD.SCORE.SELECT')}
                        <span> *</span>
                      </h5>
                      <sl-select
                        required
                        value={this.fieldScore.name != '' && this.fieldScore.name}
                        size="small"
                        onsl-change={(e: Event) => {
                          const target = e.target as HTMLFormElement & { value: string };
                          this.fieldScore = {
                            ...this.fieldScore,
                            name: target.value,
                          };
                        }}
                      >
                        {this.selectOptions.map((field) => (
                          <sl-option value={field.aliasName ? field.aliasName : field.csvField}>
                            {field.aliasName ? field.aliasName : field.csvField}
                          </sl-option>
                        ))}
                      </sl-select>
                    </div>
                  </>
                )}

                <div>{tt('SM.ADD.SCORE.WEIGHT')}</div>
                <sl-range value={this.fieldScore.weight} onsl-change={(e: Event) => this.totalWeightEdit(e)}></sl-range>
                <div class="scorebox scorebox__range">{this.fieldScore.weight}%</div>
              </div>
              {this.editMode && (
                <div class="card-body__fieldtype">
                  <h5>{tt('SM.ADD.SCORE.TYPE')}</h5>
                  <sl-radio-group
                    name="a"
                    value={this.fieldScore.type}
                    orientation="horizontal"
                    onsl-change={(e: Event) => {
                      const target = e.target as HTMLFormElement & { value: string };
                      this.fieldScore = {
                        ...this.fieldScore,
                        type: target.value,
                      };
                    }}
                  >
                    <sl-radio value="Unset">{tt('SM.ADD.SCORE.UNSET')}</sl-radio>
                    <sl-radio value="Numeric">{tt('SM.ADD.SCORE.NUMERIC')}</sl-radio>
                    <sl-radio value="Date">{tt('SM.ADD.SCORE.DATE')}</sl-radio>
                    <sl-radio value="String">{tt('SM.ADD.SCORE.STRING')}</sl-radio>
                    <sl-radio value="Boolean">{tt('SM.ADD.SCORE.BOOLEAN')}</sl-radio>
                  </sl-radio-group>
                  <div class="disclaimer">{tt('SM.ADD.SCORE.DISCLAIMER')}</div>
                </div>
              )}
              <div class={!this.editMode ? 'scores' : ''}>
                {Array.from({ length: 3 }, (_, i) => i)
                  .reverse()
                  .map((val) => this.getScores(val + 1))}
              </div>

              {this.editMode && (
                <div class="card-body__buttons">
                  <sl-button variant="text" size="medium" onClick={() => this.closeDialog()}>
                    {tt('SM.BUTTON.CANCEL')}
                  </sl-button>
                  <sl-button type="submit" variant="neutral" size="medium">
                    {tt('SM.BUTTON.CONFIRM')}
                  </sl-button>
                </div>
              )}
            </form>
          </div>
        </sl-card>
      </Fragment>
    );
  }
}
