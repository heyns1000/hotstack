import { Hono } from "hono";
import { cors } from "hono/cors";
import admin from "./routes/admin";
import ecosystem from "./routes/ecosystem";
import currency from "./routes/currency";
import ai from "./routes/ai";
import spotify from "./routes/spotify";
import dropzone from "./routes/dropzone";
import mochaApp from "./routes/mocha-app";
import vaultmesh from "./routes/vaultmesh";
import cart from "./routes/cart";
import sync from "./routes/sync";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Admin routes
app.route("/api/admin", admin);

// Ecosystem routes
app.route("/api/ecosystem", ecosystem);

// Currency routes
app.route("/api/currency", currency);

// AI routes
app.route("/api/ai", ai);

// Spotify routes
app.route("/api/spotify", spotify);

// Drop Zone routes
app.route("/api/dropzone", dropzone);

// Mocha App Integration routes
app.route("/api/mocha-app", mochaApp);

// VaultMesh routes
app.route("/api/vaultmesh", vaultmesh);

// Cart routes
app.route("/api/cart", cart);

// Sync routes
app.route("/api/sync", sync);

// Upload file endpoint
app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Generate unique storage key
  const timestamp = Date.now();
  const storageKey = `uploads/${timestamp}-${file.name}`;

  // Upload to R2
  await c.env.R2_BUCKET.put(storageKey, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      originalName: file.name,
    },
  });

  // Save metadata to database
  const result = await c.env.DB.prepare(
    `INSERT INTO files (name, size, mime_type, storage_key) VALUES (?, ?, ?, ?)`
  )
    .bind(file.name, file.size, file.type, storageKey)
    .run();

  const fileId = result.meta.last_row_id;

  // Create sync event for this upload
  try {
    await c.env.DB.prepare(
      `INSERT INTO file_sync_events (file_id, event_type, source_location, sync_status, metadata)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      fileId,
      'upload',
      'direct_upload',
      'pending',
      JSON.stringify({ timestamp: Date.now() })
    ).run();

    // Create sync targets
    const syncTargets = [
      { type: 'admin_panel', id: 'hotstack-admin' },
      { type: 'drop_zone', id: 'hotstack-dropzone' },
      { type: 'cart', id: 'shopping-cart' },
      { type: 'vaultmesh', id: 'snapshots' },
      { type: 'file_manager', id: 'home-files' }
    ];

    for (const target of syncTargets) {
      await c.env.DB.prepare(
        `INSERT INTO sync_targets (file_id, target_type, target_id, sync_complete, sync_data)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        fileId,
        target.type,
        target.id,
        0,
        JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storageKey: storageKey
        })
      ).run();
    }
  } catch (syncError) {
    console.error('Sync creation error:', syncError);
    // Don't fail the upload if sync fails
  }

  return c.json({
    id: fileId,
    name: file.name,
    size: file.size,
    mimeType: file.type,
    storageKey,
  });
});

// List files endpoint
app.get("/api/files", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT id, name, size, mime_type as mimeType, storage_key as storageKey, created_at as createdAt 
     FROM files 
     ORDER BY created_at DESC`
  ).all();

  return c.json(result.results || []);
});

// Download file endpoint
app.get("/api/files/:id/download", async (c) => {
  const fileId = c.req.param("id");

  // Get file metadata from database
  const fileRecord = await c.env.DB.prepare(
    `SELECT storage_key, name, mime_type FROM files WHERE id = ?`
  )
    .bind(fileId)
    .first();

  if (!fileRecord) {
    return c.json({ error: "File not found" }, 404);
  }

  // Get file from R2
  const object = await c.env.R2_BUCKET.get(fileRecord.storage_key as string);

  if (!object) {
    return c.json({ error: "File not found in storage" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-disposition", `attachment; filename="${fileRecord.name}"`);

  return c.body(object.body, { headers });
});

// Delete file endpoint
app.delete("/api/files/:id", async (c) => {
  const fileId = c.req.param("id");

  // Get file metadata
  const fileRecord = await c.env.DB.prepare(
    `SELECT storage_key FROM files WHERE id = ?`
  )
    .bind(fileId)
    .first();

  if (!fileRecord) {
    return c.json({ error: "File not found" }, 404);
  }

  // Delete from R2
  await c.env.R2_BUCKET.delete(fileRecord.storage_key as string);

  // Delete from database
  await c.env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(fileId).run();

  return c.json({ success: true });
});

export default app;
