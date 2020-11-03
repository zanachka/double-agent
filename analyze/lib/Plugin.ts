import * as Path from 'path';
import Profiler from '@double-agent/profiler';
import IBaseProfile from "@double-agent/collect/interfaces/IBaseProfile";
import ProbeBucketGenerator, {IProbeBucketMeta} from "./ProbeBucketGenerator";
import ProbeBucket from "./ProbeBucket";
import Layer from "./Layer";
import BaseCheck, {CheckType, ICheckType} from "./checks/BaseCheck";
import Probe from "./Probe";

export default abstract class Plugin {
  public id: string;
  public dir: string;
  public summary: string;
  public probeBuckets: ProbeBucket[] = [];
  public layers: Layer[] = [];

  constructor(pluginDir: string) {
    this.dir = pluginDir;
    this.id = Path.basename(pluginDir);
    const packageJson = require(`${pluginDir}/package.json`);
    if (packageJson) {
      this.summary = packageJson.description;
    }
  }

  public get probes() {
    const probesById = {};
    this.probeBuckets.forEach(bucket => bucket.probes.forEach(probe => probesById[probe.id] = probe));
    return Object.values(probesById);
  }

  public abstract initialize(profiles: IBaseProfile[]): void;
  public runIndividual?(profile: IBaseProfile): IResultFlag[];
  public runOverTime?(profile: IBaseProfile, profileCountOverTime: number): IResultFlag[];

  protected initializeProbes(meta: IProbeBucketMeta) {
    if (meta.layerKey) meta.layerKey = meta.layerKey.toLowerCase();
    const probeBucketGenerator = new ProbeBucketGenerator(this.id, meta);
    this.layers.push(probeBucketGenerator.layer);
    this.probeBuckets.push(...probeBucketGenerator.probeBuckets);
  }

  protected runProbes(layerKey: string, useragentId: string, checks: BaseCheck[], profileCountOverTime?: number) {
    layerKey = layerKey.toLowerCase();
    const flags: IResultFlag[] = [];
    const checkType = profileCountOverTime ? CheckType.OverTime : CheckType.Individual;
    const checksById = checks.reduce((byId, c) => Object.assign(byId, { [c.id]: c}), {});
    const layer = this.layers.find(x => x.key === layerKey);
    if (!layer) throw new Error(`${this.id} plugin missing layer key: ${layerKey}`)

    const probeBuckets = this.probeBuckets.filter(x => {
      return x.layerId === layer.id && (!x.useragentIds.length || x.useragentIds.includes(useragentId));
    });

    for (const probeBucket of probeBuckets) {
      for (const probe of probeBucket.probes) {
        if (probe.checkType !== checkType) continue;
        const toCheck = checksById[probe.check.id];
        const humanScore = probe.check.generateHumanScore(toCheck, profileCountOverTime);
        if (humanScore < 100) {
          const probeId = probe.id;
          const probeBucketId = probeBucket.id;
          flags.push({ pluginId: this.id, useragentId, humanScore, probeId, probeBucketId, toCheckArgs: toCheck?.args });
        }
      }
    }

    return flags;
  }
}

export interface IResultFlag {
  useragentId: string;
  humanScore: number;
  probeId: string;
  pluginId: string;
  probeBucketId: string;
  toCheckArgs: any[];
}
