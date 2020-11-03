import * as Fs from 'fs';
import * as Path from 'path';
import getAllPlugins from "./lib/getAllPlugins";
import Profiler from "@double-agent/profiler";
import IBaseProfile from "@double-agent/collect/interfaces/IBaseProfile";

const dataDir = Path.resolve(__dirname, './data');
const probeBucketsDir = Path.join(dataDir, 'probe-buckets');
const probesDir = Path.join(dataDir, 'probes');

if (!Fs.existsSync(probeBucketsDir)) Fs.mkdirSync(probeBucketsDir, { recursive: true });
if (!Fs.existsSync(probesDir)) Fs.mkdirSync(probesDir, { recursive: true });

let totalChecks = 0;
const layers = [];
const plugins = getAllPlugins();

for (const plugin of plugins) {
  const profiledProfiles = Profiler.getProfiles<IBaseProfile>(plugin.id);
  plugin.initialize(profiledProfiles);

  console.log('---------------------------------------');
  console.log(`SAVING ${plugin.id}`);

  const probeBucketsData = JSON.stringify(plugin.probeBuckets, null, 2);
  Fs.writeFileSync(`${probeBucketsDir}/${plugin.id}.json`, probeBucketsData);

  const probesData = JSON.stringify(plugin.probes, null, 2);
  Fs.writeFileSync(`${probesDir}/${plugin.id}.json`, probesData);

  layers.push(...plugin.layers);

  for (const layer of plugin.layers) {
    const probeBuckets = plugin.probeBuckets.filter(x => x.layerId === layer.id);
    const checkCount = probeBuckets.map(p => p.probes.length).reduce((a, b) => a+b, 0);
    totalChecks += checkCount;
    console.log(`${layer.name} (${layer.id} has ${probeBuckets.length} probe buckets (${checkCount} checks)`);
  }
}

const layersData = JSON.stringify(layers, null, 2);
Fs.writeFileSync(`${dataDir}/layers.json`, layersData);

console.log('======')
console.log(`${totalChecks} TOTAL CHECKS`);

// console.log('========================================');
// console.log(`${meta.name}: `, `${meta.checks.length} STARTING CHECKS`);
//
// for (const probe of probeGenerator.probes) {
//   console.log('---------------------------------');
//   console.log(`${probe.id} (${probe.name}) = ${probe.checks.length} checks`);
// }
//
// console.log(`${meta.name}: `, `${probeGenerator.checkCount} UNIQUE CHECKS`);
// console.log(`${meta.name}: `, `${probeGenerator.probeCount} PROBES`);
// console.log(`${meta.name}: `, `${probeGenerator.bucketedCheckCount} BUCKETED CHECKS`);
// console.log(`${meta.name}: `, `${probeGenerator.bucketedProbeCount} BUCKETED PROBES`);
