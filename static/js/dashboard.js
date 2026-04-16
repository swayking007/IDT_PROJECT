document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Dynamic Project Arrays
    renderProjects();
    
    // 2. Initialize Profile Management
    initProfileManagement();

    // 3. Sidebar Navigation Logic
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-view]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = e.currentTarget.getAttribute('data-view');
            switchView(viewId);
            if (window.innerWidth < 768) {
                document.getElementById('sidebar').classList.remove('show');
                document.getElementById('sidebarOverlay').classList.remove('show');
            }
        });
    });

    // 4. Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebarOverlay && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }

    // 5. Modal Triggers
    document.getElementById('btnSave').addEventListener('click', () => {
        new bootstrap.Modal(document.getElementById('saveModal')).show();
    });
    document.getElementById('btnExport').addEventListener('click', () => {
        new bootstrap.Modal(document.getElementById('exportModal')).show();
    });

    // 6. Generate button — clean addEventListener, no inline onclick needed
    const genBtn = document.getElementById('generate-btn');
    if (genBtn) {
        genBtn.addEventListener('click', generateDesign);
    }
});

// ==========================================
// VIEW SWITCHING LOGIC
// ==========================================
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    const targetView = document.getElementById('view' + viewId.charAt(0).toUpperCase() + viewId.slice(1));
    if (targetView) {
        targetView.style.display = 'block';
        setTimeout(() => targetView.classList.add('active'), 10);
    }

    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar-link[data-view="${viewId}"]`);
    if (activeLink) activeLink.classList.add('active');

    const titles = {
        'dashboard': 'Dashboard',
        'workspace': 'Design Workspace',
        'projects': 'Saved Projects',
        'quotations': 'Quotations',
        'boq': 'BOQ Reports',
        'cutting': 'Cutting Optimization'
    };
    document.getElementById('topbarTitle').innerText = titles[viewId] || 'Workspace';

    const isWorkspace = (viewId === 'workspace');
    document.getElementById('topbarProject').style.display = isWorkspace ? 'flex' : 'none';
    document.getElementById('btnSave').style.display = isWorkspace ? 'inline-flex' : 'none';
    document.getElementById('btnExport').style.display = isWorkspace ? 'inline-flex' : 'none';

    if (!isWorkspace) {
        document.getElementById('outputSection').style.display = 'none';
    }
}

// ==========================================
// WORKSPACE ACTIONS
// ==========================================
window.openProjectInWorkspace = function(name, code, type, width, height, qty) {
    document.getElementById('currentProjectName').innerText = name;
    document.getElementById('saveProjectName').value = name;
    document.getElementById('inputWindowCode').value = code;

    const typeSelect = document.getElementById('inputTypology');
    for (let i = 0; i < typeSelect.options.length; i++) {
        if (typeSelect.options[i].text.toLowerCase().includes(type.toLowerCase())) {
            typeSelect.selectedIndex = i;
            break;
        }
    }

    document.getElementById('inputWidth').value = width;
    document.getElementById('inputHeight').value = height;
    document.getElementById('inputQuantity').value = qty;

    switchView('workspace');
    generateDesign();
};

window.resetForm = function() {
    document.getElementById('inputWidth').value = '1800';
    document.getElementById('inputHeight').value = '1500';
    document.getElementById('inputQuantity').value = '1';
    document.getElementById('inputTypology').selectedIndex = 0;
    document.getElementById('inputFrameMaterial').selectedIndex = 0;
    document.getElementById('inputFinish').selectedIndex = 0;

    document.getElementById('outputSection').style.display = 'none';
    document.getElementById('cadEmptyState').style.display = 'flex';
    document.getElementById('cadActiveState').style.display = 'none';
};

// ==========================================
// CAD PREVIEW & DATA BINDING LOGIC
// ==========================================
window.generateDesign = function() {
    console.log('[FabriCAD] generateDesign() called');

    const emptyState = document.getElementById('cadEmptyState');
    const activeState = document.getElementById('cadActiveState');
    if (emptyState) emptyState.style.display = 'none';
    if (activeState) activeState.style.display = 'flex';

    const width  = parseInt(document.getElementById('inputWidth').value)  || 1000;
    const height = parseInt(document.getElementById('inputHeight').value) || 1000;
    const typology   = document.getElementById('inputTypology').value;
    const materialObj = document.getElementById('inputFrameMaterial');
    const finishObj   = document.getElementById('inputFinish');
    const glassObj    = document.getElementById('inputGlassType');
    const meshVal     = document.getElementById('inputMesh').value;

    // Update right-hand Properties panel
    document.getElementById('propMaterial').innerText  = materialObj.options[materialObj.selectedIndex].text;
    document.getElementById('propFinish').innerText    = finishObj.options[finishObj.selectedIndex].text;
    document.getElementById('propGlassType').innerText = glassObj.options[glassObj.selectedIndex].text;
    document.getElementById('propMesh').innerText      = meshVal === 'yes' ? 'Yes (Fiberglass)' : 'No';

    const area = ((width * height) / 1_000_000).toFixed(2);
    document.getElementById('propGlassArea').innerText = `${area} m²`;

    const colorMap = {
        'natural-anodized':  '#a8a8a8',
        'powder-coat-white': '#f0f0f0',
        'powder-coat-black': '#2d2d2d',
        'powder-coat-grey':  '#6c757d',
        'wood-grain':        '#8b5a2b'
    };
    const frameColor = colorMap[finishObj.value] || '#64748b';
    document.getElementById('propColorSwatch').style.background = frameColor;

    document.getElementById('statusDimensions').innerText = `${width} × ${height} mm`;
    document.getElementById('statusType').innerText =
        document.getElementById('inputTypology').options[document.getElementById('inputTypology').selectedIndex].text;

    const designType = document.getElementById('inputDesignType').value;
    console.log('[FabriCAD] Rendering:', { designType, typology, width, height, frameColor });

    renderCAD(designType, typology, width, height, frameColor);
};

// ==========================================
// TYPOLOGY DROPDOWN UPDATE
// ==========================================
window.updateTypologyOptions = function() {
    const designType = document.getElementById('inputDesignType').value;
    const sel = document.getElementById('inputTypology');
    sel.innerHTML = '';

    const opts = designType === 'window'
        ? [{ v: 'sliding', t: 'Sliding' }, { v: 'casement', t: 'Casement' }, { v: 'tilt-turn', t: 'Tilt & Turn' }]
        : [{ v: 'swing',   t: 'Swing'   }, { v: 'sliding',  t: 'Sliding Door' }, { v: 'folding', t: 'Folding Door' }];

    opts.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.v;
        opt.text  = o.t;
        sel.appendChild(opt);
    });

    generateDesign();
};

// ==========================================
// DOM-BASED CAD RENDERER  (100% inline styles)
// ==========================================
function renderCAD(designType, typology, w, h, frameColor) {
    const canvas = document.getElementById('cadCanvas');
    if (!canvas) { console.error('[FabriCAD] cadCanvas not found'); return; }
    canvas.innerHTML = '';

    // ── Size calculation ──────────────────────────────────
    const availW = Math.max((canvas.clientWidth  || 700) - 130, 200);
    const availH = Math.max((canvas.clientHeight || 480) - 130, 150);
    const aspect = (w || 1) / (h || 1);
    let dW = availW, dH = dW / aspect;
    if (dH > availH) { dH = availH; dW = dH * aspect; }
    dW = Math.round(dW); dH = Math.round(dH);

    const GLASS  = 'rgba(186,230,253,0.55)';
    const SASH   = '#475569';
    const FRAME  = 10;   // outer border px
    const PANEL  = 3;    // inner sash border px

    // ── Outer Wrapper ─────────────────────────────────────
    const wrap = el('div', {
        position: 'relative',
        width: dW + 'px',
        height: dH + 'px',
        flexShrink: '0',
        margin: '45px 65px 45px 25px'
    });

    // ── Outer Frame ───────────────────────────────────────
    const frame = el('div', {
        position: 'absolute',
        inset: '0',
        border: `${FRAME}px solid ${frameColor}`,
        background: GLASS,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
        boxShadow: `inset 0 0 12px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.22)`
    });

    // ── Panel factory ─────────────────────────────────────
    function makePanel(label, handleSide, lineKind) {
        const p = el('div', {
            flex: '1',
            border: `${PANEL}px solid ${SASH}`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px',
            boxSizing: 'border-box',
            overflow: 'hidden'
        });

        // SVG opening-indicator lines
        if (lineKind) {
            const ns  = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            Object.assign(svg.style, {
                position: 'absolute', inset: '0',
                width: '100%', height: '100%',
                pointerEvents: 'none'
            });
            svg.setAttribute('viewBox', '0 0 100 100');
            svg.setAttribute('preserveAspectRatio', 'none');

            const lineAttr = {
                stroke: '#7fa8c4',
                'stroke-width': '1.8',
                'stroke-dasharray': '8,5',
                'vector-effect': 'non-scaling-stroke'
            };
            function mkLine(x1,y1,x2,y2) {
                const ln = document.createElementNS(ns,'line');
                Object.entries({x1,y1,x2,y2,...lineAttr}).forEach(([k,v])=>ln.setAttribute(k,v));
                svg.appendChild(ln);
            }

            if (lineKind === 'casement') {
                // hinge left → opens right: V-shape pointing right
                mkLine(0, 0, 100, 50);
                mkLine(0, 100, 100, 50);
            } else if (lineKind === 'tilt') {
                // tilt top: V-shape pointing down
                mkLine(0, 0,  50, 100);
                mkLine(100, 0, 50, 100);
            } else if (lineKind === 'swing') {
                // quarter-circle arc showing swing path
                const path = document.createElementNS(ns, 'path');
                Object.assign({}, lineAttr);
                path.setAttribute('d', 'M 0,0 L 95,0 A 95,95 0 0,1 0,95 Z');
                path.setAttribute('fill', 'rgba(186,230,253,0.2)');
                path.setAttribute('stroke', '#7fa8c4');
                path.setAttribute('stroke-width', '1.8');
                path.setAttribute('stroke-dasharray', '8,5');
                path.setAttribute('vector-effect', 'non-scaling-stroke');
                svg.appendChild(path);
                // hinge line along left edge
                mkLine(0, 0, 0, 100);
            }
            p.appendChild(svg);
        }

        // Handle bar
        if (handleSide) {
            const hnd = el('div', {
                position: 'absolute',
                top: '50%', transform: 'translateY(-50%)',
                width: '7px', height: '40px',
                background: 'linear-gradient(180deg,#e2e8f0,#94a3b8)',
                border: '1px solid #64748b',
                borderRadius: '3px',
                [handleSide]: '9px',
                zIndex: '6',
                boxShadow: '1px 1px 4px rgba(0,0,0,0.3)'
            });
            p.appendChild(hnd);
        }

        // Label badge
        if (label) {
            const lbl = el('div', {
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid #94a3b8',
                borderRadius: '3px',
                padding: '2px 8px',
                fontWeight: '700',
                color: '#0f172a',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                letterSpacing: '0.04em',
                zIndex: '7',
                pointerEvents: 'none'
            });
            lbl.textContent = label;
            p.appendChild(lbl);
        }
        return p;
    }

    // ── Assemble panels by type + typology ────────────────
    if (designType === 'window') {
        if (typology === 'sliding') {
            frame.appendChild(makePanel('L1', 'right', null));
            frame.appendChild(makePanel('L2', 'left',  null));
        } else if (typology === 'casement') {
            frame.appendChild(makePanel(null, 'left', 'casement'));
        } else if (typology === 'tilt-turn') {
            frame.appendChild(makePanel(null, 'right', 'tilt'));
        } else {
            frame.appendChild(makePanel('L1', null, null));
        }
    } else {  // door
        if (typology === 'swing') {
            frame.appendChild(makePanel(null, 'right', 'swing'));
        } else if (typology === 'sliding') {
            frame.appendChild(makePanel('L1', 'right', null));
            frame.appendChild(makePanel('L2', 'left',  null));
        } else if (typology === 'folding') {
            [1, 2, 3].forEach(i => frame.appendChild(makePanel('L' + i, i === 3 ? 'right' : null, null)));
        } else {
            frame.appendChild(makePanel('L1', 'right', 'swing'));
        }
    }

    wrap.appendChild(frame);

    // ── Dimension annotations ─────────────────────────────
    // Top bar (width)
    wrap.appendChild(tick({ top:'-9px',  left:'0',  width:'100%', height:'1px' }));
    wrap.appendChild(tick({ top:'-14px', left:'0',  width:'1px',  height:'9px' }));
    wrap.appendChild(tick({ top:'-14px', right:'0', width:'1px',  height:'9px' }));
    const wLbl = el('div', {
        position:'absolute', top:'-27px', left:'50%',
        transform:'translateX(-50%)',
        fontWeight:'700', fontSize:'0.68rem', fontFamily:'monospace',
        color:'#334155', whiteSpace:'nowrap'
    });
    wLbl.textContent = `W = ${w} mm`;
    wrap.appendChild(wLbl);

    // Right bar (height)
    wrap.appendChild(tick({ top:'0',    right:'-9px',  width:'1px',  height:'100%' }));
    wrap.appendChild(tick({ top:'0',    right:'-14px', width:'9px',  height:'1px'  }));
    wrap.appendChild(tick({ bottom:'0', right:'-14px', width:'9px',  height:'1px'  }));
    const hLbl = el('div', {
        position:'absolute', right:'-58px', top:'50%',
        transform:'translateY(-50%) rotate(90deg)',
        transformOrigin:'center center',
        fontWeight:'700', fontSize:'0.68rem', fontFamily:'monospace',
        color:'#334155', whiteSpace:'nowrap'
    });
    hLbl.textContent = `H = ${h} mm`;
    wrap.appendChild(hLbl);

    // ── Type badge ────────────────────────────────────────
    const badge = el('div', {
        position:'absolute', bottom:'-32px', left:'50%',
        transform:'translateX(-50%)',
        background:'#0f172a', color:'#94a3b8',
        fontSize:'0.65rem', fontWeight:'700', fontFamily:'monospace',
        padding:'3px 13px', borderRadius:'100px',
        whiteSpace:'nowrap', letterSpacing:'0.08em'
    });
    badge.textContent = designType.toUpperCase() + '  ·  ' + typology.replace(/-/g,' ').toUpperCase();
    wrap.appendChild(badge);

    canvas.appendChild(wrap);
}

// ── tiny helpers ──────────────────────────────────────────
function el(tag, styles) {
    const d = document.createElement(tag);
    Object.assign(d.style, { position: 'absolute', ...styles });
    return d;
}
function tick(styles) {
    return el('div', { background: '#475569', ...styles });
}

// ==========================================
// OUTPUT REPORTS LOGIC
// ==========================================
window.showOutputSection = function(tabName) {
    document.getElementById('outputSection').style.display = 'block';
    document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (tabName === 'quotation') tabName = 'boq';
    if (tabName === 'cutting')   tabName = 'cutting-report';
    switchOutputTab(tabName);
};

window.switchOutputTab = function(tabId) {
    document.querySelectorAll('.output-tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`.output-tab[data-tab="${tabId}"]`).classList.add('active');
    document.querySelectorAll('.table-container .data-table').forEach(el => el.style.display = 'none');
    const tableMap = { 'boq': 'tableBOQ', 'cutting-report': 'tableCutting' };
    const targetTable = document.getElementById(tableMap[tabId]);
    if (targetTable) {
        targetTable.style.display = 'table';
        document.getElementById('outputRecordCount').innerText =
            targetTable.querySelectorAll('tbody tr').length + ' items';
    }
};

// ==========================================
// EXPORT & PDF GENERATOR
// ==========================================
window.exportToExcel = function() {
    alert('Gathering data... Exporting report to Excel (.xlsx)');
    addNotification('Your Excel (.xlsx) project file has been downloaded successfully.');
};

window.exportToPDF = function() {
    addNotification('Generating PDF... Please wait.');
    const projectName = document.getElementById('currentProjectName').innerText;
    const windowCode  = document.getElementById('inputWindowCode').value;

    if (document.getElementById('cadEmptyState').style.display !== 'none'
        && document.getElementById('cadActiveState').style.display === 'none') {
        alert('Please generate a design first before exporting to PDF.');
        return;
    }

    const previewEl = document.getElementById('cadCanvas');
    const previewHTML = previewEl ? previewEl.innerHTML : '<p>No preview</p>';
    const boqTable = document.getElementById('tableBOQ')
        ? document.getElementById('tableBOQ').outerHTML : '<p>No data generated</p>';

    const element = document.createElement('div');
    element.style.cssText = 'padding:20px;font-family:Arial,sans-serif;color:#333;';
    element.innerHTML = `
        <div style="border-bottom:2px solid #1a73e8;padding-bottom:10px;margin-bottom:20px;">
            <h2 style="margin:0;color:#1a73e8;font-weight:800;">FabriCAD Production Report</h2>
            <p style="margin:5px 0 0;color:#666;">Project: <strong>${projectName}</strong> | Code: <strong>${windowCode}</strong></p>
        </div>
        <div style="margin-bottom:30px;text-align:center;border:1px solid #e2e8f0;padding:20px;border-radius:8px;background:#f8fafc;">
            <h4 style="margin-top:0;margin-bottom:10px;text-align:left;color:#0f172a;">Design Preview</h4>
            <div style="background:#fff;padding:20px;border:1px solid #cbd5e1;">${previewHTML}</div>
        </div>
        <div><h4 style="color:#0f172a;margin-bottom:15px;">Bill of Quantities (BOQ)</h4>${boqTable}</div>
    `;

    const opt = {
        margin: 15,
        filename: `${windowCode}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => {
        addNotification(`PDF (${windowCode}_Report.pdf) downloaded successfully.`);
    });
};

// ==========================================
// AUTHENTICATION & PROFILE LOGIC
// ==========================================
function initProfileManagement() {
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));

    document.getElementById('btnProfile').addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem('fabricad_user') || '{}');
        document.getElementById('profileName').value    = user.name    || '';
        document.getElementById('profileCompany').value = user.company || '';
        document.getElementById('profileUsername').value = user.username || '';
        profileModal.show();
    });

    document.getElementById('btnSaveProfile').addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem('fabricad_user') || '{}');
        user.name    = document.getElementById('profileName').value;
        user.company = document.getElementById('profileCompany').value;
        localStorage.setItem('fabricad_user', JSON.stringify(user));
        profileModal.hide();
        addNotification('Profile updated successfully.');
    });
}

// ==========================================
// NOTIFICATION LOGIC
// ==========================================
function addNotification(message) {
    const notifList = document.getElementById('notificationList');
    const noNotifs  = document.getElementById('noNotifs');
    if (noNotifs) noNotifs.style.display = 'none';

    const li = document.createElement('li');
    li.innerHTML = `
        <a class="dropdown-item" href="#" style="font-size:0.85rem;white-space:normal;padding:0.75rem 1rem;border-bottom:1px solid var(--border-light);">
            <div class="d-flex align-items-start gap-2">
                <i class="bi bi-info-circle-fill text-primary mt-1"></i>
                <div>
                    <div style="font-weight:500;color:var(--text-primary);">${message}</div>
                    <div class="text-muted" style="font-size:0.7rem;margin-top:4px;">Just now</div>
                </div>
            </div>
        </a>`;
    notifList.insertBefore(li, notifList.children[2]);

    const dotBtn = document.getElementById('btnNotifications');
    if (dotBtn) dotBtn.classList.add('notification-dot');
}

// ==========================================
// DYNAMIC PROJECT MANAGEMENT
// ==========================================
let projectsData = JSON.parse(localStorage.getItem('fabricad_projects')) || [
    { id: 1, name: 'Villa Azure Windows',      code: 'WND-2024-001', type: 'Sliding',  width: 1800, height: 1500, qty: 3, time: '2h ago',  icon: 'bi-window',    color: '',              bg: '' },
    { id: 2, name: 'Cedar Heights Doors',      code: 'DOR-2024-003', type: 'Casement', width: 900,  height: 2100, qty: 6, time: '1d ago',  icon: 'bi-door-open', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
    { id: 3, name: 'Marina Bay Curtain Wall',  code: 'CW-2024-007',  type: 'Fixed',    width: 3000, height: 2400, qty: 2, time: '3d ago',  icon: 'bi-grid-3x3',  color: '#7c4dff',        bg: 'rgba(124,77,255,0.1)' }
];

function saveProjectsData() {
    localStorage.setItem('fabricad_projects', JSON.stringify(projectsData));
}

window.renderProjects = function() {
    const recentContainer     = document.getElementById('recentProjectsList');
    const savedContainer      = document.getElementById('savedProjectsList');
    const dashboardTotalCount = document.getElementById('dashStatTotal');

    let html = '';
    if (projectsData.length === 0) {
        html = `<div class="p-4 text-center text-muted" style="font-size:0.9rem;">No projects found. Create a new design!</div>`;
    } else {
        projectsData.forEach(p => {
            html += `
            <div class="project-list-item">
              <div class="project-info" onclick="openProjectInWorkspace('${p.name}','${p.code}','${p.type}','${p.width}','${p.height}','${p.qty}')" style="cursor:pointer;flex:1;">
                <div class="project-thumb" style="background:${p.bg||''};color:${p.color||''};"><i class="bi ${p.icon||'bi-window'}"></i></div>
                <div>
                  <div class="project-name">${p.name}</div>
                  <div class="project-meta">${p.code} · ${p.type} · Modified ${p.time}</div>
                </div>
              </div>
              <div class="project-actions">
                <button class="project-action-btn" title="Edit"      onclick="openProjectInWorkspace('${p.name}','${p.code}','${p.type}','${p.width}','${p.height}','${p.qty}')"><i class="bi bi-pencil"></i></button>
                <button class="project-action-btn" title="Duplicate" onclick="duplicateProject(${p.id})"><i class="bi bi-copy"></i></button>
                <button class="project-action-btn danger" title="Delete" onclick="deleteProject(${p.id})"><i class="bi bi-trash3"></i></button>
              </div>
            </div>`;
        });
    }

    if (recentContainer)     recentContainer.innerHTML = html;
    if (savedContainer)      savedContainer.innerHTML  = html;
    if (dashboardTotalCount) dashboardTotalCount.innerText = projectsData.length;
};

window.duplicateProject = function(id) {
    const proj = projectsData.find(p => p.id === id);
    if (proj) {
        projectsData.unshift({ ...proj, id: Date.now(), name: proj.name + ' (Copy)', time: 'just now' });
        saveProjectsData(); renderProjects();
        addNotification(`Project "${proj.name}" duplicated.`);
    }
};

window.deleteProject = function(id) {
    const proj = projectsData.find(p => p.id === id);
    if (proj && confirm(`Delete "${proj.name}"?`)) {
        projectsData = projectsData.filter(p => p.id !== id);
        saveProjectsData(); renderProjects();
        addNotification('Project deleted.');
    }
};

window.saveProject = function() {
    const newName  = document.getElementById('saveProjectName').value;
    const code     = document.getElementById('inputWindowCode').value;
    const typeSelect = document.getElementById('inputTypology');
    const type     = typeSelect.options[typeSelect.selectedIndex].text.split(' ')[0];
    const width    = document.getElementById('inputWidth').value;
    const height   = document.getElementById('inputHeight').value;
    const qty      = document.getElementById('inputQuantity').value;

    document.getElementById('currentProjectName').innerText = newName;

    projectsData.unshift({
        id: Date.now(), name: newName, code, type, width, height, qty,
        time: 'just now',
        icon: type.toLowerCase().includes('door') ? 'bi-door-open' : 'bi-window',
        color: '', bg: ''
    });
    saveProjectsData(); renderProjects();
    addNotification(`Project "${newName}" saved successfully!`);
};