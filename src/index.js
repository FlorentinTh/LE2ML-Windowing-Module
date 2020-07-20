import LineByLineReader from 'line-by-line';
import path from 'path';
import fs from 'fs';

function Blackman(signal) {
  const output = [];

  const a0 = 0.42659;
  const a1 = 0.49656;
  const a2 = 0.076849;

  for (let i = 0; i < signal.length; ++i) {
    const f = (6.283185307179586 * i) / (signal.length - 1);
    output[i] = signal[i] * (a0 - a1 * Math.cos(f) + a2 * Math.cos(2 * f));
  }
  return output;
}

function Hamming(signal) {
  const output = [];
  for (let i = 0; i < signal.length; ++i) {
    output[i] =
      signal[i] * (0.54 - 0.46 * Math.cos((6.283185307179586 * i) / (signal.length - 1)));
  }
  return output;
}

function Hann(signal) {
  const output = [];
  for (let i = 0; i < signal.length; ++i) {
    output[i] =
      signal[i] * (0.5 * (1 - Math.cos((6.283185307179586 * i) / (signal.length - 1))));
  }
  return output;
}

function Triangular(signal) {
  const output = [];
  for (let i = 0; i < signal.length; ++i) {
    output[i] =
      signal[i] * (1 - Math.abs((2 * (i - 0.5 * (signal.length - 1))) / signal.length));
  }
  return output;
}

function Rectangular(signal) {
  const output = [];
  for (let i = 0; i < signal.length; ++i) {
    output[i] = signal[i] * 1;
  }
  return output;
}

function transposeMatrix(matrix) {
  return matrix.reduce(
    (prev, next) => next.map((item, i) => (prev[i] || []).concat(next[i])),
    []
  );
}

(async () => {
  const windowLength = 60;
  const windowFunction = 'rectangular';

  const inputFile = path.join(__dirname, '../data/soil_6_axis_imu_lsm9ds1.csv');
  const outputFile = path.join(__dirname, '../data/windowing.csv');

  const lineReader = new LineByLineReader(inputFile, { skipEmptyLines: true });
  let writeStream;

  try {
    await fs.promises.access(outputFile);
    fs.unlinkSync(outputFile);
    writeStream = fs.createWriteStream(outputFile, { encoding: 'utf-8' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      writeStream = fs.createWriteStream(outputFile, { encoding: 'utf-8' });
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

      if (counter % windowLength === 0) {
        lineReader.pause();

        const matrix = [];
        for (let i = 0; i < totalAttributes; ++i) {
          let window;
          if (!(i === indexLabel)) {
            const signal = tempObject[i.toString()].data;

            switch (windowFunction) {
              case 'rectangular':
                window = Rectangular(signal);
                break;
              case 'triangular':
                window = Triangular(signal);
                break;
              case 'blackman':
                window = Blackman(signal);
                break;
              case 'hamming':
                window = Hamming(signal);
                break;
              case 'hann':
                window = Hann(signal);
                break;
            }
          } else {
            window = tempObject[i.toString()].data;
          }

          matrix.push(window);
          tempObject[i.toString()].data = [];
        }

        const transpose = transposeMatrix(matrix);

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
})();
