const express = require('express');
const cors = require('cors');
const { supabase } = require('./supabaseClient');

const app = express();
app.use(cors());
app.use(express.json());

const STATUSES = ['Masuk', 'Proses', 'Selesai', 'Diambil'];

function badRequest(res, message, details) {
  return res.status(400).json({ error: { message, details } });
}

function notFound(res, message = 'Data tidak ditemukan') {
  return res.status(404).json({ error: { message } });
}

function serverError(res, error) {
  console.error(error);
  return res.status(500).json({ error: { message: 'Terjadi kesalahan pada server', details: error?.message } });
}

// Health check
app.get(['/', '/health'], (req, res) => {
  res.json({ ok: true, name: 'Sepatu Wash API', version: '1.0.0' });
});

// List items dengan filter status opsional: GET /items?status=Selesai
app.get('/items', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('items').select('*').order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return serverError(res, error);

    res.json({ data });
  } catch (err) {
    serverError(res, err);
  }
});

// Ambil 1 item: GET /items/:id
app.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
    if (error && error.code === 'PGRST116') return notFound(res);
    if (error) return serverError(res, error);
    res.json({ data });
  } catch (err) {
    serverError(res, err);
  }
});

// Tambah item: POST /items
app.post('/items', async (req, res) => {
  try {
    const {
      customer_name,
      brand,
      color,
      size,
      service_type,
      status = 'Masuk',
      notes
    } = req.body || {};

    if (!customer_name || !brand || !service_type) {
      return badRequest(res, 'Field wajib: customer_name, brand, service_type');
    }
    if (!STATUSES.includes(status)) {
      return badRequest(res, `Status tidak valid. Gunakan salah satu: ${STATUSES.join(', ')}`);
    }

    const payload = {
      customer_name,
      brand,
      color: color ?? null,
      size: size ?? null,
      service_type,
      status,
      notes: notes ?? null
    };

    const { data, error } = await supabase.from('items').insert(payload).select().single();
    if (error) return serverError(res, error);

    res.status(201).json({ data });
  } catch (err) {
    serverError(res, err);
  }
});

// Update item: PATCH /items/:id
app.patch('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['customer_name', 'brand', 'color', 'size', 'service_type', 'status', 'notes'];
    const updates = {};

    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    if ('status' in updates && !STATUSES.includes(updates.status)) {
      return badRequest(res, `Status tidak valid. Gunakan salah satu: ${STATUSES.join(', ')}`);
    }

    if (Object.keys(updates).length === 0) {
      return badRequest(res, 'Tidak ada field yang ingin diperbarui');
    }

    const { data, error } = await supabase.from('items').update(updates).eq('id', id).select().single();

    if (error && error.code === 'PGRST116') return notFound(res);
    if (error) return serverError(res, error);

    res.json({ data });
  } catch (err) {
    serverError(res, err);
  }
});

// Hapus item: DELETE /items/:id
app.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase.from('items').delete().eq('id', id).select().single();

    if (error && error.code === 'PGRST116') return notFound(res);
    if (error) return serverError(res, error);

    res.json({ data, deleted: true });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = app;