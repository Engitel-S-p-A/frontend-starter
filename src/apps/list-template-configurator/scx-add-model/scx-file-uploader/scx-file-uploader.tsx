import { Component, ComponentInterface, Event, EventEmitter, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'scx-file-uploader',
  styleUrl: 'scx-file-uploader.scss',
  shadow: true,
})
export class ScxFileUploader implements ComponentInterface {
  @Prop() icon!: string;
  @Prop() label?: string;
  @Prop() esTitle?: string;

  @Event() iconClick!: EventEmitter<void>;

  private handleIconClick = () => {
    this.iconClick.emit();
  };

  render() {
    return (
      <Host>
        <div class="icon-wrap" onClick={this.handleIconClick} style={{ cursor: 'pointer' }}>
          <sl-icon size="extra" name={this.icon}></sl-icon>
        </div>
        {this.esTitle ? (
          <div class="title-wrap">
            <span>{this.esTitle}</span>
          </div>
        ) : null}
        {this.label ? (
          <div class="label-wrap">
            <span>{this.label}</span>
          </div>
        ) : null}
        <slot></slot>
      </Host>
    );
  }
}
