import * as Fs from 'fs';
import * as Path from 'path';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import {
  UserAgentToTestPickType,
  IUserAgentToTestPickType,
} from '@double-agent/config/interfaces/IUserAgentToTest';
import { extractProfilePathsMap, importProfile } from '@double-agent/config/lib/ProfileUtils';
import getAllPlugins from './lib/getAllPlugins';
import Plugin, { IResultFlag } from './lib/Plugin';
import Probe from './lib/Probe';
import ProbeBucket from './lib/ProbeBucket';
import Layer from './lib/Layer';

const dataDir = Path.resolve(__dirname, './data');

interface IResult {
  userAgentId: string;
  flags: IResultFlag[];
}

interface IResultsMap {
  byUserAgentId: {
    [userAgentId: string]: IResultFlag[];
  };
  byPickType: {
    // @ts-ignore
    [UserAgentToTestPickType.popular]: IResult[];
    // @ts-ignore
    [UserAgentToTestPickType.random]: IResult[];
  };
}

export default class Analyze {
  public plugins: Plugin[] = [];

  private readonly profileCountOverTime: number;
  private resultsMap: IResultsMap = {
    byUserAgentId: {},
    byPickType: {
      [UserAgentToTestPickType.popular]: [],
      [UserAgentToTestPickType.random]: [],
    },
  };

  constructor(profileCountOverTime: number) {
    this.profileCountOverTime = profileCountOverTime;
    this.plugins = loadAllPlugins();
  }

  public addIndividual(individualsDir: string, userAgentId: string) {
    this.resultsMap.byUserAgentId[userAgentId] = [];
    const profileDir = Path.join(individualsDir, userAgentId, 'raw-data');
    const profilePathsMap = extractProfilePathsMap(profileDir, userAgentId);

    for (const plugin of this.plugins) {
      const profilePath = profilePathsMap[plugin.id][userAgentId];
      if (!profilePath) continue;

      const profile = importProfile<IBaseProfile>(profilePath);

      if (plugin.runIndividual) {
        const flags = plugin.runIndividual(profile);
        this.resultsMap.byUserAgentId[userAgentId].push(...flags);
      }
    }

    return this.resultsMap.byUserAgentId[userAgentId];
  }

  public addOverTime(sessionsDir: string, pickType: IUserAgentToTestPickType) {
    const plugins = loadAllPlugins();
    const dirNames = Fs.readdirSync(sessionsDir)
      .filter(x => x.startsWith(pickType))
      .sort();

    for (const dirName of dirNames) {
      const userAgentId = dirName.match(/^[^:]+:(.+)$/)[1];
      const flags: IResultFlag[] = [];
      const profileDir = Path.join(sessionsDir, dirName, 'raw-data');
      const profilePathsMap = extractProfilePathsMap(profileDir, userAgentId);
      for (const plugin of plugins) {
        const profilePath = profilePathsMap[plugin.id][userAgentId];
        if (!profilePath) continue;

        const profile = importProfile<IBaseProfile>(profilePath);

        if (plugin.runOverTime) {
          flags.push(...plugin.runOverTime(profile, dirNames.length));
        }
      }
      this.resultsMap.byPickType[pickType].push({ userAgentId, flags });
    }

    return this.resultsMap.byPickType[pickType];
  }

  public generateTestResults() {
    const humanScoreMap = {
      total: {
        [UserAgentToTestPickType.popular]: 100,
        [UserAgentToTestPickType.random]: 100,
      },
      individualByUserAgentId: {},
      sessionsByPickType: {
        [UserAgentToTestPickType.popular]: [],
        [UserAgentToTestPickType.random]: [],
      },
    };

    for (const userAgentId of Object.keys(this.resultsMap.byUserAgentId)) {
      const humanScore = this.resultsMap.byUserAgentId[userAgentId].reduce((score, flag) => {
        return Math.min(score, flag.humanScore);
      }, 100);
      humanScoreMap.individualByUserAgentId[userAgentId] = humanScore;
    }

    const pickTypes = [UserAgentToTestPickType.popular, UserAgentToTestPickType.random];
    for (const pickType of pickTypes) {
      const sessionDetails = [];
      for (const sessionResult of this.resultsMap.byPickType[pickType]) {
        const { userAgentId, flags } = sessionResult;
        const humanScoreIndividual = humanScoreMap.individualByUserAgentId[userAgentId];
        const humanScoreOverTime = flags.reduce(
          (score, flag) => Math.min(score, flag.humanScore),
          100,
        );
        let humanScoreTotal = humanScoreIndividual + humanScoreOverTime / 2;
        if (humanScoreTotal > 100) humanScoreTotal = 100;
        if (humanScoreTotal < 0) humanScoreTotal = 0;
        sessionDetails.push({
          userAgentId,
          humanScore: {
            individual: humanScoreIndividual,
            overTime: humanScoreOverTime,
            total: humanScoreTotal,
          },
        });
      }
      humanScoreMap.sessionsByPickType[pickType] = sessionDetails;
      humanScoreMap.total[pickType] = sessionDetails
        .map(x => x.humanScore.total)
        .reduce((a, b) => Math.min(a, b), 100);
    }

    console.log('humanScoreMap: ', humanScoreMap);

    return humanScoreMap;
  }
}

function loadAllPlugins() {
  const plugins = getAllPlugins();
  for (const plugin of plugins) {
    const layersPath = Path.join(dataDir, 'layers.json');
    const probesPath = Path.join(dataDir, 'probes', `${plugin.id}.json`);
    const probeBucketsPath = Path.join(dataDir, 'probe-buckets', `${plugin.id}.json`);

    const probesById: { [id: string]: Probe } = {};
    const probeObjs = JSON.parse(Fs.readFileSync(probesPath, 'utf-8'));
    probeObjs.forEach(probeObj => {
      probesById[probeObj.id] = Probe.load(probeObj, plugin.id);
    });

    const probeBucketObjs = JSON.parse(Fs.readFileSync(probeBucketsPath, 'utf-8'));
    plugin.probeBuckets = probeBucketObjs.map(obj => {
      return ProbeBucket.load(obj, probesById);
    });

    const layerObjs = JSON.parse(Fs.readFileSync(layersPath, 'utf-8')).filter(
      x => x.pluginId === plugin.id,
    );
    plugin.layers = layerObjs.map(obj => Layer.load(obj));
  }
  return plugins;
}
