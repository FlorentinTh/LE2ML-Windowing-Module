import Config from './utils/config';
import APIHelper from './helpers/api.helper';
import Logger from './utils/logger';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import Windowing from './windowing/windowing';

const config = Config.getConfig();

class Tasks {
  constructor() {
    this.name = 'windowing';
    this.user = config.data.user_id;
    this.job = config.data.job_id;
  }

  async init() {
    await this.start();
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
      await windowing.apply(config.data.user_id, config.data.job_id);
      await this.success();
    } catch (error) {
      Logger.error('[Container] Error: ' + error);
      await this.error();
    }
  }

  async start() {
    Logger.info(
      `[Container] Info: user - ${this.user} starts windowing task for job - ${this.job}`
    );
    axios
      .post(`/jobs/${this.job}/tasks/start?task=${this.name}`, null, {
        headers: APIHelper.setAPIKey()
      })
      .then(response => {
        if (response) {
          Logger.info(
            `[API] Info: Windowing task started by user: ${this.user} for job: ${this.job} successfully updated (STATUS: STARTED).`
          );
        }
      })
      .catch(error => {
        Logger.error('[API] Error:' + error);
        throw new Error('API Error : ' + error);
      });
    Logger.info(
      `[Container] Info: end of windowing task started by user - ${this.user} for job - ${this.job}`
    );
  }

  async success() {
    axios
      .post(
        `/jobs/${this.job}`,
        {
          windowing: 'completed'
        },
        {
          headers: APIHelper.setAPIKey()
        }
      )
      .then(response => {
        if (response) {
          Logger.info(
            `[API] Info: Windowing task started by user: ${this.user} for job: ${this.job} successfully updated (STATUS: STARTED).`
          );
        }
      })
      .catch(error => {
        Logger.error('[API] Error:' + error);
        throw new Error('API Error : ' + error);
      });
  }

  async error() {
    axios
      .post(`/jobs/task/error/${this.job}?task=${this.name}`, null, {
        headers: APIHelper.setAPIKey()
      })
      .then(response => {
        if (response) {
          Logger.info(
            `[API] Info: Windowing task started by user: ${this.user} for job: ${this.job} successfully updated (STATUS: FAILED).`
          );
        }
      })
      .catch(error => {
        Logger.error('[API] Error:' + error);
        throw new Error('API Error : ' + error);
      });
  }
}

export default Tasks;
