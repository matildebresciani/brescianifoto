import { z } from 'zod';

export const pageNumberSchema = z.undefined().or(z.coerce.number().int());
