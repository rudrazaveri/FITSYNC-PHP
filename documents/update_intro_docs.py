import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def update_cover_page():
    doc = docx.Document('1. Cover Page.docx')
    for p in doc.paragraphs:
        txt = p.text.strip()
        if 'Name of Your Project' in txt:
            p.text = 'FITSYNC AI'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(22)
                r.bold = True
                r.font.color.rgb = RGBColor(0, 51, 102)
            # Add subtitle paragraph
            p2 = p.insert_paragraph_before()
            p2.text = '' # keep spacing
        elif 'Students name' in txt:
            p.text = "Rudra Zaveri  (24000237)\nKeya Patel  (24000234)\nDevansh Patel  (24000526)\nParth Patel  (24000628)"
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(12)
                r.bold = True
        elif 'ACADEMIC YEAR' in txt:
            p.text = 'ACADEMIC YEAR 2026-2027'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(13)
                r.bold = True
        elif 'S.Y B.C.A.' in txt:
            p.text = 'T.Y CSE SEM-5'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(13)
                r.bold = True
        elif 'Name of Faculty' in txt:
            p.text = 'Prof. Shraddha Doshi'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(13)
                r.bold = True
        elif 'Name of College' in txt:
            p.text = 'School of Engineering & Technology'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(13)
                r.bold = True
        elif 'Logo Of  University' in txt:
            p.text = 'NAVRACHANA UNIVERSITY'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(15)
                r.bold = True
                r.font.color.rgb = RGBColor(0, 51, 102)
        elif 'Name of University' in txt:
            p.text = 'Vadodara, Gujarat'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(12)
                r.bold = True

    doc.save('1. Cover Page.docx')
    print("Updated 1. Cover Page.docx successfully")

def update_title_page():
    doc = docx.Document('2. Title Page.docx')
    for p in doc.paragraphs:
        txt = p.text.strip()
        if 'Name of Your Project' in txt:
            p.text = 'FITSYNC AI\nIntelligent Health & Biometric Tracking Platform'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(20)
                r.bold = True
                r.font.color.rgb = RGBColor(0, 51, 102)
        elif 'Name of Students' in txt:
            p.text = "Rudra Zaveri  (24000237)\nKeya Patel  (24000234)\nDevansh Patel  (24000526)\nParth Patel  (24000628)"
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(12)
                r.bold = True
        elif 'ACADEMIC YEAR' in txt:
            p.text = 'ACADEMIC YEAR 2026-2027'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(13)
                r.bold = True
        elif 'S.Y B.C.A.' in txt:
            p.text = 'T.Y CSE SEM-5'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(13)
                r.bold = True
        elif 'Name of Your Faculty' in txt:
            p.text = 'Prof. Shraddha Doshi'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(13)
                r.bold = True
        elif 'Name of College' in txt:
            p.text = 'School of Engineering & Technology'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(13)
                r.bold = True
        elif 'Logo of University' in txt:
            p.text = 'NAVRACHANA UNIVERSITY'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(15)
                r.bold = True
                r.font.color.rgb = RGBColor(0, 51, 102)
        elif 'Name of University' in txt:
            p.text = 'Navrachana University'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(13)
                r.bold = True
        elif 'Vadodara' in txt:
            p.text = 'Vadodara, Gujarat'
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(12)
                r.bold = True

    doc.save('2. Title Page.docx')
    print("Updated 2. Title Page.docx successfully")

def update_abstract_ack_profile():
    doc = docx.Document('3. Abstract, Acknowledgement, Project Profile.docx')
    
    # Let's rebuild the content cleanly so it has standard formatting with page breaks
    # Clear existing paragraphs and tables
    p_elements = list(doc.paragraphs)
    t_elements = list(doc.tables)
    
    # We will format paragraph 0: ABSTRACT
    # paragraph 1: abstract body
    # paragraph 2: page break + ACKNOWLEDGEMENT
    # paragraph 3: acknowledgement body
    # paragraph 4: page break + PROJECT PROFILE
    # then Table 0 with formatted cells!
    
    # Let's clear the document body elements and populate
    for p in doc.paragraphs:
        p._p.getparent().remove(p._p)
    for t in doc.tables:
        t._tbl.getparent().remove(t._tbl)

    # 1. ABSTRACT
    p_abs_title = doc.add_paragraph()
    p_abs_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_abs = p_abs_title.add_run("ABSTRACT")
    r_abs.font.name = "Arial"
    r_abs.font.size = Pt(16)
    r_abs.bold = True
    r_abs.font.color.rgb = RGBColor(0, 51, 102)
    p_abs_title.paragraph_format.space_after = Pt(14)
    p_abs_title.paragraph_format.space_before = Pt(10)

    p_abs1 = doc.add_paragraph()
    p_abs1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs1.paragraph_format.line_spacing = 1.15
    p_abs1.paragraph_format.space_after = Pt(10)
    r1 = p_abs1.add_run(
        "FitSync AI is an intelligent, full-stack, cloud-native health and biometric tracking platform "
        "engineered to bridge the critical divide between personal fitness monitoring and clinical-grade health management. "
        "Developed using modern web architecture—including Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, and "
        "Supabase PostgreSQL—the system provides high-performance, real-time biometric and metabolic computation adhering to "
        "rigorous physiological standards."
    )
    r1.font.name = "Arial"
    r1.font.size = Pt(11)

    p_abs2 = doc.add_paragraph()
    p_abs2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs2.paragraph_format.line_spacing = 1.15
    p_abs2.paragraph_format.space_after = Pt(10)
    r2 = p_abs2.add_run(
        "The platform natively integrates validated mathematical algorithms: the Mifflin-St Jeor equation for basal metabolic "
        "rate (BMR) and total daily energy expenditure (TDEE), and the U.S. Navy Body Composition model for non-invasive body "
        "fat estimation. Beyond quantitative telemetry, FitSync AI features an intelligent allergen collision scanner that "
        "evaluates dietary logs against user allergen profiles in real time, a conflict-free telehealth appointment booking engine "
        "equipped with transactional scheduling, an AI-powered conversational assistant, and sovereign patient consent governance "
        "enforced via PostgreSQL Row Level Security (RLS)."
    )
    r2.font.name = "Arial"
    r2.font.size = Pt(11)

    p_abs3 = doc.add_paragraph()
    p_abs3.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs3.paragraph_format.line_spacing = 1.15
    p_abs3.paragraph_format.space_after = Pt(20)
    r3 = p_abs3.add_run(
        "By synthesizing proactive nutritional feedback, multi-role clinical collaboration, and strict data confidentiality, "
        "FitSync AI establishes a unified, accessible, and privacy-first ecosystem for fitness enthusiasts, patients, coaches, "
        "and medical clinicians."
    )
    r3.font.name = "Arial"
    r3.font.size = Pt(11)

    # PAGE BREAK
    doc.add_page_break()

    # 2. ACKNOWLEDGEMENT
    p_ack_title = doc.add_paragraph()
    p_ack_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ack = p_ack_title.add_run("ACKNOWLEDGEMENT")
    r_ack.font.name = "Arial"
    r_ack.font.size = Pt(16)
    r_ack.bold = True
    r_ack.font.color.rgb = RGBColor(0, 51, 102)
    p_ack_title.paragraph_format.space_after = Pt(14)
    p_ack_title.paragraph_format.space_before = Pt(10)

    p_ack1 = doc.add_paragraph()
    p_ack1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_ack1.paragraph_format.line_spacing = 1.15
    p_ack1.paragraph_format.space_after = Pt(10)
    ra1 = p_ack1.add_run(
        "We express our profound gratitude and sincere appreciation to our esteemed project guide, "
        "Prof. Shraddha Doshi, School of Engineering & Technology, Navrachana University, Vadodara, "
        "for her exceptional mentorship, continuous inspiration, valuable suggestions, and constant encouragement "
        "throughout the conception, design, and development of this project. Her constructive technical critique and guidance "
        "have been invaluable in steering the development of FitSync AI to successful fruition."
    )
    ra1.font.name = "Arial"
    ra1.font.size = Pt(11)

    p_ack2 = doc.add_paragraph()
    p_ack2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_ack2.paragraph_format.line_spacing = 1.15
    p_ack2.paragraph_format.space_after = Pt(10)
    ra2 = p_ack2.add_run(
        "We also convey our earnest thanks to the Head of the Department and all respected faculty members of the "
        "Department of Computer Science & Engineering, Navrachana University, for granting access to necessary infrastructural "
        "facilities, laboratory resources, and technical support essential for completing our software requirements and implementation."
    )
    ra2.font.name = "Arial"
    ra2.font.size = Pt(11)

    p_ack3 = doc.add_paragraph()
    p_ack3.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_ack3.paragraph_format.line_spacing = 1.15
    p_ack3.paragraph_format.space_after = Pt(20)
    ra3 = p_ack3.add_run(
        "Finally, we express our heartfelt thanks to our parents, family members, and peers for their continuous moral support, "
        "patience, and enthusiasm throughout our academic journey."
    )
    ra3.font.name = "Arial"
    ra3.font.size = Pt(11)

    p_sign = doc.add_paragraph()
    p_sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sign.paragraph_format.space_before = Pt(20)
    rsign = p_sign.add_run(
        "Rudra Zaveri  (24000237)\n"
        "Keya Patel  (24000234)\n"
        "Devansh Patel  (24000526)\n"
        "Parth Patel  (24000628)\n"
        "T.Y CSE SEM-5, Academic Year 2026-2027\n"
        "Navrachana University, Vadodara"
    )
    rsign.font.name = "Arial"
    rsign.font.size = Pt(10.5)
    rsign.bold = True

    # PAGE BREAK
    doc.add_page_break()

    # 3. PROJECT PROFILE
    p_prof_title = doc.add_paragraph()
    p_prof_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_prof = p_prof_title.add_run("PROJECT PROFILE")
    r_prof.font.name = "Arial"
    r_prof.font.size = Pt(16)
    r_prof.bold = True
    r_prof.font.color.rgb = RGBColor(0, 51, 102)
    p_prof_title.paragraph_format.space_after = Pt(14)
    p_prof_title.paragraph_format.space_before = Pt(10)

    # Create Table
    table = doc.add_table(rows=11, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(2.6), Inches(4.2)]
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # Row 0: Section 1 Header
    c0 = table.cell(0, 0)
    c1 = table.cell(0, 1)
    c0.merge(c1)
    c0.text = "1. STUDENT INFORMATION"
    set_cell_background(c0, "1E3A8A")
    set_cell_margins(c0, 140, 140, 180, 180)
    for p in c0.paragraphs:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs:
            r.font.name = "Arial"
            r.font.size = Pt(11)
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    # Row 1: Student details
    c_sname = table.cell(1, 0)
    c_sroll = table.cell(1, 1)
    c_sname.text = "Student Names:\n1. Rudra Zaveri\n2. Keya Patel\n3. Devansh Patel\n4. Parth Patel\n\nClass & Semester: T.Y CSE SEM-5\nAcademic Year: 2026-2027"
    c_sroll.text = "Enrollment Numbers:\n24000237\n24000234\n24000526\n24000628\n\nCollege: School of Engineering & Technology\nUniversity: Navrachana University, Vadodara"
    for cell in [c_sname, c_sroll]:
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, 120, 120, 160, 160)
        for p in cell.paragraphs:
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(10)

    # Row 2: Section 2 Header
    c2_0 = table.cell(2, 0)
    c2_1 = table.cell(2, 1)
    c2_0.merge(c2_1)
    c2_0.text = "2. PROJECT DETAILS"
    set_cell_background(c2_0, "1E3A8A")
    set_cell_margins(c2_0, 140, 140, 180, 180)
    for p in c2_0.paragraphs:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs:
            r.font.name = "Arial"
            r.font.size = Pt(11)
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    proj_rows = [
        (3, "Project Title:", "FitSync AI — Intelligent Health & Biometric Tracking Platform"),
        (4, "Duration:", "2 Semesters (Academic Year 2026 - 2027)"),
        (5, "Name of Project:", "FitSync AI"),
        (6, "Platform & Stack:", "Web Application (Next.js 14 App Router, React 18, TypeScript, Supabase PostgreSQL, Tailwind CSS)"),
        (7, "Team Size:", "4 Members (Full-Stack Engineering Team)")
    ]
    for r_idx, lbl, val in proj_rows:
        cl = table.cell(r_idx, 0)
        cr = table.cell(r_idx, 1)
        cl.text = lbl
        cr.text = val
        set_cell_background(cl, "F1F5F9")
        set_cell_background(cr, "FFFFFF")
        set_cell_margins(cl, 100, 100, 160, 160)
        set_cell_margins(cr, 100, 100, 160, 160)
        for p in cl.paragraphs:
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(10)
                r.bold = True
        for p in cr.paragraphs:
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(10)

    # Row 8: Section 3 Header
    c8_0 = table.cell(8, 0)
    c8_1 = table.cell(8, 1)
    c8_0.merge(c8_1)
    c8_0.text = "3. GUIDE INFORMATION"
    set_cell_background(c8_0, "1E3A8A")
    set_cell_margins(c8_0, 140, 140, 180, 180)
    for p in c8_0.paragraphs:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for r in p.runs:
            r.font.name = "Arial"
            r.font.size = Pt(11)
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    g_rows = [
        (9, "Name of Project Guide:", "Prof. Shraddha Doshi"),
        (10, "Department & Institution:", "Department of Computer Science & Engineering,\nSchool of Engineering & Technology, Navrachana University, Vadodara")
    ]
    for r_idx, lbl, val in g_rows:
        cl = table.cell(r_idx, 0)
        cr = table.cell(r_idx, 1)
        cl.text = lbl
        cr.text = val
        set_cell_background(cl, "F1F5F9")
        set_cell_background(cr, "FFFFFF")
        set_cell_margins(cl, 100, 100, 160, 160)
        set_cell_margins(cr, 100, 100, 160, 160)
        for p in cl.paragraphs:
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(10)
                r.bold = True
        for p in cr.paragraphs:
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(10)

    doc.save('3. Abstract, Acknowledgement, Project Profile.docx')
    print("Updated 3. Abstract, Acknowledgement, Project Profile.docx successfully")

def update_index_page():
    doc = docx.Document('4. Index.docx')
    tbl = doc.tables[0]
    
    # Mapping of index rows to page numbers based on the standard 17-page SRS format
    index_pages = [
        ("1", "SDLC OVERVIEW", "1"),
        ("2", "REQUIREMENT GATHERING AND ANALYSIS", "2"),
        ("2", "2.1 Organization Details", "2"),
        ("2", "2.2 Meetings", "2"),
        ("2", "2.3 Data which will be Input into the system", "2"),
        ("2", "2.4 Data which will be Output from the system", "3"),
        ("2", "2.5 Type of Project", "3"),
        ("2", "2.6 Method of collecting Data", "3"),
        ("3", "SYSTEM REQUIREMENT SPECIFICATIONS", "4"),
        ("3", "3.1 Introduction", "4"),
        ("3", "3.2 Overall Description", "4"),
        ("3", "3.3 External Interface Requirements", "7"),
        ("3", "3.4 System Features", "7"),
        ("3", "3.5 Other Non-functional Requirements", "8"),
        ("4", "SYSTEM ANALYSIS AND MODELING", "9"),
        ("4", "4.1 Use case Diagram", "9"),
        ("4", "4.2 Normalization and E-R Diagram", "9"),
        ("4", "4.3 Data Dictionary", "9"),
        ("4", "4.4 Functional and Behavior Modeling", "11"),
        ("4", "4.5 Gantt Chart", "12"),
        ("5", "TEST CASES", "13"),
        ("6", "SCREENSHOTS", "14"),
        ("7", "LIMITATIONS AND FUTURE ENHANCEMENTS", "15"),
        ("8", "CONCLUSION", "16"),
        ("9", "REFERENCES AND BIBLIOGRAPHY", "17"),
    ]
    
    # Format header row
    hdr = tbl.rows[0]
    set_cell_background(hdr.cells[0], "1E3A8A")
    set_cell_background(hdr.cells[1], "1E3A8A")
    set_cell_background(hdr.cells[2], "1E3A8A")
    for c in hdr.cells:
        set_cell_margins(c, 120, 120, 140, 140)
        for p in c.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(10.5)
                r.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    for idx, (sr, title, pg) in enumerate(index_pages):
        row = tbl.rows[idx + 1]
        row.cells[0].text = sr
        row.cells[1].text = title
        row.cells[2].text = pg
        
        # alternating background
        bg = "F8FAFC" if idx % 2 == 0 else "FFFFFF"
        is_main = not title.startswith("2.") and not title.startswith("3.") and not title.startswith("4.")
        
        for c_idx, cell in enumerate(row.cells):
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 120, 120)
            for p in cell.paragraphs:
                if c_idx == 0:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                elif c_idx == 1:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    r.font.name = "Arial"
                    r.font.size = Pt(10)
                    if is_main:
                        r.bold = True

    doc.save('4. Index.docx')
    print("Updated 4. Index.docx successfully")

if __name__ == "__main__":
    update_cover_page()
    update_title_page()
    update_abstract_ack_profile()
    update_index_page()
    print("All 4 introductory documents updated!")
