# Sepatu Wash API

REST API sederhana untuk layanan daftar barang cuci sepatu. Dibangun dengan Node.js + Express.js, menyimpan data di Supabase, dan siap dideploy ke Vercel.

## Tujuan dan Fitur Utama

- CRUD data sepatu yang sedang dicuci
- Filter daftar berdasarkan status: `GET /items?status=Selesai`
- Siap deploy ke Vercel (serverless)
- Terhubung ke Supabase sebagai database

## Struktur Data

Tabel: `items`

| Kolom          | Tipe        | Wajib | Keterangan                                               |
|----------------|-------------|-------|----------------------------------------------------------|
| id             | uuid        | Ya    | Primary key, default `gen_random_uuid()`                 |
| customer_name  | text        | Ya    | Nama pelanggan                                           |
| brand          | text        | Ya    | Merek sepatu                                             |
| color          | text        | Tidak | Warna                                                    |
| size           | text        | Tidak | Ukuran (bebas format, mis. "42" atau "27 cm")           |
| service_type   | text        | Ya    | Jenis layanan (mis. "Deep Clean", "Repaint")            |
| status         | text        | Ya    | Salah satu dari: `Masuk`, `Proses`, `Selesai`, `Diambil` |
| notes          | text        | Tidak | Catatan tambahan                                         |
| created_at     | timestamptz | Ya    | Default `now()`                                          |
| updated_at     | timestamptz | Ya    | Diupdate otomatis saat record diubah                     |

Contoh SQL untuk Supabase:

```sql
-- Pastikan extension untuk UUID tersedia
create extension if not exists "pgcrypto";

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  brand text not null,
  color text,
  size text,
  service_type text not null,
  status text not null default 'Masuk' check (status in ('Masuk','Proses','Selesai','Diambil')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger untuk update kolom updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_updated_at on public.items;
create trigger handle_updated_at
before update on public.items
for each row
execute function public.set_updated_at();

-- Catatan RLS:
-- Bila RLS aktif, gunakan SERVICE ROLE KEY di server (bypass RLS), atau buat kebijakan sesuai kebutuhan.
```

## Endpoint

Base URL saat sudah dideploy di Vercel: `https://<your-deploy-domain>`

- Health: `GET /health`
- List items: `GET /items?status=Selesai`
- Detail item: `GET /items/:id`
- Tambah item: `POST /items`
- Update item: `PATCH /items/:id`
- Hapus item: `DELETE /items/:id`

### Contoh Request & Response

1) Tambah item

Request:
```http
POST /items
Content-Type: application/json

{
  "customer_name": "Budi",
  "brand": "Nike",
  "color": "Hitam",
  "size": "42",
  "service_type": "Deep Clean",
  "status": "Masuk",
  "notes": "Tali sepatu hilang"
}
```

Response 201:
```json
{
  "data": {
    "id": "a3d1c7e0-7c1f-4b73-a1a2-62a7b0f9f3f0",
    "customer_name": "Budi",
    "brand": "Nike",
    "color": "Hitam",
    "size": "42",
    "service_type": "Deep Clean",
    "status": "Masuk",
    "notes": "Tali sepatu hilang",
    "created_at": "2025-10-25T18:11:00.000Z",
    "updated_at": "2025-10-25T18:11:00.000Z"
  }
}
```

2) List items dengan filter status

Request:
```http
GET /items?status=Selesai
```

Response 200:
```json
{
  "data": [
    {
      "id": "a3d1c7e0-7c1f-4b73-a1a2-62a7b0f9f3f0",
      "customer_name": "Budi",
      "brand": "Nike",
      "color": "Hitam",
      "size": "42",
      "service_type": "Deep Clean",
      "status": "Selesai",
      "notes": "Siap diambil",
      "created_at": "2025-10-25T18:11:00.000Z",
      "updated_at": "2025-10-25T18:40:00.000Z"
    }
  ]
}
```

3) Update status

Request:
```http
PATCH /items/a3d1c7e0-7c1f-4b73-a1a2-62a7b0f9f3f0
Content-Type: application/json

{
  "status": "Selesai",
  "notes": "Sudah kering, siap diambil"
}
```

Response 200:
```json
{
  "data": {
    "id": "a3d1c7e0-7c1f-4b73-a1a2-62a7b0f9f3f0",
    "customer_name": "Budi",
    "brand": "Nike",
    "color": "Hitam",
    "size": "42",
    "service_type": "Deep Clean",
    "status": "Selesai",
    "notes": "Sudah kering, siap diambil",
    "created_at": "2025-10-25T18:11:00.000Z",
    "updated_at": "2025-10-25T18:41:00.000Z"
  }
}
```

4) Hapus item

Request:
```http
DELETE /items/a3d1c7e0-7c1f-4b73-a1a2-62a7b0f9f3f0
```

Response 200:
```json
{
  "data": {
    "id": "a3d1c7e0-7c1f-4b73-a1a2-62a7b0f9f3f0",
    "customer_name": "Budi",
    "brand": "Nike",
    "color": "Hitam",
    "size": "42",
    "service_type": "Deep Clean",
    "status": "Selesai",
    "notes": "Sudah kering, siap diambil",
    "created_at": "2025-10-25T18:11:00.000Z",
    "updated_at": "2025-10-25T18:41:00.000Z"
  },
  "deleted": true
}
```

## Instalasi & Menjalankan Secara Lokal

1. Salin `.env.example` menjadi `.env` dan isi:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
2. Install dependency:
   ```bash
   npm install
   ```
3. Jalankan:
   ```bash
   npm run dev
   ```
4. Coba endpoint:
   - `GET http://localhost:3000/health`
   - `POST http://localhost:3000/items`

## Deploy ke Vercel

1. Push kode ke GitHub
2. Buat proyek di [Vercel](https://vercel.com) dan import repository
3. Di Project Settings -> Environment Variables, set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Setelah sukses, API tersedia:
   - `GET https://<your-deploy-domain>/health`
   - `GET https://<your-deploy-domain>/items?status=Selesai`

## Link

- Repository: https://github.com/nabwelll/sepatu-wash-api
- Vercel: https://<your-deploy-domain> (update setelah deploy)