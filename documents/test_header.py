import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

doc = docx.Document()
section = doc.sections[0]
section.top_margin = Inches(0.8)
section.bottom_margin = Inches(0.8)
section.left_margin = Inches(0.8)
section.right_margin = Inches(0.8)

# Configure Header
header = section.header
p_head = header.paragraphs[0]
p_head.text = "" # clear

tbl_h = header.add_table(rows=1, cols=2, width=Inches(6.9))
tbl_h.autofit = False
tbl_h.columns[0].width = Inches(3.8)
tbl_h.columns[1].width = Inches(3.1)

c_hl = tbl_h.cell(0, 0)
p_hl = c_hl.paragraphs[0]
r_hl = p_hl.add_run("Rudra Zaveri (24000237) | Keya Patel (24000234)\nDevansh Patel (24000526) | Parth Patel (24000628)")
r_hl.font.name = "Arial"
r_hl.font.size = Pt(8)
r_hl.font.color.rgb = RGBColor(100, 116, 139)

c_hr = tbl_h.cell(0, 1)
p_hr = c_hr.paragraphs[0]
p_hr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r_hr = p_hr.add_run("FitSync AI\nHealth & Biometric Platform")
r_hr.font.name = "Arial"
r_hr.font.size = Pt(8.5)
r_hr.bold = True
r_hr.font.color.rgb = RGBColor(30, 58, 138)

# Remove table borders
def remove_table_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'<w:tblBorders {nsdecls("w")}>'
                        f'<w:top w:val="none"/>'
                        f'<w:left w:val="none"/>'
                        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>'
                        f'<w:right w:val="none"/>'
                        f'<w:insideH w:val="none"/>'
                        f'<w:insideV w:val="none"/>'
                        f'</w:tblBorders>')
    tblPr.append(borders)

remove_table_borders(tbl_h)

doc.save("test_header.docx")
print("Header test passed")
