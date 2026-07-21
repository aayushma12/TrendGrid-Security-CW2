/**
 * Repository barrel. Import per-sub-domain namespaces from the service layer:
 *   import * as productRepo from '../repository/product';
 * or the aggregated re-exports below.
 */
export * as productRepo from './product';
export * as characteristicRepo from './characteristic';
export * as variantRepo from './variant';
