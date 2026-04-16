document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Dynamic Project Arrays (Do not auto-generate CAD yet)
    renderProjects();
    
    // 2. Initialize Auth, Profile, and Notifications
    initAuthentication();
    initProfileManagement();

    // 3. Sidebar Navigation Logic
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-view]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = e.currentTarget.getAttribute('data-view');
            switchView(viewId);
            
            // Close sidebar on mobile after clicking
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

    if(sidebarToggle && sidebarOverlay && sidebar) {
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
    if(activeLink) activeLink.classList.add('active');

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
    for(let i=0; i < typeSelect.options.length; i++) {
        if(typeSelect.options[i].text.toLowerCase().includes(type.toLowerCase())) {
            typeSelect.selectedIndex = i;
            break;
        }
    }

    document.getElementById('inputWidth').value = width;
    document.getElementById('inputHeight').value = height;
    document.getElementById('inputQuantity').value = qty;

    switchView('workspace');
    updateCADPreview(); // Automatically show CAD since they opened an existing project
};

window.resetForm = function() {
    document.getElementById('inputWidth').value = '1800';
    document.getElementById('inputHeight').value = '1500';
    document.getElementById('inputQuantity').value = '1';
    document.getElementById('inputTypology').selectedIndex = 0;
    document.getElementById('inputFrameMaterial').selectedIndex = 0;
    document.getElementById('inputFinish').selectedIndex = 0;
    
    // Hide Output Section and Active CAD, Show Empty State
    document.getElementById('outputSection').style.display = 'none';
    document.getElementById('cadEmptyState').style.display = 'flex';
    document.getElementById('cadActiveState').style.display = 'none';
};

// ==========================================
// CAD PREVIEW & DATA BINDING LOGIC
// ==========================================
window.updateCADPreview = function() {
    // Hide the empty state and show the active CAD workspace
    document.getElementById('cadEmptyState').style.display = 'none';
    document.getElementById('cadActiveState').style.display = 'flex';

    const width = parseInt(document.getElementById('inputWidth').value) || 1000;
    const height = parseInt(document.getElementById('inputHeight').value) || 1000;
    const type = document.getElementById('inputTypology').value;
    const materialObj = document.getElementById('inputFrameMaterial');
    const finishObj = document.getElementById('inputFinish');
    const glassObj = document.getElementById('inputGlassType');
    const meshVal = document.getElementById('inputMesh').value;

    document.getElementById('propMaterial').innerText = materialObj.options[materialObj.selectedIndex].text;
    document.getElementById('propFinish').innerText = finishObj.options[finishObj.selectedIndex].text;
    document.getElementById('propGlassType').innerText = glassObj.options[glassObj.selectedIndex].text;
    document.getElementById('propMesh').innerText = meshVal === 'yes' ? 'Yes (Fiberglass)' : 'No';
    
    const area = ((width * height) / 1000000).toFixed(2);
    document.getElementById('propGlassArea').innerText = `${area} m²`;

    const colorMap = {
        'natural-anodized': '#c0c0c0',
        'powder-coat-white': '#f8f9fa',
        'powder-coat-black': '#212529',
        'powder-coat-grey': '#6c757d',
        'wood-grain': '#8b5a2b'
    };
    document.getElementById('propColorSwatch').style.background = colorMap[finishObj.value] || '#c0c0c0';

    document.getElementById('statusDimensions').innerText = `${width} × ${height} mm`;
    const typeText = document.getElementById('inputTypology').options[document.getElementById('inputTypology').selectedIndex].text;
    document.getElementById('statusType').innerText = typeText;

    drawWindowSVG(width, height, type, colorMap[finishObj.value]);
};

function drawWindowSVG(w, h, type, frameColor = '#c0c0c0') {
    const svg = document.getElementById('windowSVG');
    svg.innerHTML = ''; 

    const padding = 150;
    svg.setAttribute('viewBox', `0 0 ${w + padding * 2} ${h + padding * 2}`);

    const createEl = (tag, attrs) => {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (let k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    };

    const glassColor = "#e0f2fe"; 
    const strokeColor = "#475569";
    const frameWidth = Math.max(40, w * 0.05);

    // 1. Draw Outer Frame
    svg.appendChild(createEl("rect", {
        x: padding, y: padding, width: w, height: h, fill: frameColor, stroke: strokeColor, "stroke-width": 4
    }));

    // Helper for Glass Label
    const addPanelLabel = (x, y, label) => {
        const text = createEl("text", {
            x: x, y: y, "text-anchor": "middle", fill: "#0f172a", 
            "font-size": Math.max(30, w * 0.04), "font-family": "sans-serif", "font-weight": "bold",
            "opacity": "0.7"
        });
        text.textContent = label;
        svg.appendChild(text);
    };

    // Helper for Sliding Arrow
    const addSlideArrow = (startX, startY, endX) => {
        // Dashed line
        svg.appendChild(createEl("line", {
            x1: startX, y1: startY, x2: endX, y2: startY,
            stroke: "#3b82f6", "stroke-width": 4, "stroke-dasharray": "15,10"
        }));
        // Arrow head
        const headDir = startX < endX ? 15 : -15;
        svg.appendChild(createEl("path", {
            d: `M ${endX - headDir} ${startY - 10} L ${endX} ${startY} L ${endX - headDir} ${startY + 10}`,
            fill: "none", stroke: "#3b82f6", "stroke-width": 4
        }));
    };

    // 2. Draw Inner Sashes
    if (type === 'sliding') {
        const panelW = (w - frameWidth * 2) / 2 + (frameWidth/2); 
        const panelH = h - frameWidth * 2;
        
        // Left Panel (Fixed or sliding right)
        svg.appendChild(createEl("rect", {
            x: padding + frameWidth, y: padding + frameWidth, width: panelW, height: panelH, fill: glassColor, stroke: strokeColor, "stroke-width": 8
        }));
        addPanelLabel(padding + frameWidth + panelW/2, padding + h - frameWidth - 30, "A");
        addSlideArrow(padding + frameWidth + panelW/2 + 40, padding + h/2, padding + frameWidth + panelW/2 - 40);

        // Right Panel (Sliding left)
        svg.appendChild(createEl("rect", {
            x: padding + w/2 - frameWidth/2, y: padding + frameWidth, width: panelW, height: panelH, fill: glassColor, stroke: strokeColor, "stroke-width": 8
        }));
        addPanelLabel(padding + w/2 - frameWidth/2 + panelW/2, padding + h - frameWidth - 30, "B");
        addSlideArrow(padding + w/2 - frameWidth/2 + panelW/2 - 40, padding + h/2, padding + w/2 - frameWidth/2 + panelW/2 + 40);
        
    } else {
        // Single Panel (Fixed, Casement, Awning)
        svg.appendChild(createEl("rect", {
            x: padding + frameWidth, y: padding + frameWidth, width: w - frameWidth * 2, height: h - frameWidth * 2, fill: glassColor, stroke: strokeColor, "stroke-width": 8
        }));
        addPanelLabel(padding + w/2, padding + h - frameWidth - 30, "A");
        
        if(type === 'casement') {
            svg.appendChild(createEl("path", {
                d: `M ${padding+frameWidth} ${padding+frameWidth} L ${padding+w-frameWidth} ${padding+h/2} L ${padding+frameWidth} ${padding+h-frameWidth}`,
                fill: "none", stroke: "#94a3b8", "stroke-dasharray": "15,15", "stroke-width": 4
            }));
        }
    }

    // 3. Draw Dimension Lines (RA Workshop Style)
    const dimColor = "#333333";
    const fontSize = Math.max(40, Math.min(w, h) * 0.05);

    svg.appendChild(createEl("line", { x1: padding, y1: padding - 40, x2: padding + w, y2: padding - 40, stroke: dimColor, "stroke-width": 3 }));
    svg.appendChild(createEl("path", { d: `M ${padding} ${padding-45} L ${padding+10} ${padding-35}`, stroke: dimColor, "stroke-width": 3 }));
    svg.appendChild(createEl("path", { d: `M ${padding+w} ${padding-45} L ${padding+w-10} ${padding-35}`, stroke: dimColor, "stroke-width": 3 }));
    
    const textW = createEl("text", {
        x: padding + w / 2, y: padding - 60, "text-anchor": "middle", fill: dimColor, "font-size": fontSize, "font-family": "monospace", "font-weight": "bold"
    });
    textW.textContent = `W=${w}.0`;
    svg.appendChild(textW);

    svg.appendChild(createEl("line", { x1: padding - 40, y1: padding, x2: padding - 40, y2: padding + h, stroke: dimColor, "stroke-width": 3 }));
    svg.appendChild(createEl("path", { d: `M ${padding-45} ${padding} L ${padding-35} ${padding+10}`, stroke: dimColor, "stroke-width": 3 }));
    svg.appendChild(createEl("path", { d: `M ${padding-45} ${padding+h} L ${padding-35} ${padding+h-10}`, stroke: dimColor, "stroke-width": 3 }));

    const textH = createEl("text", {
        x: padding - 60, y: padding + h / 2, "text-anchor": "middle", fill: dimColor, "font-size": fontSize, "font-family": "monospace", "font-weight": "bold",
        transform: `rotate(-90, ${padding - 60}, ${padding + h / 2})`
    });
    textH.textContent = `H=${h}.0`;
    svg.appendChild(textH);
}

// ==========================================
// OUTPUT REPORTS LOGIC
// ==========================================
window.showOutputSection = function(tabName) {
    document.getElementById('outputSection').style.display = 'block';
    document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    if (tabName === 'quotation') tabName = 'boq'; 
    if (tabName === 'cutting') tabName = 'cutting-report';

    switchOutputTab(tabName);
};

window.switchOutputTab = function(tabId) {
    document.querySelectorAll('.output-tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`.output-tab[data-tab="${tabId}"]`).classList.add('active');

    document.querySelectorAll('.table-container .data-table').forEach(el => el.style.display = 'none');

    const tableMap = {
        'boq': 'tableBOQ',
        'cutting-report': 'tableCutting'
    };
    
    const targetTable = document.getElementById(tableMap[tabId]);
    if (targetTable) {
        targetTable.style.display = 'table';
        const rowCount = targetTable.querySelectorAll('tbody tr').length;
        document.getElementById('outputRecordCount').innerText = `${rowCount} items`;
    }
};

// ==========================================
// EXPORT & PDF GENERATOR
// ==========================================
window.exportToExcel = function() {
    alert("Gathering data... Exporting report to Excel (.xlsx)");
    addNotification("Your Excel (.xlsx) project file has been downloaded successfully.");
};

window.exportToPDF = function() {
    // 1. Notify user
    addNotification("Generating PDF... Please wait.");
    
    // 2. Extract Data from DOM
    const projectName = document.getElementById('currentProjectName').innerText;
    const windowCode = document.getElementById('inputWindowCode').value;
    
    // Safety check - make sure CAD is generated
    const svgElement = document.getElementById('windowSVG');
    if (!svgElement || document.getElementById('cadEmptyState').style.display === 'flex') {
        alert("Please generate a design first before exporting to PDF.");
        return;
    }
    
    // FIX: Clone the SVG and force fixed dimensions so html2pdf doesn't crop it
    const svgClone = svgElement.cloneNode(true);
    svgClone.removeAttribute('style'); // Remove any dynamic viewport styling
    svgClone.setAttribute('width', '100%');
    svgClone.setAttribute('height', '300px'); // Fixed height for PDF structure
    const svgContent = svgClone.outerHTML;
    
    const boqTable = document.getElementById('tableBOQ') ? document.getElementById('tableBOQ').outerHTML : '<p>No data generated</p>';
    
    // 3. Create an off-screen HTML structure for the PDF
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#333';
    
    element.innerHTML = `
        <div style="border-bottom: 2px solid #1a73e8; padding-bottom: 10px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #1a73e8; font-weight: 800;">FabriCAD Production Report</h2>
            <p style="margin: 5px 0 0; color: #666;">Project: <strong>${projectName}</strong> | Item Code: <strong>${windowCode}</strong></p>
        </div>
        
        <div style="margin-bottom: 30px; text-align: center; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; background: #f8fafc;">
            <h4 style="margin-top: 0; margin-bottom: 10px; text-align: left; color: #0f172a;">Design Diagram</h4>
            <div style="background: #ffffff; padding: 20px; border: 1px solid #cbd5e1;">
                ${svgContent}
            </div>
        </div>
        
        <div>
            <h4 style="color: #0f172a; margin-bottom: 15px;">Bill of Quantities (BOQ)</h4>
            ${boqTable}
        </div>
    `;
    
    // 4. Force basic styling onto the extracted table for PDF rendering
    const tables = element.getElementsByTagName('table');
    for(let table of tables) {
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '12px';
        const cells = table.getElementsByTagName('td');
        const headers = table.getElementsByTagName('th');
        for(let c of cells) { 
            c.style.borderBottom = '1px solid #e2e8f0'; 
            c.style.padding = '10px'; 
            c.style.textAlign = 'left';
        }
        for(let h of headers) { 
            h.style.borderBottom = '2px solid #cbd5e1'; 
            h.style.padding = '10px'; 
            h.style.backgroundColor = '#f8fafc'; 
            h.style.textAlign = 'left'; 
        }
    }

    // 5. Configure html2pdf options
    const opt = {
        margin:       15,
        filename:     `${windowCode}_Report.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 6. Generate and save
    html2pdf().set(opt).from(element).save().then(() => {
        addNotification(`Your PDF project file (${windowCode}_Report.pdf) has been downloaded successfully.`);
    });
};

// ==========================================
// AUTHENTICATION & PROFILE LOGIC
// ==========================================
function initAuthentication() {
    const authModalEl = document.getElementById('authModal');
    const authModal = new bootstrap.Modal(authModalEl); 

    const currentUser = JSON.parse(localStorage.getItem('fabricad_user'));
    
    if (!currentUser) {
        authModal.show(); 
    } else {
        updateUIData(currentUser); 
    }

    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const company = document.getElementById('signupCompany').value;
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;

        const user = { name, company, username, password };
        localStorage.setItem('fabricad_user', JSON.stringify(user));
        
        updateUIData(user);
        authModal.hide();
        addNotification(`Welcome to FabriCAD, ${name}! Your account was created successfully.`);
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        
        let user = JSON.parse(localStorage.getItem('fabricad_user'));
        
        if(!user || user.username !== username) {
            user = { name: "Demo User", company: "Demo Company", username: username };
            localStorage.setItem('fabricad_user', JSON.stringify(user));
        }

        updateUIData(user);
        authModal.hide();
        addNotification(`Welcome back, ${user.name}!`);
    });
}

function initProfileManagement() {
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));

    document.getElementById('btnProfile').addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem('fabricad_user'));
        if (user) {
            document.getElementById('profileName').value = user.name || '';
            document.getElementById('profileCompany').value = user.company || '';
            document.getElementById('profileUsername').value = user.username || '';
        }
        profileModal.show();
    });

    document.getElementById('btnSaveProfile').addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem('fabricad_user'));
        user.name = document.getElementById('profileName').value;
        user.company = document.getElementById('profileCompany').value;
        
        localStorage.setItem('fabricad_user', JSON.stringify(user));
        updateUIData(user);
        profileModal.hide();
        addNotification('Your profile information has been updated successfully.');
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('fabricad_user');
        window.location.reload(); 
    });
}

function updateUIData(user) {
    if(!user) return;
    
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    document.getElementById('sidebarUserName').innerText = user.name;
    document.getElementById('sidebarUserCompany').innerText = user.company;
    document.getElementById('sidebarUserInitials').innerText = initials;
    document.getElementById('topbarUserInitials').innerText = initials;

    const welcomeHeader = document.querySelector('#viewDashboard h4');
    if(welcomeHeader) {
        welcomeHeader.innerText = `Welcome back, ${user.name.split(' ')[0]} 👋`;
    }
}

// ==========================================
// NOTIFICATION LOGIC
// ==========================================
function addNotification(message) {
    const notifList = document.getElementById('notificationList');
    const noNotifs = document.getElementById('noNotifs');
    
    if(noNotifs) noNotifs.style.display = 'none';

    const li = document.createElement('li');
    li.innerHTML = `
        <a class="dropdown-item" href="#" style="font-size:0.85rem; white-space: normal; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-light);">
            <div class="d-flex align-items-start gap-2">
                <i class="bi bi-info-circle-fill text-primary mt-1"></i>
                <div>
                    <div style="font-weight: 500; color: var(--text-primary);">${message}</div>
                    <div class="text-muted" style="font-size:0.7rem; margin-top: 4px;">Just now</div>
                </div>
            </div>
        </a>`;
    
    notifList.insertBefore(li, notifList.children[2]);
    
    const dotBtn = document.getElementById('btnNotifications');
    if (dotBtn) dotBtn.classList.add('notification-dot');
}

// ==========================================
// DYNAMIC PROJECT MANAGEMENT LOGIC
// ==========================================

// Load projects from local storage or set default dummy projects
let projectsData = JSON.parse(localStorage.getItem('fabricad_projects')) || [
    { id: 1, name: 'Villa Azure Windows', code: 'WND-2024-001', type: 'Sliding', width: 1800, height: 1500, qty: 3, time: '2h ago', icon: 'bi-window', color: '', bg: '' },
    { id: 2, name: 'Cedar Heights Doors', code: 'DOR-2024-003', type: 'Casement', width: 900, height: 2100, qty: 6, time: '1d ago', icon: 'bi-door-open', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
    { id: 3, name: 'Marina Bay Curtain Wall', code: 'CW-2024-007', type: 'Fixed', width: 3000, height: 2400, qty: 2, time: '3d ago', icon: 'bi-grid-3x3', color: '#7c4dff', bg: 'rgba(124,77,255,0.1)' }
];

function saveProjectsData() {
    localStorage.setItem('fabricad_projects', JSON.stringify(projectsData));
}

window.renderProjects = function() {
    const recentContainer = document.getElementById('recentProjectsList');
    const savedContainer = document.getElementById('savedProjectsList');
    const dashboardTotalCount = document.getElementById('dashStatTotal');
    
    let html = '';
    
    if (projectsData.length === 0) {
        html = `<div class="p-4 text-center text-muted" style="font-size:0.9rem;">No projects found. Create a new design!</div>`;
    } else {
        projectsData.forEach(p => {
            html += `
            <div class="project-list-item">
              <div class="project-info" onclick="openProjectInWorkspace('${p.name}','${p.code}','${p.type}','${p.width}','${p.height}','${p.qty}')" style="cursor:pointer; flex: 1;">
                <div class="project-thumb" style="background:${p.bg || ''};color:${p.color || ''};"><i class="bi ${p.icon || 'bi-window'}"></i></div>
                <div>
                  <div class="project-name">${p.name}</div>
                  <div class="project-meta">${p.code} · ${p.type} · Modified ${p.time}</div>
                </div>
              </div>
              <div class="project-actions">
                <button class="project-action-btn" title="Edit" onclick="openProjectInWorkspace('${p.name}','${p.code}','${p.type}','${p.width}','${p.height}','${p.qty}')"><i class="bi bi-pencil"></i></button>
                <button class="project-action-btn" title="Duplicate" onclick="duplicateProject(${p.id})"><i class="bi bi-copy"></i></button>
                <button class="project-action-btn danger" title="Delete" onclick="deleteProject(${p.id})"><i class="bi bi-trash3"></i></button>
              </div>
            </div>`;
        });
    }

    if (recentContainer) recentContainer.innerHTML = html;
    if (savedContainer) savedContainer.innerHTML = html;
    if (dashboardTotalCount) dashboardTotalCount.innerText = projectsData.length;
};

// Functions to handle Duplicate and Delete dynamically
window.duplicateProject = function(id) {
    const proj = projectsData.find(p => p.id === id);
    if(proj) {
        const newProj = { ...proj, id: Date.now(), name: proj.name + ' (Copy)', time: 'just now' };
        projectsData.unshift(newProj); 
        saveProjectsData();
        renderProjects();
        addNotification(`Project "${proj.name}" duplicated successfully.`);
    }
};

window.deleteProject = function(id) {
    const proj = projectsData.find(p => p.id === id);
    if(proj && confirm(`Are you sure you want to delete "${proj.name}"?`)) {
        projectsData = projectsData.filter(p => p.id !== id);
        saveProjectsData();
        renderProjects();
        addNotification(`Project deleted successfully.`);
    }
};

// Update saveProject to dynamically push to array
window.saveProject = function() {
    const newName = document.getElementById('saveProjectName').value;
    const code = document.getElementById('inputWindowCode').value;
    const typeSelect = document.getElementById('inputTypology');
    const type = typeSelect.options[typeSelect.selectedIndex].text.split(' ')[0]; 
    const width = document.getElementById('inputWidth').value;
    const height = document.getElementById('inputHeight').value;
    const qty = document.getElementById('inputQuantity').value;

    document.getElementById('currentProjectName').innerText = newName;

    const newProj = {
        id: Date.now(),
        name: newName,
        code: code,
        type: type,
        width: width,
        height: height,
        qty: qty,
        time: 'just now',
        icon: type.toLowerCase().includes('door') ? 'bi-door-open' : 'bi-window',
        color: '',
        bg: ''
    };

    projectsData.unshift(newProj);
    saveProjectsData();
    renderProjects();
    
    addNotification(`Project "${newName}" saved successfully to your lists!`);
};