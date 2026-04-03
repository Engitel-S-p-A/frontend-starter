import { ContainerModule } from 'inversify';
import { ListTemplateConfiguratorService } from './list-template-configurator.service';
import { LIST_TEMPLATE_CONFIGURATOR_TYPES } from './list-template-configurator.types';

export const listTemplateConfiguratorModule = new ContainerModule(({ bind }) => {
  bind(LIST_TEMPLATE_CONFIGURATOR_TYPES.TemplateConfiguratorService)
    .to(ListTemplateConfiguratorService)
    .inSingletonScope();
});
