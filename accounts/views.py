from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse, JsonResponse
import json, io
from datetime import date

# ── Cost Calculation Helper ─────────────────────────────────────────────────
MATERIAL_RATES = {
    'aluminium': 500,
    'steel':     700,
    'wood':      600,
}

def calculate_cost(width, height, quantity, material):
    area       = (width / 1000) * (height / 1000)   # convert mm → m²
    rate       = MATERIAL_RATES.get(material.lower(), 500)
    base_cost  = area * rate * quantity
    production = base_cost * 0.10
    labor      = base_cost * 0.10
    total      = base_cost + production + labor
    return {
        'area':       round(area, 4),
        'rate':       rate,
        'base_cost':  round(base_cost, 2),
        'production': round(production, 2),
        'labor':      round(labor, 2),
        'total':      round(total, 2),
    }


# ── Public Views ─────────────────────────────────────────────────────────────
def landing_view(request):
    return render(request, 'index.html')

def login_view(request):
    if request.method == 'POST':
        u    = request.POST.get('username')
        p    = request.POST.get('password')
        user = authenticate(request, username=u, password=p)
        if user:
            login(request, user)
            return redirect('dashboard')
        messages.error(request, 'Invalid username or password.')
    return render(request, 'login.html')

def signup_view(request):
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        e = request.POST.get('email')
        n = request.POST.get('name')
        if User.objects.filter(username=u).exists():
            messages.error(request, 'Username already exists.')
        else:
            user = User.objects.create_user(username=u, email=e, password=p)
            user.first_name = n
            user.save()
            login(request, user)
            return redirect('dashboard')
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('landing')


# ── Authenticated Views ───────────────────────────────────────────────────────
@login_required
def dashboard_view(request):
    from .models import Design
    designs = Design.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'dashboard.html', {'designs': designs})


@login_required
def calculate_cost_view(request):
    """AJAX endpoint: returns cost breakdown as JSON."""
    if request.method == 'POST':
        data = json.loads(request.body)
        try:
            width    = float(data.get('width', 0))
            height   = float(data.get('height', 0))
            quantity = int(data.get('quantity', 1))
            material = data.get('material', 'aluminium')
        except (ValueError, TypeError):
            return JsonResponse({'error': 'Invalid inputs'}, status=400)

        cost = calculate_cost(width, height, quantity, material)
        return JsonResponse(cost)
    return JsonResponse({'error': 'POST required'}, status=405)


@login_required
def save_design_view(request):
    if request.method == 'POST':
        design_type = request.POST.get('type', 'window')
        typology    = request.POST.get('typology', '')
        material    = request.POST.get('material', 'aluminium')
        try:
            width    = float(request.POST.get('width', 0))
            height   = float(request.POST.get('height', 0))
            quantity = int(request.POST.get('quantity', 1))
        except ValueError:
            width = height = 0.0
            quantity = 1

        cost = calculate_cost(width, height, quantity, material)

        from .models import Design
        Design.objects.create(
            user=request.user,
            type=design_type,
            typology=typology,
            width=width,
            height=height,
            quantity=quantity,
            material=material,
            total_cost=cost['total'],
        )
        messages.success(request, f'Design saved — Total Cost: ₹{cost["total"]:,.2f}')
        return redirect('dashboard')
    return redirect('dashboard')


@login_required
def export_pdf_view(request, design_id):
    """Generate and serve a PDF quotation for a saved design."""
    from .models import Design
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

    design = get_object_or_404(Design, id=design_id, user=request.user)
    cost   = calculate_cost(design.width, design.height, design.quantity, design.material)

    buffer   = io.BytesIO()
    doc      = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=20*mm, leftMargin=20*mm,
        topMargin=18*mm, bottomMargin=18*mm
    )

    styles = getSampleStyleSheet()
    BLUE   = colors.HexColor('#1a73e8')
    DARK   = colors.HexColor('#0f172a')
    GREY   = colors.HexColor('#64748b')
    LIGHT  = colors.HexColor('#f8fafc')
    BORDER = colors.HexColor('#e2e8f0')

    def H(text, size=22, color=DARK, align=TA_LEFT, bold=True):
        return Paragraph(text, ParagraphStyle(
            'h', parent=styles['Normal'], fontSize=size,
            textColor=color, alignment=align,
            fontName='Helvetica-Bold' if bold else 'Helvetica',
            spaceAfter=2
        ))

    def P(text, size=9, color=GREY, align=TA_LEFT):
        return Paragraph(text, ParagraphStyle(
            'p', parent=styles['Normal'], fontSize=size,
            textColor=color, alignment=align, fontName='Helvetica',
            spaceAfter=3
        ))

    story = []

    # ── Header ──────────────────────────────────────────────
    story.append(H('FabriCAD', 26, BLUE))
    story.append(P('Window & Door Fabrication Suite', 10, GREY))
    story.append(HRFlowable(width='100%', thickness=1, color=BLUE, spaceAfter=6))

    story.append(H('QUOTATION', 18, DARK))
    story.append(P(f'Ref: FAB-{design.id:04d}  |  Date: {date.today().strftime("%d %b %Y")}', 9, GREY))
    story.append(Spacer(1, 6*mm))

    # ── Client / Project Info ────────────────────────────────
    info_data = [
        ['Client', design.user.get_full_name() or design.user.username,
         'Project Ref', f'FAB-{design.id:04d}'],
        ['Username', design.user.username, 'Date', date.today().strftime('%d %b %Y')],
    ]
    info_tbl = Table(info_data, colWidths=[35*mm, 70*mm, 30*mm, 40*mm])
    info_tbl.setStyle(TableStyle([
        ('FONTNAME',  (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME',  (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME',  (2,0), (2,-1), 'Helvetica-Bold'),
        ('FONTSIZE',  (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (0,-1), DARK),
        ('TEXTCOLOR', (2,0), (2,-1), DARK),
        ('TEXTCOLOR', (1,0), (1,-1), GREY),
        ('TEXTCOLOR', (3,0), (3,-1), GREY),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 5*mm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=5))

    # ── Design Specification ─────────────────────────────────
    story.append(H('Design Specification', 13))
    story.append(Spacer(1, 2*mm))
    spec_data = [
        ['Parameter', 'Value'],
        ['Type',      design.type.capitalize()],
        ['Typology',  design.typology.replace('-', ' ').title()],
        ['Width',     f'{design.width:.0f} mm'],
        ['Height',    f'{design.height:.0f} mm'],
        ['Quantity',  str(design.quantity)],
        ['Material',  design.material.capitalize()],
        ['Area (per unit)', f'{cost["area"]:.4f} m²'],
    ]
    spec_tbl = Table(spec_data, colWidths=[60*mm, 115*mm])
    spec_tbl.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), BLUE),
        ('TEXTCOLOR',    (0,0), (-1,0), colors.white),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 9),
        ('FONTNAME',     (0,1), (0,-1), 'Helvetica-Bold'),
        ('BACKGROUND',   (0,1), (-1,-1), LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT]),
        ('GRID',         (0,0), (-1,-1), 0.4, BORDER),
        ('TOPPADDING',   (0,0), (-1,-1), 5),
        ('BOTTOMPADDING',(0,0), (-1,-1), 5),
        ('LEFTPADDING',  (0,0), (-1,-1), 8),
    ]))
    story.append(spec_tbl)
    story.append(Spacer(1, 5*mm))

    # ── BOQ Table ────────────────────────────────────────────
    story.append(H('Bill of Quantities (BOQ)', 13))
    story.append(Spacer(1, 2*mm))

    # Derive BOQ rows from geometry (in mm)
    W, H_ = design.width, design.height
    boq_rows = [
        ['#', 'Component', 'Dimension (mm)', 'Qty', 'Est. Area/Length'],
        ['1', 'Outer Frame – Top Rail',    f'{W:.0f} × 60',  str(design.quantity), f'{W/1000:.2f} m'],
        ['2', 'Outer Frame – Bottom Rail', f'{W:.0f} × 60',  str(design.quantity), f'{W/1000:.2f} m'],
        ['3', 'Outer Frame – Left Jamb',   f'{H_:.0f} × 60', str(design.quantity), f'{H_/1000:.2f} m'],
        ['4', 'Outer Frame – Right Jamb',  f'{H_:.0f} × 60', str(design.quantity), f'{H_/1000:.2f} m'],
        ['5', 'Glass Panel',               f'{W-80:.0f} × {H_-80:.0f}',
                                           str(design.quantity),
                                           f'{((W-80)*(H_-80)/1e6):.4f} m²'],
        ['6', 'Frame Material', design.material.capitalize(),
                                str(design.quantity),
                                f'{cost["area"]:.4f} m²'],
    ]
    boq_tbl = Table(boq_rows, colWidths=[12*mm, 55*mm, 40*mm, 15*mm, 40*mm])
    boq_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), DARK),
        ('TEXTCOLOR',     (0,0), (-1,0), colors.white),
        ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0,0), (-1,-1), 8),
        ('FONTNAME',      (0,1), (0,-1), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [colors.white, LIGHT]),
        ('GRID',          (0,0), (-1,-1), 0.4, BORDER),
        ('ALIGN',         (2,0), (-1,-1), 'CENTER'),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
    ]))
    story.append(boq_tbl)
    story.append(Spacer(1, 5*mm))

    # ── Cost Breakdown ───────────────────────────────────────
    story.append(H('Cost Breakdown', 13))
    story.append(Spacer(1, 2*mm))
    cost_data = [
        ['Description',           'Amount (₹)'],
        ['Material Rate',         f'₹{cost["rate"]} / m²'],
        ['Area × Rate × Qty',     f'₹{cost["base_cost"]:,.2f}'],
        ['Production Cost (10%)', f'₹{cost["production"]:,.2f}'],
        ['Labour Cost (10%)',     f'₹{cost["labor"]:,.2f}'],
        ['TOTAL COST',            f'₹{cost["total"]:,.2f}'],
    ]
    cost_tbl = Table(cost_data, colWidths=[115*mm, 60*mm])
    cost_tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),  (-1,0),  colors.HexColor('#334155')),
        ('TEXTCOLOR',     (0,0),  (-1,0),  colors.white),
        ('FONTNAME',      (0,0),  (-1,0),  'Helvetica-Bold'),
        ('FONTSIZE',      (0,0),  (-1,-1), 9),
        ('ROWBACKGROUNDS',(0,1),  (-1,-2), [colors.white, LIGHT]),
        ('BACKGROUND',    (0,-1), (-1,-1), BLUE),
        ('TEXTCOLOR',     (0,-1), (-1,-1), colors.white),
        ('FONTNAME',      (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('GRID',          (0,0),  (-1,-1), 0.4, BORDER),
        ('ALIGN',         (1,0),  (1,-1),  'RIGHT'),
        ('TOPPADDING',    (0,0),  (-1,-1), 6),
        ('BOTTOMPADDING', (0,0),  (-1,-1), 6),
        ('LEFTPADDING',   (0,0),  (-1,-1), 8),
        ('RIGHTPADDING',  (1,0),  (1,-1),  8),
    ]))
    story.append(cost_tbl)
    story.append(Spacer(1, 8*mm))

    # ── Footer ───────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=BORDER))
    story.append(Spacer(1, 3*mm))
    story.append(P(
        'This quotation is valid for 30 days from the date of issue. '
        'Prices are subject to change upon final measurement and site conditions. '
        'GST applicable as per prevailing government rates.',
        8, GREY, TA_CENTER
    ))
    story.append(P('FabriCAD — Precision Fabrication Software', 8, BLUE, TA_CENTER))

    doc.build(story)
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="FabriCAD_Quotation_FAB-{design.id:04d}.pdf"'
    return response
