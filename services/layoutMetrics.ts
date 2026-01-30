export interface LayoutMetricsInput {
  canvasWidth: number;
  canvasHeight: number;
  fontSize: number;
  baselineJitterRange: number;
  distortionLevel?: number;
}

export interface LayoutMetricsResult {
  topMargin: number;
  bottomMargin: number;
  sideMargin: number;
  lineSpacing: number;
  lineHeightFactor: number;
  linesPerPage: number;
  availableWidth: number;
  availableHeight: number;
  approxWordsPerLine: number;
  wordsPerPage: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function computeHandwritingLayoutMetrics(input: LayoutMetricsInput): LayoutMetricsResult {
  const fontSize = Math.max(12, input.fontSize || 18);
  const canvasWidth = Math.max(320, input.canvasWidth || 800);
  const canvasHeight = Math.max(320, input.canvasHeight || 1000);
  const normalizedJitter = clamp(input.baselineJitterRange ?? 0.35, 0.08, 0.65);
  const distortionLevel = input.distortionLevel ?? 2;

  let distortionCompensation = 1;
  if (distortionLevel === 1) {
    distortionCompensation = 1.12;
  } else if (distortionLevel === 3) {
    distortionCompensation = 0.94;
  }

  const jitterInfluence = clamp(normalizedJitter * distortionCompensation, 0.08, 0.85);

  const topMargin = Math.max(40, fontSize * (1.15 + jitterInfluence * 0.28));
  const bottomMargin = Math.max(38, fontSize * (1.05 + jitterInfluence * 0.24));
  const sideMargin = Math.max(18, fontSize * (0.46 + jitterInfluence * 0.1));

  const availableWidth = Math.max(160, canvasWidth - sideMargin * 2);
  const availableHeight = Math.max(180, canvasHeight - topMargin - bottomMargin);

  const lineHeightFactor = 1.18 + jitterInfluence * 0.26;
  const lineSpacing = fontSize * lineHeightFactor;
  const linesPerPage = Math.max(4, Math.floor(availableHeight / lineSpacing));

  const approxCharWidth = fontSize * (0.4 + jitterInfluence * 0.05);
  let approxCharsPerLine = Math.max(10, Math.floor(availableWidth / approxCharWidth));
  if (distortionLevel === 3) {
    approxCharsPerLine = Math.floor(approxCharsPerLine * 0.92);
  }

  const approxWordsPerLine = Math.max(3, Math.floor(approxCharsPerLine / 4.6));
  const wordsPerPage = Math.max(120, Math.round(approxWordsPerLine * linesPerPage * 0.9));

  return {
    topMargin,
    bottomMargin,
    sideMargin,
    lineSpacing,
    lineHeightFactor,
    linesPerPage,
    availableWidth,
    availableHeight,
    approxWordsPerLine,
    wordsPerPage
  };
}
