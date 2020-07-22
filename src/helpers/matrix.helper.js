class MatrixHelper {
  static transpose(matrix) {
    if (!(matrix.constructor === Array)) {
      throw new Error('Expected type for argument matrix is Array.');
    }
    return matrix.reduce(
      (prev, next) => next.map((item, i) => (prev[i] || []).concat(next[i])),
      []
    );
  }
}

export default MatrixHelper;
