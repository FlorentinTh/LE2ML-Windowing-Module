import Joi from '@hapi/joi';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const defaultValidationSchema = Joi.object({
  LOG_FILE: Joi.string().required(),
  API_URL: Joi.string().required(),
  API_VERSION: Joi.string().required(),
  API_APP_KEY: Joi.string().required(),
  API_PROXY: Joi.string().required()
})
  .unknown()
  .required();

class Config {
  static getConfig() {
    const { error, value: env } = defaultValidationSchema.validate(process.env);

    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }

    return {
      env: process.env.NODE_ENV,
      log_file: env.LOG_FILE,
      data: {
        user_id: process.env.DATA_USER_ID,
        job_id: process.env.DATA_JOB_ID
      },
      api: {
        url: path.normalize(env.API_URL),
        version: path.normalize(env.API_VERSION),
        app_key: path.normalize(env.API_APP_KEY),
        proxy: path.normalize(env.API_PROXY)
      }
    };
  }
}

export default Config;
