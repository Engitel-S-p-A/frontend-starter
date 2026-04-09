import { Component, ComponentInterface, Element, Event, EventEmitter, Listen, Method, State, h } from '@stencil/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { CellComponent, ColumnDefinition, RowComponent, Tabulator } from 'tabulator-tables';
import { starter } from '../../../../di/containers';
import { tt } from '../../../../libs/i18n';
import { CSVJSONItems, Model } from '../../list-template-configurator.interface';

@Component({
  tag: 'scx-mapping-table',
  styleUrl: 'scx-mapping-table.scss',
  shadow: true,
  assetsDirs: ['assets'],
})
export class ScxMappingTable implements ComponentInterface {
  @State() tableData: { name: string; entityType?: string; [key: string]: unknown }[] = [];
  @State() csvFields: CSVJSONItems[] = [];
  @State() userModel: Model | null = null;
  @State() modelNameErrorShow = false;
  @State() fileErrorShow = false;
  @Event() changePage!: EventEmitter<string>;
  private persistedUserModel: Model | null = null;
  private subscriptions: Subscription[] = [];
  @Element() el!: HTMLElement;

  private boundAliasInputs = new WeakSet<HTMLElement>();

  private table?: Tabulator;
  private tableContainer?: HTMLDivElement;

  private columns: ColumnDefinition[] = [
    { title: tt('SM.MAPPING.TABLE.COLUMN.CSV_FIELDS'), field: 'name' },
    { title: 'type', field: 'entityType', visible: false },
    {
      title: tt('SM.MAPPING.TABLE.COLUMN.RENAME_FIELD'),
      field: 'alias',
      width: 200,
      minWidth: 200,
      formatter: (cell: CellComponent) => {
        // Set value if present
        const value = cell.getValue() || '';

        const rowIndex = cell.getRow().getIndex(); // Get row index for unique ID
        const inputId = `rename-input-${rowIndex}`;
        return `<sl-input class="my-input" id="${inputId}" value="${value}" placeholder="${tt('SM.MAPPING.TABLE.COLUMN.RENAME_FIELD')}" style="--sl-input-height-medium:30px;width:100%;box-sizing:border-box;overflow:hidden;"></sl-input>`;
      },
    },
    this.checkboxColumn(`${tt('SM.MAPPING.TABLE.COLUMN.ID')}`, 'leadId'),
    this.checkboxColumn(`${tt('SM.MAPPING.TABLE.COLUMN.PHONE')}`, 'landline'),
    this.checkboxColumn(`${tt('SM.MAPPING.TABLE.COLUMN.MOBILE')}`, 'mobile'),
    this.checkboxColumn(`${tt('SM.MAPPING.TABLE.COLUMN.EMAIL')}`, 'email'),
    this.checkboxColumn(`${tt('SM.MAPPING.TABLE.COLUMN.RECENCY')}`, 'recency'),
    this.checkboxColumn(`${tt('SM.MAPPING.TABLE.COLUMN.MONETARY')}`, 'monetary'),
    this.checkboxColumn(`${tt('SM.MAPPING.TABLE.COLUMN.FREQUENCY')}`, 'frequency'),
    this.checkboxColumn(`${tt('SM.MAPPING.TABLE.COLUMN.MANDATORY')}`, 'mandatory'),
    this.checkboxColumn(`${tt('SM.MAPPING.TABLE.COLUMN.HIDDEN')}`, 'hidden'),
  ];

  async componentWillLoad() {
    const service = starter.templateConfiguratorService;

    this.subscriptions.push(
      service.userModel$.subscribe((model) => {
        this.userModel = model ? { ...model } : null;
        this.persistedUserModel = model ? { ...model } : null;
      })
    );

    this.subscriptions.push(
      service.jsonFields$.subscribe((CSVJSONItems) => {
        this.csvFields = CSVJSONItems ? [...CSVJSONItems] : [];
      })
    );

    this.readcsvJson()
      .then((jsonFields) => {
        this.csvFields = jsonFields;
        this.tableData = jsonFields.map((field) => ({
          ...field,
          leadId: (field as { leadId?: boolean }).leadId ?? false,
          landline: field.entityType === 'landline' ? true : ((field as { landline?: boolean }).landline ?? false),
          mobile: field.entityType === 'mobile' ? true : ((field as { mobile?: boolean }).mobile ?? false),
          email: field.entityType === 'email' ? true : ((field as { email?: boolean }).email ?? false),
          recency: (field as { recency?: boolean }).recency ?? false,
          monetary: (field as { monetary?: boolean }).monetary ?? false,
          frequency: (field as { frequency?: boolean }).frequency ?? false,
          mandatory: (field as { mandatory?: boolean }).mandatory ?? false,
          hidden: (field as { hidden?: boolean }).hidden ?? false,
        }));

        // If Tabulator is already initialized, update its data
        if (this.table) {
          this.table.replaceData(this.tableData);
        }
      })
      .catch(() => {
        this.csvFields = [];
        this.tableData = [];
      });
  }

  async componentDidLoad() {
    if (!this.tableContainer) return;

    // Dynamic import of Tabulator - it exports as default
    const tabulatorModule = await import('tabulator-tables');

    const tabulatorClass = (tabulatorModule.default ?? tabulatorModule) as unknown as typeof Tabulator;

    if (!tabulatorClass) {
      return;
    }

    this.table = new tabulatorClass(this.tableContainer, {
      layout: 'fitColumns',
      movableRows: true,
      rowHeader: {
        headerSort: true,
        resizable: false,
        minWidth: 30,
        width: 30,
        rowHandle: true,
        formatter: () => {
          return '<sl-icon size="medium" name="cv-drag-circle" class="drag-handle"></sl-icon>';
        },
      },
      data: this.tableData,
      columns: this.columns,
    });

    this.table.on('dataProcessed', () => {
      this.table?.getRows().forEach((row) => {
        const data = (row as RowComponent).getData() as { name: string; entityType?: string; [key: string]: unknown };

        // Set checkbox state based on entityTyp
        const type = data.entityType;

        if (type) {
          // Find the cell whose field matches the entitytype
          const cell = row.getCell(type);
          if (cell) {
            cell.setValue(true);
          }
        }

        // Handle renameField input synchronization
        const cell2 = row.getCell('alias');
        if (!cell2) return;

        const slInput = cell2.getElement().querySelector('sl-input.my-input') as
          | (HTMLElement & { value?: string })
          | null;
        if (!slInput) return;

        if (!this.boundAliasInputs.has(slInput)) {
          const handler: EventListener = (event: Event) => {
            const target = event.target as HTMLElement & { value?: string };
            const value = target.value ?? '';
            const rowData = row.getData() as { name: string; entityType?: string; [key: string]: unknown };
            rowData.alias = value;
            row.update(rowData);

            if (cell2.getValue() !== value) {
              cell2.setValue(value);
            }
          };

          slInput.addEventListener('sl-change', handler);
          this.boundAliasInputs.add(slInput);
        }
      });
    });
  }

  private checkboxColumn(title: string, field: string): ColumnDefinition {
    return {
      title,
      field,
      headerSort: true,
      hozAlign: 'center',
      formatter: (cell: CellComponent) => {
        const checked = cell.getValue() === true ? 'checked' : '';
        return `<div class="checkbox-container"><sl-checkbox size="small" ${checked}></sl-checkbox></div>`;
      },
      cellClick: (_e: unknown, cell: CellComponent) => {
        const current = cell.getValue();
        const row = cell.getRow();
        const rowData = row.getData() as { name: string; entityType?: string; [key: string]: unknown };
        // Toggle checked state
        const newChecked = !current;
        cell.setValue(newChecked);
        row.update(rowData); // update row data to reflect the change
      },
    };
  }

  disconnectedCallback() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());

    if (this.table) {
      this.table.destroy();
    }
  }

  /** Read CSV and load into Tabulator */
  private async readcsvJson(): Promise<CSVJSONItems[]> {
    try {
      let jsonFields = this.csvFields;
      if (jsonFields.length > 0) return jsonFields;
      const service = starter.templateConfiguratorService;
      jsonFields = await service.loadMappingFields();
      return jsonFields;
    } catch {
      return [];
    }
  }

  @Method()
  async saveMappings(): Promise<boolean> {
    if (!this.table) return false;

    const modelName = this.userModel?.name?.trim();
    const fileName = this.userModel?.fileName?.trim();

    this.modelNameErrorShow = false;
    this.fileErrorShow = false;

    if (!modelName) {
      this.modelNameErrorShow = true;
      return false;
    }
    if (!fileName) {
      this.fileErrorShow = true;
      return false;
    }

    const service = starter.templateConfiguratorService;
    const hasModelChanged =
      !this.persistedUserModel ||
      this.persistedUserModel.name !== modelName ||
      this.persistedUserModel.fileName !== fileName;

    if (hasModelChanged && this.userModel) {
      const updatedModel: Model = {
        ...this.userModel,
        name: modelName,
        fileName,
        properties: this.csvFields,
      };
      await service.saveModel(updatedModel);
      this.userModel = updatedModel;
      this.persistedUserModel = { ...updatedModel };
    }

    const tableData = this.table.getData() as { name: string; entityType?: string; [key: string]: unknown }[];
    // Update jsonFields with latest row data based on fieldName
    this.csvFields = this.csvFields.map((field) => {
      const row = tableData.find((r) => r.name === field.name);
      if (!row) return field;

      const resolvedEntityType =
        row.mobile === true ? 'mobile' : row.landline === true ? 'landline' : row.email === true ? 'email' : 'null';

      return { ...field, ...row, entityType: resolvedEntityType };
    });

    await service.saveMapping(this.csvFields);
    this.changePage.emit('scoring');
    return true;
  }

  @Listen('sl-remove')
  async handleModelRemove(event: Event): Promise<void> {
    const fromFileTag = event.composedPath().some((node) => node instanceof HTMLElement && node.id === 'fileTag');
    if (!fromFileTag) {
      return;
    }

    event.preventDefault();
    const service = starter.templateConfiguratorService;
    await service.updateModelFileName('');
  }

  render() {
    return (
      <div class="vertical-cards-container">
        <sl-card>
          <div class="card-body">
            <div class="card-body__div">
              <div class="model-inputs-row">
                <sl-input
                  size="small"
                  name="modelName"
                  label={tt('SM.MAPPING.MODEL.MODEL_NAME')}
                  placeholder={tt('SM.MAPPING.MODEL.MODEL_TEXT')}
                  required
                  style={{ width: 'stretch' }}
                  value={this.userModel?.name || ''}
                  onInput={(event: Event) =>
                    (this.userModel = { ...this.userModel, name: (event.target as HTMLInputElement).value } as Model)
                  }
                ></sl-input>
                {this.modelNameErrorShow && <div class="error-message">{tt('SM.MAPPING.MODEL.MODEL_ERROR')}</div>}
                <sl-tag removable id="fileTag">
                  <sl-icon name="cv-document"></sl-icon>
                  {this.userModel?.fileName || ''}
                </sl-tag>
              </div>
            </div>
          </div>
        </sl-card>
        <sl-card class="card-header">
          <div slot="header" class="card-header__header">
            <div class="card-header__content">
              <sl-icon name="cv-sort-cx-card" class="cv-sort-cx-card"></sl-icon>
              <h4>{tt('SM.MAPPING.TABLE.HEADER')}</h4>
            </div>
          </div>
          <div class="card-body">
            <div class="card-body__div">
              <div class="table-container" ref={(el) => (this.tableContainer = el)}></div>
            </div>
          </div>
        </sl-card>
      </div>
    );
  }
}
