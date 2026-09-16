"""PDF generator for Wolf's Mind ASD receipts and balance reports."""
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                Image as RLImage)
import base64

PRIMARY = colors.HexColor("#1E3A5F")
LIGHT = colors.HexColor("#F5F7FA")
BORDER = colors.HexColor("#CBD5E1")
TEXT = colors.HexColor("#1F2937")


def _fmt_eur(v: float) -> str:
    s = f"{float(v or 0):,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{s} €"


def _fmt_date(iso: str) -> str:
    if not iso:
        return ""
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except Exception:
        try:
            return datetime.strptime(iso[:10], "%Y-%m-%d").strftime("%d/%m/%Y")
        except Exception:
            return iso


def _fmt_month(ym: str) -> str:
    months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
              "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]
    try:
        y, m = ym.split("-")
        return f"{months[int(m) - 1]} {y}"
    except Exception:
        return ym


def _image_from_b64(b64: str | None, w_mm: float, h_mm: float):
    if not b64:
        return None
    try:
        from PIL import Image
        raw = b64.split(",", 1)[1] if "," in b64 else b64
        data = base64.b64decode(raw)
        # Verify image is decodable eagerly (reportlab decodes lazily)
        Image.open(BytesIO(data)).verify()
        return RLImage(BytesIO(data), width=w_mm * mm, height=h_mm * mm)
    except Exception:
        return None


def _header(org: dict, styles):
    logo = _image_from_b64(org.get("logo_base64"), 28, 28)
    right_text = f"""
        <b><font size=13 color="#1E3A5F">{org.get('name', "Wolf's Mind A.S.D.")}</font></b><br/>
        <font size=8>{org.get('address', '')}</font><br/>
        <font size=8>C.F. {org.get('fiscal_code', '')}</font><br/>
        <font size=8>Email: {org.get('email', '')}</font><br/>
        <font size=8>PEC: {org.get('pec', '')}</font><br/>
        <font size=8>{org.get('affiliation', '')}</font>
    """
    right_para = Paragraph(right_text, styles["small_right"])
    if logo:
        header_table = Table([[logo, right_para]], colWidths=[45 * mm, 130 * mm])
    else:
        left_placeholder = Paragraph(
            f"""<b><font size=14 color="#1E3A5F">{org.get('name', "Wolf's Mind A.S.D.")}</font></b><br/>
            <font size=7 color="#6B7280">ASSOCIAZIONE SPORTIVA DILETTANTISTICA</font>""",
            styles["small_left"])
        header_table = Table([[left_placeholder, right_para]], colWidths=[75 * mm, 100 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    return header_table


def _footer_text(org: dict) -> str:
    parts = [org.get("address", ""), f"C.F. {org.get('fiscal_code','')}",
             f"PEC: {org.get('pec','')}", org.get("affiliation", "")]
    return " | ".join([p for p in parts if p and p.strip() and p not in ("C.F. ", "PEC: ")])


def _make_styles():
    ss = getSampleStyleSheet()
    return {
        "small_right": ParagraphStyle("sr", parent=ss["Normal"], alignment=TA_RIGHT,
                                       fontSize=9, textColor=TEXT, leading=12),
        "small_left": ParagraphStyle("sl", parent=ss["Normal"], alignment=TA_LEFT,
                                      fontSize=9, textColor=TEXT, leading=12),
        "title": ParagraphStyle("t", parent=ss["Normal"], alignment=TA_CENTER,
                                 fontSize=22, textColor=PRIMARY,
                                 fontName="Helvetica-Bold", spaceAfter=6),
        "sect": ParagraphStyle("sect", parent=ss["Normal"], fontSize=10,
                                fontName="Helvetica-Bold", textColor=colors.white,
                                leading=14),
        "label": ParagraphStyle("lbl", parent=ss["Normal"], fontSize=8,
                                 textColor=colors.HexColor("#6B7280"),
                                 fontName="Helvetica-Bold"),
        "val": ParagraphStyle("val", parent=ss["Normal"], fontSize=10,
                               textColor=TEXT, fontName="Helvetica"),
        "note": ParagraphStyle("note", parent=ss["Normal"], fontSize=8,
                                textColor=colors.HexColor("#374151"), leading=10),
        "center_small": ParagraphStyle("cs", parent=ss["Normal"], alignment=TA_CENTER,
                                        fontSize=7, textColor=colors.HexColor("#6B7280")),
        "period": ParagraphStyle("per", parent=ss["Normal"], alignment=TA_CENTER,
                                  fontSize=11, textColor=TEXT),
    }


def _section_bar(text: str, styles):
    t = Table([[Paragraph(text, styles["sect"])]], colWidths=[180 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PRIMARY),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def _field_style():
    return TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ])


def generate_receipt_pdf(receipt: dict, tesserato: dict, org: dict,
                         emesso_da_nome: str) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=15 * mm, rightMargin=15 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    st = _make_styles()
    story = [_header(org, st), Spacer(1, 8 * mm),
             Paragraph("RICEVUTA", st["title"])]

    # Numero + tessera + data row
    num_txt = f"<b>N. {receipt['numero']}</b>"
    if tesserato.get("numero_tessera"):
        num_txt += f"  <font size=9 color='#6B7280'>· Tessera n. {tesserato['numero_tessera']}</font>"
    num_row = Table([[
        Paragraph(num_txt, ParagraphStyle("n", fontSize=12, textColor=TEXT, fontName="Helvetica-Bold")),
        Paragraph(f"<b>Data:</b> {_fmt_date(receipt['data'])}",
                  ParagraphStyle("d", fontSize=11, alignment=TA_RIGHT, textColor=TEXT)),
    ]], colWidths=[110 * mm, 70 * mm])
    num_row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(num_row)
    story.append(Spacer(1, 6 * mm))

    # Dati tesserato
    story.append(_section_bar("DATI DEL TESSERATO / RICEVENTE", st))
    dt = [[Paragraph("Cognome e Nome:", st["label"]),
           Paragraph(f"{tesserato.get('cognome','').upper()} {tesserato.get('nome','').upper()}", st["val"]),
           Paragraph("Codice Fiscale", st["label"]),
           Paragraph(tesserato.get("codice_fiscale", "").upper(), st["val"])]]
    t1 = Table(dt, colWidths=[30 * mm, 65 * mm, 30 * mm, 55 * mm])
    t1.setStyle(_field_style()); story.append(t1)

    addr = [[Paragraph("Indirizzo:", st["label"]),
             Paragraph(f"{tesserato.get('indirizzo','')} {tesserato.get('civico','')}", st["val"]),
             Paragraph("CAP", st["label"]),
             Paragraph(tesserato.get("cap", ""), st["val"]),
             Paragraph("Città", st["label"]),
             Paragraph(f"{tesserato.get('citta','')} ({tesserato.get('provincia','')})", st["val"])]]
    t2 = Table(addr, colWidths=[22 * mm, 55 * mm, 12 * mm, 20 * mm, 15 * mm, 56 * mm])
    t2.setStyle(_field_style()); story.append(t2)
    story.append(Spacer(1, 5 * mm))

    # Dettaglio pagamento
    story.append(_section_bar("DETTAGLIO PAGAMENTO", st))
    rows = [[Paragraph("<b>Descrizione</b>", st["val"]),
             Paragraph("<b>N. lezioni</b>",
                       ParagraphStyle("h", fontSize=10, alignment=TA_CENTER, fontName="Helvetica-Bold")),
             Paragraph("<b>Importo totale</b>",
                       ParagraphStyle("h2", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold"))]]
    for item in receipt.get("items", []):
        rows.append([Paragraph(item.get("descrizione", ""), st["val"]),
                     Paragraph(str(item.get("num_lezioni") or "-"),
                               ParagraphStyle("c", fontSize=10, alignment=TA_CENTER)),
                     Paragraph(_fmt_eur(item.get("importo", 0)),
                               ParagraphStyle("r", fontSize=10, alignment=TA_RIGHT))])
    pay = Table(rows, colWidths=[100 * mm, 30 * mm, 50 * mm])
    pay.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(pay); story.append(Spacer(1, 4 * mm))

    tot = Table([[Paragraph("Metodo di pagamento:", st["label"]),
                  Paragraph(receipt.get("metodo_pagamento", "Contanti"), st["val"]),
                  Paragraph("<b>Totale ricevuto:</b>",
                            ParagraphStyle("tl", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
                  Paragraph(f"<b>{_fmt_eur(receipt.get('totale', 0))}</b>",
                            ParagraphStyle("tv", fontSize=12, alignment=TA_RIGHT,
                                            fontName="Helvetica-Bold", textColor=PRIMARY))]],
                colWidths=[45 * mm, 55 * mm, 40 * mm, 40 * mm])
    tot.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(tot); story.append(Spacer(1, 5 * mm))

    if receipt.get("note"):
        story.append(Paragraph(f"<b>Note:</b> {receipt['note']}", st["val"]))
        story.append(Spacer(1, 5 * mm))

    legal = ("Operazione effettuata nell'ambito dell'attività istituzionale della ASD. "
             "I dati personali forniti sono trattati da Wolf's Mind ASD esclusivamente "
             "per finalità connesse alla gestione del rapporto associativo e in "
             "ottemperanza al Regolamento UE 2016/679 (GDPR).")
    story.append(Paragraph(legal, st["note"]))
    story.append(Spacer(1, 10 * mm))

    # Signature block
    signature = _image_from_b64(org.get("president_signature_base64"), 55, 18)
    firma_data = [[
        Paragraph(f"Emessa da: <b>{emesso_da_nome}</b>", st["val"]),
        signature if signature else Paragraph(" ", st["val"]),
    ], [
        "",
        Paragraph("Il Presidente", ParagraphStyle(
            "pr", fontSize=10, alignment=TA_CENTER, fontName="Helvetica-Bold")),
    ], [
        "",
        Paragraph(f"<i>{org.get('president_name', 'Drovetti Cassiano Bruno')}</i>",
                  ParagraphStyle("pn", fontSize=10, alignment=TA_CENTER,
                                 fontName="Helvetica-Oblique")),
    ]]
    fs = Table(firma_data, colWidths=[90 * mm, 90 * mm], rowHeights=[20 * mm, 5 * mm, 5 * mm])
    fs.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("LINEABOVE", (1, 1), (1, 1), 0.5, colors.black),
        ("TOPPADDING", (0, 1), (-1, 1), 4),
    ]))
    story.append(fs)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(_footer_text(org), st["center_small"]))
    doc.build(story)
    return buf.getvalue()


def generate_libro_soci_pdf(org: dict, anno: int, soci: list, totali: dict) -> bytes:
    """Generate a Libro Soci PDF with member list and status."""
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=12 * mm, rightMargin=12 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    st = _make_styles()
    story = [_header(org, st), Spacer(1, 8 * mm),
             Paragraph("LIBRO SOCI", st["title"]),
             Spacer(1, 4 * mm),
             Paragraph(f"Anno associativo: <b>{anno}</b>", st["period"]),
             Spacer(1, 6 * mm)]

    # Riepilogo statistico
    story.append(_section_bar("RIEPILOGO", st))
    r_rows = [[Paragraph("<b>Soci totali</b>", st["val"]),
               Paragraph(str(totali.get("totali", 0)),
                         ParagraphStyle("v1", fontSize=11, alignment=TA_RIGHT, fontName="Helvetica-Bold"))],
              [Paragraph("<b>Attivi</b>", st["val"]),
               Paragraph(str(totali.get("attivi", 0)),
                         ParagraphStyle("v2", fontSize=11, alignment=TA_RIGHT,
                                         textColor=colors.HexColor("#059669"),
                                         fontName="Helvetica-Bold"))],
              [Paragraph("<b>Scaduti / morosi</b>", st["val"]),
               Paragraph(str(totali.get("morosi_scaduti", 0)),
                         ParagraphStyle("v3", fontSize=11, alignment=TA_RIGHT,
                                         textColor=colors.HexColor("#DC2626"),
                                         fontName="Helvetica-Bold"))],
              [Paragraph(f"<b>Quote incassate {anno}</b>", st["val"]),
               Paragraph(_fmt_eur(totali.get("quote_totali", 0)),
                         ParagraphStyle("v4", fontSize=12, alignment=TA_RIGHT,
                                         fontName="Helvetica-Bold", textColor=PRIMARY))]]
    rt = Table(r_rows, colWidths=[130 * mm, 56 * mm])
    rt.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                             ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
                             ("LEFTPADDING", (0, 0), (-1, -1), 8),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                             ("TOPPADDING", (0, 0), (-1, -1), 5),
                             ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                             ("BACKGROUND", (0, 3), (-1, 3), LIGHT)]))
    story.append(rt); story.append(Spacer(1, 6 * mm))

    story.append(_section_bar("ELENCO SOCI", st))
    rows = [[Paragraph("<b>N. Tess.</b>", ParagraphStyle("h1", fontSize=8, fontName="Helvetica-Bold")),
             Paragraph("<b>Cognome e Nome</b>", ParagraphStyle("h2", fontSize=8, fontName="Helvetica-Bold")),
             Paragraph("<b>Codice Fiscale</b>", ParagraphStyle("h3", fontSize=8, fontName="Helvetica-Bold")),
             Paragraph("<b>Città</b>", ParagraphStyle("h4", fontSize=8, fontName="Helvetica-Bold")),
             Paragraph("<b>Scadenza tess.</b>", ParagraphStyle("h5", fontSize=8, fontName="Helvetica-Bold")),
             Paragraph("<b>Stato</b>", ParagraphStyle("h6", fontSize=8, fontName="Helvetica-Bold")),
             Paragraph("<b>Quota</b>",
                       ParagraphStyle("h7", fontSize=8, fontName="Helvetica-Bold", alignment=TA_RIGHT))]]
    row_style = ParagraphStyle("r", fontSize=8, textColor=TEXT, leading=10)
    for s in soci:
        stato = s.get("stato_socio", "moroso")
        color_hex = "#059669" if stato == "attivo" else ("#F59E0B" if "scaduto" in stato else "#DC2626")
        rows.append([
            Paragraph(s.get("numero_tessera") or "—", row_style),
            Paragraph(f"{s.get('cognome','')} {s.get('nome','')}", row_style),
            Paragraph(s.get("codice_fiscale", "").upper(), ParagraphStyle("cf", fontSize=7, textColor=TEXT, fontName="Courier")),
            Paragraph(s.get("citta", ""), row_style),
            Paragraph(_fmt_date(s.get("scadenza_tesseramento")), row_style),
            Paragraph(f"<font color='{color_hex}'>{stato}</font>", row_style),
            Paragraph(_fmt_eur(s.get("quota_pagata_anno", 0)) if s.get("quota_pagata_anno") else "—",
                       ParagraphStyle("q", fontSize=8, alignment=TA_RIGHT, textColor=TEXT)),
        ])
    tbl = Table(rows, colWidths=[18 * mm, 45 * mm, 34 * mm, 28 * mm, 22 * mm, 22 * mm, 17 * mm],
                repeatRows=1)
    tbl.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                              ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                              ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                              ("LEFTPADDING", (0, 0), (-1, -1), 3),
                              ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                              ("TOPPADDING", (0, 0), (-1, -1), 3),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    story.append(tbl)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(_footer_text(org), st["center_small"]))
    doc.build(story)
    return buf.getvalue()

def generate_balance_report_pdf(org: dict, movimenti: list, date_from: str,
                                 date_to: str, totali: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    st = _make_styles()
    story = [_header(org, st), Spacer(1, 8 * mm),
             Paragraph("REPORT BILANCIO", st["title"]),
             Spacer(1, 4 * mm),
             Paragraph(f"Periodo: <b>{_fmt_date(date_from)}</b> - <b>{_fmt_date(date_to)}</b>", st["period"]),
             Spacer(1, 8 * mm)]

    story.append(_section_bar("RIEPILOGO", st))
    riep = [[Paragraph("<b>Entrate</b>", st["val"]),
             Paragraph(_fmt_eur(totali["entrate"]),
                       ParagraphStyle("e", fontSize=12, alignment=TA_RIGHT,
                                       textColor=colors.HexColor("#059669"),
                                       fontName="Helvetica-Bold"))],
            [Paragraph("<b>Uscite</b>", st["val"]),
             Paragraph(_fmt_eur(totali["uscite"]),
                       ParagraphStyle("u", fontSize=12, alignment=TA_RIGHT,
                                       textColor=colors.HexColor("#DC2626"),
                                       fontName="Helvetica-Bold"))],
            [Paragraph("<b>Saldo</b>", ParagraphStyle("sl", fontSize=11, fontName="Helvetica-Bold")),
             Paragraph(f"<b>{_fmt_eur(totali['saldo'])}</b>",
                       ParagraphStyle("sv", fontSize=13, alignment=TA_RIGHT,
                                       fontName="Helvetica-Bold", textColor=PRIMARY))]]
    rt = Table(riep, colWidths=[130 * mm, 50 * mm])
    rt.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                             ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
                             ("LEFTPADDING", (0, 0), (-1, -1), 8),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                             ("TOPPADDING", (0, 0), (-1, -1), 6),
                             ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                             ("BACKGROUND", (0, 2), (-1, 2), LIGHT)]))
    story.append(rt); story.append(Spacer(1, 6 * mm))

    by_month = {}
    for m in movimenti:
        ym = (m.get("data") or "")[:7]
        d = by_month.setdefault(ym, {"entrate": 0, "uscite": 0})
        if m["tipo"] == "entrata":
            d["entrate"] += m["importo"]
        else:
            d["uscite"] += m["importo"]
    if by_month:
        story.append(_section_bar("TOTALI PER MESE", st))
        mrows = [[Paragraph("<b>Mese</b>", st["val"]),
                  Paragraph("<b>Entrate</b>",
                            ParagraphStyle("mh", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
                  Paragraph("<b>Uscite</b>",
                            ParagraphStyle("mh2", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
                  Paragraph("<b>Saldo mese</b>",
                            ParagraphStyle("mh3", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold"))]]
        for ym in sorted(by_month.keys()):
            row = by_month[ym]
            saldo = row["entrate"] - row["uscite"]
            mrows.append([Paragraph(_fmt_month(ym), st["val"]),
                          Paragraph(_fmt_eur(row["entrate"]),
                                    ParagraphStyle("ee", fontSize=9, alignment=TA_RIGHT,
                                                    textColor=colors.HexColor("#059669"))),
                          Paragraph(_fmt_eur(row["uscite"]),
                                    ParagraphStyle("uu", fontSize=9, alignment=TA_RIGHT,
                                                    textColor=colors.HexColor("#DC2626"))),
                          Paragraph(_fmt_eur(saldo),
                                    ParagraphStyle("ss", fontSize=9, alignment=TA_RIGHT,
                                                    fontName="Helvetica-Bold"))])
        mt = Table(mrows, colWidths=[60 * mm, 40 * mm, 40 * mm, 40 * mm])
        mt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                                 ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                                 ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                 ("LEFTPADDING", (0, 0), (-1, -1), 4),
                                 ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                                 ("TOPPADDING", (0, 0), (-1, -1), 4),
                                 ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
        story.append(mt); story.append(Spacer(1, 6 * mm))

    story.append(_section_bar("DETTAGLIO MOVIMENTI", st))
    rows = [[Paragraph("<b>Data</b>", st["val"]),
             Paragraph("<b>Tipo</b>", st["val"]),
             Paragraph("<b>Categoria</b>", st["val"]),
             Paragraph("<b>Descrizione</b>", st["val"]),
             Paragraph("<b>Importo</b>",
                       ParagraphStyle("h", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold"))]]
    for m in movimenti:
        color = colors.HexColor("#059669") if m["tipo"] == "entrata" else colors.HexColor("#DC2626")
        sign = "+" if m["tipo"] == "entrata" else "-"
        rows.append([Paragraph(_fmt_date(m["data"]), st["val"]),
                     Paragraph(m["tipo"].capitalize(), st["val"]),
                     Paragraph(m.get("categoria", ""), st["val"]),
                     Paragraph((m.get("descrizione") or "")[:60], st["val"]),
                     Paragraph(f"{sign}{_fmt_eur(m['importo'])}",
                               ParagraphStyle("i", fontSize=9, alignment=TA_RIGHT, textColor=color))])
    mv = Table(rows, colWidths=[22 * mm, 20 * mm, 35 * mm, 70 * mm, 33 * mm], repeatRows=1)
    mv.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                             ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                             ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                             ("FONTSIZE", (0, 0), (-1, -1), 9),
                             ("LEFTPADDING", (0, 0), (-1, -1), 4),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                             ("TOPPADDING", (0, 0), (-1, -1), 4),
                             ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    story.append(mv); story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(_footer_text(org), st["center_small"]))
    doc.build(story)
    return buf.getvalue()



def generate_verbale_pdf(org: dict, verbale: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    st = _make_styles()
    tipo = verbale.get("tipo", "assemblea").upper()
    title = {"ASSEMBLEA": "VERBALE DI ASSEMBLEA ORDINARIA",
             "ASSEMBLEA_STRAORDINARIA": "VERBALE DI ASSEMBLEA STRAORDINARIA",
             "DIRETTIVO": "VERBALE DEL CONSIGLIO DIRETTIVO",
             "ALTRO": "VERBALE"}.get(tipo, "VERBALE")
    story = [_header(org, st), Spacer(1, 8 * mm),
             Paragraph(title, st["title"]),
             Spacer(1, 3 * mm)]

    # Riga: data · sede · ora
    intestazione_parts = [f"Data: <b>{_fmt_date(verbale.get('data'))}</b>"]
    if verbale.get("sede"):
        intestazione_parts.append(f"Sede: <b>{verbale['sede']}</b>")
    if verbale.get("ora_inizio"):
        intestazione_parts.append(f"Ora inizio: <b>{verbale['ora_inizio']}</b>")
    story.append(Paragraph(" &nbsp; · &nbsp; ".join(intestazione_parts), st["period"]))

    story += [Spacer(1, 6 * mm),
              _section_bar("OGGETTO", st),
              Paragraph(verbale.get("oggetto", ""), st["val"]),
              Spacer(1, 4 * mm)]

    presenti = verbale.get("presenti") or []
    assenti = verbale.get("assenti") or []
    remoti = verbale.get("partecipanti_remoti") or []
    if presenti or assenti or remoti:
        story.append(_section_bar("PARTECIPANTI", st))
        if presenti:
            story.append(Paragraph(f"<b>Presenti in sede ({len(presenti)}):</b> " + ", ".join(presenti), st["val"]))
        if remoti:
            story.append(Paragraph(f"<b>Partecipanti da remoto ({len(remoti)}):</b> " + ", ".join(remoti), st["val"]))
        if assenti:
            story.append(Paragraph(f"<b>Assenti:</b> " + ", ".join(assenti), st["val"]))
        story.append(Spacer(1, 4 * mm))

    if verbale.get("contenuto"):
        story.append(_section_bar("SVOLGIMENTO", st))
        for para in verbale["contenuto"].split("\n\n"):
            if para.strip():
                story.append(Paragraph(para.replace("\n", "<br/>"), st["val"]))
                story.append(Spacer(1, 3 * mm))

    if verbale.get("delibere"):
        story.append(_section_bar("DELIBERE", st))
        for para in verbale["delibere"].split("\n\n"):
            if para.strip():
                story.append(Paragraph(para.replace("\n", "<br/>"), st["val"]))
                story.append(Spacer(1, 3 * mm))

    # Chiusura
    if verbale.get("ora_chiusura") or verbale.get("data_chiusura"):
        chius_parts = []
        if verbale.get("data_chiusura"):
            chius_parts.append(f"il <b>{_fmt_date(verbale['data_chiusura'])}</b>")
        if verbale.get("ora_chiusura"):
            chius_parts.append(f"alle ore <b>{verbale['ora_chiusura']}</b>")
        if chius_parts:
            story.append(Spacer(1, 4 * mm))
            story.append(Paragraph(
                "La seduta si chiude " + " ".join(chius_parts) + ".",
                st["val"]))

    firme_on = verbale.get("firme_abilitate", True)
    if firme_on:
        story.append(Spacer(1, 12 * mm))
        pres_sig = _image_from_b64(org.get("president_signature_base64"), 55, 18)
        secr_sig = _image_from_b64(org.get("secretary_signature_base64"), 55, 18)
        firma = [[Paragraph("Il Segretario", ParagraphStyle("sg", fontSize=10,
                                                              alignment=TA_CENTER, fontName="Helvetica-Bold")),
                  Paragraph("Il Presidente", ParagraphStyle("pr", fontSize=10,
                                                              alignment=TA_CENTER, fontName="Helvetica-Bold"))],
                 [secr_sig if secr_sig else Paragraph(" ", st["val"]),
                  pres_sig if pres_sig else Paragraph(" ", st["val"])],
                 ["", Paragraph(f"<i>{org.get('president_name', 'Drovetti Cassiano Bruno')}</i>",
                                  ParagraphStyle("pn", fontSize=10, alignment=TA_CENTER,
                                                  fontName="Helvetica-Oblique"))]]
        fs = Table(firma, colWidths=[90 * mm, 90 * mm], rowHeights=[6 * mm, 18 * mm, 5 * mm])
        fs.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                 ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                                 ("LINEBELOW", (0, 1), (0, 1), 0.5, colors.black),
                                 ("LINEBELOW", (1, 1), (1, 1), 0.5, colors.black)]))
        story.append(fs)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(_footer_text(org), st["center_small"]))
    doc.build(story)
    return buf.getvalue()


def generate_compenso_pdf(org: dict, comp: dict, tecnico: dict, dettaglio_ricevute: list = None) -> bytes:
    """Busta paga stile PDF per un compenso erogato — 2 pagine:
    Pagina 1: dati, importo, firme (segretario + presidente)
    Pagina 2: riepilogo ricevute che hanno generato il compenso
    """
    from reportlab.platypus import PageBreak
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    st = _make_styles()
    story = [_header(org, st), Spacer(1, 8 * mm),
             Paragraph("EROGAZIONE COMPENSO", st["title"]),
             Spacer(1, 6 * mm)]

    story.append(_section_bar("DATI PERCETTORE", st))
    dt = [[Paragraph("Nome e Cognome:", st["label"]),
           Paragraph(tecnico.get("name", ""), st["val"]),
           Paragraph("Email:", st["label"]),
           Paragraph(tecnico.get("email", ""), st["val"])]]
    t1 = Table(dt, colWidths=[30 * mm, 60 * mm, 20 * mm, 70 * mm])
    t1.setStyle(_field_style())
    story.append(t1); story.append(Spacer(1, 5 * mm))

    story.append(_section_bar("DETTAGLIO", st))
    d_rows = [[Paragraph("Data pagamento:", st["label"]),
               Paragraph(_fmt_date(comp.get("data")), st["val"]),
               Paragraph("", st["label"]),
               Paragraph("", st["val"])]]
    periodo = ""
    if comp.get("periodo_da") and comp.get("periodo_a"):
        periodo = f"{_fmt_date(comp['periodo_da'])} - {_fmt_date(comp['periodo_a'])}"
    if periodo:
        d_rows.append([Paragraph("Periodo:", st["label"]),
                       Paragraph(periodo, st["val"]),
                       Paragraph("", st["label"]),
                       Paragraph("", st["val"])])
    t2 = Table(d_rows, colWidths=[30 * mm, 55 * mm, 30 * mm, 65 * mm])
    t2.setStyle(_field_style())
    story.append(t2); story.append(Spacer(1, 5 * mm))

    # Riga descrittiva libera (mostrata sempre, anche vuota per compilazione manuale)
    story.append(_section_bar("DESCRIZIONE", st))
    descrizione_txt = comp.get("descrizione") or comp.get("note") or " "
    desc_tbl = Table([[Paragraph(descrizione_txt, st["val"])]],
                     colWidths=[180 * mm], rowHeights=[16 * mm])
    desc_tbl.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story.append(desc_tbl); story.append(Spacer(1, 5 * mm))

    # Importo totale
    tot = Table([[Paragraph("<b>Importo erogato:</b>",
                              ParagraphStyle("tl", fontSize=11, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
                  Paragraph(f"<b>{_fmt_eur(comp.get('importo', 0))}</b>",
                              ParagraphStyle("tv", fontSize=14, alignment=TA_RIGHT,
                                              fontName="Helvetica-Bold", textColor=PRIMARY))]],
                colWidths=[100 * mm, 80 * mm])
    tot.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                              ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                              ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                              ("LEFTPADDING", (0, 0), (-1, -1), 10),
                              ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                              ("TOPPADDING", (0, 0), (-1, -1), 8),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    story.append(tot); story.append(Spacer(1, 5 * mm))

    if comp.get("note"):
        story.append(Paragraph(f"<b>Note:</b> {comp['note']}", st["val"]))
        story.append(Spacer(1, 5 * mm))

    # Firme in pagina 1: Segretario + Presidente
    story.append(Spacer(1, 15 * mm))
    pres_sig = _image_from_b64(org.get("president_signature_base64"), 55, 18)
    secr_sig = _image_from_b64(org.get("secretary_signature_base64"), 55, 18)
    firma = [[Paragraph("Il Segretario", ParagraphStyle("sg", fontSize=10,
                                                          alignment=TA_CENTER, fontName="Helvetica-Bold")),
              Paragraph("Il Presidente", ParagraphStyle("pr", fontSize=10,
                                                          alignment=TA_CENTER, fontName="Helvetica-Bold"))],
             [secr_sig if secr_sig else Paragraph(" ", st["val"]),
              pres_sig if pres_sig else Paragraph(" ", st["val"])],
             ["",
              Paragraph(f"<i>{org.get('president_name', 'Drovetti Cassiano Bruno')}</i>",
                          ParagraphStyle("pn", fontSize=10, alignment=TA_CENTER,
                                          fontName="Helvetica-Oblique"))]]
    fs = Table(firma, colWidths=[90 * mm, 90 * mm], rowHeights=[6 * mm, 20 * mm, 5 * mm])
    fs.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                             ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                             ("LINEBELOW", (0, 1), (0, 1), 0.5, colors.black),
                             ("LINEBELOW", (1, 1), (1, 1), 0.5, colors.black)]))
    story.append(fs)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(_footer_text(org), st["center_small"]))

    # ---------- PAGINA 2: riepilogo ricevute ----------
    if dettaglio_ricevute:
        story.append(PageBreak())
        story.append(_header(org, st))
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph(
            f"RIEPILOGO RICEVUTE - {tecnico.get('name','')}", st["title"]))
        story.append(Spacer(1, 3 * mm))
        if periodo:
            story.append(Paragraph(f"Periodo: <b>{periodo}</b>", st["period"]))
        story.append(Spacer(1, 6 * mm))
        story.append(_section_bar(
            f"RICEVUTE INCLUSE ({len(dettaglio_ricevute)})", st))
        rows = [[Paragraph("<b>Numero</b>", st["val"]),
                 Paragraph("<b>Data</b>", st["val"]),
                 Paragraph("<b>Tesserato</b>", st["val"]),
                 Paragraph("<b>Totale</b>",
                            ParagraphStyle("h", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold"))]]
        tot_r = 0.0
        for r in dettaglio_ricevute:
            rows.append([Paragraph(r.get("numero", ""), st["val"]),
                         Paragraph(_fmt_date(r.get("data")), st["val"]),
                         Paragraph(r.get("tesserato_nome", ""), st["val"]),
                         Paragraph(_fmt_eur(r.get("totale", 0)),
                                    ParagraphStyle("i", fontSize=9, alignment=TA_RIGHT))])
            tot_r += float(r.get("totale", 0))
        rows.append([Paragraph("", st["val"]), Paragraph("", st["val"]),
                     Paragraph("<b>TOTALE</b>",
                                ParagraphStyle("tt", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
                     Paragraph(f"<b>{_fmt_eur(tot_r)}</b>",
                                ParagraphStyle("tt2", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold"))])
        rt = Table(rows, colWidths=[30 * mm, 25 * mm, 80 * mm, 45 * mm], repeatRows=1)
        rt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                                 ("BACKGROUND", (0, -1), (-1, -1), LIGHT),
                                 ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                                 ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                 ("FONTSIZE", (0, 0), (-1, -1), 9),
                                 ("LEFTPADDING", (0, 0), (-1, -1), 4),
                                 ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                                 ("TOPPADDING", (0, 0), (-1, -1), 4),
                                 ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
        story.append(rt)
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph(_footer_text(org), st["center_small"]))

    doc.build(story)
    return buf.getvalue()


def generate_rimborso_pdf(org: dict, r: dict) -> bytes:
    """Modulo per rimborso spese (Collaboratori, Volontari, Amministratori).
    Layout ispirato al modulo di erogazione compenso ma dedicato al rimborso.
    """
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    st = _make_styles()
    story = [_header(org, st), Spacer(1, 8 * mm),
             Paragraph("MODULO PER RIMBORSO SPESE", st["title"]),
             Spacer(1, 6 * mm)]

    story.append(_section_bar("DATI PERCIPIENTE", st))
    dt = [[Paragraph("Nome e Cognome:", st["label"]),
           Paragraph(r.get("nome_percipiente", ""), st["val"]),
           Paragraph("Qualifica:", st["label"]),
           Paragraph(r.get("tipologia", ""), st["val"])]]
    t1 = Table(dt, colWidths=[30 * mm, 60 * mm, 25 * mm, 65 * mm])
    t1.setStyle(_field_style())
    story.append(t1); story.append(Spacer(1, 5 * mm))

    story.append(_section_bar("DETTAGLIO", st))
    d_rows = [[Paragraph("Data:", st["label"]),
               Paragraph(_fmt_date(r.get("data")), st["val"]),
               Paragraph("", st["label"]),
               Paragraph("", st["val"])]]
    t2 = Table(d_rows, colWidths=[30 * mm, 55 * mm, 30 * mm, 65 * mm])
    t2.setStyle(_field_style())
    story.append(t2); story.append(Spacer(1, 5 * mm))

    story.append(_section_bar("DESCRIZIONE DELLA SPESA", st))
    descrizione_txt = r.get("descrizione") or " "
    desc_tbl = Table([[Paragraph(descrizione_txt, st["val"])]],
                     colWidths=[180 * mm], rowHeights=[26 * mm])
    desc_tbl.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story.append(desc_tbl); story.append(Spacer(1, 5 * mm))

    # Importo totale
    tot = Table([[Paragraph("<b>Importo rimborsato:</b>",
                              ParagraphStyle("tl", fontSize=11, alignment=TA_RIGHT,
                                              fontName="Helvetica-Bold")),
                  Paragraph(f"<b>{_fmt_eur(r.get('importo', 0))}</b>",
                              ParagraphStyle("tv", fontSize=14, alignment=TA_RIGHT,
                                              fontName="Helvetica-Bold", textColor=PRIMARY))]],
                colWidths=[100 * mm, 80 * mm])
    tot.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                              ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                              ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                              ("LEFTPADDING", (0, 0), (-1, -1), 10),
                              ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                              ("TOPPADDING", (0, 0), (-1, -1), 8),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    story.append(tot); story.append(Spacer(1, 5 * mm))

    if r.get("note"):
        story.append(Paragraph(f"<b>Note:</b> {r['note']}", st["val"]))
        story.append(Spacer(1, 5 * mm))

    # Firme: Percipiente + Presidente
    story.append(Spacer(1, 15 * mm))
    pres_sig = _image_from_b64(org.get("president_signature_base64"), 55, 18)
    firma = [[Paragraph("Il Percipiente", ParagraphStyle("fp", fontSize=10,
                                                            alignment=TA_CENTER,
                                                            fontName="Helvetica-Bold")),
              Paragraph("Il Presidente", ParagraphStyle("pr", fontSize=10,
                                                            alignment=TA_CENTER,
                                                            fontName="Helvetica-Bold"))],
             [Paragraph(" ", st["val"]),
              pres_sig if pres_sig else Paragraph(" ", st["val"])],
             [Paragraph(f"<i>{r.get('nome_percipiente','')}</i>",
                          ParagraphStyle("np", fontSize=10, alignment=TA_CENTER,
                                          fontName="Helvetica-Oblique")),
              Paragraph(f"<i>{org.get('president_name', 'Drovetti Cassiano Bruno')}</i>",
                          ParagraphStyle("pn", fontSize=10, alignment=TA_CENTER,
                                          fontName="Helvetica-Oblique"))]]
    fs = Table(firma, colWidths=[90 * mm, 90 * mm], rowHeights=[6 * mm, 20 * mm, 5 * mm])
    fs.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                             ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                             ("LINEBELOW", (0, 1), (0, 1), 0.5, colors.black),
                             ("LINEBELOW", (1, 1), (1, 1), 0.5, colors.black)]))
    story.append(fs)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(_footer_text(org), st["center_small"]))
    doc.build(story)
    return buf.getvalue()


# ============================================================
# RENDICONTO GESTIONALE ANNUALE (per Consiglio Direttivo)
# ============================================================

_SEZIONI_META = [
    ("entrate_istituzionali", "1) PROVENTI DA ATTIVITÀ ISTITUZIONALI",
     "Quote associative, tesseramenti, contributi (attività non commerciale)",
     "entrata"),
    ("entrate_commerciali", "2) PROVENTI DA ATTIVITÀ DIVERSE / COMMERCIALI",
     "Ricevute, sponsor, corsi, merchandising e ricavi di gestione",
     "entrata"),
    ("uscite_personale", "3) ONERI PER PERSONALE E COLLABORAZIONI SPORTIVE",
     "Compensi tecnici, sportivi e collaboratori occasionali",
     "uscita"),
    ("uscite_rimborsi", "4) RIMBORSI ORGANIZZATIVI E TRASFERTE",
     "Rimborsi spese a collaboratori, volontari e amministratori",
     "uscita"),
    ("uscite_altre", "5) ALTRI ONERI DELLA GESTIONE",
     "Affitti, utenze, materiali, federazione, assicurazioni, manutenzioni…",
     "uscita"),
]


def _rendiconto_section_table(sezione: dict, sezione_prev: dict, st, is_entrata: bool):
    """Tabella comparativa Voce | Anno corrente | Anno precedente | Δ%."""
    color = colors.HexColor("#059669") if is_entrata else colors.HexColor("#DC2626")
    header = [
        Paragraph("<b>Voce</b>", st["val"]),
        Paragraph("<b>Anno corrente</b>",
                  ParagraphStyle("h1", fontSize=9, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
        Paragraph("<b>Anno precedente</b>",
                  ParagraphStyle("h2", fontSize=9, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
        Paragraph("<b>Δ%</b>",
                  ParagraphStyle("h3", fontSize=9, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
    ]
    rows = [header]

    voci_curr = sezione.get("voci", {}) or {}
    voci_prev = (sezione_prev or {}).get("voci", {}) or {}
    all_voci = sorted(set(list(voci_curr.keys()) + list(voci_prev.keys())))

    for v in all_voci:
        curr = float(voci_curr.get(v, 0))
        prev = float(voci_prev.get(v, 0))
        if prev == 0 and curr == 0:
            continue
        if prev == 0:
            delta = "n.d."
        else:
            pct = ((curr - prev) / abs(prev)) * 100.0
            delta = f"{'+' if pct >= 0 else ''}{pct:,.1f}%".replace(",", ".")
        rows.append([
            Paragraph(v, st["val"]),
            Paragraph(_fmt_eur(curr),
                      ParagraphStyle("v1", fontSize=9, alignment=TA_RIGHT, textColor=color)),
            Paragraph(_fmt_eur(prev),
                      ParagraphStyle("v2", fontSize=9, alignment=TA_RIGHT,
                                     textColor=colors.HexColor("#6B7280"))),
            Paragraph(delta,
                      ParagraphStyle("v3", fontSize=9, alignment=TA_RIGHT,
                                     textColor=colors.HexColor("#374151"))),
        ])

    if len(rows) == 1:
        rows.append([Paragraph("<i>Nessun movimento registrato</i>",
                                ParagraphStyle("nc", fontSize=9,
                                                textColor=colors.HexColor("#9CA3AF"))),
                     "", "", ""])

    tot_curr = float(sezione.get("totale", 0))
    tot_prev = float((sezione_prev or {}).get("totale", 0))
    if tot_prev == 0:
        tot_delta = "n.d."
    else:
        pct = ((tot_curr - tot_prev) / abs(tot_prev)) * 100.0
        tot_delta = f"{'+' if pct >= 0 else ''}{pct:,.1f}%".replace(",", ".")
    rows.append([
        Paragraph("<b>TOTALE SEZIONE</b>",
                  ParagraphStyle("tl", fontSize=10, fontName="Helvetica-Bold")),
        Paragraph(f"<b>{_fmt_eur(tot_curr)}</b>",
                  ParagraphStyle("tc", fontSize=10, alignment=TA_RIGHT,
                                 fontName="Helvetica-Bold", textColor=color)),
        Paragraph(f"<b>{_fmt_eur(tot_prev)}</b>",
                  ParagraphStyle("tp", fontSize=10, alignment=TA_RIGHT,
                                 fontName="Helvetica-Bold",
                                 textColor=colors.HexColor("#6B7280"))),
        Paragraph(f"<b>{tot_delta}</b>",
                  ParagraphStyle("td", fontSize=10, alignment=TA_RIGHT,
                                 fontName="Helvetica-Bold")),
    ])

    tbl = Table(rows, colWidths=[80 * mm, 38 * mm, 38 * mm, 24 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EEF2F7")),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return tbl


def generate_rendiconto_pdf(org: dict, year: int, rendiconto: dict,
                             rendiconto_prev: dict | None,
                             movimenti: list, saldi: dict | None = None) -> bytes:
    """Rendiconto Gestionale Annuale — pronto per il Consiglio Direttivo.

    Contiene:
    - Intestazione ASD + logo
    - Riepilogo esecutivo (totali entrate/uscite/risultato con confronto anno precedente)
    - 5 sezioni con tabelle comparative (voce, anno corrente, anno precedente, Δ%)
    - Saldi Cassa / Banca al termine dell'esercizio
    - Elenco dettagliato di tutti i movimenti (ordinato per data)
    - Firma Presidente + Segretario
    """
    from reportlab.platypus import PageBreak
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    st = _make_styles()
    story = [_header(org, st), Spacer(1, 6 * mm),
             Paragraph(f"RENDICONTO GESTIONALE {year}", st["title"]),
             Spacer(1, 3 * mm),
             Paragraph(
                 f"Documento riepilogativo di gestione — Esercizio dal 01/01/{year} al 31/12/{year}",
                 st["period"]),
             Spacer(1, 6 * mm)]

    # Presentazione / preambolo
    preambolo = (
        f"Il presente documento, redatto ai sensi delle disposizioni statutarie e "
        f"in conformità alle indicazioni previste per gli enti del Terzo Settore e le "
        f"Associazioni Sportive Dilettantistiche, espone in forma sintetica e analitica "
        f"i proventi e gli oneri della gestione relativi all'esercizio "
        f"<b>{year}</b>, posto a confronto con l'esercizio precedente "
        f"<b>{year - 1}</b>. I saldi di cassa e banca sono riferiti al termine "
        f"dell'esercizio in oggetto."
    )
    story.append(Paragraph(preambolo, st["val"]))
    story.append(Spacer(1, 6 * mm))

    # ---- RIEPILOGO ESECUTIVO ----
    tot_e = float(rendiconto["totali"]["entrate"])
    tot_u = float(rendiconto["totali"]["uscite"])
    risultato = float(rendiconto["totali"]["risultato"])
    tot_e_prev = float((rendiconto_prev or {}).get("totali", {}).get("entrate", 0))
    tot_u_prev = float((rendiconto_prev or {}).get("totali", {}).get("uscite", 0))
    ris_prev = float((rendiconto_prev or {}).get("totali", {}).get("risultato", 0))

    def _delta(curr, prev):
        if prev == 0:
            return "n.d."
        pct = ((curr - prev) / abs(prev)) * 100.0
        return f"{'+' if pct >= 0 else ''}{pct:,.1f}%".replace(",", ".")

    story.append(_section_bar("RIEPILOGO ESECUTIVO", st))
    riep_rows = [
        [Paragraph("<b>Grandezza</b>", st["val"]),
         Paragraph(f"<b>{year}</b>",
                   ParagraphStyle("r1", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
         Paragraph(f"<b>{year - 1}</b>",
                   ParagraphStyle("r2", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
         Paragraph("<b>Δ%</b>",
                   ParagraphStyle("r3", fontSize=10, alignment=TA_RIGHT, fontName="Helvetica-Bold"))],
        [Paragraph("Totale Proventi", st["val"]),
         Paragraph(_fmt_eur(tot_e),
                   ParagraphStyle("e", fontSize=10, alignment=TA_RIGHT,
                                  textColor=colors.HexColor("#059669"), fontName="Helvetica-Bold")),
         Paragraph(_fmt_eur(tot_e_prev),
                   ParagraphStyle("ep", fontSize=10, alignment=TA_RIGHT,
                                  textColor=colors.HexColor("#6B7280"))),
         Paragraph(_delta(tot_e, tot_e_prev),
                   ParagraphStyle("ed", fontSize=10, alignment=TA_RIGHT))],
        [Paragraph("Totale Oneri", st["val"]),
         Paragraph(_fmt_eur(tot_u),
                   ParagraphStyle("u", fontSize=10, alignment=TA_RIGHT,
                                  textColor=colors.HexColor("#DC2626"), fontName="Helvetica-Bold")),
         Paragraph(_fmt_eur(tot_u_prev),
                   ParagraphStyle("up", fontSize=10, alignment=TA_RIGHT,
                                  textColor=colors.HexColor("#6B7280"))),
         Paragraph(_delta(tot_u, tot_u_prev),
                   ParagraphStyle("ud", fontSize=10, alignment=TA_RIGHT))],
        [Paragraph("<b>Risultato d'esercizio</b>",
                   ParagraphStyle("rl", fontSize=11, fontName="Helvetica-Bold")),
         Paragraph(f"<b>{_fmt_eur(risultato)}</b>",
                   ParagraphStyle("rv", fontSize=12, alignment=TA_RIGHT,
                                  fontName="Helvetica-Bold", textColor=PRIMARY)),
         Paragraph(_fmt_eur(ris_prev),
                   ParagraphStyle("rvp", fontSize=10, alignment=TA_RIGHT,
                                  textColor=colors.HexColor("#6B7280"))),
         Paragraph(_delta(risultato, ris_prev),
                   ParagraphStyle("rd", fontSize=10, alignment=TA_RIGHT,
                                  fontName="Helvetica-Bold"))],
    ]
    rt = Table(riep_rows, colWidths=[80 * mm, 38 * mm, 38 * mm, 24 * mm])
    rt.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                             ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
                             ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                             ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EEF2F7")),
                             ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                             ("LEFTPADDING", (0, 0), (-1, -1), 6),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                             ("TOPPADDING", (0, 0), (-1, -1), 5),
                             ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    story.append(rt)

    # Avanzo / Disavanzo statement
    if risultato >= 0:
        stato = (f"L'esercizio {year} chiude con un <b>AVANZO DI GESTIONE</b> pari a "
                 f"<b>{_fmt_eur(risultato)}</b>.")
        stato_color = colors.HexColor("#059669")
    else:
        stato = (f"L'esercizio {year} chiude con un <b>DISAVANZO DI GESTIONE</b> pari a "
                 f"<b>{_fmt_eur(abs(risultato))}</b>.")
        stato_color = colors.HexColor("#DC2626")
    story.append(Spacer(1, 3 * mm))
    stato_box = Table([[Paragraph(stato,
                                     ParagraphStyle("sb", fontSize=11,
                                                     alignment=TA_CENTER, textColor=colors.white,
                                                     fontName="Helvetica"))]],
                       colWidths=[180 * mm])
    stato_box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), stato_color),
                                     ("TOPPADDING", (0, 0), (-1, -1), 8),
                                     ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    story.append(stato_box)
    story.append(Spacer(1, 6 * mm))

    # ---- 5 SEZIONI ----
    prev_sez = (rendiconto_prev or {}).get("sezioni", {}) or {}
    for key, titolo, sub, tipo in _SEZIONI_META:
        story.append(_section_bar(titolo, st))
        story.append(Paragraph(f"<i>{sub}</i>",
                                ParagraphStyle("sub", fontSize=8,
                                                textColor=colors.HexColor("#6B7280"),
                                                leading=10)))
        story.append(Spacer(1, 2 * mm))
        story.append(_rendiconto_section_table(
            rendiconto["sezioni"].get(key, {"totale": 0, "voci": {}}),
            prev_sez.get(key, {"totale": 0, "voci": {}}),
            st, is_entrata=(tipo == "entrata")))
        story.append(Spacer(1, 5 * mm))

    # ---- SALDI CASSA / BANCA ----
    if saldi:
        story.append(_section_bar("DISPONIBILITÀ LIQUIDE AL 31/12", st))
        saldi_rows = [[
            Paragraph("<b>Voce</b>", st["val"]),
            Paragraph("<b>Entrate</b>",
                      ParagraphStyle("se", fontSize=9, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
            Paragraph("<b>Uscite</b>",
                      ParagraphStyle("su", fontSize=9, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
            Paragraph("<b>Saldo</b>",
                      ParagraphStyle("ss", fontSize=9, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
        ]]
        cassa_e = float(saldi.get("dettaglio", {}).get("cassa", {}).get("entrate", 0))
        cassa_u = float(saldi.get("dettaglio", {}).get("cassa", {}).get("uscite", 0))
        banca_e = float(saldi.get("dettaglio", {}).get("banca", {}).get("entrate", 0))
        banca_u = float(saldi.get("dettaglio", {}).get("banca", {}).get("uscite", 0))
        cassa_s = float(saldi.get("cassa", 0))
        banca_s = float(saldi.get("banca", 0))
        tot_s = float(saldi.get("totale", cassa_s + banca_s))
        for lbl, e, u, s in [("Cassa contanti", cassa_e, cassa_u, cassa_s),
                             ("Conto corrente bancario", banca_e, banca_u, banca_s)]:
            saldi_rows.append([
                Paragraph(lbl, st["val"]),
                Paragraph(_fmt_eur(e),
                          ParagraphStyle("se2", fontSize=9, alignment=TA_RIGHT,
                                          textColor=colors.HexColor("#059669"))),
                Paragraph(_fmt_eur(u),
                          ParagraphStyle("su2", fontSize=9, alignment=TA_RIGHT,
                                          textColor=colors.HexColor("#DC2626"))),
                Paragraph(_fmt_eur(s),
                          ParagraphStyle("ss2", fontSize=10, alignment=TA_RIGHT,
                                          fontName="Helvetica-Bold")),
            ])
        saldi_rows.append([
            Paragraph("<b>Liquidità totale</b>",
                      ParagraphStyle("tl", fontSize=10, fontName="Helvetica-Bold")),
            "", "",
            Paragraph(f"<b>{_fmt_eur(tot_s)}</b>",
                      ParagraphStyle("tv", fontSize=11, alignment=TA_RIGHT,
                                      fontName="Helvetica-Bold", textColor=PRIMARY)),
        ])
        stbl = Table(saldi_rows, colWidths=[80 * mm, 34 * mm, 34 * mm, 32 * mm])
        stbl.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                                    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EEF2F7")),
                                    ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
        story.append(stbl)
        story.append(Spacer(1, 3 * mm))

        # Nota giroconti
        gc = rendiconto.get("sezioni", {}).get("giroconti", {}) or {}
        if gc.get("count"):
            story.append(Paragraph(
                f"<i>Nell'esercizio sono stati registrati {gc.get('count', 0)} "
                f"giroconti Cassa/Banca per un totale movimentato di "
                f"{_fmt_eur(gc.get('totale', 0))} — operazioni non impattanti sul "
                f"risultato di gestione.</i>",
                st["note"]))
        story.append(Spacer(1, 4 * mm))

    # ---- DETTAGLIO MOVIMENTI (pagina dedicata) ----
    story.append(PageBreak())
    story.append(_section_bar(f"DETTAGLIO MOVIMENTI — ESERCIZIO {year}", st))
    story.append(Paragraph(
        "<i>Elenco cronologico di tutti i movimenti registrati (esclusi giroconti "
        "interni tra Cassa e Banca, evidenziati separatamente).</i>", st["note"]))
    story.append(Spacer(1, 3 * mm))

    dett_header = [
        Paragraph("<b>Data</b>", st["val"]),
        Paragraph("<b>Tipo</b>", st["val"]),
        Paragraph("<b>Metodo</b>", st["val"]),
        Paragraph("<b>Categoria</b>", st["val"]),
        Paragraph("<b>Descrizione</b>", st["val"]),
        Paragraph("<b>Importo</b>",
                  ParagraphStyle("dh", fontSize=9, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
    ]
    dett_rows = [dett_header]
    movs_sorted = sorted([m for m in movimenti if not m.get("is_giroconto")],
                          key=lambda m: (m.get("data") or ""))
    for m in movs_sorted:
        color = colors.HexColor("#059669") if m["tipo"] == "entrata" else colors.HexColor("#DC2626")
        sign = "+" if m["tipo"] == "entrata" else "-"
        metodo = (m.get("metodo") or "cassa").capitalize()
        dett_rows.append([
            Paragraph(_fmt_date(m["data"]),
                      ParagraphStyle("dd", fontSize=8, textColor=TEXT)),
            Paragraph(m["tipo"].capitalize(),
                      ParagraphStyle("dt", fontSize=8, textColor=color)),
            Paragraph(metodo,
                      ParagraphStyle("dm", fontSize=8, textColor=TEXT)),
            Paragraph((m.get("categoria") or "")[:24],
                      ParagraphStyle("dc", fontSize=8, textColor=TEXT)),
            Paragraph((m.get("descrizione") or "")[:70],
                      ParagraphStyle("dx", fontSize=8, textColor=TEXT)),
            Paragraph(f"{sign}{_fmt_eur(m['importo'])}",
                      ParagraphStyle("di", fontSize=8, alignment=TA_RIGHT,
                                      textColor=color, fontName="Helvetica-Bold")),
        ])
    if len(dett_rows) == 1:
        dett_rows.append([Paragraph("<i>Nessun movimento nel periodo</i>",
                                       ParagraphStyle("nom", fontSize=9,
                                                       textColor=colors.HexColor("#9CA3AF"))),
                            "", "", "", "", ""])
    dtbl = Table(dett_rows,
                  colWidths=[20 * mm, 16 * mm, 16 * mm, 32 * mm, 70 * mm, 26 * mm],
                  repeatRows=1)
    dtbl.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                                ("GRID", (0, 0), (-1, -1), 0.25, BORDER),
                                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                                ("TOPPADDING", (0, 0), (-1, -1), 3),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    story.append(dtbl)
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        f"<b>Totale movimenti registrati:</b> {len(movs_sorted)} operazioni — "
        f"Proventi: <b>{_fmt_eur(tot_e)}</b> · Oneri: <b>{_fmt_eur(tot_u)}</b>",
        st["note"]))

    # ---- APPROVAZIONE E FIRME ----
    story.append(Spacer(1, 10 * mm))
    approv = (
        f"Il presente Rendiconto Gestionale è stato redatto in conformità alle "
        f"scritture contabili tenute dall'associazione e viene sottoposto "
        f"all'approvazione del Consiglio Direttivo e dell'Assemblea dei Soci."
    )
    story.append(Paragraph(approv, st["val"]))
    story.append(Spacer(1, 12 * mm))

    luogo = org.get("citta") or org.get("sede_legale") or "Torino"
    oggi = datetime.now().strftime("%d/%m/%Y")
    story.append(Paragraph(f"{luogo}, lì {oggi}",
                            ParagraphStyle("lg", fontSize=10, alignment=TA_LEFT,
                                            fontName="Helvetica-Oblique")))
    story.append(Spacer(1, 10 * mm))

    pres_sig = _image_from_b64(org.get("president_signature_base64"), 55, 18)
    secr_sig = _image_from_b64(org.get("secretary_signature_base64"), 55, 18)
    firma = [[Paragraph("Il Segretario",
                          ParagraphStyle("sg", fontSize=10, alignment=TA_CENTER,
                                          fontName="Helvetica-Bold")),
                Paragraph("Il Presidente",
                          ParagraphStyle("pr", fontSize=10, alignment=TA_CENTER,
                                          fontName="Helvetica-Bold"))],
              [secr_sig if secr_sig else Paragraph(" ", st["val"]),
               pres_sig if pres_sig else Paragraph(" ", st["val"])],
              ["",
               Paragraph(f"<i>{org.get('president_name', 'Drovetti Cassiano Bruno')}</i>",
                          ParagraphStyle("pn", fontSize=10, alignment=TA_CENTER,
                                          fontName="Helvetica-Oblique"))]]
    fs = Table(firma, colWidths=[90 * mm, 90 * mm],
                rowHeights=[6 * mm, 20 * mm, 5 * mm])
    fs.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                             ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                             ("LINEBELOW", (0, 1), (0, 1), 0.5, colors.black),
                             ("LINEBELOW", (1, 1), (1, 1), 0.5, colors.black)]))
    story.append(fs)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(_footer_text(org), st["center_small"]))
    doc.build(story)
    return buf.getvalue()
