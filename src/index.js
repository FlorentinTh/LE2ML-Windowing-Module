import path from 'path';
import fs from 'fs';
import Logger from './utils/logger';
import Config from './utils/config';
import Windowing from './Windowing';

const config = Config.getConfig();

(async () => {
  const pipelineFilePath = path.resolve(__dirname, 'conf.json');

  try {
    const pipelineFile = await fs.promises.readFile(pipelineFilePath);
    const pipelineObject = JSON.parse(pipelineFile.toString());

    const length = pipelineObject.windowing.parameters.length;
    const func = pipelineObject.windowing.parameters.function.label;
    const input = path.join(
      __dirname,
      pipelineObject.input.file.type,
      pipelineObject.input.file.filename
    );

    const windowing = new Windowing(length, func, input);
    await windowing.start(config.data.user_id, config.data.job_id);
  } catch (error) {
    Logger.error('Error: ' + error);
  }
})();
