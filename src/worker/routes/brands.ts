import { Hono } from 'hono';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import type { Env } from '../types';

type BrandEnv = { Bindings: Env; Variables: { adminUser: { id: number; email: string; fullName: string; isSuperAdmin: boolean } } };

const brands = new Hono<BrandEnv>();

// List all published brands — public
brands.get('/', async (c) => {
  try {
    const status = c.req.query('status');
    const sector = c.req.query('sector');

    let query = `SELECT * FROM marketplace_brands WHERE is_published = 1`;
    const params: string[] = [];

    if (status) { query += ` AND status = ?`; params.push(status); }
    if (sector) { query += ` AND sector LIKE ?`; params.push(`%${sector}%`); }

    query += ` ORDER BY sort_order ASC`;

    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ brands: result.results || [], total: result.results?.length ?? 0 });
  } catch (error) {
    console.error('Brands list error:', error);
    return c.json({ error: 'Failed to fetch brands', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
});

// Get single brand — public
brands.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const brand = await c.env.DB.prepare(
      `SELECT * FROM marketplace_brands WHERE id = ? AND is_published = 1`
    ).bind(id).first();

    if (!brand) return c.json({ error: 'Brand not found' }, 404);
    return c.json(brand);
  } catch (error) {
    return c.json({ error: 'Failed to fetch brand' }, 500);
  }
});

// Webhook import — requires admin auth (fixes audit finding F01)
brands.post('/webhook/import', adminAuthMiddleware, async (c) => {
  try {
    const { brands: incomingBrands } = await c.req.json() as { brands: Array<{
      id: string; icon?: string; name: string; sector: string; description: string;
      status?: string; tone?: number; sort_order?: number; is_published?: boolean;
    }> };

    if (!Array.isArray(incomingBrands) || incomingBrands.length === 0) {
      return c.json({ error: 'brands array required' }, 400);
    }

    const results: Array<{ id: string; status: string }> = [];
    for (const b of incomingBrands) {
      if (!b.id || !b.name || !b.sector) {
        results.push({ id: b.id ?? 'unknown', status: 'skipped: missing required fields' });
        continue;
      }
      await c.env.DB.prepare(
        `INSERT INTO marketplace_brands (id, icon, name, sector, description, status, tone, sort_order, is_published, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           icon = excluded.icon, name = excluded.name, sector = excluded.sector,
           description = excluded.description, status = excluded.status,
           tone = excluded.tone, sort_order = excluded.sort_order,
           is_published = excluded.is_published, updated_at = CURRENT_TIMESTAMP`
      ).bind(
        b.id, b.icon ?? '🌐', b.name, b.sector, b.description ?? '',
        b.status ?? 'Building', b.tone ?? 0, b.sort_order ?? 0, b.is_published ? 1 : 0
      ).run();
      results.push({ id: b.id, status: 'upserted' });
    }

    return c.json({ results, imported: results.filter(r => r.status === 'upserted').length });
  } catch (error) {
    console.error('Brand import error:', error);
    return c.json({ error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
});

export default brands;
