import { apiRequest } from "./client";
import type { HomeSectionContent, HomepageSectionDto } from "./types";

/** Public: visible sections only, in display order. Used by the live storefront. */
export async function listPublicHomepageSections() {
  return apiRequest<HomepageSectionDto[]>("/homepage", { auth: false });
}

/** Admin: every section (visible + hidden), in display order. */
export async function listAdminHomepageSections() {
  return apiRequest<HomepageSectionDto[]>("/homepage/admin");
}

export async function getHomepageSection(id: string) {
  return apiRequest<HomepageSectionDto>(`/homepage/${id}`);
}

export async function updateHomepageSectionContent(id: string, content: HomeSectionContent) {
  return apiRequest<HomepageSectionDto>(`/homepage/${id}/content`, {
    method: "PUT",
    body: JSON.stringify(content),
  });
}

export async function updateHomepageSectionVisibility(id: string, visible: boolean) {
  return apiRequest<HomepageSectionDto>(`/homepage/${id}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ visible }),
  });
}

/** `order` must contain every existing section id, each exactly once. */
export async function reorderHomepageSections(order: string[]) {
  return apiRequest<HomepageSectionDto[]>("/homepage/reorder", {
    method: "PATCH",
    body: JSON.stringify({ order }),
  });
}

/**
 * Upload an image file for use inside a section's content (Cloudinary via the
 * shared imageService pipeline). Returns the hosted URL — does not persist to
 * content by itself; the caller writes the returned url into a field and
 * saves via updateHomepageSectionContent.
 */
export async function uploadHomepageSectionImage(id: string, image: File) {
  const body = new FormData();
  body.append("image", image);
  return apiRequest<{ url: string; publicId: string }>(`/homepage/${id}/image`, {
    method: "POST",
    body,
  });
}
