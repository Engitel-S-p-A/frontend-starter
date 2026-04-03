import { ListTemplateConfigurator } from './list-template-configurator';

describe('list-template-configurator', () => {
  it('is defined', () => {
    expect(ListTemplateConfigurator).toBeDefined();
  });

  it('has tag name', () => {
    expect(ListTemplateConfigurator.name).toBe('ListTemplateConfigurator');
  });
});
