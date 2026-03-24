    function getIntentRequests(state) {
      if (!state || !Array.isArray(state.requests)) return [];
      return state.requests;
    }

    function getSelectedIntentRequest(state, persist) {
      const requests = getIntentRequests(state);
      if (!requests.length) return null;
      let selected = requests.find((r) => r.id === state.selectedRequestId);
      if (!selected) {
        selected = requests[0];
        state.selectedRequestId = selected.id;
        if (persist !== false) saveIntentState();
      }
      return selected;
    }

    function getActiveIntentRequest(state) {
      const requests = getIntentRequests(state);
      if (!requests.length) return null;
      if (state?.activeRequestId) {
        const active = requests.find((r) => r.id === state.activeRequestId && r.response === 'accepted');
        if (active) return active;
      }
      return requests.find((r) => r.response === 'accepted') || null;
    }

    function syncLegacyIntentFields(state) {
      const selected = getSelectedIntentRequest(state, false);
      if (selected) {
        state.submittedAt = selected.submittedAt || '';
        state.response = selected.response || 'pending';
      } else {
        state.submittedAt = '';
        state.response = 'none';
      }
    }

    function hasAcceptedIntent(state) {
      return !!getActiveIntentRequest(state) || state?.response === 'accepted';
    }

    function hasPendingIntent(state) {
      const requests = getIntentRequests(state);
      return requests.some((r) => r.response === 'pending');
    }

    function ensureIntentState() {
      if (!currentDeal) return null;
      const dealId = currentDeal.id;
      if (!intentByDeal[dealId]) {
        intentByDeal[dealId] = {
          investmentType: 'RBF固定',
          amountBand: '300-500',
          customMin: '',
          customMax: '',
          concerns: [],
          note: '',
          summary: '',
          submittedAt: '',
          response: 'none',
          requests: [],
          selectedRequestId: '',
          activeRequestId: ''
        };
        saveIntentState();
      }

      const state = intentByDeal[dealId];
      let migrated = false;

      if (!Array.isArray(state.requests)) {
        state.requests = [];
        migrated = true;
      }

      // 兼容旧数据：将单条提交迁移到 requests
      if (state.requests.length === 0 && state.submittedAt) {
        state.requests.push({
          id: 'IR_LEGACY_' + dealId,
          submittedAt: state.submittedAt,
          response: state.response === 'none' ? 'pending' : state.response,
          summary: state.summary || '历史意向（无摘要）',
          fromName: '投资方'
        });
        migrated = true;
      }

      state.requests.sort((a, b) => (new Date(b.submittedAt).getTime()) - (new Date(a.submittedAt).getTime()));

      if (typeof state.activeRequestId !== 'string') {
        state.activeRequestId = '';
        migrated = true;
      }
      if (!state.activeRequestId) {
        const accepted = state.requests.find((r) => r.response === 'accepted');
        if (accepted) {
          state.activeRequestId = accepted.id;
          migrated = true;
        }
      } else if (!state.requests.some((r) => r.id === state.activeRequestId && r.response === 'accepted')) {
        state.activeRequestId = '';
        migrated = true;
      }

      if (!state.selectedRequestId && state.requests.length > 0) {
        state.selectedRequestId = state.requests[0].id;
        migrated = true;
      }

      syncLegacyIntentFields(state);
      if (migrated) saveIntentState();
      return state;
    }

    function getIntentAmountText(state) {
      if (state.amountBand === 'custom') {
        const min = parseWanValue(state.customMin);
        const max = parseWanValue(state.customMax);
        if (min > 0 && max > 0) return min.toFixed(0) + '万 - ' + max.toFixed(0) + '万';
        return '自定义（待填写）';
      }
      if (state.amountBand === '800+') return '800万以上';
      const parts = String(state.amountBand).split('-');
      if (parts.length === 2) return parts[0] + '万 - ' + parts[1] + '万';
      return state.amountBand;
    }

    function renderIntentRequestList(state) {
      const list = document.getElementById('intentRequestList');
      const count = document.getElementById('intentRequestCount');
      if (count) count.textContent = String(getIntentRequests(state).length);
      if (!list) return;
      const requests = getIntentRequests(state);
      const activeConn = getActiveIntentRequest(state);
      if (!requests.length) {
        list.textContent = '暂无意向请求。';
        return;
      }
      list.innerHTML = requests.map((req) => {
        const active = req.id === state.selectedRequestId;
        const locked = !!activeConn && activeConn.id !== req.id;
        const statusMap = {
          pending: { text: '待处理', cls: 'bg-amber-50 text-amber-700' },
          accepted: { text: '已接受', cls: 'bg-emerald-50 text-emerald-700' },
          rejected: { text: '已拒绝', cls: 'bg-rose-50 text-rose-700' }
        };
        const st = statusMap[req.response] || statusMap.pending;
        const at = req.submittedAt ? req.submittedAt.slice(0, 16).replace('T', ' ') : '--';
        const summary = req.summary || '无摘要';
        const preview = summary.length > 52 ? (summary.slice(0, 52) + '...') : summary;
        return '<button onclick="selectIntentRequest(\'' + req.id + '\')" ' + (locked ? 'disabled' : '') + ' class="w-full text-left p-2.5 rounded-lg border transition-colors ' + (locked ? 'opacity-45 grayscale border-gray-200 bg-gray-100 cursor-not-allowed' : (active ? 'border-teal-300 bg-teal-50' : 'border-gray-100 bg-gray-50 hover:bg-white')) + '">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<span class="text-xs text-gray-500">' + at + '</span>' +
            '<div class="flex items-center gap-1"><span class="text-[10px] px-2 py-0.5 rounded ' + st.cls + '">' + st.text + '</span>' + (locked ? '<span class="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-500">锁定</span>' : '') + '</div>' +
          '</div>' +
          '<p class="text-xs text-gray-700 mb-1 truncate">' + preview + '</p>' +
          '<p class="text-[10px] text-gray-400">提交方：' + (req.fromName || '投资方') + '</p>' +
        '</button>';
      }).join('');
    }

    function selectIntentRequest(requestId) {
      if (!currentDeal) return;
      const state = ensureIntentState();
      if (!state) return;
      if (!getIntentRequests(state).some((r) => r.id === requestId)) return;
      const activeConn = getActiveIntentRequest(state);
      if (activeConn && activeConn.id !== requestId) {
        showToast('info', '当前请求已锁定', '请先处理或拒绝已接受的请求，再选择其他请求');
        return;
      }
      state.selectedRequestId = requestId;
      syncLegacyIntentFields(state);
      saveIntentState();
      renderIntentTab();
    }

    function renderIntentSummaryAndResponse(state) {
      const summaryBox = document.getElementById('intentSummaryBox');
      const responseBox = document.getElementById('intentResponseBox');
      const selected = getSelectedIntentRequest(state, false);

      if (summaryBox) {
        if (selected && selected.summary) {
          summaryBox.textContent = selected.summary;
        } else if (currentPerspective === 'financer') {
          summaryBox.textContent = '尚未收到投资方提交的结构化意向。';
        } else {
          summaryBox.textContent = state.summary || '尚未生成摘要。';
        }
      }

      if (!responseBox) return;
      if (!selected) {
        responseBox.className = 'p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700';
        responseBox.textContent = currentPerspective === 'financer' ? '当前暂无投资方意向待处理。' : '尚未提交意向。';
        return;
      }

      if (selected.response === 'accepted') {
        responseBox.className = 'p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700';
        responseBox.textContent = '该意向已接受沟通，其他请求将暂时锁定。';
        return;
      }
      if (selected.response === 'rejected') {
        responseBox.className = 'p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700';
        responseBox.textContent = '该意向已标记为暂不考虑。';
        return;
      }
      const activeConn = getActiveIntentRequest(state);
      if (currentPerspective === 'financer' && activeConn && activeConn.id !== selected.id) {
        responseBox.className = 'p-3 rounded-xl bg-gray-100 border border-gray-200 text-sm text-gray-600';
        responseBox.textContent = '当前已与“' + (activeConn.fromName || '投资方') + '”建联，该请求暂时锁定。';
        return;
      }
      responseBox.className = 'p-3 rounded-xl bg-cyan-50 border border-cyan-100 text-sm text-cyan-700';
      responseBox.textContent = currentPerspective === 'financer' ? '已收到投资方意向，请选择处理结果。' : '意向已发送，等待融资方响应。';
    }

    function renderIntentPerspective(state) {
      const isFinancer = currentPerspective === 'financer';
      const formTitle = document.getElementById('intentFormTitle');
      const summaryTitle = document.getElementById('intentSummaryTitle');
      const responseTitle = document.getElementById('intentResponseTitle');
      const formActions = document.getElementById('intentFormActions');
      const responseActions = document.getElementById('intentResponseActions');
      const responseTip = document.getElementById('intentResponseTip');
      const queueCard = document.getElementById('intentRequestQueueCard');
      const queueTitle = document.getElementById('intentRequestQueueTitle');
      const queueHint = document.getElementById('intentRequestQueueHint');
      const acceptBtn = document.getElementById('btnIntentAccept');
      const rejectBtn = document.getElementById('btnIntentReject');

      if (formTitle) {
        formTitle.innerHTML = isFinancer
          ? '<i class="fas fa-inbox mr-2 text-amber-600"></i>融资方视角 · 意向处理'
          : '<i class="fas fa-hand-point-up mr-2 text-teal-600"></i>结构化意向填写';
      }
      if (summaryTitle) {
        summaryTitle.innerHTML = isFinancer
          ? '<i class="fas fa-file-signature mr-2 text-cyan-600"></i>投资方意向摘要'
          : '<i class="fas fa-file-signature mr-2 text-cyan-600"></i>意向摘要确认';
      }
      if (responseTitle) {
        responseTitle.innerHTML = isFinancer
          ? '<i class="fas fa-reply mr-2 text-amber-600"></i>处理结果'
          : '<i class="fas fa-reply mr-2 text-amber-600"></i>融资方响应';
      }

      const selected = getSelectedIntentRequest(state, false);
      const activeConn = getActiveIntentRequest(state);
      const canAccept = isFinancer && !!selected && selected.response === 'pending' && (!activeConn || activeConn.id === selected.id);
      const canReject = isFinancer && !!selected && (selected.response === 'pending' || (selected.response === 'accepted' && activeConn && activeConn.id === selected.id));
      const canShowActions = canAccept || canReject;
      if (formActions) formActions.classList.toggle('hidden', isFinancer);
      if (responseActions) responseActions.classList.toggle('hidden', !canShowActions);
      if (acceptBtn) acceptBtn.classList.toggle('hidden', !canAccept);
      if (rejectBtn) {
        rejectBtn.textContent = (selected && selected.response === 'accepted') ? '拒绝并释放锁定' : '暂不考虑';
      }

      if (responseTip) {
        responseTip.textContent = isFinancer
          ? '规则：接受一条后其余请求会变灰锁定；仅当拒绝当前已接受请求后，其他请求才恢复可选。'
          : '验收说明：接受沟通后建议进入条款工作台；暂不考虑则项目留在列表待观察。';
      }

      if (queueCard) queueCard.classList.toggle('hidden', !isFinancer);
      if (queueTitle) queueTitle.innerHTML = '<i class="fas fa-inbox mr-2 text-amber-600"></i>收到的意向请求';
      if (queueHint) queueHint.textContent = '按提交时间展示，优先处理最新请求。';

      document.querySelectorAll('#intentFormBody input, #intentFormBody select, #intentFormBody textarea').forEach((el) => {
        el.disabled = isFinancer;
      });
    }

    function renderIntentTab() {
      if (!currentDeal) return;
      const state = ensureIntentState();
      if (!state) return;
      const activeConn = getActiveIntentRequest(state);
      if (activeConn && state.selectedRequestId !== activeConn.id) {
        state.selectedRequestId = activeConn.id;
        syncLegacyIntentFields(state);
        saveIntentState();
      }
      const typeEl = document.getElementById('intentInvestmentType');
      const bandEl = document.getElementById('intentAmountBand');
      const minEl = document.getElementById('intentCustomMin');
      const maxEl = document.getElementById('intentCustomMax');
      const noteEl = document.getElementById('intentNote');
      const selected = getSelectedIntentRequest(state, false);
      const formSource = currentPerspective === 'financer' && selected ? selected : state;
      if (typeEl) typeEl.value = formSource.investmentType || 'RBF固定';
      if (bandEl) bandEl.value = formSource.amountBand || '300-500';
      if (minEl) minEl.value = formSource.customMin || '';
      if (maxEl) maxEl.value = formSource.customMax || '';
      if (noteEl) noteEl.value = formSource.note || '';
      const selectedConcerns = Array.isArray(formSource.concerns) ? formSource.concerns : [];
      document.querySelectorAll('.intent-concern').forEach((el) => {
        const checkbox = el;
        checkbox.checked = selectedConcerns.includes(checkbox.value);
      });
      renderIntentPerspective(state);
      renderIntentRequestList(state);
      renderIntentSummaryAndResponse(state);
    }

    function updateIntentAndPreview() {
      if (!currentDeal) return;
      if (currentPerspective === 'financer') return;
      const state = ensureIntentState();
      if (!state) return;
      state.investmentType = document.getElementById('intentInvestmentType')?.value || 'RBF固定';
      state.amountBand = document.getElementById('intentAmountBand')?.value || '300-500';
      state.customMin = document.getElementById('intentCustomMin')?.value || '';
      state.customMax = document.getElementById('intentCustomMax')?.value || '';
      state.note = document.getElementById('intentNote')?.value || '';
      state.concerns = Array.from(document.querySelectorAll('.intent-concern:checked')).map((el) => el.value);
      saveIntentState();
      renderIntentSummaryAndResponse(state);
    }

    function generateIntentSummary() {
      if (!currentDeal) return;
      if (currentPerspective === 'financer') {
        showToast('warning', '当前为融资方视角', '融资方不可生成投资方意向摘要');
        return;
      }
      updateIntentAndPreview();
      const state = ensureIntentState();
      if (!state) return;
      if (state.amountBand === 'custom') {
        const min = parseWanValue(state.customMin);
        const max = parseWanValue(state.customMax);
        if (!(min > 0 && max > 0 && max >= min)) {
          showToast('warning', '自定义区间无效', '请填写有效金额区间（最大值需>=最小值）');
          return;
        }
      }
      const concernsText = state.concerns.length > 0 ? state.concerns.join('、') : '暂无额外关注点';
      const noteText = state.note ? '备注：' + state.note : '备注：无';
      state.summary =
        '项目：' + currentDeal.name +
        '；投资类型：' + state.investmentType +
        '；意向金额：' + getIntentAmountText(state) +
        '；核心关注：' + concernsText +
        '；参考：AI评分' + currentDeal.aiScore + ' / 风控' + (currentDeal.riskGrade || 'N/A') +
        '；' + noteText;
      saveIntentState();
      renderIntentSummaryAndResponse(state);
      showToast('success', '摘要已生成', '请确认后发送给融资方');
    }

    function submitIntent() {
      if (!currentDeal) return;
      if (currentPerspective === 'financer') {
        showToast('warning', '当前为融资方视角', '融资方不可提交投资意向');
        return;
      }
      const state = ensureIntentState();
      if (!state) return;
      if (!state.summary) {
        generateIntentSummary();
        if (!state.summary) return;
      }

      const request = {
        id: 'IR_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        submittedAt: new Date().toISOString(),
        response: 'pending',
        summary: state.summary,
        fromName: currentUser?.displayName || currentUser?.username || '投资方',
        investmentType: state.investmentType || 'RBF固定',
        amountBand: state.amountBand || '300-500',
        customMin: state.customMin || '',
        customMax: state.customMax || '',
        amountText: getIntentAmountText(state),
        concerns: (state.concerns || []).slice(),
        note: state.note || ''
      };

      state.requests.unshift(request);
      state.selectedRequestId = request.id;
      syncLegacyIntentFields(state);

      currentDeal.status = 'interested';
      const original = allDeals.find((d) => d.id === currentDeal.id);
      if (original) original.status = 'interested';
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));

      saveIntentState();
      pushTimelineEvent('intent_submitted', '提交结构化意向（' + request.id + '）', getPublicTermsFromWorkbench());
      renderIntentRequestList(state);
      renderIntentPerspective(state);
      renderIntentSummaryAndResponse(state);
      showToast('success', '意向已发送', '融资方将收到结构化意向摘要');
    }

    function handleIntentDecision(status) {
      if (!currentDeal) return;
      if (currentPerspective !== 'financer') {
        showToast('warning', '当前为投资方视角', '请切换到融资方视角后处理意向');
        return;
      }
      const state = ensureIntentState();
      if (!state) return;

      const selected = getSelectedIntentRequest(state, false);
      const activeConn = getActiveIntentRequest(state);
      if (!selected) {
        showToast('warning', '暂无意向可处理', '当前项目尚未收到投资方意向');
        return;
      }
      if (status === 'accepted' && activeConn && activeConn.id !== selected.id) {
        showToast('warning', '请求已锁定', '请先拒绝当前已接受请求，再接受新的请求');
        return;
      }
      if (status === 'accepted' && selected.response !== 'pending') {
        showToast('info', '该请求已处理', '请切换其他待处理意向请求');
        return;
      }
      if (status === 'rejected' && selected.response !== 'pending' && !(selected.response === 'accepted' && activeConn && activeConn.id === selected.id)) {
        showToast('info', '该请求已处理', '请切换其他待处理意向请求');
        return;
      }

      if (status === 'accepted') {
        selected.response = 'accepted';
        state.activeRequestId = selected.id;
        currentDeal.status = 'interested';
        const originalAccepted = allDeals.find((d) => d.id === currentDeal.id);
        if (originalAccepted) originalAccepted.status = 'interested';
        localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
        syncLegacyIntentFields(state);
        saveIntentState();
        pushTimelineEvent('intent_accepted', '融资方接受沟通（' + selected.id + '）', getPublicTermsFromWorkbench());
        renderIntentRequestList(state);
        renderIntentPerspective(state);
        renderIntentSummaryAndResponse(state);
        showToast('success', '已接受意向', '项目可继续进入条款工作台');
        switchSessionTab('workbench');
        return;
      }

      if (status === 'rejected') {
        selected.response = 'rejected';
        if (state.activeRequestId === selected.id) {
          state.activeRequestId = '';
        }
        const hasLive = hasPendingIntent(state) || hasAcceptedIntent(state);
        currentDeal.status = hasLive ? 'interested' : 'open';
        const originalRejected = allDeals.find((d) => d.id === currentDeal.id);
        if (originalRejected) originalRejected.status = currentDeal.status;
        localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
        syncLegacyIntentFields(state);
        saveIntentState();
        pushTimelineEvent('intent_rejected', '融资方暂不考虑当前意向（' + selected.id + '）', getPublicTermsFromWorkbench());
        renderIntentRequestList(state);
        renderIntentPerspective(state);
        renderIntentSummaryAndResponse(state);
        showToast('info', '已拒绝当前意向', '可继续处理其他意向请求');
      }
    }

    function mockIntentResponse(status) {
      handleIntentDecision(status);
    }
