import * as Fs from 'fs';
import * as Path from 'path';
import Plugin from "./Plugin";

export const pluginsDir = Path.resolve(__dirname, '../plugins');

export default function getAllPlugins(print = false, filter?: string[]) {
  const plugins: Plugin[] = [];

  for (const pluginDirName of Fs.readdirSync(pluginsDir)) {
    const pluginDir = Path.join(pluginsDir, pluginDirName);
    if (pluginDirName === '.DS_Store') continue;
    if (!Fs.statSync(pluginDir).isDirectory()) continue;
    if (filter && !filter.includes(pluginDirName)) continue;

    try {
      const Plugin = require(pluginDir)?.default;
      if (Plugin) {
        plugins.push(new Plugin(pluginDir));
      }
    } catch (err) {
      console.log(err);
    }
  }

  if (print) {
    console.log(
      'Collect Plugins Activated',
      plugins.map(x => `${x ? '✓' : 'x'} ${x.id} - ${x.summary}`),
    );
  }

  return plugins;
}
