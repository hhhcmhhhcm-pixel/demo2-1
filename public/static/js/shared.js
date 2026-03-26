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

    function updatePerspectiveUI() {
      const isFinancer = currentPerspective === 'financer';

      // ---- Dashboard toggle button ----
      const btn = document.getElementById('perspectiveToggleBtn');
      const icon = document.getElementById('perspectiveToggleIcon');
      const text = document.getElementById('perspectiveToggleText');
      if (btn) {
        if (isFinancer) {
          btn.style.color = '#0f766e';
          btn.style.background = 'rgba(13,148,136,0.10)';
          btn.style.border = '1px solid rgba(13,148,136,0.25)';
        } else {
          btn.style.color = '#a16207';
          btn.style.background = 'rgba(245,158,11,0.08)';
          btn.style.border = '1px solid rgba(245,158,11,0.16)';
        }
      }
      if (icon) icon.className = isFinancer ? 'fas fa-rotate-left text-xs' : 'fas fa-arrows-rotate text-xs';
      if (text) text.textContent = isFinancer ? '切换投资方视角' : '切换融资方视角';

      // ---- Detail view toggle button ----
      var dBtn = document.getElementById('detailPerspectiveBtn');
      var dIcon = document.getElementById('detailPerspectiveIcon');
      var dText = document.getElementById('detailPerspectiveText');
      if (dBtn) {
        if (isFinancer) {
          dBtn.style.color = '#0f766e';
          dBtn.style.background = 'rgba(13,148,136,0.10)';
          dBtn.style.border = '1px solid rgba(13,148,136,0.25)';
        } else {
          dBtn.style.color = '#a16207';
          dBtn.style.background = 'rgba(245,158,11,0.08)';
          dBtn.style.border = '1px solid rgba(245,158,11,0.16)';
        }
      }
      if (dIcon) dIcon.className = isFinancer ? 'fas fa-rotate-left text-xs' : 'fas fa-arrows-rotate text-xs';
      if (dText) dText.textContent = isFinancer ? '切换投资方视角' : '切换融资方视角';

      // ---- Detail view: research tab layout (both perspectives keep 2/5 + 3/5) ----
      var researchLeft = document.getElementById('researchLeftPanel');
      if (researchLeft) {
        researchLeft.classList.add('w-2/5', 'border-r');
        researchLeft.classList.remove('w-full');
      }

      // ---- Detail view: session tab active color ----
      if (typeof currentSessionTab !== 'undefined') switchSessionTab(currentSessionTab);
      const aiRecommendBtn = document.getElementById('aiRecommendBtn');
      if (aiRecommendBtn) {
        if (isFinancer) {
          aiRecommendBtn.style.color = '#92400e';
          aiRecommendBtn.style.background = 'rgba(245,158,11,0.10)';
          aiRecommendBtn.style.border = '1px solid rgba(217,119,6,0.22)';
        } else {
          aiRecommendBtn.style.color = '#49A89A';
          aiRecommendBtn.style.background = 'rgba(93,196,179,0.06)';
          aiRecommendBtn.style.border = '1px solid rgba(93,196,179,0.12)';
        }
      }
      const navUserBtn = document.getElementById('navUserBtn');
      if (navUserBtn) {
        navUserBtn.setAttribute('onmouseover', isFinancer
          ? "this.style.background='rgba(245,158,11,0.12)'"
          : "this.style.background='rgba(93,196,179,0.08)'");
      }
      const navAvatar = document.getElementById('navAvatar');
      const ddAvatar = document.getElementById('ddAvatar');
      const avatarBg = isFinancer
        ? 'linear-gradient(135deg, #f59e0b, #b45309)'
        : 'linear-gradient(135deg, #5DC4B3, #3D8F83)';
      if (navAvatar) {
        navAvatar.style.background = avatarBg;
        navAvatar.style.boxShadow = isFinancer ? '0 2px 8px rgba(245,158,11,0.30)' : '0 2px 8px rgba(93,196,179,0.3)';
      }
      if (ddAvatar) ddAvatar.style.background = avatarBg;

      const heroSubtitle = document.getElementById('heroSubtitle');
      if (heroSubtitle) {
        heroSubtitle.textContent = isFinancer
          ? '发起通的投资机会将在此展示，便于从融资方视角浏览与跟进。'
          : '发起通的投资机会，经您的评估通筛子精选后展示于此';
      }
      const emptySubtitle = document.getElementById('emptyStateSubtitle');
      if (emptySubtitle) {
        emptySubtitle.textContent = isFinancer
          ? '当前以融资方视角展示机会列表，可先加载演示数据。'
          : '机会由融资方通过发起通上传，经评估通筛子过滤后展示于此';
      }
      const role = document.getElementById('ddRole');
      if (role) role.textContent = isFinancer ? '融资方视角' : '投资者';
      const listTitle = document.getElementById('dashboardListTitle');
      if (listTitle) listTitle.textContent = isFinancer ? '融资项目' : '投资机会';
      const filterLabel = document.getElementById('filterLabel');
      if (filterLabel) filterLabel.style.display = isFinancer ? 'none' : '';
      const kybHintLine = document.getElementById('kybHintLine');
      if (kybHintLine) kybHintLine.style.display = isFinancer ? 'none' : '';
      const intentTabBtn = document.getElementById('sessionTabBtn-intent');
      if (intentTabBtn) {
        intentTabBtn.innerHTML = isFinancer
          ? '<i class="fas fa-hand-point-up mr-1"></i>意向处理'
          : '<i class="fas fa-hand-point-up mr-1"></i>表达意向';
      }
      if (currentSessionTab === 'intent' && typeof renderIntentTab === 'function') {
        renderIntentTab();
      }
      setDashboardViewMode(dashboardViewMode);
    }

    function playPerspectiveFlip() {
      const surface = document.getElementById('dashboardContentSurface');
      if (!surface) return;
      surface.classList.remove('perspective-flip');
      void surface.offsetWidth;
      surface.classList.add('perspective-flip');
      setTimeout(() => surface.classList.remove('perspective-flip'), 480);
    }

    function applyPerspective(perspective, opts) {
      const options = opts || {};
      const next = perspective === 'financer' ? 'financer' : 'investor';
      const changed = currentPerspective !== next;
      currentPerspective = next;
      document.body.setAttribute('data-perspective', currentPerspective);
      if (options.persist !== false) localStorage.setItem('ec_perspective', currentPerspective);

      updatePerspectiveUI();
      if (currentUser && currentPerspective === 'financer' && typeof selectSieve === 'function') {
        selectSieve('all');
      } else if (currentUser && typeof renderDeals === 'function') {
        renderDeals();
      }
      // 视角切换后，若当前在项目会话页且有选中项目，重新渲染做功课内容
      if (changed && currentDeal && typeof openDetail === 'function') {
        openDetail(currentDeal.id);
      }
      if (options.animate !== false && changed) playPerspectiveFlip();

      if (options.toast !== false && changed) {
        if (currentPerspective === 'financer') showToast('info', '已切换融资方视角', '主页面已隐藏评估通相关区域');
        else showToast('info', '已切换投资者视角', '主页面已恢复评估通相关区域');
      }
      if (typeof updateIntentUnreadDot === 'function') updateIntentUnreadDot();
    }

    function togglePerspective() {
      applyPerspective(currentPerspective === 'financer' ? 'investor' : 'financer', { animate: true, persist: true, toast: true });
    }

    function switchSessionTab(tab) {
      currentSessionTab = tab;
      var isFinancer = currentPerspective === 'financer';
      var activeBg = isFinancer ? 'bg-amber-50' : 'bg-teal-50';
      var activeText = isFinancer ? 'text-amber-700' : 'text-teal-700';
      var inactiveBg = isFinancer ? 'bg-teal-50' : 'bg-amber-50';
      var inactiveText = isFinancer ? 'text-teal-700' : 'text-amber-700';
      const tabs = ['research', 'forecast', 'workbench', 'intent', 'negotiation', 'memo', 'timeline'];
      tabs.forEach(t => {
        const panel = document.getElementById('sessionTab-' + t);
        const btn = document.getElementById('sessionTabBtn-' + t);
        if (panel) panel.classList.toggle('hidden', t !== tab);
        if (btn) {
          btn.classList.remove('bg-teal-50', 'bg-amber-50', 'text-teal-700', 'text-amber-700');
          if (t === tab) {
            btn.classList.add(activeBg, activeText);
            btn.classList.remove('text-gray-600', 'hover:bg-gray-50');
          } else {
            btn.classList.add('text-gray-600', 'hover:bg-gray-50');
          }
        }
      });
      if (tab === 'forecast') renderForecastTab();
      if (tab === 'workbench') {
        refreshWorkbenchPrefill();
        renderWorkbench();
      }
      if (tab === 'intent') {
        renderIntentTab();
        if (currentPerspective === 'financer' && typeof markIntentRequestsAsRead === 'function') markIntentRequestsAsRead();
      }
      if (tab === 'negotiation') renderNegotiationTab();
      if (tab === 'memo') renderMemoTab();
      if (tab === 'timeline') renderTimelineTab();
      if (typeof updateIntentUnreadDot === 'function') updateIntentUnreadDot();
    }

    function setDashboardViewMode(mode) {
      dashboardViewMode = mode;
      const storeBtn = document.getElementById('viewModeStore');
      const brandBtn = document.getElementById('viewModeBrand');
      const activeBg = currentPerspective === 'financer' ? 'bg-amber-50' : 'bg-teal-50';
      const activeText = currentPerspective === 'financer' ? 'text-amber-700' : 'text-teal-700';
      const reset = ['bg-teal-50', 'text-teal-700', 'bg-amber-50', 'text-amber-700', 'text-gray-600', 'hover:bg-gray-50'];
      if (storeBtn) {
        reset.forEach((c) => storeBtn.classList.remove(c));
        if (mode === 'store') {
          storeBtn.classList.add(activeBg, activeText);
        } else {
          storeBtn.classList.add('text-gray-600', 'hover:bg-gray-50');
        }
      }
      if (brandBtn) {
        reset.forEach((c) => brandBtn.classList.remove(c));
        if (mode === 'brand') {
          brandBtn.classList.add(activeBg, activeText);
        } else {
          brandBtn.classList.add('text-gray-600', 'hover:bg-gray-50');
        }
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
