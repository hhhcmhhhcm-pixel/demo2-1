    // ==================== 意向红点通知 ====================
    function saveIntentReadState() {
      localStorage.setItem('ec_intentReadByDeal', JSON.stringify(intentReadByDeal));
    }

    function markIntentRequestsAsRead() {
      if (!currentDeal) return;
      var dealId = currentDeal.id;
      var state = intentByDeal[dealId];
      if (!state || !Array.isArray(state.requests)) return;
      if (!intentReadByDeal[dealId]) intentReadByDeal[dealId] = {};
      var now = Date.now();
      state.requests.forEach(function(r) {
        intentReadByDeal[dealId][r.id] = now;
      });
      saveIntentReadState();
      updateIntentUnreadDot();
    }

    function getIntentUnreadCount() {
      if (!currentDeal) return 0;
      var dealId = currentDeal.id;
      var state = intentByDeal[dealId];
      if (!state || !Array.isArray(state.requests) || !state.requests.length) return 0;
      var readMap = intentReadByDeal[dealId] || {};
      var count = 0;
      state.requests.forEach(function(r) {
        var lastRead = readMap[r.id] || 0;
        var requestTime = new Date(r.updatedAt || r.submittedAt || 0).getTime();
        if (requestTime > lastRead) count++;
      });
      return count;
    }

    function updateIntentUnreadDot() {
      var dot = document.getElementById('intentUnreadDot');
      if (!dot) return;
      if (currentPerspective !== 'financer') {
        dot.classList.add('hidden');
        return;
      }
      var count = getIntentUnreadCount();
      if (count > 0) {
        dot.classList.remove('hidden');
        dot.textContent = String(count);
      } else {
        dot.classList.add('hidden');
      }
    }

    // ==================== 投资方模拟画像 ====================
    // 投资方模拟画像（根据 fromName hash 生成稳定的模拟数据）
    var INVESTOR_PROFILES = [
      { type: '私募股权基金', aum: '12.5亿', preference: 'RBF / 收入分成', deals: 23, region: '华东' },
      { type: '产业投资基金', aum: '8.2亿', preference: '股权+RBF混合', deals: 15, region: '华南' },
      { type: '家族办公室', aum: '5.8亿', preference: '保守型RBF', deals: 9, region: '华北' },
      { type: '天使投资机构', aum: '3.1亿', preference: '早期高成长', deals: 31, region: '全国' },
      { type: '银行系投资平台', aum: '25.0亿', preference: '低风险稳健型', deals: 47, region: '长三角' },
      { type: '独立投资人', aum: '1.2亿', preference: '餐饮零售专注', deals: 6, region: '西南' }
    ];

    function getInvestorProfile(fromName) {
      var hash = 0;
      var name = fromName || '投资方';
      for (var i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
      var idx = Math.abs(hash) % INVESTOR_PROFILES.length;
      return INVESTOR_PROFILES[idx];
    }

    function toggleIntentCard(requestId) {
      if (expandedIntentCards.has(requestId)) {
        expandedIntentCards.delete(requestId);
      } else {
        expandedIntentCards.add(requestId);
      }
      var body = document.getElementById('intentCardBody-' + requestId);
      var chevron = document.getElementById('intentCardChevron-' + requestId);
      if (body) body.classList.toggle('hidden');
      if (chevron) chevron.classList.toggle('rotate-180');
    }

    function handleFinancerCardAction(requestId, status) {
      if (!currentDeal) return;
      var state = ensureIntentState();
      if (!state) return;
      state.selectedRequestId = requestId;
      syncLegacyIntentFields(state);
      saveIntentState();
      handleIntentDecision(status);
    }

    function renderFinancerIntentCards(state) {
      var container = document.getElementById('intentFinancerCardList');
      var countEl = document.getElementById('intentFinancerCount');
      var requests = getIntentRequests(state);
      if (countEl) countEl.textContent = requests.length + ' 条';
      if (!container) return;
      if (!requests.length) {
        container.innerHTML = '<p class="text-sm text-gray-400 text-center py-6">暂无投资方意向请求。</p>';
        return;
      }
      var activeConn = getActiveIntentRequest(state);
      var readMap = (currentDeal && intentReadByDeal[currentDeal.id]) || {};
      container.innerHTML = requests.map(function(req) {
        var expanded = expandedIntentCards.has(req.id);
        var profile = getInvestorProfile(req.fromName);
        var statusMap = {
          pending: { text: '待处理', cls: 'bg-amber-50 text-amber-700' },
          accepted: { text: '已接受', cls: 'bg-emerald-50 text-emerald-700' },
          rejected: { text: '已拒绝', cls: 'bg-rose-50 text-rose-700' }
        };
        var st = statusMap[req.response] || statusMap.pending;
        var at = req.submittedAt ? req.submittedAt.slice(0, 16).replace('T', ' ') : '--';
        var locked = !!activeConn && activeConn.id !== req.id;
        // 未读检测
        var lastRead = readMap[req.id] || 0;
        var requestTime = new Date(req.updatedAt || req.submittedAt || 0).getTime();
        var isUnread = requestTime > lastRead;
        var canAccept = req.response === 'pending' && !locked;
        var canReject = req.response === 'pending' || (req.response === 'accepted' && activeConn && activeConn.id === req.id);

        // 意向摘要
        var summary = (req.investmentType || req.amountBand || req.amountText || req.note || (Array.isArray(req.concerns) && req.concerns.length))
          ? buildIntentSummaryText(req) : (req.summary || '无摘要');

        // 投资方基础信息
        var investorInfoHtml =
          '<div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">' +
            '<div class="p-2.5 rounded-lg bg-amber-50 border border-amber-100"><p class="text-[11px] text-gray-400">投资方</p><p class="text-xs font-semibold text-gray-800">' + (req.fromName || '投资方') + '</p></div>' +
            '<div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">机构类型</p><p class="text-xs font-semibold text-gray-800">' + profile.type + '</p></div>' +
            '<div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">管理规模</p><p class="text-xs font-semibold text-gray-800">' + profile.aum + '</p></div>' +
            '<div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">投资偏好</p><p class="text-xs font-semibold text-gray-800">' + profile.preference + '</p></div>' +
            '<div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">历史成交</p><p class="text-xs font-semibold text-gray-800">' + profile.deals + ' 笔</p></div>' +
            '<div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">投资区域</p><p class="text-xs font-semibold text-gray-800">' + profile.region + '</p></div>' +
          '</div>';

        // 投资人联系方式
        var isAccepted = req.response === 'accepted';
        var contactName = profile.contactName || (req.fromName ? req.fromName.charAt(0) + '先生' : '张先生');
        var _ph = (req.fromName || 'inv').split('').reduce(function(a, c) { return ((a << 5) - a + c.charCodeAt(0)) | 0; }, 0);
        var contactPhone = profile.contactPhone || '138' + String(Math.abs(_ph)).slice(0, 8).padEnd(8, '0');
        var contactWechat = profile.contactWechat || 'wx_' + (req.fromName || 'investor').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').toLowerCase();
        var investorContactHtml =
          '<div class="mb-3">' +
            '<h4 class="text-xs font-bold text-gray-700 mb-2"><i class="fas fa-address-book mr-1.5 text-blue-500"></i>投资人联系方式</h4>' +
            (isAccepted
              ? '<div class="grid grid-cols-3 gap-2">' +
                  '<div class="p-2 rounded-lg bg-blue-50 border border-blue-100"><p class="text-[11px] text-gray-400">联系人</p><p class="text-xs font-semibold text-gray-800">' + contactName + '</p></div>' +
                  '<div class="p-2 rounded-lg bg-blue-50 border border-blue-100"><p class="text-[11px] text-gray-400">联系电话</p><p class="text-xs font-semibold text-gray-800">' + contactPhone + '</p></div>' +
                  '<div class="p-2 rounded-lg bg-blue-50 border border-blue-100"><p class="text-[11px] text-gray-400">微信号</p><p class="text-xs font-semibold text-gray-800">' + contactWechat + '</p></div>' +
                '</div>'
              : '<div class="grid grid-cols-3 gap-2">' +
                  '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">联系人</p><p class="text-xs font-semibold text-gray-800">' + contactName + '</p></div>' +
                  '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">联系电话</p><p class="text-xs font-semibold text-gray-400">***********</p></div>' +
                  '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">微信号</p><p class="text-xs font-semibold text-gray-400">***********</p></div>' +
                '</div>' +
                '<p class="text-[11px] text-amber-600 mt-1.5"><i class="fas fa-lock mr-1"></i>当前未通过意向申请，请通过意向申请后再查看投资人联系方式</p>'
            ) +
          '</div>';

        // 意向详情
        var intentDetailHtml =
          '<div class="mb-3">' +
            '<h4 class="text-xs font-bold text-gray-700 mb-2"><i class="fas fa-file-signature mr-1.5 text-cyan-500"></i>意向内容</h4>' +
            '<div class="grid grid-cols-2 gap-2 mb-2">' +
              '<div class="p-2 rounded-lg bg-teal-50 border border-teal-100"><p class="text-[11px] text-gray-400">投资类型</p><p class="text-xs font-semibold text-gray-800">' + (req.investmentType || 'RBF YITO') + '</p></div>' +
              '<div class="p-2 rounded-lg bg-teal-50 border border-teal-100"><p class="text-[11px] text-gray-400">意向金额</p><p class="text-xs font-semibold text-gray-800">' + (req.amountText || getIntentAmountText(req)) + '</p></div>' +
            '</div>' +
            (Array.isArray(req.concerns) && req.concerns.length ? '<div class="flex flex-wrap gap-1 mb-2">' + req.concerns.map(function(c) { return '<span class="text-[10px] px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-100">' + c + '</span>'; }).join('') + '</div>' : '') +
            (req.note ? '<p class="text-[11px] text-gray-500"><i class="fas fa-comment-dots mr-1 text-gray-400"></i>' + req.note + '</p>' : '') +
          '</div>';

        // 操作按钮
        var actionHtml = '';
        if (req.response === 'pending' || (req.response === 'accepted' && activeConn && activeConn.id === req.id)) {
          var dis = locked ? ' disabled style="opacity:0.4;cursor:not-allowed;"' : '';
          actionHtml = '<div class="flex gap-2 pt-3 border-t border-gray-100">' +
            (canAccept ? '<button onclick="handleFinancerCardAction(\'' + req.id + '\',\'accepted\')" class="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"' + dis + '>接受沟通</button>' : '') +
            (canReject ? '<button onclick="handleFinancerCardAction(\'' + req.id + '\',\'rejected\')" class="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"' + dis + '>' + (req.response === 'accepted' ? '拒绝并释放锁定' : '暂不考虑') + '</button>' : '') +
          '</div>';
        }

        var borderColor = req.response === 'accepted' ? 'border-emerald-200' : (req.response === 'rejected' ? 'border-rose-200' : 'border-gray-100');
        var lockOverlay = locked ? ' opacity-60' : '';

        return '<div class="bg-white rounded-2xl border ' + borderColor + ' overflow-hidden' + lockOverlay + '">' +
          // 卡片头部
          '<div class="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors" onclick="toggleIntentCard(\'' + req.id + '\')">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#f59e0b,#d97706);"><span class="text-white text-xs font-bold">' + (req.fromName || '投')[0] + '</span></div>' +
              '<div>' +
                '<p class="text-sm font-semibold text-gray-800">' + (req.fromName || '投资方') + '</p>' +
                '<p class="text-[11px] text-gray-400">' + profile.type + ' · ' + at + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
              (isUnread ? '<span class="inline-block w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>' : '') +
              (locked ? '<span class="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-500">已锁定</span>' : '') +
              '<span class="text-[10px] px-2 py-0.5 rounded ' + st.cls + '">' + st.text + '</span>' +
              '<i id="intentCardChevron-' + req.id + '" class="fas fa-chevron-down text-gray-400 text-xs transition-transform' + (expanded ? ' rotate-180' : '') + '"></i>' +
            '</div>' +
          '</div>' +
          // 卡片展开内容
          '<div id="intentCardBody-' + req.id + '" class="px-4 pb-4' + (expanded ? '' : ' hidden') + '">' +
            '<div class="border-t border-gray-100 pt-3">' +
              '<h4 class="text-xs font-bold text-gray-700 mb-2"><i class="fas fa-user-tie mr-1.5 text-amber-500"></i>投资方信息</h4>' +
              investorInfoHtml +
              investorContactHtml +
              intentDetailHtml +
              actionHtml +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

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
          investmentType: 'RBF YITO',
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
      if (state.amountText && !state.amountBand) return state.amountText;
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

    function buildIntentSummaryText(source) {
      if (!currentDeal) return '';
      const concerns = Array.isArray(source?.concerns) ? source.concerns : [];
      const concernsText = concerns.length > 0 ? concerns.join('、') : '暂无额外关注点';
      const noteText = source?.note ? '备注：' + source.note : '备注：无';
      const invType = source?.investmentType || 'RBF YITO';
      return '项目：' + currentDeal.name +
        '；投资类型：' + invType +
        '；意向金额：' + getIntentAmountText(source || {}) +
        '；核心关注：' + concernsText +
        '；参考：AI评分' + currentDeal.aiScore + ' / 风控' + (currentDeal.riskGrade || 'N/A') +
        '；' + noteText;
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
        const summary = (req.investmentType || req.amountBand || req.amountText || req.note || (Array.isArray(req.concerns) && req.concerns.length))
          ? buildIntentSummaryText(req)
          : (req.summary || '无摘要');
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
      const selectedSummary = selected
        ? ((selected.investmentType || selected.amountBand || selected.amountText || selected.note || (Array.isArray(selected.concerns) && selected.concerns.length))
            ? buildIntentSummaryText(selected)
            : (selected.summary || ''))
        : '';

      if (summaryBox) {
        if (selectedSummary) {
          summaryBox.textContent = selectedSummary;
        } else if (currentPerspective === 'financer') {
          summaryBox.textContent = '尚未收到投资方提交的结构化意向。';
        } else {
          summaryBox.textContent = state.summary || buildIntentSummaryText(state) || '尚未生成摘要。';
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
      // 切换融资方/投资方视图容器
      var financerView = document.getElementById('intentFinancerView');
      var investorView = document.getElementById('intentInvestorView');
      if (financerView) financerView.classList.toggle('hidden', !isFinancer);
      if (investorView) investorView.classList.toggle('hidden', isFinancer);
      // 融资方走独立卡片渲染，不再操作投资方视图DOM
      if (isFinancer) {
        renderFinancerIntentCards(state);
        return;
      }
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
      if (typeEl) typeEl.value = formSource.investmentType || 'RBF YITO';
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

      // 投资方视角：按钮文案根据是否已发送过意向动态切换
      if (currentPerspective !== 'financer') {
        var myName = (currentUser && (currentUser.displayName || currentUser.username)) || '投资方';
        var hasExisting = state.requests.some(function(r) { return r.fromName === myName; });
        var submitBtn = document.getElementById('btnSubmitIntent');
        if (submitBtn) {
          submitBtn.textContent = hasExisting ? '修改并更新意向' : '确认并发送意向';
        }
      }
    }

    function updateIntentAndPreview() {
      if (!currentDeal) return;
      if (currentPerspective === 'financer') return;
      const state = ensureIntentState();
      if (!state) return;
      state.investmentType = document.getElementById('intentInvestmentType')?.value || 'RBF YITO';
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
      state.summary = buildIntentSummaryText(state);
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
      updateIntentAndPreview();
      if (state.amountBand === 'custom') {
        const min = parseWanValue(state.customMin);
        const max = parseWanValue(state.customMax);
        if (!(min > 0 && max > 0 && max >= min)) {
          showToast('warning', '自定义区间无效', '请填写有效金额区间（最大值需>=最小值）');
          return;
        }
      }
      state.summary = buildIntentSummaryText(state);
      if (!state.summary) return;

      // 查找当前投资方已有的意向请求
      var myName = (currentUser && (currentUser.displayName || currentUser.username)) || '投资方';
      var existing = state.requests.find(function(r) { return r.fromName === myName; });

      if (existing) {
        // 修改已发送的意向
        existing.summary = state.summary;
        existing.investmentType = state.investmentType || 'RBF YITO';
        existing.amountBand = state.amountBand || '300-500';
        existing.customMin = state.customMin || '';
        existing.customMax = state.customMax || '';
        existing.amountText = getIntentAmountText(state);
        existing.concerns = (state.concerns || []).slice();
        existing.note = state.note || '';
        existing.updatedAt = new Date().toISOString();
        state.selectedRequestId = existing.id;
        syncLegacyIntentFields(state);
        saveIntentState();
        pushTimelineEvent('intent_updated', '修改结构化意向（' + existing.id + '）', getPublicTermsFromWorkbench());
        renderIntentTab();
        updateIntentUnreadDot();
        showToast('success', '意向已更新', '融资方将看到最新修改内容');
      } else {
        // 首次发送意向
        const request = {
          id: 'IR_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          submittedAt: new Date().toISOString(),
          response: 'pending',
          summary: state.summary,
          fromName: myName,
          investmentType: state.investmentType || 'RBF YITO',
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
        renderIntentTab();
        updateIntentUnreadDot();
        showToast('success', '意向已发送', '融资方将收到结构化意向摘要');
      }
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
