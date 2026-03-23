    // ==================== Toast System ====================
    function initToastContainer() {
      if (!document.getElementById('toastContainer')) {
        const c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c);
      }
    }
    function showToast(typeOrMsg, titleOrType, message, duration) {
      const validTypes = ['success', 'error', 'warning', 'info'];
      let type, title;
      if (validTypes.includes(typeOrMsg)) { type = typeOrMsg; title = titleOrType || ''; }
      else { type = validTypes.includes(titleOrType) ? titleOrType : 'info'; title = typeOrMsg || ''; message = ''; }
      initToastContainer();
      const container = document.getElementById('toastContainer');
      const icons = { success: 'fas fa-check-circle', error: 'fas fa-times-circle', warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle' };
      duration = duration || (type === 'error' ? 5000 : 3000);
      const toast = document.createElement('div'); toast.className = 'toast toast-' + type;
      toast.innerHTML = '<div class="toast-icon"><i class="' + (icons[type]||icons.info) + '"></i></div><div class="toast-body"><div class="toast-title">' + title + '</div>' + (message ? '<div class="toast-message">' + message + '</div>' : '') + '</div><button class="toast-close" onclick="this.parentElement.classList.add(\'toast-exit\'); setTimeout(() => this.parentElement.remove(), 300);"><i class="fas fa-times"></i></button><div class="toast-progress" style="animation-duration: ' + duration + 'ms;"></div>';
      container.appendChild(toast);
      setTimeout(() => { if (toast.parentElement) { toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 300); } }, duration);
    }

    // ==================== Utilities ====================
    function togglePwdVis(id, btn) {
      const inp = document.getElementById(id); if (!inp) return;
      const icon = btn.querySelector('i');
      if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
      else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
    }

    function switchPage(pageId) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const page = document.getElementById(pageId); if (page) page.classList.add('active');
      const fab = document.getElementById('aiFab'); if (fab) fab.classList.toggle('hidden', pageId === 'pageAuth');
    }

    function switchSessionTab(tab) {
      currentSessionTab = tab;
      const tabs = ['research', 'workbench', 'intent', 'negotiation', 'timeline'];
      tabs.forEach(t => {
        const panel = document.getElementById('sessionTab-' + t);
        const btn = document.getElementById('sessionTabBtn-' + t);
        if (panel) panel.classList.toggle('hidden', t !== tab);
        if (btn) {
          btn.classList.toggle('bg-teal-50', t === tab);
          btn.classList.toggle('text-teal-700', t === tab);
          btn.classList.toggle('text-gray-600', t !== tab);
          btn.classList.toggle('hover:bg-gray-50', t !== tab);
        }
      });
      if (tab === 'workbench') {
        refreshWorkbenchPrefill();
        renderWorkbench();
      }
      if (tab === 'intent') renderIntentTab();
      if (tab === 'negotiation') renderNegotiationTab();
      if (tab === 'timeline') renderTimelineTab();
    }

    function setDashboardViewMode(mode) {
      dashboardViewMode = mode;
      const storeBtn = document.getElementById('viewModeStore');
      const brandBtn = document.getElementById('viewModeBrand');
      if (storeBtn) {
        storeBtn.classList.toggle('bg-teal-50', mode === 'store');
        storeBtn.classList.toggle('text-teal-700', mode === 'store');
        storeBtn.classList.toggle('text-gray-600', mode !== 'store');
        storeBtn.classList.toggle('hover:bg-gray-50', mode !== 'store');
      }
      if (brandBtn) {
        brandBtn.classList.toggle('bg-teal-50', mode === 'brand');
        brandBtn.classList.toggle('text-teal-700', mode === 'brand');
        brandBtn.classList.toggle('text-gray-600', mode !== 'brand');
        brandBtn.classList.toggle('hover:bg-gray-50', mode !== 'brand');
      }
      renderDeals();
    }

    function saveResearchInputs() {
      localStorage.setItem('ec_researchInputsByDeal', JSON.stringify(researchInputsByDeal));
    }

    function parseWanValue(raw) {
      const normalized = String(raw || '')
        .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 65248))
        .replace(/．/g, '.')
        .replace(/，/g, ',')
        .replace(/,/g, '')
        .replace(/[^\d.-]/g, '');
      const val = parseFloat(normalized);
      return Number.isFinite(val) ? val : 0;
    }

    function saveWorkbenchState() {
      localStorage.setItem('ec_workbenchByDeal', JSON.stringify(workbenchByDeal));
    }

    function saveIntentState() {
      localStorage.setItem('ec_intentByDeal', JSON.stringify(intentByDeal));
    }

