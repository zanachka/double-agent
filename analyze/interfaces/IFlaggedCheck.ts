import IAsset from '@double-agent/collect/interfaces/IAsset';
import Layer from './Layer';

export default interface IFlaggedCheck extends IAsset {
  requestIdx?: number; //index in session
  category: string;
  checkName: string;
  description?: string;
  value: string | number | boolean;
  pctBot: number;
  layer: Layer;
  expected?: string | number | boolean;
  details?: string;
}
