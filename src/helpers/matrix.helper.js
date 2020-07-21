class MatrixHelper {
  static transpose(matrix) {
    return matrix.reduce(
      (prev, next) => next.map((item, i) => (prev[i] || []).concat(next[i])),
      []
    );
  }
}

export default MatrixHelper;
