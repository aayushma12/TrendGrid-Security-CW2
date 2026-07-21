import { HomepageSection, HomeSectionContent } from '../types';

export interface HomepageSectionResponseDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  visible: boolean;
  sortOrder: number;
  content: HomeSectionContent;
  createdAt: string;
  updatedAt: string;
}

/** PUT /homepage/:id/content body — replaces the section's content wholesale. */
export type UpdateSectionContentDto = HomeSectionContent;

/** PATCH /homepage/:id/visibility body. */
export interface UpdateSectionVisibilityDto {
  visible: boolean;
}

/** PATCH /homepage/reorder body — full ordered list of section ids. */
export interface ReorderSectionsDto {
  order: string[];
}

/** POST /homepage/:id/image response — paste `url` into a content field's `value`. */
export interface HomepageImageUploadResponseDto {
  url: string;
  publicId: string;
}

export const toHomepageSectionResponseDto = (s: HomepageSection): HomepageSectionResponseDto => ({
  id: s.id,
  key: s.key,
  name: s.name,
  description: s.description ?? null,
  visible: s.visible,
  sortOrder: s.sortOrder,
  content: s.content,
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt.toISOString(),
});
