import { Hono } from 'hono';
import { GoogleGenAI } from '@google/genai';
import type { Env } from '../types';

const cart = new Hono<{ Bindings: Env }>();

// Add item to cart
cart.post('/add', async (c) => {
  try {
    const { userId, sessionId, itemType, itemId, itemName, itemDescription, price, currency, quantity, metadata } = await c.req.json();

    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO cart_items (user_id, session_id, item_type, item_id, item_name, item_description, price, currency, quantity, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId || null,
      sessionId,
      itemType,
      itemId,
      itemName,
      itemDescription || null,
      price,
      currency || 'USD',
      quantity || 1,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    // Track interaction
    await c.env.DB.prepare(
      `INSERT INTO user_interactions (user_id, session_id, interaction_type, page, element, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      userId || null,
      sessionId,
      'add_to_cart',
      'cart',
      itemName,
      JSON.stringify({ itemType, itemId, price })
    ).run();

    return c.json({
      success: true,
      cartItemId: result.meta.last_row_id,
      message: 'Item added to cart'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return c.json({ error: 'Failed to add item to cart' }, 500);
  }
});

// Get cart items
cart.get('/items', async (c) => {
  try {
    const sessionId = c.req.query('sessionId');
    const userId = c.req.query('userId');

    if (!sessionId && !userId) {
      return c.json({ error: 'Session ID or User ID required' }, 400);
    }

    const query = userId
      ? `SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at DESC`
      : `SELECT * FROM cart_items WHERE session_id = ? ORDER BY created_at DESC`;

    const result = await c.env.DB.prepare(query).bind(userId || sessionId).all();

    const items = (result.results || []).map((item: any) => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null
    }));

    const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    return c.json({
      items,
      total,
      itemCount: items.length,
      currency: items[0]?.currency || 'USD'
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return c.json({ error: 'Failed to get cart items' }, 500);
  }
});

// Update cart item quantity
cart.put('/items/:id', async (c) => {
  try {
    const itemId = c.req.param('id');
    const { quantity } = await c.req.json();

    if (quantity < 1) {
      return c.json({ error: 'Quantity must be at least 1' }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(quantity, itemId).run();

    return c.json({ success: true, message: 'Cart item updated' });
  } catch (error) {
    console.error('Update cart error:', error);
    return c.json({ error: 'Failed to update cart item' }, 500);
  }
});

// Remove cart item
cart.delete('/items/:id', async (c) => {
  try {
    const itemId = c.req.param('id');

    await c.env.DB.prepare(`DELETE FROM cart_items WHERE id = ?`).bind(itemId).run();

    return c.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return c.json({ error: 'Failed to remove cart item' }, 500);
  }
});

// Clear cart
cart.delete('/clear', async (c) => {
  try {
    const sessionId = c.req.query('sessionId');
    const userId = c.req.query('userId');

    if (!sessionId && !userId) {
      return c.json({ error: 'Session ID or User ID required' }, 400);
    }

    const query = userId
      ? `DELETE FROM cart_items WHERE user_id = ?`
      : `DELETE FROM cart_items WHERE session_id = ?`;

    await c.env.DB.prepare(query).bind(userId || sessionId).run();

    return c.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return c.json({ error: 'Failed to clear cart' }, 500);
  }
});

// Create order
cart.post('/checkout', async (c) => {
  try {
    const { userId, sessionId, paymentProvider, paymentId, currency } = await c.req.json();

    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400);
    }

    // Get cart items
    const query = userId
      ? `SELECT * FROM cart_items WHERE user_id = ?`
      : `SELECT * FROM cart_items WHERE session_id = ?`;

    const result = await c.env.DB.prepare(query).bind(userId || sessionId).all();
    const items = result.results || [];

    if (items.length === 0) {
      return c.json({ error: 'Cart is empty' }, 400);
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order
    const orderResult = await c.env.DB.prepare(
      `INSERT INTO orders (user_id, session_id, order_number, total_amount, currency, payment_status, payment_provider, payment_id, items_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId || null,
      sessionId,
      orderNumber,
      totalAmount,
      currency || 'USD',
      'completed',
      paymentProvider || 'paypal',
      paymentId || null,
      JSON.stringify(items)
    ).run();

    // Clear cart
    await c.env.DB.prepare(query).bind(userId || sessionId).run();

    // Track checkout interaction
    await c.env.DB.prepare(
      `INSERT INTO user_interactions (user_id, session_id, interaction_type, page, element, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      userId || null,
      sessionId,
      'checkout',
      'cart',
      'checkout_button',
      JSON.stringify({ orderNumber, totalAmount, itemCount: items.length })
    ).run();

    return c.json({
      success: true,
      orderId: orderResult.meta.last_row_id,
      orderNumber,
      totalAmount,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Get AI recommendations
cart.post('/recommendations', async (c) => {
  try {
    const { userId, sessionId, context } = await c.req.json();

    if (!sessionId && !userId) {
      return c.json({ error: 'Session ID or User ID required' }, 400);
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'AI not configured' }, 500);
    }

    // Get user's cart items
    const cartQuery = userId
      ? `SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`
      : `SELECT * FROM cart_items WHERE session_id = ? ORDER BY created_at DESC LIMIT 10`;

    const cartResult = await c.env.DB.prepare(cartQuery).bind(userId || sessionId).all();
    const cartItems = cartResult.results || [];

    // Get user's interaction history
    const interactionQuery = userId
      ? `SELECT * FROM user_interactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
      : `SELECT * FROM user_interactions WHERE session_id = ? ORDER BY created_at DESC LIMIT 50`;

    const interactionResult = await c.env.DB.prepare(interactionQuery).bind(userId || sessionId).all();
    const interactions = interactionResult.results || [];

    // Import sector data for recommendations
    const { sectorList } = await import('../data/sectors');

    // Prepare AI prompt
    const prompt = `You are an advanced AI recommendation engine for the Fruitful FAA.ZONE ecosystem. Analyze user behavior and provide hyper-personalized "interstellar" level recommendations.

**User Context:**
- Cart Items: ${cartItems.length > 0 ? JSON.stringify(cartItems.map((i: any) => ({ name: i.item_name, type: i.item_type, price: i.price }))) : 'Empty cart'}
- Recent Interactions: ${interactions.length > 0 ? interactions.slice(0, 10).map((i: any) => `${i.interaction_type} on ${i.element}`).join(', ') : 'No history'}
- Session Context: ${context || 'General browsing'}

**Available Offerings:**
We have 31 sectors with brands and sub-nodes. Key sectors include:
${Object.entries(sectorList).slice(0, 10).map(([, name]) => `- ${name}`).join('\n')}

**Your Task:**
Provide 5-7 highly personalized recommendations that would benefit this user based on their behavior patterns. Think beyond obvious suggestions - predict needs they might not know they have yet.

For each recommendation, provide:
1. Item name and type (sector/brand/subnode)
2. Why it's perfect for them (1-2 sentences)
3. Confidence score (0-100)
4. Potential value/benefit

Format as JSON array with fields: itemName, itemType, itemId, reasoning, confidence, estimatedValue, synergy`;

    const genai = new GoogleGenAI({ apiKey });
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 2000,
      }
    });

    let recommendations = [];
    const reasoning = response.text || 'AI recommendations generated';

    try {
      // Try to extract JSON from response
      const jsonMatch = reasoning.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // If JSON parsing fails, create structured recommendations from text
      recommendations = [
        {
          itemName: 'AI & Logic Core Protocol',
          itemType: 'sector',
          itemId: 'ai-logic',
          reasoning: 'Based on your activity, advanced AI tools would enhance your workflow',
          confidence: 85,
          estimatedValue: 1500,
          synergy: 'Complements existing tools'
        }
      ];
    }

    // Calculate overall confidence
    const avgConfidence = recommendations.length > 0
      ? recommendations.reduce((sum: number, r: any) => sum + (r.confidence || 70), 0) / recommendations.length
      : 70;

    // Save recommendations to database
    await c.env.DB.prepare(
      `INSERT INTO ai_recommendations (user_id, session_id, recommendation_type, recommended_items, confidence_score, reasoning)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      userId || null,
      sessionId,
      'cart_recommendations',
      JSON.stringify(recommendations),
      avgConfidence,
      reasoning
    ).run();

    return c.json({
      recommendations,
      confidence: avgConfidence,
      reasoning,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return c.json({ error: 'Failed to generate recommendations' }, 500);
  }
});

// Track user interaction (for heatmap)
cart.post('/track', async (c) => {
  try {
    const { userId, sessionId, interactionType, page, element, coordinates, metadata } = await c.req.json();

    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400);
    }

    await c.env.DB.prepare(
      `INSERT INTO user_interactions (user_id, session_id, interaction_type, page, element, coordinates, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId || null,
      sessionId,
      interactionType,
      page,
      element || null,
      coordinates ? JSON.stringify(coordinates) : null,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Track interaction error:', error);
    return c.json({ error: 'Failed to track interaction' }, 500);
  }
});

// Get heatmap data
cart.get('/heatmap', async (c) => {
  try {
    const page = c.req.query('page');
    const hours = parseInt(c.req.query('hours') || '24');

    const result = await c.env.DB.prepare(
      `SELECT interaction_type, page, element, coordinates, COUNT(*) as count
       FROM user_interactions
       WHERE created_at > datetime('now', '-${hours} hours')
       ${page ? 'AND page = ?' : ''}
       GROUP BY interaction_type, page, element, coordinates
       ORDER BY count DESC`
    ).bind(page ? page : undefined).all();

    const heatmapData = (result.results || []).map((row: any) => ({
      ...row,
      coordinates: row.coordinates ? JSON.parse(row.coordinates) : null
    }));

    return c.json({
      heatmap: heatmapData,
      totalInteractions: heatmapData.reduce((sum: number, d: any) => sum + d.count, 0),
      timeRange: `${hours} hours`,
      page: page || 'all'
    });
  } catch (error) {
    console.error('Heatmap error:', error);
    return c.json({ error: 'Failed to get heatmap data' }, 500);
  }
});

// Get orders
cart.get('/orders', async (c) => {
  try {
    const userId = c.req.query('userId');
    const sessionId = c.req.query('sessionId');

    if (!userId && !sessionId) {
      return c.json({ error: 'User ID or Session ID required' }, 400);
    }

    const query = userId
      ? `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`
      : `SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC`;

    const result = await c.env.DB.prepare(query).bind(userId || sessionId).all();

    const orders = (result.results || []).map((order: any) => ({
      ...order,
      items_data: order.items_data ? JSON.parse(order.items_data) : []
    }));

    return c.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return c.json({ error: 'Failed to get orders' }, 500);
  }
});

export default cart;
