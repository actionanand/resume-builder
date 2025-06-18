/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SkillPill {
  text: string;
  fontSize: number;
  color: string;
  background: string;
  border: [number, number, number, number];
  borderColor: string;
  padding: [number, number, number, number];
  margin: [number, number, number, number];
}

export interface SkillComma {
  text: string;
  fontSize: number;
  color: string;
  margin: [number, number, number, number];
}

export interface SkillCategory {
  name?: string;
  category?: string;
  title?: string;
  skills?: string[] | string;
  items?: string[];
}

export interface SkillColumn {
  width: string;
  stack: any[];
}

export interface PdfDocInfo {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: Date;
}

export interface PdfTableLayout {
  hLineWidth: (i: number, node: any) => number;
  vLineWidth: (i: number, node: any) => number;
  hLineColor: (i: number, node: any) => string;
  vLineColor: (i: number, node: any) => string;
  paddingLeft: (i: number, node: any) => number;
  paddingRight: (i: number, node: any) => number;
  paddingTop: (i: number, node: any) => number;
  paddingBottom: (i: number, node: any) => number;
}

export interface PdfTableLayouts {
  skillsLayout: PdfTableLayout;
}

export interface PdfStyles {
  header: PdfStyle;
  subheader: PdfStyle;
  sectionTitle: PdfStyle;
  normalText: PdfStyle;
  smallText: PdfStyle;
  listItem: PdfStyle;
  dateText: PdfStyle;
}

export interface PdfStyle {
  fontSize?: number;
  bold?: boolean;
  color?: string;
  margin?: number[];
  italics?: boolean;
}

export interface PdfDocDefinition {
  content: any[];
  info: PdfDocInfo;
  defaultStyle: {
    fontSize: number;
    lineHeight: number;
    color: string;
  };
  styles: PdfStyles;
  tableLayouts: PdfTableLayouts;
  pageSize: string;
  pageMargins: number[];
}
