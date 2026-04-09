import { Component, Host, Listen, Prop, State, h } from '@stencil/core';
import type { ComponentInterface } from '@stencil/core';
import { starter } from '../../di/containers';
import { tt } from '../../libs/i18n';

@Component({
  tag: 'scx-root',
  styleUrl: 'scx-root.scss',
  shadow: true,
})
export class ScxRoot implements ComponentInterface {
  @Prop() apiUrl = '';
  @State() initialized = false;
  @State() selectedRadioValue = 'mapping';

  async componentWillLoad() {
    await starter.init({ apiBaseUrl: this.apiUrl });
    this.initialized = true;
  }

  @Listen('changePage')
  handleAddField(event: CustomEvent<string>) {
    this.selectedRadioValue = event.detail;
  }

  private openModal = () => {
    const modal = starter.modal;

    modal.create({
      component: 'list-template-configurator',
      width: '90%',
      height: '90%',
      dismissOnEsc: true,
      backdropDismiss: true,
      componentProps: {
        modalTitle: 'Add model List',
      },
    });

    modal.show();
  };

  render() {
    return (
      <Host>
        {this.initialized ? (
          <div>
            <sl-button onClick={this.openModal}>Open Modal</sl-button>
          </div>
        ) : (
          <div class="loading">{tt('SM.SHELL.INITIALIZING')}</div>
        )}
      </Host>
    );
  }
}
