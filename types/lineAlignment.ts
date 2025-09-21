// Line Alignment System Types
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

export interface TemplateMetadata {
  id: string;
  name: string;
  type: 'lined' | 'blank';
  lineHeight: number;
  marginTop: number;
  marginLeft: number;
  marginRight: number;
  marginBottom: number;
  lineSpacing: number;
  lineColor: string;
  hasMarginLine: boolean;
  marginLinePosition: number;
  marginLineColor: string;
  baselineOffset: number;
  description: string;
}

export interface MarginBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface AlignedLine {
  text: string;
  x: number;
  y: number;
  baseline: number;
}

export interface AlignmentResult {
  lines: AlignedLine[];
  totalHeight: number;
  marginAdjustments: MarginBounds;
}

export interface LineAlignmentConfig {
  enabled: boolean;
  template: TemplateMetadata;
  baselineOffset: number;
  marginAdjustments: MarginBounds;
}

export interface ITemplateMetadataLoader {
  loadMetadata(templateId: string): Promise<TemplateMetadata>;
  loadAllMetadata(): Promise<TemplateMetadata[]>;
  validateMetadata(metadata: TemplateMetadata): boolean;
  hasMetadata(templateId: string): Promise<boolean>;
}

export interface ILineAlignmentEngine {
  calculateTextBaseline(template: TemplateMetadata, fontSize: number): number;
  getLineSpacing(template: TemplateMetadata): number;
  getMarginBounds(template: TemplateMetadata): MarginBounds;
  alignTextToLines(text: string, template: TemplateMetadata, config: any): AlignmentResult;
  calculateLinePositions(template: TemplateMetadata, canvasHeight: number): number[];
}

export class TemplateMetadataError extends Error {
  constructor(
    public readonly templateId: string,
    public readonly type: 'not_found' | 'invalid' | 'load_error',
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'TemplateMetadataError';
  }
}