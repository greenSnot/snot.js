THREE = {};
THREE.Math = {
  clamp: function(a, b, c) {
    if (a >c) return c;
    if (a <b) return b;
    return a;
  }
};
