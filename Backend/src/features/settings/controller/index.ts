import { Request, Response } from 'express';

import { success } from '../../../utils/response';
import * as settingsService from '../service';
import { SETTINGS_MESSAGES } from '../constants';

export const getSettingsController = async (_req: Request, res: Response): Promise<void> => {
  const settings = await settingsService.getSettings();
  success(res, settings, SETTINGS_MESSAGES.FETCHED);
};

export const updateSettingsController = async (req: Request, res: Response): Promise<void> => {
  const settings = await settingsService.updateSettings(req.body);
  success(res, settings, SETTINGS_MESSAGES.UPDATED);
};
