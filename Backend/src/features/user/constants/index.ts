export const USER_ROLES = ['ADMIN', 'USER', 'EDITOR'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_SORT_FIELDS = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'] as const;
export const USER_FILTER_FIELDS = ['role', 'isActive'] as const;

export const USER_AVATAR_SUBFOLDER = 'users/avatars';
