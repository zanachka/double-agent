import Collect from './index';

async function run() {
  const collect = new Collect();
  const session = await collect.createSession();

  console.log('PLUGINS: ', JSON.stringify(session.pages, null, 2));
}

run().catch(error => console.log(error));
