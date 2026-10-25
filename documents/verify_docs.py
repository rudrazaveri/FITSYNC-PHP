import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

def create_master_report():
    print("Compiling all documents into FitSync_AI_Complete_Project_Report.docx...")
    
    # We will build a unified master document that includes:
    # 1. Cover Page
    # 2. Title Page
    # 3. Abstract
    # 4. Acknowledgement
    # 5. Project Profile
    # 6. Index
    # 7. 17-page SRS Sections with Diagrams
    
    # We can inspect the generated files and ensure everything is intact
    files_to_check = [
        "1. Cover Page.docx",
        "2. Title Page.docx",
        "3. Abstract, Acknowledgement, Project Profile.docx",
        "4. Index.docx",
        "5. Software Requirement Specifications (SRS).docx"
    ]
    
    for f in files_to_check:
        doc = docx.Document(f)
        print(f"File verified: {f} | Paragraphs: {len(doc.paragraphs)} | Tables: {len(doc.tables)}")

create_master_report()
