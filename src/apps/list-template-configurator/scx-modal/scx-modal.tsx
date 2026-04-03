import { Component, ComponentInterface, Host, Listen, Prop, State, h } from '@stencil/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { starter } from '../../../di/containers';
import type { IModal } from '../../../libs/modal';
import type { CSVJSONItems, Model } from '../list-template-configurator.interface';

@Component({
  tag: 'scx-modal',
  styleUrl: 'scx-modal.scss',
  shadow: true,
})
export class ScxModal implements ComponentInterface {
  @Prop() modal!: IModal;
  @Prop() modalTitle = 'Scoree Modal';
  @State() selectedRadioValue = 'mapping';
  @State() userModel: Model | null = null;
  private addModelEl?: HTMLElement & {
    saveCurrentStep: () => Promise<'model' | 'mapping' | null>;
  };
  private subscriptions: Subscription[] = [];

  async componentWillLoad() {
    const service = starter.templateConfiguratorService;
    this.subscriptions.push(
      service.UserModel$.subscribe((model) => {
        this.userModel = model;
      })
    );
  }

  disconnectedCallback() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private handleConfirm = async () => {
    switch (this.selectedRadioValue) {
      case 'mapping':
        {
          const savedStep = await this.addModelEl?.saveCurrentStep();
          if (!savedStep) return;

          // Model step was saved: stay on mapping so the table can be completed.
          if (savedStep === 'model') return;
        }

        this.selectedRadioValue = 'scoring';
        return;
      case 'scoring':
        {
          const mappingJson = this.GenerateFinalMappingJSON();
          //  if (!mappingJson) return;
          //  if (!mappingJson) return;
          this.modal.close({ confirm: true, mappingJson });
        }
        return;
      default:
        return;
    }
  };

  handleCancel = () => {
    this.modal.close({ dismiss: true });
  };

  private GenerateFinalMappingJSON = (): string => {
    if (!this.userModel) {
      alert('model or mapping are missing.');
      return '';
    }
    if (!this.userModel.properties || this.userModel.properties.length === 0) {
      alert('mapping fields are missing.');
      return '';
    }

    const fields: CSVJSONItems[] = this.userModel.properties;
    const excludedKeys = new Set(['landline', 'mobile', 'email']);

    const properties = fields.reduce<Record<string, Record<string, unknown>>>(
      (result: Record<string, Record<string, unknown>>, field: CSVJSONItems) => {
        const { name, ...fieldDefinition } = field as CSVJSONItems;
        result[name] = Object.fromEntries(
          Object.entries(fieldDefinition).filter(([key, value]) => value !== undefined && !excludedKeys.has(key))
        );
        return result;
      },
      {}
    );

    const model = {
      ...this.userModel,
      properties,
    };

    const result = JSON.stringify(model, null, 2);
    console.log('Generated final mapping JSON:', result);
    return result;
  };

  private handleRadioChange = (event: CustomEvent) => {
    this.selectedRadioValue = event.detail.value;
  };

  @Listen('changePage')
  handleAddField(event: CustomEvent<string>) {
    this.selectedRadioValue = event.detail;
  }

  renderContent = () => {
    switch (this.selectedRadioValue) {
      case 'mapping':
        return (
          <scx-add-model
            ref={(el) =>
              (this.addModelEl = el as unknown as HTMLElement & {
                saveCurrentStep: () => Promise<'model' | 'mapping' | null>;
              })
            }
          ></scx-add-model>
        );
      case 'scoring':
        return (
          <div class="scoresDialog">
            <scx-score-panel scope="Contactability"></scx-score-panel>
            <scx-score-panel scope="Propensity"></scx-score-panel>
          </div>
        );
      case 'options':
        return <p>options.</p>;
      default:
        return null;
    }
  };

  render() {
    return (
      <Host>
        <div class="modal-wrapper">
          <div class="modal-head">
            <div class="modal-title">
              <sl-icon name="cv-badge-role-stroke" size="small"></sl-icon> {this.modalTitle}
            </div>
            <sl-button variant="text" label="Close" class="modal-close" onClick={this.handleCancel}>
              <sl-icon name="cv-close" size="medium"></sl-icon>
            </sl-button>
          </div>
          <div class="modal-content">
            <scx-radio-group
              value={this.selectedRadioValue}
              size="small"
              variant="light"
              onSmChange={this.handleRadioChange}
            >
              <scx-radio-button value="mapping">Mapping</scx-radio-button>
              <scx-radio-button value="scoring">Scoring</scx-radio-button>
              <scx-radio-button value="options">Options</scx-radio-button>
            </scx-radio-group>
            {this.renderContent()}
          </div>

          <div class="modal-footer">
            <sl-button variant="text" onClick={this.handleCancel}>
              Cancel
            </sl-button>
            <sl-button variant="primary" onClick={this.handleConfirm}>
              Save
            </sl-button>
          </div>
        </div>
      </Host>
    );
  }
}
