import Fs from 'fs';
import { FILE_PATH } from './Browsers';
import { lookup } from 'useragent';
import IBrowser from '../interfaces/IBrowser';
import DeviceCategory from '../interfaces/DeviceCategory';
import { createBrowserId } from './BrowserUtils';
import useragents from "../data/browserstack/useragents.json";
import extractReleaseDateAndDescription from "./extractReleaseDateAndDescription";
import browserExtras from "../data/custom/browserExtras.json";
import BrowserMarketshareGenerator from "./BrowserMarketshareGenerator";

export default class BrowserGenerator {
  private byId: { [id: string]: IBrowser } = {};

  public run() {
    const browserMarketshareGenerator = new BrowserMarketshareGenerator();

    for (const useragent of useragents) {
      const { family: name, major, minor } = lookup(useragent.string);
      const version = { major, minor };
      const browserId = createBrowserId({ name, version });
      const [releaseDate, description] = extractReleaseDateAndDescription(name, browserId, browserExtras);
      const browser: IBrowser = {
        id: browserId,
        name: name,
        marketshare: browserMarketshareGenerator.get(browserId),
        version: version,
        deviceCategory: DeviceCategory.desktop,
        releaseDate: releaseDate,
        description: description,
      }
      this.byId[browserId] = browser;
    }
    return this;
  }

  public save() {
    const browserEnginesData = JSON.stringify(this.byId, null, 2);
    Fs.writeFileSync(FILE_PATH, browserEnginesData);
    return this;
  }
}
