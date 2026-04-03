import { Component, ComponentInterface, Element, Event, EventEmitter, Method, State, h } from '@stencil/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { CellComponent, ColumnDefinition, RowComponent, Tabulator } from 'tabulator-tables';
import { starter } from '../../../../di/containers';
import { CSVJSONItems, Model } from '../../list-template-configurator.interface';

@Component({
  tag: 'scx-mapping-table',
  styleUrl: 'scx-mapping-table.scss',
  shadow: true,
  assetsDirs: ['assets'], // <— important when packaging as a library
})
export class ScxMappingTable implements ComponentInterface {
  @State() tableData: { name: string; entityType?: string; [key: string]: unknown }[] = [];
  @State() csvFields: CSVJSONItems[] = [];
  @State() userModel: Model | null = null;
  @Event() changePage!: EventEmitter<string>;
  private persistedUserModel: Model | null = null;

  // @State() initialized = false;

  // Subscription management
  private subscriptions: Subscription[] = [];

  @Element() el!: HTMLElement;

  private table?: Tabulator;
  private tableContainer?: HTMLDivElement;
  private fileTagEl?: HTMLElement;

  private columns: ColumnDefinition[] = [
    { title: 'CSV Fields', field: 'name' },
    { title: 'type', field: 'entityType', visible: false },
    {
      title: 'Rename field',
      field: 'alias',
      width: 200,
      minWidth: 200,
      formatter: (cell: CellComponent) => {
        // Set value if present
        const value = cell.getValue() || '';
        // Use name for input id
        const rowIndex = cell.getRow().getPosition(); // Get row index for unique ID
        const inputId = `rename-input-${rowIndex}`;
        return `<sl-input class="my-input" id="${inputId}" value="${value}" placeholder="Rename field" style="--sl-input-height-medium:30px;width:100%;box-sizing:border-box;overflow:hidden;"></sl-input>`;
      },
    },
    this.checkboxColumn('ID', 'leadId'),
    this.checkboxColumn('Phone', 'landline'),
    this.checkboxColumn('Mobile', 'mobile'),
    this.checkboxColumn('E-mail', 'email'),
    this.checkboxColumn('Recency (R)', 'recency'),
    this.checkboxColumn('Monetary (M)', 'monetary'),
    this.checkboxColumn('Frequency (F)', 'frequency'),
    this.checkboxColumn('Mandatory', 'mandatory'),
    this.checkboxColumn('Hidden', 'hidden'),
  ];

  async componentWillLoad() {
    const service = starter.templateConfiguratorService;

    this.subscriptions.push(
      service.UserModel$.subscribe((model) => {
        this.userModel = model ? { ...model } : null;
        this.persistedUserModel = model ? { ...model } : null;
      })
    );

    this.subscriptions.push(
      service.JSONFields$.subscribe((CSVJSONItems) => {
        this.csvFields = CSVJSONItems ? [...CSVJSONItems] : [];
      })
    );

    this.ReadcsvJson()
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
        console.log('tableData:', this.tableData);
        // If Tabulator is already initialized, update its data
        if (this.table) {
          this.table.replaceData(this.tableData);
        }
      })
      .catch((error) => {
        console.log('Failed to load CSV fields:', error);
      });
  }

  async componentDidLoad() {
    this.fileTagEl?.addEventListener('sl-remove', this.handleModelRemove as EventListener);

    if (!this.tableContainer) return;

    // Dynamic import of Tabulator - it exports as default
    const tabulatorModule = await import('tabulator-tables');

    const TabulatorClass = (tabulatorModule.default ?? tabulatorModule) as unknown as typeof Tabulator;

    if (!TabulatorClass) {
      console.error('Tabulator constructor not found');
      return;
    }

    this.table = new TabulatorClass(this.tableContainer, {
      layout: 'fitColumns',
      movableRows: true,
      rowHeader: {
        headerSort: true,
        resizable: false,
        minWidth: 30,
        width: 30,
        rowHandle: true,
        formatter: () => {
          return '<sl-icon name="cv-drag-circle" class="drag-handle"></sl-icon>';
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
            // setValue(value, mutate) → mutate=true avoids triggering an edit event
            cell.setValue(true);
          }
        }

        // Handle renameField input synchronization for Shoelace sl-input
        const cell2 = row.getCell('alias');
        if (!cell2) return;

        const slInput = cell2.getElement().querySelector('sl-input.my-input');
        if (!slInput) return;

        // Attach event listener once
        if (!(slInput as { _bound?: boolean })._bound) {
          slInput.addEventListener('sl-change', (event: Event) => {
            const target = event.target as HTMLInputElement;
            const value = target.value;
            const rowData = row.getData() as { name: string; entityType?: string; [key: string]: unknown };
            rowData.alias = value;
            row.update(rowData);
            // Optionally, keep Tabulator's cell value in sync
            if (cell2.getValue() !== value) {
              cell2.setValue(value); // true = silent
            }
            console.log(`Row data after alias input:`, rowData);
          });
          (slInput as { _bound?: boolean })._bound = true;
        }
      });
    });
  }

  private checkboxColumn(title: string, field: string): ColumnDefinition {
    // const field = title.toLowerCase().replace(/\s+/g, '_');
    return {
      title,
      field,
      headerSort: true,
      hozAlign: 'center',
      formatter: (cell: CellComponent) => {
        const checked = cell.getValue() === true ? 'checked' : '';
        return `<div class="checkbox-container"><sl-checkbox ${checked}></sl-checkbox></div>`;
      },
      cellClick: (_e: unknown, cell: CellComponent) => {
        const current = cell.getValue();
        const row = cell.getRow();
        const rowData = row.getData() as { name: string; entityType?: string; [key: string]: unknown };
        // Toggle checked state
        const newChecked = !current;
        cell.setValue(newChecked);
        row.update(rowData); // update row data to reflect the change
        console.log(`Row data after ${title} toggle:`, rowData);
      },
    };
  }

  disconnectedCallback() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.fileTagEl?.removeEventListener('sl-remove', this.handleModelRemove as EventListener);
    if (this.table) {
      this.table.destroy();
    }
  }

  /** Read CSV and load into Tabulator */
  private async ReadcsvJson(): Promise<CSVJSONItems[]> {
    try {
      console.log('Loading mapping fields from constant file...');
      let jsonFields = this.csvFields;
      console.log('Current csvFields state:', jsonFields);
      if (jsonFields.length > 0) return jsonFields;

      const service = starter.templateConfiguratorService;
      jsonFields = await service.loadMappingFields();
      console.log('Loaded mapping fields:', jsonFields);
      return jsonFields;
    } catch (error) {
      console.error('Failed to load mapping fields from constant file:', error);
      return [];
    }
  }

  @Method()
  async saveMappings(): Promise<boolean> {
    if (!this.table) return false;

    // Get model name from state
    const modelName = this.userModel?.name?.trim();
    const fileName = this.userModel?.fileName?.trim();
    console.log('Saving mappings for model:', modelName);

    if (!modelName) {
      alert('Please enter a model name.');
      return false;
    }
    if (!fileName) {
      alert('Please enter a model file name.');
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

    console.log('Updated csvFields:', this.csvFields);

    await service.saveMapping(this.csvFields);
    this.changePage.emit('scoring');
    return true;
  }

  private handleModelRemove = async (event: Event) => {
    event.preventDefault();
    console.log('Model remove triggered');
    const service = starter.templateConfiguratorService;
    await service.updateModelFileName('');
    // this.userModel = null;
    // this.persistedUserModel = null;
  };

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
                  label="Model Name"
                  placeholder="Model customer Outband"
                  required
                  style={{ width: 'stretch' }}
                  value={this.userModel?.name || ''}
                  onInput={(event: Event) =>
                    (this.userModel = { ...this.userModel, name: (event.target as HTMLInputElement).value } as Model)
                  }
                ></sl-input>
                <sl-tag removable id="fileTag" ref={(el: Element | undefined) => (this.fileTagEl = el as HTMLElement)}>
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
              <h4>Field Mapping Configuration</h4>
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
