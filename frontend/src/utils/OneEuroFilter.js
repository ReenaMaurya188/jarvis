export class OneEuroFilter {
  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xPrev = null;
    this.dxPrev = null;
    this.tPrev = null;
  }

  smoothingFactor(t_e, cutoff) {
    const r = 2 * Math.PI * cutoff * t_e;
    return r / (r + 1);
  }

  exponentialSmoothing(a, x, xPrev) {
    return a * x + (1 - a) * xPrev;
  }

  filter(t, x) {
    if (this.tPrev === null) {
      this.tPrev = t;
      this.xPrev = x;
      this.dxPrev = 0.0;
      return x;
    }

    const t_e = t - this.tPrev;
    if (t_e <= 0) return this.xPrev;

    // Calculate dx/dt
    const dx = (x - this.xPrev) / t_e;

    // Smooth dx
    const aD = this.smoothingFactor(t_e, this.dCutoff);
    const dxSmoothed = this.exponentialSmoothing(aD, dx, this.dxPrev);

    // Calculate cutoff frequency
    const cutoff = this.minCutoff + this.beta * Math.abs(dxSmoothed);

    // Smooth x
    const a = this.smoothingFactor(t_e, cutoff);
    const xSmoothed = this.exponentialSmoothing(a, x, this.xPrev);

    // Store state
    this.tPrev = t;
    this.xPrev = xSmoothed;
    this.dxPrev = dxSmoothed;

    return xSmoothed;
  }
}

// Helper class to filter a 3D coordinate {x, y, z}
export class OneEuroFilter3D {
  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.filterX = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterZ = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  filter(t, point) {
    if (!point) return null;
    return {
      x: this.filterX.filter(t, point.x),
      y: this.filterY.filter(t, point.y),
      z: this.filterZ.filter(t, point.z)
    };
  }
}

// Helper class to filter a list of 3D landmarks (like a full hand)
export class OneEuroFilterLandmarks {
  constructor(numLandmarks = 21, minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.filters = Array.from({ length: numLandmarks }, () => new OneEuroFilter3D(minCutoff, beta, dCutoff));
  }

  filter(t, landmarks) {
    if (!landmarks) return null;
    return landmarks.map((lm, i) => this.filters[i].filter(t, lm));
  }
}
