class WindowingFunction {
  constructor(signal) {
    if (this.constructor === WindowingFunction) {
      throw new TypeError(
        'Abstract class "WindowFunction" cannot be instantiated directly'
      );
    }

    if (!(signal.constructor === Array)) {
      throw new Error('Expected type for argument "signal" is Array');
    }

    if (!signal.length > 0) {
      throw new Error('Signal argument cannot be empty');
    }
  }

  compute() {
    throw new Error('You must implement this function');
  }
}

export class Blackman extends WindowingFunction {
  constructor(signal) {
    super(signal);

    this.signal = signal;
    this.a0 = 0.42659;
    this.a1 = 0.49656;
    this.a2 = 0.076849;
  }

  compute() {
    const result = [];

    for (let i = 0; i < this.signal.length; ++i) {
      const f = (6.283185307179586 * i) / (this.signal.length - 1);

      result[i] =
        this.signal[i] * (this.a0 - this.a1 * Math.cos(f) + this.a2 * Math.cos(2 * f));
    }

    return result;
  }
}

export class Hamming extends WindowingFunction {
  constructor(signal) {
    super(signal);

    this.signal = signal;
  }

  compute() {
    const result = [];

    for (let i = 0; i < this.signal.length; ++i) {
      result[i] =
        this.signal[i] *
        (0.54 - 0.46 * Math.cos((6.283185307179586 * i) / (this.signal.length - 1)));
    }

    return result;
  }
}

export class Hann extends WindowingFunction {
  constructor(signal) {
    super(signal);

    this.signal = signal;
  }

  compute() {
    const result = [];

    for (let i = 0; i < this.signal.length; ++i) {
      result[i] =
        this.signal[i] *
        (0.5 * (1 - Math.cos((6.283185307179586 * i) / (this.signal.length - 1))));
    }

    return result;
  }
}

export class Triangular extends WindowingFunction {
  constructor(signal) {
    super(signal);

    this.signal = signal;
  }

  compute() {
    const result = [];

    for (let i = 0; i < this.signal.length; ++i) {
      result[i] =
        this.signal[i] *
        (1 - Math.abs((2 * (i - 0.5 * (this.signal.length - 1))) / this.signal.length));
    }

    return result;
  }
}

export class Rectangular extends WindowingFunction {
  constructor(signal) {
    super(signal);

    this.signal = signal;
  }

  compute() {
    const result = [];

    for (let i = 0; i < this.signal.length; ++i) {
      result[i] = this.signal[i] * 1;
    }

    return result;
  }
}
