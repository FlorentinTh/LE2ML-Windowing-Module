import path from 'path';
import fs from 'fs';
import LineByLineReader from 'line-by-line';
import Logger from '../utils/logger';
import * as WindowingFunction from './windowing.functions';
import MatrixHelper from '../helpers/matrix.helper';

class Windowing {
  constructor(length, func, input) {
    this.length = length;
    this.func = func;
    this.input = input;
  }

  async apply(user, job) {
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
        Logger.error('[Container] Error: ' + error);
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
                  window = new WindowingFunction.Rectangular(signal);
                  break;
                case 'triangular':
                  window = new WindowingFunction.Triangular(signal);
                  break;
                case 'blackman':
                  window = new WindowingFunction.Blackman(signal);
                  break;
                case 'hamming':
                  window = new WindowingFunction.Hamming(signal);
                  break;
                case 'hann':
                  window = new WindowingFunction.Hann(signal);
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
  }
}

export default Windowing;
