import type { Lembar } from './ekspor'

/**
 * Tulis satu atau beberapa `Lembar` ke workbook .xlsx lalu unduh di peramban.
 * exceljs dimuat dinamis supaya tidak ikut bundel awal layar entri.
 */
export async function unduhXlsx(berkas: string, lembar: Lembar[], kop: [string, string][]) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'nilaiHub by dodeclass'
  wb.company = 'dodeclass'
  wb.created = new Date()

  const garis = { style: 'thin' as const, color: { argb: 'FF000000' } }
  const kotak = { top: garis, left: garis, bottom: garis, right: garis }

  for (const l of lembar) {
    const ws = wb.addWorksheet(l.namaSheet.slice(0, 31).replace(/[\\/?*[\]:]/g, '-'), {
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    })
    const lebar = l.kolom.length

    // Judul + kop.
    ws.addRow([l.judul]).font = { bold: true, size: 13 }
    ws.mergeCells(1, 1, 1, lebar)
    for (const [label, isi] of kop) {
      const r = ws.addRow([label, isi])
      r.getCell(1).font = { bold: true }
    }
    ws.addRow([])

    // Kepala: dua tingkat bila ada kolom bergrup.
    const adaGrup = l.kolom.some((k) => k.grup)
    const barisAtas = ws.rowCount + 1
    if (adaGrup) {
      ws.addRow(l.kolom.map((k) => k.grup ?? k.label))
      ws.addRow(l.kolom.map((k) => (k.grup ? k.label : null)))
      // Kolom tanpa grup: gabung vertikal. Kolom bergrup: gabung mendatar per grup.
      let c = 0
      while (c < lebar) {
        const g = l.kolom[c].grup
        if (!g) {
          ws.mergeCells(barisAtas, c + 1, barisAtas + 1, c + 1)
          c++
          continue
        }
        let akhir = c
        while (akhir + 1 < lebar && l.kolom[akhir + 1].grup === g) akhir++
        if (akhir > c) ws.mergeCells(barisAtas, c + 1, barisAtas, akhir + 1)
        c = akhir + 1
      }
    } else {
      ws.addRow(l.kolom.map((k) => k.label))
    }
    const barisKepalaAkhir = ws.rowCount
    for (let r = barisAtas; r <= barisKepalaAkhir; r++) {
      const row = ws.getRow(r)
      for (let c = 1; c <= lebar; c++) {
        const cell = row.getCell(c)
        cell.font = { bold: true }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = kotak
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } }
      }
    }

    // Data.
    for (const b of l.baris) {
      const row = ws.addRow(b)
      l.kolom.forEach((k, i) => {
        const cell = row.getCell(i + 1)
        cell.border = kotak
        if (typeof b[i] === 'number') {
          cell.numFmt = k.bulat ? '0' : '0.0'
          cell.alignment = { horizontal: 'right' }
        }
      })
    }

    // Lebar kolom.
    l.kolom.forEach((k, i) => {
      const col = ws.getColumn(i + 1)
      if (i === 1) col.width = 32
      else col.width = Math.max(7, Math.min(18, k.label.length + 3))
    })
    ws.getColumn(1).width = Math.max(ws.getColumn(1).width ?? 0, 10)
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = berkas
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
