import { Component, ComponentInterface, Element, Method, State, h } from '@stencil/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { starter } from '../../../di/containers';
import { tt } from '../../../libs/i18n';
import type { Model } from '../list-template-configurator.interface';

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
  @State() modelNameErrorShow = false;
  @State() fileErrorShow = false;

  private subscriptions: Subscription[] = [];

  async componentWillLoad() {
    const service = starter.templateConfiguratorService;
    this.subscriptions.push(
      service.userModel$.subscribe((model) => {
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
    const modelName = this.modelName.trim();
    const file = this.fileInput?.files?.[0] ?? null;
    const resolvedFileName = file?.name ?? this.userModel?.fileName ?? this.fileName;

    this.modelNameErrorShow = false;
    this.fileErrorShow = false;

    if (!modelName) {
      this.modelNameErrorShow = true;
      return false;
    }

    if (!resolvedFileName) {
      this.fileErrorShow = true;
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
                    label={tt('SM.MAPPING.MODEL.MODEL_NAME')}
                    placeholder={tt('SM.MAPPING.MODEL.MODEL_TEXT')}
                    required
                    style={{ width: '100%' }}
                    value={this.modelName || ''}
                    onInput={(event: Event) => (this.modelName = (event.target as HTMLInputElement).value)}
                  ></sl-input>
                  {this.modelNameErrorShow && <div class="error-message">{tt('SM.MAPPING.MODEL.MODEL_ERROR')}</div>}
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
                    esTitle={this.fileName || tt('SM.MAPPING.MODEL.FILE_UPLOAD_EMPTY')}
                    label={tt('SM.MAPPING.MODEL.FILE_UPLOAD_FORMATS')}
                    onIconClick={this.handleIconClick}
                  ></scx-file-uploader>
                  {this.fileErrorShow && (
                    <div class="error-message txtcenter">{tt('SM.MAPPING.MODEL.FILE_UPLOAD_ERROR')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
