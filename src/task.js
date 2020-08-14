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
    this.state = 'started';
    this.user = config.data.user_id;
    this.job = config.data.job_id;
  }

  async init() {
    Logger.info(
      `[Container] Info: user - ${this.user} starts windowing task for job - ${this.job}`
    );

    const confPath = path.resolve(
      config.data.base_path,
      this.user,
      'jobs',
      this.job,
      'conf.json'
    );

    let confFile;
    try {
      confFile = await fs.promises.readFile(confPath);
    } catch (error) {
      Logger.error('[Container] ' + error);
      return await this.error();
    }

    const conf = JSON.parse(confFile.toString());

    const length = conf.windowing.parameters.length;
    const func = conf.windowing.parameters.function.label;
    const overlap = conf.windowing.parameters.overlap;

    const input = path.join(
      config.data.base_path,
      this.user,
      'jobs',
      this.job,
      conf.input.file.filename
    );

    if (length === 0) {
      Logger.error('[Container] Error: length cannot be set to 0');
      return await this.error();
    }

    const windowing = new Windowing(length, func, overlap, input);

    try {
      if (overlap === 0) {
        await windowing.sanitize();
        await windowing.process({ overlap: false });
      } else {
        await windowing.process({ overlap: true });
      }
    } catch (error) {
      Logger.error('[Container] ' + error);
      return await this.error();
    }

    this.state = 'completed';
    return await this.success();
  }

  async success() {
    axios
      .post(
        `/jobs/${this.job}/tasks/complete`,
        {
          task: this.name,
          state: this.state,
          token: config.data.token
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
        Logger.error('[API] :' + error);
      });
  }

  async error() {
    axios
      .post(`/jobs/${this.job}/task/error?task=${this.name}`, null, {
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
        Logger.error('[API] :' + error);
      });
  }
}

export default Tasks;
