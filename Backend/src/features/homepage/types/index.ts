/**
 * The `content` JSON blob shape. Mirrors the storefront admin's editable
 * schema exactly (fields + repeaters) so the frontend can persist/restore
 * it verbatim — the backend does not interpret field semantics, only
 * validates structure (see validator/index.ts).
 */
export type HomeFieldType = 'text' | 'textarea' | 'image';

export interface HomeField {
  key: string;
  label: string;
  type: HomeFieldType;
  value: string;
}

export interface HomeRepeaterFieldDef {
  key: string;
  label: string;
  type: HomeFieldType;
}

export interface HomeRepeater {
  key: string;
  label: string;
  itemNoun: string;
  itemFields: HomeRepeaterFieldDef[];
  /** Each item is a flat key→value map keyed by itemFields[].key. */
  items: Record<string, string>[];
}

export interface HomeSectionContent {
  /** Optional inline admin note, e.g. "Tiles are managed in Categories". */
  note?: string;
  fields: HomeField[];
  repeaters: HomeRepeater[];
}

export interface HomepageSection {
  id: string;
  key: string;
  name: string;
  description?: string;
  visible: boolean;
  sortOrder: number;
  content: HomeSectionContent;
  createdAt: Date;
  updatedAt: Date;
}
