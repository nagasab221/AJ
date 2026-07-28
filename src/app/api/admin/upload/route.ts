import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { supabaseConfigured, uploadsPublicPrefix } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg'
};

/** Photo upload for the gallery and service images. */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No picture was chosen.' }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'That file type is not supported. Use a JPG, PNG or WEBP photo.' },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'That picture is too big. Please use one under 6 MB.' },
        { status: 413 }
      );
    }

    const ext = EXTENSIONS[file.type] ?? 'jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase()
      .storage.from('uploads')
      .upload(name, await file.arrayBuffer(), { contentType: file.type, upsert: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, url: `${uploadsPublicPrefix()}${name}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    console.error('[admin/upload] failed:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
