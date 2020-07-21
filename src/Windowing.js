import path from 'path';
import fs from 'fs';
import LineByLineReader from 'line-by-line';
import Logger from './utils/logger';
import * as WindowFunction from './WindowFunction';
import MatrixHelper from './helpers/matrix.helper';

class Windowing {
  constructor(length, func, input) {
    this.length = length;
    this.func = func;
    this.input = input;
  }

  async start(user, job) {
    Logger.info(`User: ${user} starts windowing task for job: ${job}`);

    const outputFile = path.join(__dirname, 'output', 'input.window.csv');
    const lineReader = new LineByLineReader(this.input, { skipEmptyLines: true });

    let writeStream;

    try {
      await fs.promises.access(outputFile);
      fs.unlinkSync(outputFile);
      writeStream = fs.createWriteStream(outputFile, { encoding: 'utf-8' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        writeStream = fs.createWriteStream(outputFile, { encoding: 'utf-8' });
      } else {
        Logger.error('Error: ' + error);
      }
    }

    let counter = 0;
    let totalAttributes = 0;
    let indexLabel = 0;

    const tempObject = {};

    lineReader.on('line', line => {
      if (counter === 0) {
        writeStream.write(line + '\n');

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

              switch (this.func) {
                case 'rectangular':
                  window = new WindowFunction.Rectangular(signal).compute();
                  break;
                case 'triangular':
                  window = new WindowFunction.Triangular(signal).compute();
                  break;
                case 'blackman':
                  window = new WindowFunction.Blackman(signal).compute();
                  break;
                case 'hamming':
                  window = new WindowFunction.Hamming(signal).compute();
                  break;
                case 'hann':
                  window = new WindowFunction.Hann(signal).compute();
                  break;
              }
            } else {
              window = tempObject[i.toString()].data;
            }

            matrix.push(window);
            tempObject[i.toString()].data = [];
          }

          const transpose = MatrixHelper.transpose(matrix);

          for (let i = 0; i < transpose.length; i++) {
            writeStream.write(transpose[i] + '\n');
          }

          lineReader.resume();
        }
      }
      ++counter;
    });

    lineReader.on('end', () => {
      lineReader.close();
      writeStream.end();
    });

    Logger.info(`End of windowing task started by: ${user} for job: ${job}`);
  }
}

export default Windowing;
