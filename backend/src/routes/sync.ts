import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { env } from '../env.js';
import { requireAuth } from '../middleware/auth.js';

export const syncRouter = Router();

syncRouter.get('/pull', requireAuth, async (_req, res) => {
  const dataset = await prisma.dataset.findUnique({ where: { key: env.DATASET_KEY } });
  if (!dataset) {
    return res.json({ key: env.DATASET_KEY, version: 0, data: null, updatedAt: null });
  }
  return res.json({
    key: dataset.key,
    version: dataset.version,
    data: dataset.data,
    updatedAt: dataset.updatedAt,
  });
});

const pushSchema = z.object({
  baseVersion: z.number().int().nonnegative().optional(),
  data: z.unknown(),
});

syncRouter.post('/push', requireAuth, async (req, res) => {
  const parsed = pushSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
  }

  const { baseVersion, data } = parsed.data;
  const existing = await prisma.dataset.findUnique({ where: { key: env.DATASET_KEY } });

  if (existing && typeof baseVersion === 'number' && baseVersion !== existing.version) {
    return res.status(409).json({
      error: 'Version conflict',
      serverVersion: existing.version,
      serverData: existing.data,
    });
  }

  const nextVersion = (existing?.version ?? 0) + 1;
  const jsonData = data as Prisma.InputJsonValue;

  const updated = await prisma.dataset.upsert({
    where: { key: env.DATASET_KEY },
    create: { key: env.DATASET_KEY, version: nextVersion, data: jsonData },
    update: { version: nextVersion, data: jsonData },
  });

  return res.json({
    key: updated.key,
    version: updated.version,
    updatedAt: updated.updatedAt,
  });
});


