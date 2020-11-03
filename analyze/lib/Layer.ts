import {IProbeBucketMeta} from "./ProbeBucketGenerator";
import humanizeString from 'humanize-string';
import initialize from 'initialism';
import slugify from 'slugify';

export default class Layer {
  public id: string;
  public key: string;
  public name: string;
  public pluginId: string;

  constructor(id: string, key: string, name: string, pluginId: string) {
    this.id = id;
    this.key = key;
    this.name = name;
    this.pluginId = pluginId;
  }

  static extractKeyFromProbeMeta(meta: IProbeBucketMeta) {
    let key = meta.layerKey;
    if (!key) {
      const title = humanizeString(meta.layerName);
      const words = title.split(' ');
      key = words.length === 2 ? initialize(words[0], 2) + initialize(words[1]) : initialize(title, 3);
    }
    return key.toLowerCase();
  }

  public static create(key: string, name: string, pluginId: string) {
    const id = slugify(name, '-').toLowerCase();
    return new this(id, key, name, pluginId);
  }

  public static load(obj: any) {
    const { id, key, name, pluginId } = obj;
    return new this(id, key, name, pluginId)
  }
}
