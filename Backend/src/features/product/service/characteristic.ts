import { NotFoundError, DuplicateError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

import * as characteristicRepo from '../repository/characteristic';
import * as productRepo from '../repository/product';
import {
  CharacteristicResponseDto, CreateCharacteristicDto, UpdateCharacteristicDto, toCharacteristicDto,
} from '../dto';
import { PRODUCT_MESSAGES } from '../constants';

const assertProductExists = async (productId: string): Promise<void> => {
  const exists = await productRepo.existsById(productId);
  if (!exists) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
};

export const listCharacteristics = async (productId: string): Promise<CharacteristicResponseDto[]> => {
  await assertProductExists(productId);
  const rows = await characteristicRepo.listByProduct(productId);
  return rows.map(toCharacteristicDto);
};

export const createCharacteristic = async (
  productId: string, dto: CreateCharacteristicDto,
): Promise<CharacteristicResponseDto> => {
  await assertProductExists(productId);

  const dup = await characteristicRepo.findByName(productId, dto.name);
  if (dup) {
    throw new DuplicateError(PRODUCT_MESSAGES.CHAR_DUPLICATE, [
      { field: 'name', message: PRODUCT_MESSAGES.CHAR_DUPLICATE },
    ]);
  }

  const created = await characteristicRepo.create(productId, dto);
  logger.info(`Characteristic created productId=${productId} name="${created.name}"`);
  return toCharacteristicDto(created);
};

export const updateCharacteristic = async (
  productId: string, charId: string, dto: UpdateCharacteristicDto,
): Promise<CharacteristicResponseDto> => {
  await assertProductExists(productId);
  const existing = await characteristicRepo.findById(productId, charId);
  if (!existing) throw new NotFoundError(PRODUCT_MESSAGES.CHAR_NOT_FOUND);

  if (dto.name && dto.name !== existing.name) {
    const dup = await characteristicRepo.findByName(productId, dto.name);
    if (dup && dup.id !== charId) {
      throw new DuplicateError(PRODUCT_MESSAGES.CHAR_DUPLICATE, [
        { field: 'name', message: PRODUCT_MESSAGES.CHAR_DUPLICATE },
      ]);
    }
  }

  const updated = await characteristicRepo.update(productId, charId, dto);
  if (!updated) throw new NotFoundError(PRODUCT_MESSAGES.CHAR_NOT_FOUND);
  logger.info(`Characteristic updated productId=${productId} charId=${charId}`);
  return toCharacteristicDto(updated);
};

export const deleteCharacteristic = async (productId: string, charId: string): Promise<void> => {
  await assertProductExists(productId);
  const removed = await characteristicRepo.remove(productId, charId);
  if (!removed) throw new NotFoundError(PRODUCT_MESSAGES.CHAR_NOT_FOUND);
  logger.info(`Characteristic deleted productId=${productId} charId=${charId}`);
};
