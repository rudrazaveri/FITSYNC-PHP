import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

from update_intro_docs import update_cover_page, update_title_page, update_abstract_ack_profile, update_index_page
from generate_srs_doc import add_header_footer, add_heading_1, add_heading_2, add_heading_3, add_p, add_bullet, build_srs_document

def compile_master():
    print("Building master combined document...")
    # We can create a master document starting from 1, 2, 3, 4, 5
    # Let's read doc 1, 2, 3, 4, 5
    master = docx.Document('5. Software Requirement Specifications (SRS).docx')
    master.save('FitSync_AI_Complete_Project_Report.docx')
    print("Master report generated as FitSync_AI_Complete_Project_Report.docx")

if __name__ == '__main__':
    compile_master()
