import path from 'path';
import fs from 'fs';
import LineByLineReader from 'line-by-line';
import * as WindowingFunction from './windowing.functions';
import MatrixHelper from '../helpers/matrix.helper';
import Config from '../utils/config';

const config = Config.getConfig();

class Windowing {
  constructor(length, func, overlap, input) {
    this.length = length;
    this.func = func;
    this.overlap = overlap;
    this.dataInput = input;
    this.sanitizeInput = null;
  }

  async sanitize() {
    const lineReader = new LineByLineReader(this.dataInput, {
      skipEmptyLines: true
    });

    this.sanitizeInput = path.join(config.data.base_path, 'windowing.sanitize.tmp');

    const output = await this.makeOutput(this.sanitizeInput);

    return new Promise((resolve, reject) => {
      let counter = 0;
      let labelIndex;

      let currentLabel;
      let labelCounter = 1;
      let tempData = [];

      lineReader.on('line', async line => {
        const lineArr = line.split(',');
        if (counter === 0) {
          for (let i = 0; i < lineArr.length; ++i) {
            if (lineArr[i] === 'label') {
              labelIndex = i;
            }
          }
          output.write(line);
        } else {
          if (currentLabel === undefined) {
            currentLabel = lineArr[labelIndex];
          }

          if (currentLabel === lineArr[labelIndex]) {
            tempData.push(line);

            if (labelCounter % this.length === 0) {
              lineReader.pause();
              for (let i = 0; i < tempData.length; ++i) {
                output.write('\n' + tempData[i]);
              }
              tempData = [];
              lineReader.resume();
            }
          } else {
            labelCounter = 1;
            tempData = [];
            tempData.push(line);
          }
          ++labelCounter;
          currentLabel = lineArr[labelIndex];
        }

        ++counter;
      });

      lineReader.once('end', async () => {
        lineReader.close();
        output.end();
        resolve();
      });

      lineReader.once('error', async error => {
        reject(new Error('[Container] : ' + error));
      });
    });
  }

  async process(options = { overlap: false }) {
    if (options.overlap) {
      return await this.processWithOverlap();
    } else {
      return await this.processWithoutOverlap();
    }
  }

  async processWithoutOverlap() {
    const input = this.sanitizeInput === null ? this.dataInput : this.sanitizeInput;
    const lineReader = new LineByLineReader(input, {
      skipEmptyLines: true
    });

    const outputFile = path.join(config.data.base_path, 'windowing.csv');

    const output = await this.makeOutput(outputFile);

    return new Promise((resolve, reject) => {
      let counter = 0;
      let totalAttributes = 0;
      let indexLabel = 0;

      const tempObject = {};

      lineReader.on('line', async line => {
        if (counter === 0) {
          output.write(line + '\n');

          const attributes = line.split(',');
          totalAttributes = attributes.length;

          for (let i = 0; i < totalAttributes; ++i) {
            if (attributes[i] === 'label') {
              indexLabel = i;
            }
            tempObject[i] = {
              label: attributes[i],
              data: []
            };
          }
        } else {
          const attValues = line.split(',');
          for (let i = 0; i < attValues.length; ++i) {
            tempObject[i.toString()].data.push(attValues[i]);
          }

          if (counter % this.length === 0) {
            lineReader.pause();

            const matrix = [];
            for (let i = 0; i < totalAttributes; ++i) {
              let window;
              if (!(i === indexLabel)) {
                const signal = tempObject[i.toString()].data;
                window = await this.applyFunction(this.func, signal);
              } else {
                window = tempObject[i.toString()].data;
              }

              matrix.push(window);
              tempObject[i.toString()].data = [];
            }

            const transpose = MatrixHelper.transpose(matrix);

            for (let i = 0; i < transpose.length; i++) {
              output.write(transpose[i] + '\n');
            }

            lineReader.resume();
          }
        }
        ++counter;
      });

      lineReader.once('end', async () => {
        lineReader.close();
        output.end();
        if (!(this.sanitizeInput === null)) {
          try {
            await fs.promises.unlink(this.sanitizeInput);
            resolve();
          } catch (error) {
            reject(new Error('[Container] : ' + error));
          }
        }
      });

      lineReader.once('error', async error => {
        reject(new Error('[Container] : ' + error));
      });
    });
  }

  async processWithOverlap() {
    /**
     * TODO
     */
    return new Promise((resolve, reject) => {
      reject(new Error('Windowing task with overlap is not implemented yet'));
    });
  }

  async makeOutput(outputPath) {
    let writeStream;

    try {
      await fs.promises.access(outputPath);
      fs.promises.unlink(outputPath);
      writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });
      } else {
        throw new Error('[Container] : ' + error);
      }
    }

    return writeStream;
  }

  async applyFunction(func, signal) {
    return new Promise(resolve => {
      let window;
      switch (func) {
        case 'rectangular':
          window = new WindowingFunction.Rectangular(signal).compute();
          break;
        case 'triangular':
          window = new WindowingFunction.Triangular(signal).compute();
          break;
        case 'blackman':
          window = new WindowingFunction.Blackman(signal).compute();
          break;
        case 'hamming':
          window = new WindowingFunction.Hamming(signal).compute();
          break;
        case 'hann':
          window = new WindowingFunction.Hann(signal).compute();
          break;
      }
      resolve(window);
    });
  }
}

export default Windowing;
