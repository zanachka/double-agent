import DetectorPluginDelegate from "../lib/DetectorPluginDelegate";
import getAllDetectors from '../lib/getAllDetectors';
import UserBucketTracker from '../lib/UserBucketTracker';
import IDetectorModule from '../interfaces/IDetectorModule';

export default class Analyze {
  public bucketTracker: UserBucketTracker;
  private readonly detectors: IDetectorModule[];
  public readonly pluginDelegate: DetectorPluginDelegate;

  constructor() {
    this.detectors = getAllDetectors(detectRepeatVisits, true);
    this.pluginDelegate = new DetectorPluginDelegate(this.detectors);
    this.bucketTracker = new UserBucketTracker(this.detectors);
  }

  public async start() {
    await this.pluginDelegate.start(this.httpDomains, this.httpsDomains, this.bucketTracker);

  }

  protected async stop(): Promise<any> {
    await this.pluginDelegate.stop();
  }
}
