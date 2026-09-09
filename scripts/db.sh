#!/usr/bin/env sh
#
# Pembungkus Supabase CLI untuk proyek ini.
#
# Kenapa ada: CLI menyimpan satu sesi login global, sementara proyek ini berada
# di akun Supabase yang berbeda dari akun yang biasanya login di mesin ini.
# Alih-alih bertukar login, semua perintah di sini menembak basis data langsung
# lewat --db-url, jadi akun mana yang sedang login tidak berpengaruh sama sekali.
#
# Rahasianya diambil dari .env.local (sudah masuk .gitignore), bukan dari argumen
# baris perintah, supaya tidak bocor ke riwayat shell atau daftar proses.

set -eu

# `supabase` di sini adalah binari dari devDependency: pnpm menaruh
# node_modules/.bin di PATH saat menjalankan skrip.

if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

butuh_url() {
  if [ -z "${SUPABASE_DB_URL:-}" ]; then
    cat >&2 <<'PESAN'
SUPABASE_DB_URL belum diisi di .env.local.

Ambil dari dasbor Supabase proyek ini:
  Project Settings -> Database -> Connection string -> URI

  SUPABASE_DB_URL=postgresql://postgres:<sandi>@db.<ref>.supabase.co:5432/postgres

Catatan:
  - Pakai koneksi langsung atau session pooler (port 5432). Transaction pooler
    (6543) tidak cocok untuk migrasi.
  - Sandi harus percent-encoded bila mengandung @ : / ? # atau spasi.
PESAN
    exit 1
  fi
}

perintah="${1:-}"
[ $# -gt 0 ] && shift

case "$perintah" in
  push)
    butuh_url
    exec supabase db push --db-url "$SUPABASE_DB_URL" "$@"
    ;;

  status)
    butuh_url
    exec supabase migration list --db-url "$SUPABASE_DB_URL" "$@"
    ;;

  types)
    butuh_url
    # Tulis ke berkas sementara dulu: kalau generasi gagal, berkas types yang
    # lama tidak ikut terpotong jadi kosong.
    sementara="$(mktemp)"
    trap 'rm -f "$sementara"' EXIT
    supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public > "$sementara"
    mkdir -p src/lib
    mv "$sementara" src/lib/database.types.ts
    trap - EXIT
    echo "Ditulis -> src/lib/database.types.ts"
    ;;

  *)
    echo "Pemakaian: scripts/db.sh <push|status|types> [flag tambahan]" >&2
    exit 2
    ;;
esac
