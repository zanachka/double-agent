import { Scorer } from "./scorers";
import {Matcher } from "./matchers";
import Probe from "./Probe";
import Layer from "./Layer";
import { ICheckType } from "./checks/BaseCheck";

const COUNTER_START = 1000;
const layerMetaMap: { [key: string]: { counter: number, pluginId: string } } = {};

export default class ProbeBucket {
  public id: string;
  public layerId: string;
  public checkType: ICheckType;
  public useragentIds: string[];
  public probes: Probe[];
  public matcher: string;
  public scorer: string;

  constructor(
      id: string,
      layerId: string,
      checkType: ICheckType,
      matcher: string,
      scorer: string,
      useragentIds: string[],
      probes: Probe[],
    ) {
    this.id = id;
    this.layerId = layerId;
    this.checkType = checkType;
    this.useragentIds = useragentIds;
    this.matcher = matcher;
    this.scorer = scorer;
    this.probes = probes;
    if (probes.some(x => x.checkType !== checkType)) {
      throw new Error('Probes within a ProbeBucket must share the same CheckType');
    }
  }

  public toJSON() {
    return {
      id: this.id,
      layerId: this.layerId,
      checkType: this.checkType,
      useragentIds: this.useragentIds,
      matcher: this.matcher,
      scorer: this.scorer,
      probeIds: this.probes.map(p => p.id),
    }
  }

  public static create(
    layer: Layer,
    probes: Probe[],
    useragentIds: string[],
    matcher: Constructable<Matcher>,
    scorer: Constructable<Scorer>,
  ) {
    const id = generateId(layer);
    const layerId = layer.id;
    const checkType = probes[0].checkType;
    return new this(id, layerId, checkType, matcher.name, scorer.name, useragentIds, probes);
  }

  public static load(probeBucketObj: any, probesById: { [id: string]: Probe }) {
    const probes = probeBucketObj.probeIds.map(id => probesById[id]);
    const { id, layerId, checkType, useragentIds, matcher, scorer } = probeBucketObj;
    return new this(id, layerId, checkType, matcher, scorer, useragentIds, probes);
  }
}

// HELPERS //////

function generateId(layer: Layer) {
  layerMetaMap[layer.key] = layerMetaMap[layer.key] || { counter: COUNTER_START, pluginId: layer.pluginId };
  layerMetaMap[layer.key].counter += 1;
  if (layerMetaMap[layer.key].pluginId !== layer.pluginId) {
    throw new Error(`Layer key (${layer.key}) already assigned to ${layer.pluginId} plugin.`);
  }

  return `${layer.key}-${layerMetaMap[layer.key].counter}`
}

// TYPES //////

type Constructable<T> = new (...args: any[]) => T;
