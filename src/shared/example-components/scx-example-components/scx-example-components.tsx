import { Component, ComponentInterface, State, h } from '@stencil/core';
import { starter } from '../../../di/containers';

/**
 * Tab Configuration Interface
 */
interface TabConfig {
  id: string;
  label: string;
  renderContent: () => unknown;
}

/**
 * Example Components Showcase
 *
 * Dynamic tab-based documentation component using Shoelace tabs.
 *
 * Features:
 * - Shoelace sl-tab-group for native tab UI
 * - Easy to add new components (just add to tabs array)
 * - Live interactive examples
 * - Code snippets with syntax highlighting
 * - API documentation tables
 *
 * Adding a new component:
 * 1. Add new object to `tabs` array in componentWillLoad()
 * 2. Create render method for content
 * 3. Done! Tab is automatically rendered
 *
 * Usage:
 * ```html
 * <scx-example-components></scx-example-components>
 * ```
 */
@Component({
  tag: 'scx-example-components',
  styleUrl: 'scx-example-components.scss',
  shadow: true,
})
export class ScxExampleComponents implements ComponentInterface {
  @State() selectedRadioValue = 'option1';
  @State() selectedRadioSize: 'small' | 'medium' | 'large' = 'medium';
  @State() selectedRadioVariant: 'default' | 'neutral' | 'light' = 'default';
  @State() lastModalResult = 'Not opened yet';

  /**
   * Tab configuration array
   * Add new tabs here to automatically render them
   */
  private tabs: TabConfig[] = [];

  componentWillLoad() {
    // Initialize tabs configuration
    this.tabs = [
      {
        id: 'modal',
        label: 'Modal Service',
        renderContent: () => this.renderModalTab(),
      },
      {
        id: 'radio',
        label: 'Radio Group',
        renderContent: () => this.renderRadioTab(),
      },
      {
        id: 'empty',
        label: 'Empty State',
        renderContent: () => this.renderEmptyStateTab(),
      },
      {
        id: 'tabulator',
        label: 'Tabulator Tables',
        renderContent: () => this.renderTabulatorTab(),
      },
      {
        id: 'icons',
        label: 'Custom Icons',
        renderContent: () => this.renderIconsTab(),
      },
    ];
  }

  /**
   * Open example modal
   */
  private openModal = () => {
    const modal = starter.modal;

    modal.create({
      component: 'scx-modal-example',
      width: '500px',
      dismissOnEsc: true,
      backdropDismiss: true,
      componentProps: {
        modalTitle: 'Example Modal',
        message: 'This is an example modal created with the Modal Service. Try clicking the buttons or pressing ESC!',
      },
    });

    modal.onDismiss((data) => {
      if (data.confirm) {
        this.lastModalResult = '✅ User confirmed';
      } else if (data.dismiss) {
        this.lastModalResult = '❌ User dismissed';
      }
    });

    modal.show();
  };

  /**
   * Handle radio group change
   */
  private handleRadioChange = (event: CustomEvent) => {
    this.selectedRadioValue = event.detail.value;
  };

  // ============================================
  // TAB CONTENT RENDERERS
  // ============================================

  /**
   * Render Modal Service tab content
   */
  private renderModalTab() {
    return (
      <div class="tab-content">
        <p class="description">
          Lightweight modal dialog system built on native HTML <code>&lt;dialog&gt;</code> elements with CSS animations.
          Includes ESC key and backdrop dismissal support.
        </p>

        <div class="example-demo">
          <h3>Live Demo</h3>
          <sl-button onClick={this.openModal}>Open Modal</sl-button>
          <p class="result">Last result: {this.lastModalResult}</p>
        </div>

        <div class="api-docs">
          <h3>API Reference</h3>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>create(options)</code>
                </td>
                <td>Creates modal with specified configuration</td>
              </tr>
              <tr>
                <td>
                  <code>onDismiss(callback)</code>
                </td>
                <td>Registers callback for when modal closes</td>
              </tr>
              <tr>
                <td>
                  <code>show()</code>
                </td>
                <td>Displays the modal</td>
              </tr>
              <tr>
                <td>
                  <code>close(data)</code>
                </td>
                <td>Closes modal with animation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /**
   * Render Radio Group tab content
   */
  private renderRadioTab() {
    return (
      <div class="tab-content">
        <p class="description">
          Custom radio button group component with multiple size and variant options. Supports both fill and hug
          layouts.
        </p>

        <div class="example-demo">
          <h3>Live Demo</h3>

          <div class="demo-controls">
            <sl-select
              label="Size"
              value={this.selectedRadioSize}
              on-sl-change={(e: CustomEvent) => {
                const target = e.target as HTMLSelectElement & { value: 'small' | 'medium' | 'large' };
                this.selectedRadioSize = target.value;
              }}
            >
              <sl-option value="small">Small</sl-option>
              <sl-option value="medium">Medium</sl-option>
              <sl-option value="large">Large</sl-option>
            </sl-select>

            <sl-select
              label="Variant"
              value={this.selectedRadioVariant}
              on-sl-change={(e: CustomEvent) => {
                const target = e.target as HTMLSelectElement & { value: 'default' | 'neutral' | 'light' };
                this.selectedRadioVariant = target.value;
              }}
            >
              <sl-option value="default">Default</sl-option>
              <sl-option value="neutral">Neutral</sl-option>
              <sl-option value="light">Light</sl-option>
            </sl-select>
          </div>

          <scx-radio-group
            value={this.selectedRadioValue}
            size={this.selectedRadioSize}
            variant={this.selectedRadioVariant}
            onSmChange={this.handleRadioChange}
          >
            <scx-radio-button value="option1">Option 1</scx-radio-button>
            <scx-radio-button value="option2">Option 2</scx-radio-button>
            <scx-radio-button value="option3">Option 3</scx-radio-button>
          </scx-radio-group>

          <p class="result">Selected value: {this.selectedRadioValue}</p>
        </div>

        <div class="api-docs">
          <h3>Props</h3>
          <table>
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>value</code>
                </td>
                <td>unknown</td>
                <td>-</td>
                <td>The selected value</td>
              </tr>
              <tr>
                <td>
                  <code>size</code>
                </td>
                <td>'small' | 'medium' | 'large'</td>
                <td>'medium'</td>
                <td>Size of radio buttons</td>
              </tr>
              <tr>
                <td>
                  <code>variant</code>
                </td>
                <td>'default' | 'neutral' | 'light'</td>
                <td>'default'</td>
                <td>Color variant</td>
              </tr>
              <tr>
                <td>
                  <code>contain</code>
                </td>
                <td>'fill' | 'hug'</td>
                <td>'fill'</td>
                <td>Layout style</td>
              </tr>
              <tr>
                <td>
                  <code>allowEmptySelection</code>
                </td>
                <td>boolean</td>
                <td>false</td>
                <td>Allow deselection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /**
   * Render Empty State tab content
   */
  private renderEmptyStateTab() {
    return (
      <div class="tab-content">
        <p class="description">
          Component for displaying empty states with an icon, title, and optional label. Useful for showing "no data" or
          "no results" scenarios.
        </p>

        <div class="example-demo">
          <h3>Live Demo</h3>
          <div class="empty-state-demo">
            <scx-empty-state
              icon="cv-gear-stroke"
              esTitle="No Messages"
              label="You don't have any messages yet."
            ></scx-empty-state>
          </div>
        </div>

        <div class="api-docs">
          <h3>Props</h3>
          <table>
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>icon</code>
                </td>
                <td>string</td>
                <td>Yes</td>
                <td>Icon name (from icon library)</td>
              </tr>
              <tr>
                <td>
                  <code>esTitle</code>
                </td>
                <td>string</td>
                <td>No</td>
                <td>Title text</td>
              </tr>
              <tr>
                <td>
                  <code>label</code>
                </td>
                <td>string</td>
                <td>No</td>
                <td>Label text (supports HTML)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /**
   * Render Tabulator tab content
   */
  private renderTabulatorTab() {
    return (
      <div class="tab-content">
        <p class="description">
          Feature-rich data table library with sorting, filtering, pagination, and custom styling. Uses the custom
          tabulator-theme mixin for consistent design.
        </p>

        <div class="example-demo">
          <h3>Live Demo</h3>
          <scx-tabulator-example></scx-tabulator-example>
        </div>

        <div class="api-docs">
          <h3>Key Features</h3>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>Sorting</code>
                </td>
                <td>Click column headers to sort ascending/descending</td>
              </tr>
              <tr>
                <td>
                  <code>Row Reordering</code>
                </td>
                <td>Drag and drop rows to reorder them</td>
              </tr>
              <tr>
                <td>
                  <code>Pagination</code>
                </td>
                <td>Navigate through large datasets with page controls</td>
              </tr>
              <tr>
                <td>
                  <code>Custom Theme</code>
                </td>
                <td>Styled with tabulator-theme mixin for consistency</td>
              </tr>
              <tr>
                <td>
                  <code>Responsive</code>
                </td>
                <td>Adapts to different screen sizes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /**
   * Render Icons tab content
   */
  private renderIconsTab() {
    return (
      <div class="tab-content">
        <p class="description">
          Browse and search through 1,100+ custom Covisian icons. Click any icon to copy its name to clipboard for use
          with <code>&lt;sl-icon&gt;</code> components.
        </p>

        <div class="example-demo">
          <scx-icons-example></scx-icons-example>
        </div>

        <div class="api-docs">
          <h3>Usage Examples</h3>
          <table>
            <thead>
              <tr>
                <th>Example</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>&lt;sl-icon name="cv-2fa-password-2"&gt;&lt;/sl-icon&gt;</code>
                </td>
                <td>Display any custom icon by name</td>
              </tr>
              <tr>
                <td>
                  <code>&lt;sl-icon name="cv-chat-fill"&gt;&lt;/sl-icon&gt;</code>
                </td>
                <td>Icons support -fill and -stroke variants</td>
              </tr>
              <tr>
                <td>
                  <code>&lt;sl-icon name="cv-call-r"&gt;&lt;/sl-icon&gt;</code>
                </td>
                <td>-r suffix indicates rounded variants</td>
              </tr>
            </tbody>
          </table>

          <h3>Props</h3>
          <table>
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>name</code>
                </td>
                <td>string</td>
                <td>-</td>
                <td>Icon name (required)</td>
              </tr>
              <tr>
                <td>
                  <code>style</code>
                </td>
                <td>CSSProperties</td>
                <td>-</td>
                <td>
                  Inline styles - use <code>fontSize</code> for size and <code>color</code> for color
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Styling</h3>
          <table>
            <thead>
              <tr>
                <th>Example</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>
                    &lt;sl-icon name="cv-chat-fill" style=&#123;&#123; fontSize: '2rem' &#125;&#125;&gt;&lt;/sl-icon&gt;
                  </code>
                </td>
                <td>Set icon size using fontSize</td>
              </tr>
              <tr>
                <td>
                  <code>
                    &lt;sl-icon name="cv-call-r" style=&#123;&#123; color: 'var(--sl-color-primary-600)'
                    &#125;&#125;&gt;&lt;/sl-icon&gt;
                  </code>
                </td>
                <td>Set icon color using CSS variables</td>
              </tr>
              <tr>
                <td>
                  <code>
                    &lt;sl-icon name="cv-gear-stroke" style=&#123;&#123; fontSize: '3rem', color: '#ff0000'
                    &#125;&#125;&gt;&lt;/sl-icon&gt;
                  </code>
                </td>
                <td>Combine size and color</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  render() {
    return (
      <div class="showcase">
        <header class="showcase-header">
          <h1>Component Examples</h1>
          <p>Interactive documentation for SmileCX Frontend Starter components</p>
        </header>

        {/* Shoelace Tab Group */}
        <sl-tab-group>
          {this.tabs.map((tab) => (
            <sl-tab slot="nav" panel={tab.id}>
              {tab.label}
            </sl-tab>
          ))}

          {this.tabs.map((tab) => (
            <sl-tab-panel name={tab.id}>{tab.renderContent()}</sl-tab-panel>
          ))}
        </sl-tab-group>
      </div>
    );
  }
}
