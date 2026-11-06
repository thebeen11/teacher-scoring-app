-- Pilihan "Semua kelas" untuk sumber min/maks dihapus dari antarmuka: min/maks
-- selalu dari kelas sendiri. Kelas lama yang masih memakai 'sekolah' diseragamkan
-- supaya tidak diam-diam memakai mode yang tak bisa lagi diubah.
update kelas set sumber_minmaks = 'kelas' where sumber_minmaks <> 'kelas';
