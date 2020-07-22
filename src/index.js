import Config from './utils/config';
import APIHelper from './helpers/api.helper';
import Task from './task';

const config = Config.getConfig();

APIHelper.setBaseUrl(`${config.api.url}/v${config.api.version}`);

(async () => {
  const task = new Task();
  await task.init();
})();
