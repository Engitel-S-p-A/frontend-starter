import { Component, ComponentInterface, Listen, Prop, State, Watch, h } from '@stencil/core';
import { Subscription } from 'rxjs';
import { starter } from '../../../di/containers';
import { tt } from '../../../libs/i18n';
import { FieldToSend, FormToSend } from '../list-template-configurator.interface';

@Component({
  tag: 'scx-score-panel',
  styleUrl: 'scx-score-panel.scss',
  shadow: true,
})
export class ScxScorePanel implements ComponentInterface {
  private scoringService = starter.templateConfiguratorService;
  private subscriptions: Subscription[] = [];
  @State() fieldsToSend: FieldToSend[] = [];
  @State() formToSend: FormToSend = { contactability: [], propensity: [] };
  @State() addNewField = false;
  @State() totalWeight = 0;
  @Prop() scope!: 'Contactability' | 'Propensity';
  text =
    this.scope == 'Contactability'
      ? tt('SM.SCORING.PANEL.EMPTY.CONTACTABILITY').split('{br}')
      : tt('SM.SCORING.PANEL.EMPTY.PROPENSITY').split('{br}');
  async componentWillLoad() {
    this.subscriptions.push(
      this.scoringService.formToSend$.subscribe((fields) => {
        this.fieldsToSend = this.scope === 'Contactability' ? fields.contactability : fields.propensity;
      })
    );

    if (this.scope === 'Contactability')
      this.subscriptions.push(
        this.scoringService.totalweightContactability$.subscribe((fields) => {
          this.totalWeight = fields;
        })
      );
    else
      this.subscriptions.push(
        this.scoringService.totalweightPropensity$.subscribe((fields) => {
          this.totalWeight = fields;
        })
      );
  }

  @Watch('fieldsToSend')
  editWeight() {
    this.scoringService.editTotalWeight(this.scope);
  }

  @Listen('addField')
  handleAddField(event: CustomEvent<FieldToSend>) {
    this.addNewField = false;
    this.scoringService.addFieldToSend(event.detail, this.scope);
  }
  @Listen('deleteField')
  handleDeleteField(event: CustomEvent<number>) {
    this.scoringService.deleteField(event.detail, this.scope);
  }

  @Listen('closeNewDialog')
  handleCloseNewDialog() {
    this.addNewField = false;
  }

  @Listen('editField')
  handleChangeField(event: CustomEvent<{ field: FieldToSend; key: number }>) {
    this.scoringService.editFieldsToSend(event.detail.field, event.detail.key, this.scope);
  }
  disconnectedCallback() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  render() {
    return (
      <div class="singleScorePanel">
        <div class="score-panel-header">
          <div class="score-panel-header__title">
            {this.scope == 'Contactability' ? tt('SM.SCORING.PANEL.CONTACTABILITY') : tt('SM.SCORING.PANEL.PROPENSITY')}
          </div>
          <div class="score-panel-header__amount">
            <p
              class={`score-panel-header__amount__value ${this.totalWeight != 100 && this.totalWeight != 0 && `score-panel-header__amount__value`}`}
            >
              {tt('SM.SCORING.PANEL.TOTAL')}&nbsp;&nbsp;
              <span
                class={`weight ${this.totalWeight == 0 ? 'black' : this.totalWeight > 100 || this.totalWeight < 100 ? 'red' : 'green'}`}
              >
                {this.totalWeight}%
              </span>
              {this.totalWeight != 0 && (
                <sl-icon
                  name={this.totalWeight === 100 ? 'cv-confirm' : 'cv-chat-error'}
                  label="weight"
                  class={`${this.totalWeight === 100 ? 'green' : 'red'}  icon-total-weight`}
                ></sl-icon>
              )}
            </p>
            {this.totalWeight != 100 && this.fieldsToSend.length > 0 && (
              <span class="score-panel-header__amount__button__border">
                <sl-button variant="neutral" size="medium" onClick={() => this.scoringService.normalize(this.scope)}>
                  Normalize 100%
                </sl-button>
              </span>
            )}
          </div>
        </div>
        <div class="score-panel-add">
          <sl-button size="small" onClick={() => (this.addNewField = true)}>
            <sl-icon slot="prefix" name="cv-plus" size="small"></sl-icon>
            {tt('SM.SCORING.PANEL.ADD')}
          </sl-button>
        </div>
        <div class="score-panel-body">
          {this.addNewField && <scx-add-score addNewField={this.addNewField} scope={this.scope}></scx-add-score>}
          {this.fieldsToSend.length > 0
            ? this.fieldsToSend.map((field, index) => (
                <scx-add-score fieldIndex={index} key={index} field={field} scope={this.scope}></scx-add-score>
              ))
            : !this.addNewField && (
                <div class="score-panel-body__empty">
                  <sl-icon name="cv-es-no-users-to-show" size="large"></sl-icon>
                  <h4>{tt('SM.SCORING.PANEL.EMPTY.SCORE')}</h4>
                  <p>
                    {this.text[0]}
                    <br />
                    {this.text[1]}
                  </p>
                </div>
              )}
        </div>
      </div>
    );
  }
}
