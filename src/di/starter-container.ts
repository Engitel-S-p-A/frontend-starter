import { Container } from 'inversify';
import { IListTemplateConfiguratorService } from '../apps/list-template-configurator/list-template-configurator.interface';
import { listTemplateConfiguratorModule } from '../apps/list-template-configurator/list-template-configurator.module';
import { LIST_TEMPLATE_CONFIGURATOR_TYPES } from '../apps/list-template-configurator/list-template-configurator.types';
import type { IOutboundService } from '../apps/outbound-manager/outbound.interface';
import { outboundModule } from '../apps/outbound-manager/outbound.module';
import { OUTBOUND_TYPES } from '../apps/outbound-manager/outbound.types';
import { createApiModule } from '../libs/api/api.module';
import { loggerModule } from '../libs/logger/logger.module';
import type { IModal } from '../libs/modal/modal.interface';
import { modalModule } from '../libs/modal/modal.module';
import { MODAL_TYPES } from './types';

/**
 * Starter Container
 *
 * Simplified DI container demonstrating module-based initialization.
 * Loads modules sequentially: Logger → API → Outbound.
 *
 * Key patterns demonstrated:
 * - Sequential module loading (dependencies first)
 * - Factory modules with runtime config (API module)
 * - Convenience getters for type-safe service access
 * - Singleton pattern (one container per app)
 *
 * Lifecycle:
 * 1. Create container instance (imported via singleton)
 * 2. Call init() with runtime config (API base URL)
 * 3. Access services via convenience getters
 *
 * Usage:
 * ```typescript
 * import { starter } from './di/containers';
 *
 * // In scx-root componentWillLoad()
 * await starter.init({ apiBaseUrl: 'http://localhost:3001/t/acme-corp/v1' });
 *
 * // In app components
 * const service = starter.outbound;
 * service.campaigns$.subscribe(...);
 * ```
 */
export class StarterContainer extends Container {
  private initialized = false;

  /**
   * Initialize container with runtime configuration
   *
   * Loads modules in dependency order:
   * 1. Logger - no dependencies
   * 2. API - depends on Logger for debug output
   * 3. Outbound - depends on Logger + API
   *
   * @param options - Runtime configuration
   * @param options.apiBaseUrl - Base URL for API requests (e.g., 'http://localhost:3001/t/acme-corp/v1')
   * @returns Promise that resolves when initialization completes
   *
   * @example
   * await starter.init({ apiBaseUrl: 'http://localhost:3001/t/acme-corp/v1' });
   */
  async init(options: { apiBaseUrl: string }): Promise<void> {
    if (this.initialized) {
      console.warn('StarterContainer already initialized');
      return;
    }

    // 1. Load Logger module (no dependencies)
    this.load(loggerModule);

    // 2. Load API module with configuration
    const apiModule = createApiModule({ apiUrl: options.apiBaseUrl });
    this.load(apiModule);

    // 3. Load Modal module (no dependencies)
    this.load(modalModule);

    // 4. Load Outbound module (depends on Logger + API)
    this.load(outboundModule);

    // 5. Load Template Configurator module (depends on Logger + API)
    this.load(listTemplateConfiguratorModule);

    this.initialized = true;
    console.log('StarterContainer initialized');
  }

  /**
   * Get Outbound service instance
   *
   * Convenience getter for type-safe service access.
   * Preferred over direct container.get() calls.
   *
   * @returns IOutboundService instance
   *
   * @example
   * const service = starter.outbound;
   * service.loadCampaigns();
   * service.campaigns$.subscribe(campaigns => {
   *   console.log('Campaigns:', campaigns);
   * });
   */
  get outbound(): IOutboundService {
    return this.get<IOutboundService>(OUTBOUND_TYPES.OutboundService);
  }

  /**
   * Get Modal service instance
   *
   * Returns a new modal instance (transient scope).
   * Each call to this getter creates a fresh modal instance.
   *
   * @returns IModal instance
   *
   * @example
   * const modal = starter.modal;
   * modal.create({
   *   component: 'my-modal-content',
   *   width: '500px',
   *   dismissOnEsc: true,
   * });
   * modal.onDismiss((data) => {
   *   console.log('Modal closed:', data);
   * });
   * modal.show();
   */
  get modal(): IModal {
    return this.get<IModal>(MODAL_TYPES.Modal);
  }

  get templateConfiguratorService(): IListTemplateConfiguratorService {
    return this.get<IListTemplateConfiguratorService>(LIST_TEMPLATE_CONFIGURATOR_TYPES.TemplateConfiguratorService);
  }
}
