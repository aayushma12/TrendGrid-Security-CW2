/**
 * Controller — lightweight. Receives request → calls service → standard response.
 */
import type { Request, Response } from 'express';

import * as userService from '../service';
import { success, created, noContent, paginated } from '../../../utils/response';
import { parseQueryOptions } from '../../../utils/queryOptions';
import { USER_SORT_FIELDS, USER_FILTER_FIELDS } from '../constants';
import { BadRequestError, ForbiddenError } from '../../../utils/errors';
import { MESSAGES } from '../../../constants';
import { logger } from '../../../utils/logger';
import { sendSecurityAlert } from '../../../utils/securityAlert';

const STAFF_ROLES = new Set(['ADMIN', 'EDITOR']);

export const createUserController = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.createUser(req.body);
  logger.warn(`AUDIT user created by admin=${req.user?.id} target=${user.id} role=${user.role}`);
  created(res, user, 'User created successfully.');
};

export const getUserController = async (req: Request, res: Response): Promise<void> => {
  // A user may fetch their own profile; anyone else's profile requires staff role.
  const isSelf = req.user?.id === req.params.id;
  const isStaff = req.user?.role ? STAFF_ROLES.has(req.user.role) : false;
  if (!isSelf && !isStaff) {
    throw new ForbiddenError('You can only view your own profile.');
  }
  const user = await userService.getUserById(req.params.id);
  success(res, user, 'User retrieved successfully.');
};

export const getUsersController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...USER_SORT_FIELDS],
    allowedFilters: [...USER_FILTER_FIELDS],
  });
  const { items, meta } = await userService.getUsers(options);
  paginated(res, items, meta, 'Users retrieved successfully.');
};

export const updateUserController = async (req: Request, res: Response): Promise<void> => {
  // Role changes are ADMIN-only. The route allows EDITOR to hit this endpoint
  // for ordinary profile edits, but without this check an EDITOR could set
  // role: 'ADMIN' on any account (self or otherwise) and fully escalate.
  if (req.body.role !== undefined && req.user?.role !== 'ADMIN') {
    sendSecurityAlert('role_escalation_attempt', {
      actorId: req.user?.id,
      actorRole: req.user?.role,
      targetUserId: req.params.id,
      requestedRole: req.body.role,
    });
    throw new ForbiddenError('Only administrators can change a user\'s role.');
  }

  // Same reasoning as role above — isActive is a privileged account-status
  // field (a non-ADMIN EDITOR could otherwise disable/re-enable ANY account,
  // including an ADMIN's, without ever touching the role field itself).
  if (req.body.isActive !== undefined && req.user?.role !== 'ADMIN') {
    sendSecurityAlert('role_escalation_attempt', {
      actorId: req.user?.id,
      actorRole: req.user?.role,
      targetUserId: req.params.id,
      requestedIsActive: req.body.isActive,
    });
    throw new ForbiddenError('Only administrators can change an account\'s active status.');
  }

  const user = await userService.updateUser(req.params.id, req.body);
  if (req.body.role !== undefined) {
    logger.warn(`AUDIT role changed by admin=${req.user?.id} target=${req.params.id} newRole=${req.body.role}`);
  }
  if (req.body.isActive !== undefined) {
    logger.warn(`AUDIT active status changed by admin=${req.user?.id} target=${req.params.id} isActive=${req.body.isActive}`);
  }
  success(res, user, 'User updated successfully.');
};

/** Self-service — the authenticated user editing their own profile. Only
 *  firstName/lastName/phoneNumber can ever reach here (see
 *  updateOwnProfileSchema); there is no role/isActive field to guard against. */
export const updateOwnProfileController = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateUser(req.user!.id, req.body);
  success(res, user, 'Profile updated successfully.');
};

/** "Download my data" — full privacy export of the caller's own account. */
export const exportMyDataController = async (req: Request, res: Response): Promise<void> => {
  const data = await userService.exportUserData(req.user!.id);
  success(res, data, 'Data export ready.');
};

/** "Restore profile backup" — validated + allowlisted by importProfileSchema before this ever runs. */
export const importMyDataController = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.importUserData(req.user!.id, req.body);
  success(res, user, 'Profile restored successfully.');
};

export const deleteUserController = async (req: Request, res: Response): Promise<void> => {
  await userService.deleteUser(req.params.id, req.user?.id);
  logger.warn(`AUDIT user deleted by admin=${req.user?.id} target=${req.params.id}`);
  noContent(res);
};

export const resetUserMfaController = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.adminResetMfa(req.params.id, req.user!.id);
  success(res, user, 'MFA has been reset for this user. They can log in with just their password and re-enroll.');
};

export const uploadUserAvatarController = async (req: Request, res: Response): Promise<void> => {
  // Same rule as getUserController: a user may only replace their own avatar
  // unless they're staff. Without this check any authenticated user could
  // overwrite another account's avatar by guessing/enumerating its id (IDOR).
  const isSelf = req.user?.id === req.params.id;
  const isStaff = req.user?.role ? STAFF_ROLES.has(req.user.role) : false;
  if (!isSelf && !isStaff) {
    throw new ForbiddenError('You can only update your own avatar.');
  }

  const file = req.file;
  if (!file?.buffer) throw new BadRequestError('Avatar file is required (field: "avatar")');
  const user = await userService.setUserAvatar(req.params.id, file.buffer);
  success(res, user, MESSAGES.UPDATED);
};

export const removeUserAvatarController = async (req: Request, res: Response): Promise<void> => {
  // Same ownership rule as upload — self or staff only.
  const isSelf = req.user?.id === req.params.id;
  const isStaff = req.user?.role ? STAFF_ROLES.has(req.user.role) : false;
  if (!isSelf && !isStaff) {
    throw new ForbiddenError('You can only remove your own avatar.');
  }

  const user = await userService.removeUserAvatar(req.params.id);
  success(res, user, 'Avatar removed successfully.');
};
