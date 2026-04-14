/* ===== DASHBOARD JS ===== */

// ===== SIDEBAR NAVIGATION =====
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-view]');
const viewSections = {
  dashboard: document.getElementById('viewDashboard'),
  workspace: document.getElementById('viewWorkspace'),
  projects: document.getElementById('viewProjects'),
  quotations: document.getElementById('viewQuotations'),
  boq: document.getElementById('viewBOQ'),
  cutting: document.getElementById('viewCutting'),
};

function switchView(viewName) {
  // Hide all views
  Object.values(viewSections).forEach(v => {
    if (v) {
      v.style.display = 'none';
      v.classList.remove('active');
    }
  });

  // Show target view
  const targetView = viewSections[viewName];
  if (targetView) {
    if (viewName === 'workspace') {
      targetView.style.display = 'grid';
    } else {
      targetView.style.display = 'block';
    }
    targetView.classList.add('active');
  }

  // Update sidebar active state
  sidebarLinks.forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar-link[data-view="${viewName}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Update topbar
  const titles = {
    dashboard: 'Dashboard',
    workspace: 'Design Workspace',
    projects: 'Saved Projects',
    quotations: 'Quotations',
    boq: 'BOQ Reports',
    cutting: 'Cutting Optimization',
  };
  document.getElementById('topbarTitle').textContent = titles[viewName] || 'Dashboard';

  // Toggle workspace-specific buttons
  const isWorkspace = viewName === 'workspace';
  document.getElementById('btnSave').style.display = isWorkspace ? '' : 'none';
  document.getElementById('btnExport').style.display = isWorkspace ? '' : 'none';
  document.getElementById('topbarProject').style.display = isWorkspace ? '' : 'none';

  // Show/hide output section
  if (viewName !== 'workspace') {
    document.getElementById('outputSection').style.display = 'none';
  }

  // Draw CAD preview if workspace
  if (viewName === 'workspace') {
    updateCADPreview();
  }

  // Close sidebar on mobile
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.remove('open');
}

sidebarLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const view = link.getAttribute('data-view');
    switchView(view);
  });
});

// ===== SIDEBAR TOGGLE (Mobile) =====
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

sidebarOverlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
});

// ===== SAVE & EXPORT BUTTONS =====
document.getElementById('btnSave').addEventListener('click', () => {
  const modal = new bootstrap.Modal(document.getElementById('saveModal'));
  modal.show();
});

document.getElementById('btnExport').addEventListener('click', () => {
  const modal = new bootstrap.Modal(document.getElementById('exportModal'));
  modal.show();
});

// ===== CAD WINDOW DRAWING =====
function updateCADPreview() {
  const width = parseInt(document.getElementById('inputWidth').value) || 1800;
  const height = parseInt(document.getElementById('inputHeight').value) || 1500;
  const typology = document.getElementById('inputTypology').value;
  const glassType = document.getElementById('inputGlassType').value;
  const mesh = document.getElementById('inputMesh').value;

  // Update status bar
  document.getElementById('statusDimensions').textContent = `${width} × ${height} mm`;
  document.getElementById('statusType').textContent = typology.charAt(0).toUpperCase() + typology.slice(1).replace('-', ' & ');

  // Update properties panel
  updateProperties(width, height, typology, glassType, mesh);

  // Draw SVG
  drawWindow(width, height, typology);
}

function drawWindow(width, height, typology) {
  const svg = document.getElementById('windowSVG');
  const svgWidth = 800;
  const svgHeight = 600;

  // Scale factor
  const maxDim = Math.max(width, height);
  const scale = Math.min(480 / maxDim, 380 / maxDim);
  const drawW = width * scale;
  const drawH = height * scale;
  const offsetX = (svgWidth - drawW) / 2;
  const offsetY = (svgHeight - drawH) / 2 + 10;

  let svgContent = '';

  // Background grid pattern
  svgContent += `<defs>
    <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#smallGrid)" opacity="0.5"/>`;

  // Outer frame
  const frameThick = 12;
  svgContent += `<rect x="${offsetX}" y="${offsetY}" width="${drawW}" height="${drawH}" 
    fill="none" stroke="#475569" stroke-width="3" rx="2"/>`;

  // Inner frame
  svgContent += `<rect x="${offsetX + frameThick}" y="${offsetY + frameThick}" 
    width="${drawW - frameThick * 2}" height="${drawH - frameThick * 2}" 
    fill="none" stroke="#64748b" stroke-width="1.5"/>`;

  // Draw typology-specific elements
  const innerX = offsetX + frameThick;
  const innerY = offsetY + frameThick;
  const innerW = drawW - frameThick * 2;
  const innerH = drawH - frameThick * 2;

  if (typology === 'sliding') {
    // Two-panel sliding window
    const panelW = innerW / 2;

    // Panel divider (interlock)
    svgContent += `<line x1="${innerX + panelW}" y1="${innerY}" 
      x2="${innerX + panelW}" y2="${innerY + innerH}" 
      stroke="#475569" stroke-width="3"/>`;

    // Glass panels with gradient
    svgContent += `<rect x="${innerX + 4}" y="${innerY + 4}" 
      width="${panelW - 7}" height="${innerH - 8}" 
      fill="#dbeafe" fill-opacity="0.4" stroke="#93c5fd" stroke-width="0.5" rx="1"/>`;
    svgContent += `<rect x="${innerX + panelW + 3}" y="${innerY + 4}" 
      width="${panelW - 7}" height="${innerH - 8}" 
      fill="#dbeafe" fill-opacity="0.4" stroke="#93c5fd" stroke-width="0.5" rx="1"/>`;

    // Sliding arrows
    svgContent += `<text x="${innerX + panelW / 2}" y="${innerY + innerH / 2}" 
      text-anchor="middle" fill="#94a3b8" font-size="18">◄►</text>`;

    // Panel labels
    svgContent += `<text x="${innerX + panelW / 2}" y="${innerY + innerH + 28}" 
      text-anchor="middle" fill="#64748b" font-size="12" font-family="Inter, sans-serif" font-weight="600">L1 – Fixed</text>`;
    svgContent += `<text x="${innerX + panelW + panelW / 2}" y="${innerY + innerH + 28}" 
      text-anchor="middle" fill="#64748b" font-size="12" font-family="Inter, sans-serif" font-weight="600">L2 – Sliding</text>`;

    // Track lines at bottom
    svgContent += `<line x1="${offsetX}" y1="${offsetY + drawH - 4}" 
      x2="${offsetX + drawW}" y2="${offsetY + drawH - 4}" 
      stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,3"/>`;

  } else if (typology === 'casement') {
    // Single casement with hinge marks
    svgContent += `<rect x="${innerX + 4}" y="${innerY + 4}" 
      width="${innerW - 8}" height="${innerH - 8}" 
      fill="#dbeafe" fill-opacity="0.4" stroke="#93c5fd" stroke-width="0.5" rx="1"/>`;

    // Hinge marks (left side)
    for (let i = 0; i < 3; i++) {
      const hy = innerY + (innerH / 4) * (i + 0.5);
      svgContent += `<rect x="${innerX - 2}" y="${hy}" width="8" height="12" 
        fill="#475569" rx="1"/>`;
    }

    // Handle (right side)
    const handleY = innerY + innerH / 2 - 15;
    svgContent += `<rect x="${innerX + innerW - 8}" y="${handleY}" width="6" height="30" 
      fill="#475569" rx="2"/>`;

    // Opening direction arc
    svgContent += `<path d="M ${innerX + innerW - 20} ${innerY + 20} 
      Q ${innerX + innerW + 40} ${innerY + innerH / 2} ${innerX + innerW - 20} ${innerY + innerH - 20}" 
      fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="5,5"/>`;

    // Label
    svgContent += `<text x="${innerX + innerW / 2}" y="${innerY + innerH + 28}" 
      text-anchor="middle" fill="#64748b" font-size="12" font-family="Inter, sans-serif" font-weight="600">Casement – Opens Right</text>`;

  } else if (typology === 'fixed') {
    // Single fixed panel
    svgContent += `<rect x="${innerX + 4}" y="${innerY + 4}" 
      width="${innerW - 8}" height="${innerH - 8}" 
      fill="#dbeafe" fill-opacity="0.4" stroke="#93c5fd" stroke-width="0.5" rx="1"/>`;

    // Cross pattern for fixed
    svgContent += `<line x1="${innerX}" y1="${innerY}" x2="${innerX + innerW}" y2="${innerY + innerH}" 
      stroke="#cbd5e1" stroke-width="0.5" stroke-dasharray="8,8"/>`;
    svgContent += `<line x1="${innerX + innerW}" y1="${innerY}" x2="${innerX}" y2="${innerY + innerH}" 
      stroke="#cbd5e1" stroke-width="0.5" stroke-dasharray="8,8"/>`;

    // Label
    svgContent += `<text x="${innerX + innerW / 2}" y="${innerY + innerH + 28}" 
      text-anchor="middle" fill="#64748b" font-size="12" font-family="Inter, sans-serif" font-weight="600">Fixed Panel</text>`;

  } else if (typology === 'tilt-turn') {
    // Tilt & Turn
    svgContent += `<rect x="${innerX + 4}" y="${innerY + 4}" 
      width="${innerW - 8}" height="${innerH - 8}" 
      fill="#dbeafe" fill-opacity="0.4" stroke="#93c5fd" stroke-width="0.5" rx="1"/>`;

    // Turn arc (side)
    svgContent += `<path d="M ${innerX + innerW - 20} ${innerY + 20} 
      Q ${innerX + innerW + 40} ${innerY + innerH / 2} ${innerX + innerW - 20} ${innerY + innerH - 20}" 
      fill="none" stroke="#3b82f6" stroke-width="1" stroke-dasharray="5,5"/>`;

    // Tilt arc (top)
    svgContent += `<path d="M ${innerX + 20} ${innerY + 20} 
      Q ${innerX + innerW / 2} ${innerY - 30} ${innerX + innerW - 20} ${innerY + 20}" 
      fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="5,5"/>`;

    // Handle
    const handleY = innerY + innerH / 2 - 15;
    svgContent += `<rect x="${innerX + innerW - 8}" y="${handleY}" width="6" height="30" 
      fill="#475569" rx="2"/>`;

    // Hinges
    for (let i = 0; i < 3; i++) {
      const hy = innerY + (innerH / 4) * (i + 0.5);
      svgContent += `<rect x="${innerX - 2}" y="${hy}" width="8" height="12" 
        fill="#475569" rx="1"/>`;
    }

    svgContent += `<text x="${innerX + innerW / 2}" y="${innerY + innerH + 28}" 
      text-anchor="middle" fill="#64748b" font-size="12" font-family="Inter, sans-serif" font-weight="600">Tilt & Turn</text>`;

  } else if (typology === 'awning') {
    // Awning window
    svgContent += `<rect x="${innerX + 4}" y="${innerY + 4}" 
      width="${innerW - 8}" height="${innerH - 8}" 
      fill="#dbeafe" fill-opacity="0.4" stroke="#93c5fd" stroke-width="0.5" rx="1"/>`;

    // Top hinges
    for (let i = 0; i < 3; i++) {
      const hx = innerX + (innerW / 4) * (i + 0.5);
      svgContent += `<rect x="${hx}" y="${innerY - 2}" width="12" height="8" 
        fill="#475569" rx="1"/>`;
    }

    // Opening arc (bottom)
    svgContent += `<path d="M ${innerX + 20} ${innerY + innerH - 20} 
      Q ${innerX + innerW / 2} ${innerY + innerH + 40} ${innerX + innerW - 20} ${innerY + innerH - 20}" 
      fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="5,5"/>`;

    svgContent += `<text x="${innerX + innerW / 2}" y="${innerY + innerH + 28}" 
      text-anchor="middle" fill="#64748b" font-size="12" font-family="Inter, sans-serif" font-weight="600">Awning – Opens Out</text>`;
  }

  // Dimension lines
  // Top dimension
  const dimY = offsetY - 25;
  svgContent += `<line x1="${offsetX}" y1="${dimY}" x2="${offsetX + drawW}" y2="${dimY}" 
    stroke="#1a73e8" stroke-width="1"/>`;
  svgContent += `<line x1="${offsetX}" y1="${dimY - 6}" x2="${offsetX}" y2="${dimY + 6}" 
    stroke="#1a73e8" stroke-width="1.5"/>`;
  svgContent += `<line x1="${offsetX + drawW}" y1="${dimY - 6}" x2="${offsetX + drawW}" y2="${dimY + 6}" 
    stroke="#1a73e8" stroke-width="1.5"/>`;
  svgContent += `<text x="${offsetX + drawW / 2}" y="${dimY - 8}" 
    text-anchor="middle" fill="#1a73e8" font-size="12" font-family="JetBrains Mono, monospace" font-weight="500">${width}</text>`;

  // Right dimension
  const dimX = offsetX + drawW + 25;
  svgContent += `<line x1="${dimX}" y1="${offsetY}" x2="${dimX}" y2="${offsetY + drawH}" 
    stroke="#1a73e8" stroke-width="1"/>`;
  svgContent += `<line x1="${dimX - 6}" y1="${offsetY}" x2="${dimX + 6}" y2="${offsetY}" 
    stroke="#1a73e8" stroke-width="1.5"/>`;
  svgContent += `<line x1="${dimX - 6}" y1="${offsetY + drawH}" x2="${dimX + 6}" y2="${offsetY + drawH}" 
    stroke="#1a73e8" stroke-width="1.5"/>`;
  svgContent += `<text x="${dimX + 16}" y="${offsetY + drawH / 2 + 4}" 
    text-anchor="start" fill="#1a73e8" font-size="12" font-family="JetBrains Mono, monospace" font-weight="500" 
    transform="rotate(-90, ${dimX + 16}, ${offsetY + drawH / 2})">${height}</text>`;

  // Title block
  svgContent += `<text x="${svgWidth / 2}" y="${svgHeight - 15}" 
    text-anchor="middle" fill="#94a3b8" font-size="11" font-family="Inter, sans-serif">
    ${document.getElementById('inputWindowCode').value || 'WND-2024-015'} | ${width}×${height}mm | ${typology.charAt(0).toUpperCase() + typology.slice(1)} | Scale 1:10
  </text>`;

  svg.innerHTML = svgContent;
}

function updateProperties(width, height, typology, glassType, mesh) {
  const material = document.getElementById('inputFrameMaterial').value;
  const finish = document.getElementById('inputFinish').value;

  // Material
  const materialMap = {
    'aluminium': 'Aluminium',
    'upvc': 'uPVC',
    'wood': 'Wood',
    'steel': 'Steel'
  };
  document.getElementById('propMaterial').textContent = materialMap[material] || material;

  // Series
  const seriesMap = {
    'aluminium': 'S-60',
    'upvc': 'P-70',
    'wood': 'W-85',
    'steel': 'ST-50'
  };
  document.getElementById('propSeries').textContent = seriesMap[material] || 'S-60';

  // Finish
  const finishMap = {
    'natural-anodized': { label: 'Nat. Anodized', color: '#c0c0c0' },
    'powder-coat-white': { label: 'White', color: '#f5f5f5' },
    'powder-coat-black': { label: 'Black', color: '#2d2d2d' },
    'powder-coat-grey': { label: 'Grey', color: '#808080' },
    'wood-grain': { label: 'Wood Grain', color: '#8B6914' },
  };
  const f = finishMap[finish] || finishMap['natural-anodized'];
  document.getElementById('propFinish').textContent = f.label;
  document.getElementById('propColorSwatch').style.background = f.color;

  // Profile thickness depends on material
  if (material === 'aluminium') {
    document.getElementById('propOuterFrame').textContent = '60 × 40 mm';
    document.getElementById('propSash').textContent = '45 × 35 mm';
    document.getElementById('propMullion').textContent = '60 × 30 mm';
    document.getElementById('propWallThickness').textContent = '1.6 mm';
  } else if (material === 'upvc') {
    document.getElementById('propOuterFrame').textContent = '70 × 50 mm';
    document.getElementById('propSash').textContent = '60 × 45 mm';
    document.getElementById('propMullion').textContent = '70 × 40 mm';
    document.getElementById('propWallThickness').textContent = '2.5 mm';
  } else if (material === 'wood') {
    document.getElementById('propOuterFrame').textContent = '85 × 65 mm';
    document.getElementById('propSash').textContent = '70 × 55 mm';
    document.getElementById('propMullion').textContent = '85 × 50 mm';
    document.getElementById('propWallThickness').textContent = '—';
  } else {
    document.getElementById('propOuterFrame').textContent = '50 × 35 mm';
    document.getElementById('propSash').textContent = '40 × 30 mm';
    document.getElementById('propMullion').textContent = '50 × 25 mm';
    document.getElementById('propWallThickness').textContent = '2.0 mm';
  }

  // Glass
  const glassMap = {
    'single': { label: 'SGU 6mm', thickness: '6 mm' },
    'double': { label: 'DGU 6-12-6', thickness: '24 mm' },
    'triple': { label: 'TGU 6-12-6-12-6', thickness: '42 mm' },
    'laminated': { label: 'Lam 6.38mm', thickness: '6.38 mm' },
  };
  const g = glassMap[glassType];
  document.getElementById('propGlassType').textContent = g.label;
  document.getElementById('propGlassThickness').textContent = g.thickness;

  // Calculate glass area
  const glassW = (width - 60) / 1000; // rough estimate
  const glassH = (height - 60) / 1000;
  const area = (glassW * glassH).toFixed(2);
  document.getElementById('propGlassArea').textContent = area + ' m²';

  // Hardware depends on typology
  if (typology === 'sliding') {
    document.getElementById('propLock').textContent = 'Crescent Lock';
    document.getElementById('propRollers').textContent = '2× Tandem';
    document.getElementById('propHandle').textContent = 'D-Handle';
  } else if (typology === 'casement') {
    document.getElementById('propLock').textContent = 'Multi-Point';
    document.getElementById('propRollers').textContent = '—';
    document.getElementById('propHandle').textContent = 'Espag Handle';
  } else if (typology === 'tilt-turn') {
    document.getElementById('propLock').textContent = 'Tilt-Turn Lock';
    document.getElementById('propRollers').textContent = '—';
    document.getElementById('propHandle').textContent = 'T&T Handle';
  } else {
    document.getElementById('propLock').textContent = '—';
    document.getElementById('propRollers').textContent = '—';
    document.getElementById('propHandle').textContent = '—';
  }

  // Mesh
  document.getElementById('propMesh').textContent = mesh === 'yes' ? 'Yes' : 'No';
  if (mesh === 'yes') {
    const meshW = Math.round(width / 2 - 40);
    const meshH = height - 60;
    document.getElementById('propMeshSize').textContent = `${meshW} × ${meshH} mm`;
  } else {
    document.getElementById('propMeshSize').textContent = '—';
  }
}

// ===== OUTPUT SECTION =====
function showOutputSection(tab) {
  const outputSection = document.getElementById('outputSection');
  outputSection.style.display = 'block';
  switchOutputTab(tab === 'quotation' ? 'boq' : tab === 'cutting' ? 'cutting-report' : 'boq');
  outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function switchOutputTab(tabName) {
  // Update tabs
  document.querySelectorAll('.output-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
  });

  // Show/hide tables
  document.getElementById('tableBOQ').style.display = tabName === 'boq' ? '' : 'none';
  document.getElementById('tableGlass').style.display = tabName === 'glass' ? '' : 'none';
  document.getElementById('tableHardware').style.display = tabName === 'hardware' ? '' : 'none';
  document.getElementById('tableCutting').style.display = tabName === 'cutting-report' ? '' : 'none';

  // Update record count
  const counts = { 'boq': 8, 'glass': 3, 'hardware': 7, 'cutting-report': 6 };
  document.getElementById('outputRecordCount').textContent = (counts[tabName] || 0) + ' items';
}

// ===== FORM RESET =====
function resetForm() {
  document.getElementById('inputWindowCode').value = 'WND-2024-015';
  document.getElementById('inputWidth').value = '1800';
  document.getElementById('inputHeight').value = '1500';
  document.getElementById('inputQuantity').value = '4';
  document.getElementById('inputTypology').value = 'sliding';
  document.getElementById('inputGlassType').value = 'double';
  document.getElementById('inputMesh').value = 'yes';
  document.getElementById('inputFrameMaterial').value = 'aluminium';
  document.getElementById('inputFinish').value = 'natural-anodized';
  updateCADPreview();
}

// ===== OPEN PROJECT FROM DASHBOARD =====
function openProjectInWorkspace(name, code, typology, width, height, qty) {
  document.getElementById('currentProjectName').textContent = name;
  document.getElementById('saveProjectName').value = name;
  document.getElementById('inputWindowCode').value = code;
  document.getElementById('inputWidth').value = width;
  document.getElementById('inputHeight').value = height;
  document.getElementById('inputQuantity').value = qty;
  
  const typologyMap = {
    'Sliding': 'sliding',
    'Casement': 'casement',
    'Fixed': 'fixed',
    'Tilt & Turn': 'tilt-turn',
    'Awning': 'awning'
  };
  document.getElementById('inputTypology').value = typologyMap[typology] || 'sliding';
  
  switchView('workspace');
}

// ===== SAVE PROJECT =====
function saveProject() {
  const name = document.getElementById('saveProjectName').value;
  document.getElementById('currentProjectName').textContent = name;
  
  // Show toast notification
  showToast('Project saved successfully!');
}

// ===== EXPORT FUNCTIONS =====
function exportToPDF() {
  showToast('PDF export ready for download.');
}

function exportToExcel() {
  showToast('Excel export ready for download.');
}

// ===== TOAST NOTIFICATION =====
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-size: 0.88rem;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideInToast 0.3s ease;
  `;
  toast.innerHTML = `<i class="bi bi-check-circle-fill" style="color:#10b981;"></i> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add toast animation
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes slideInToast {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(toastStyle);

// ===== INITIAL DRAW =====
// Draw initial CAD preview if on workspace view
document.addEventListener('DOMContentLoaded', () => {
  // Input change listeners for live preview
  const inputs = ['inputWidth', 'inputHeight', 'inputTypology', 'inputGlassType', 
                  'inputMesh', 'inputFrameMaterial', 'inputFinish', 'inputWindowCode'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', updateCADPreview);
      el.addEventListener('input', updateCADPreview);
    }
  });
});
