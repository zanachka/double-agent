import IPlugin from './IPlugin';

export default interface IDetectorModule {
  name: string;
  summary: string;
  dir: string;
  plugin?: IPlugin;
  checkCategories: string[];
}
