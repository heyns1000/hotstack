import { Hono } from 'hono';
import type { Env } from '../types';

const mochaApp = new Hono<{ Bindings: Env }>();

// Webhook endpoint to receive events from other Mocha apps
mochaApp.post('/webhook', async (c) => {
  try {
    const payload = await c.req.json();
    
    console.log('Received webhook event:', payload);

    // Store the webhook event
    const result = await c.env.DB.prepare(
      `INSERT INTO mocha_webhook_events (event_type, app_id, payload, processed)
       VALUES (?, ?, ?, ?)`
    ).bind(
      payload.event_type || payload.type || 'unknown',
      payload.app_id || 'unknown',
      JSON.stringify(payload),
      0
    ).run();

    return c.json({ 
      success: true, 
      message: 'Webhook event received',
      eventId: result.meta.last_row_id 
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to process webhook event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all webhook events
mochaApp.get('/events', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const events = await c.env.DB.prepare(
      `SELECT * FROM mocha_webhook_events 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    const totalResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM mocha_webhook_events`
    ).first();

    const processedResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM mocha_webhook_events WHERE processed = 1`
    ).first();

    const totalCount = Number(totalResult?.count || 0);
    const processedCount = Number(processedResult?.count || 0);

    return c.json({
      events: events.results || [],
      total: totalCount,
      processed: processedCount,
      pending: totalCount - processedCount
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get event by ID
mochaApp.get('/events/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const event = await c.env.DB.prepare(
      `SELECT * FROM mocha_webhook_events WHERE id = ?`
    ).bind(id).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    return c.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return c.json({ 
      error: 'Failed to fetch event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Mark event as processed
mochaApp.put('/events/:id/process', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(
      `UPDATE mocha_webhook_events 
       SET processed = 1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(id).run();

    return c.json({ success: true, message: 'Event marked as processed' });
  } catch (error) {
    console.error('Error processing event:', error);
    return c.json({ 
      error: 'Failed to process event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete event
mochaApp.delete('/events/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(
      `DELETE FROM mocha_webhook_events WHERE id = ?`
    ).bind(id).run();

    return c.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return c.json({ 
      error: 'Failed to delete event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Clear all events
mochaApp.delete('/events', async (c) => {
  try {
    await c.env.DB.prepare(
      `DELETE FROM mocha_webhook_events`
    ).run();

    return c.json({ success: true, message: 'All events cleared' });
  } catch (error) {
    console.error('Error clearing events:', error);
    return c.json({ 
      error: 'Failed to clear events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default mochaApp;
