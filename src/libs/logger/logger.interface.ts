import type { Logger } from 'debuggo';

/**
 * Debug Namespaces for SmileCX Starter
 *
 * Each namespace corresponds to a logical area of the application.
 * Logs are prefixed with 'smilecx-{namespace}' (e.g., 'smilecx-core', 'smilecx-api').
 *
 * Enable in browser console:
 * - All logs: localStorage.debug = 'smilecx-*'
 * - Specific: localStorage.debug = 'smilecx-api,smilecx-outbound'
 */
export enum StarterDebugNamespaces {
  Core = 'core',
  Api = 'api',
  Outbound = 'outbound',
  TemplateConfigurator = 'template-configurator',
}

/**
 * Logger Service Interface
 *
 * Provides namespaced logging capabilities via debuggo.
 * Primary usage is in services via DI injection.
 */
export interface ILogger {
  /**
   * Get a logger for a specific namespace.
   *
   * @param namespace - The debug namespace to use for logging
   * @returns Logger instance for the specified namespace
   */
  getLogger(namespace: StarterDebugNamespaces): Logger;
}
