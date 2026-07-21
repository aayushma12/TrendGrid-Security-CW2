import type { PaymentStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';

export const createTransaction = (input: {
  orderId: string;
  gateway: 'ESEWA';
  referenceId: string;
  amount: number;
}) =>
  prisma.paymentTransaction.create({
    data: {
      orderId: input.orderId,
      gateway: input.gateway,
      referenceId: input.referenceId,
      amount: new Prisma.Decimal(input.amount),
      status: 'PENDING',
    },
  });

export const findByReferenceId = (referenceId: string) =>
  prisma.paymentTransaction.findUnique({ where: { referenceId } });

export const markVerified = (
  referenceId: string,
  data: { status: PaymentStatus; gatewayRefId?: string | null; gatewayResponse: Prisma.InputJsonValue },
) =>
  prisma.paymentTransaction.update({
    where: { referenceId },
    data: {
      status: data.status,
      gatewayRefId: data.gatewayRefId ?? null,
      gatewayResponse: data.gatewayResponse,
      verifiedAt: new Date(),
    },
  });
