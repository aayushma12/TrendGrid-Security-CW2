import { z } from 'zod';

import { HOME_FIELD_TYPES } from '../constants';

const uuid = z.string().uuid('Must be a valid UUID');

const homeFieldSchema = z.object({
  key: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(200),
  type: z.enum(HOME_FIELD_TYPES),
  value: z.string().max(20000),
});

const homeRepeaterFieldDefSchema = z.object({
  key: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(200),
  type: z.enum(HOME_FIELD_TYPES),
});

/** Repeater items are flat key→value maps, keyed by the repeater's itemFields[].key. */
const repeaterItemSchema = z.record(z.string().max(20000));

const homeRepeaterSchema = z.object({
  key: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(200),
  itemNoun: z.string().trim().min(1).max(100),
  itemFields: z.array(homeRepeaterFieldDefSchema).max(50),
  items: z.array(repeaterItemSchema).max(200),
});

/** PUT /homepage/:id/content body. */
export const updateSectionContentSchema = z.object({
  note: z.string().max(1000).optional(),
  fields: z.array(homeFieldSchema).max(50),
  repeaters: z.array(homeRepeaterSchema).max(20),
});

/** PATCH /homepage/:id/visibility body. */
export const updateSectionVisibilitySchema = z.object({
  visible: z.boolean(),
});

/** PATCH /homepage/reorder body — every existing section id, exactly once. */
export const reorderSectionsSchema = z.object({
  order: z.array(uuid).min(1),
});

export const sectionIdParamsSchema = z.object({ id: uuid });
