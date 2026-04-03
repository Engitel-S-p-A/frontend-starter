import { Component, ComponentInterface, Element, Method, State, h } from '@stencil/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { starter } from '../../../../di/containers';
import type { Model } from '../../list-template-configurator.interface';

@Component({
  tag: 'scx-add-model',
  styleUrl: 'scx-add-model.scss',
  shadow: true,
})
export class ScxAddModel implements ComponentInterface {
  @Element() el!: HTMLElement;
  private fileInput?: HTMLInputElement;
  private mappingTableEl?: HTMLElement & { saveMappings: () => Promise<boolean> };
  @State() modelName = '';
  @State() fileName = '';
  @State() userModel: Model | null = null;

  private subscriptions: Subscription[] = [];

  async componentWillLoad() {
    const service = starter.templateConfiguratorService;
    this.subscriptions.push(
      service.UserModel$.subscribe((model) => {
        this.userModel = model;
        this.modelName = model?.name ?? '';
        this.fileName = model?.fileName ?? '';
      })
    );
  }

  disconnectedCallback() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private handleIconClick = () => {
    this.fileInput?.click();
  };

  private handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0] as File;
      this.fileName = file.name;
    } else {
      this.fileName = '';
    }
  };

  @Method()
  async saveModel(): Promise<boolean> {
    console.log('saveModel method called with modelName:', this.modelName);
    const modelName = this.modelName.trim();
    const file = this.fileInput?.files && this.fileInput.files.length > 0 ? (this.fileInput.files[0] as File) : null;
    const resolvedFileName = file?.name ?? this.userModel?.fileName ?? this.fileName;

    if (!modelName) {
      alert('Please enter a model name.');
      return false;
    }
    if (!resolvedFileName) {
      alert('Please select a model file.');
      return false;
    }

    const service = starter.templateConfiguratorService;
    const model: Model = this.userModel
      ? {
          ...this.userModel,
          name: modelName,
          fileName: resolvedFileName,
          properties: [],
        }
      : {
          id: crypto.randomUUID(),
          name: modelName,
          fileName: resolvedFileName,
          properties: [],
        };

    await service.saveModel(model);

    console.log('Model saved:', model);
    return true;
  }

  @Method()
  async saveMappings(): Promise<boolean> {
    if (!this.mappingTableEl) {
      return false;
    }

    return this.mappingTableEl.saveMappings();
  }

  @Method()
  async saveCurrentStep(): Promise<'model' | 'mapping' | null> {
    if (this.mappingTableEl) {
      const saved = await this.saveMappings();
      return saved ? 'mapping' : null;
    }

    const saved = await this.saveModel();
    return saved ? 'model' : null;
  }

  render() {
    return (
      <div class="vertical-cards-container">
        {this.userModel && this.userModel.name && this.userModel.fileName ? (
          <scx-mapping-table
            ref={(el) =>
              (this.mappingTableEl = el as unknown as HTMLElement & { saveMappings: () => Promise<boolean> })
            }
          ></scx-mapping-table>
        ) : (
          <div class="add-model-container">
            <sl-card>
              <div class="card-body">
                <div class="card-body__div">
                  <sl-input
                    size="small"
                    name="modelName"
                    label="Model Name"
                    placeholder="Insert model name"
                    required
                    style={{ width: '100%' }}
                    value={this.modelName || ''}
                    onInput={(event: Event) => (this.modelName = (event.target as HTMLInputElement).value)}
                  ></sl-input>
                </div>
              </div>
            </sl-card>
            <div class="upload-card">
              <div class="card-body">
                <div class="card-body__div">
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    ref={(el) => (this.fileInput = el as HTMLInputElement)}
                    onChange={this.handleFileChange}
                    accept=".xlsx,.csv"
                  />
                  <scx-file-uploader
                    icon="cv-cloud-up"
                    esTitle={this.fileName || 'Drag and drop your model list here'}
                    label="Supported formats: .XLSX .CSV"
                    onIconClick={this.handleIconClick}
                  ></scx-file-uploader>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
