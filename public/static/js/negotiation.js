    function saveNegotiationState() {
      localStorage.setItem('ec_negotiationByDeal', JSON.stringify(negotiationByDeal));
    }

    function saveTimelineState() {
      localStorage.setItem('ec_timelineByDeal', JSON.stringify(timelineByDeal));
    }

    function saveContractPayloadState() {
      localStorage.setItem('ec_contractPayloadByDeal', JSON.stringify(contractPayloadByDeal));
    }

    function getPublicTermsFromWorkbench() {
      const state = ensureWorkbenchState();
      if (!state) return null;
      return {
        amountWan: Number(state.publicAmountWan),
        sharePct: Number(state.publicSharePct),
        aprPct: Number(state.publicAprPct),
        termMonths: Number(state.publicTermMonths)
      };
    }

    function ensureTimelineState() {
      if (!currentDeal) return [];
      const dealId = currentDeal.id;
      if (!timelineByDeal[dealId]) timelineByDeal[dealId] = [];
      return timelineByDeal[dealId];
    }

    function pushTimelineEvent(type, summary, publicTerms) {
      if (!currentDeal) return;
      const list = ensureTimelineState();
      list.unshift({
        id: 'E_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        at: new Date().toISOString(),
        actor: (currentUser && (currentUser.displayName || currentUser.username)) || '我方',
        role: currentPerspective || 'investor',
        type,
        summary,
        publicTerms: publicTerms || null
      });
      saveTimelineState();
    }

    function ensureNegotiationState() {
      if (!currentDeal) return null;
      const dealId = currentDeal.id;
      if (negotiationByDeal[dealId]) return negotiationByDeal[dealId];
      negotiationByDeal[dealId] = {
        proposals: [],
        memos: [],
        invite: null
      };
      saveNegotiationState();
      return negotiationByDeal[dealId];
    }

    function applyPublicTermsToWorkbench(terms) {
      if (!terms) return;
      const wb = ensureWorkbenchState();
      if (!wb) return;
      wb.publicAmountWan = Number(terms.amountWan);
      wb.publicSharePct = Number(terms.sharePct);
      wb.publicAprPct = Number(terms.aprPct);
      wb.publicTermMonths = Number(terms.termMonths);
      saveWorkbenchState();
      recalcWorkbench();
      renderWorkbench();
    }

    function formatTermsInline(terms) {
      if (!terms) return '--';
      return '金额 ' + Number(terms.amountWan).toFixed(1) + '万 / 比例 ' + Number(terms.sharePct).toFixed(2) + '% / APR ' + Number(terms.aprPct).toFixed(2) + '% / 期限 ' + Number(terms.termMonths).toFixed(0) + '月';
    }

    // ---- 多方案对比：动态渲染所有提交的方案卡片 ----
    function renderProposalGrid(state) {
      var grid = document.getElementById('negProposalGrid');
      var empty = document.getElementById('negProposalEmpty');
      if (!grid) return;

      var proposals = state.proposals || [];
      if (proposals.length === 0) {
        grid.innerHTML = '<p id="negProposalEmpty" class="text-sm text-gray-400 col-span-full py-6 text-center">暂无方案，请在条款工作台中提交方案草稿。</p>';
        return;
      }

      grid.innerHTML = proposals.map(function(p, idx) {
        var isFinancer = p.perspective === 'financer';
        var borderColor = isFinancer ? 'border-amber-200' : 'border-teal-200';
        var bgColor = isFinancer ? 'bg-amber-50/50' : 'bg-teal-50/50';
        var badgeColor = isFinancer ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700';
        var roleName = isFinancer ? '融资方' : '投资方';
        var statusText = getProposalStatusText(p.status);
        var statusCls = p.status === 'agreed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
        var t = p.publicTerms || {};
        var time = p.createdAt ? p.createdAt.slice(5, 16).replace('T', ' ') : '';

        return '<div class="p-3.5 rounded-xl border ' + borderColor + ' ' + bgColor + ' cursor-pointer hover:shadow-md transition-shadow" onclick="showProposalDetail(\'' + p.id + '\')">' +
          '<div class="flex items-center justify-between mb-2">' +
            '<span class="text-xs font-bold text-gray-800">方案 #' + (proposals.length - idx) + '</span>' +
            '<div class="flex items-center gap-1">' +
              '<span class="text-[10px] px-1.5 py-0.5 rounded ' + badgeColor + '">' + roleName + '</span>' +
              '<span class="text-[10px] px-1.5 py-0.5 rounded ' + statusCls + '">' + statusText + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-1.5 text-xs">' +
            '<div class="p-1.5 rounded bg-white/70"><span class="text-gray-400">金额</span> <span class="font-semibold text-gray-700">' + Number(t.amountWan || 0).toFixed(1) + '万</span></div>' +
            '<div class="p-1.5 rounded bg-white/70"><span class="text-gray-400">比例</span> <span class="font-semibold text-gray-700">' + Number(t.sharePct || 0).toFixed(2) + '%</span></div>' +
            '<div class="p-1.5 rounded bg-white/70"><span class="text-gray-400">APR</span> <span class="font-semibold text-gray-700">' + Number(t.aprPct || 0).toFixed(2) + '%</span></div>' +
            '<div class="p-1.5 rounded bg-white/70"><span class="text-gray-400">期限</span> <span class="font-semibold text-gray-700">' + Number(t.termMonths || 0).toFixed(0) + '月</span></div>' +
          '</div>' +
          '<div class="flex items-center justify-between mt-2">' +
            '<span class="text-[10px] text-gray-400">' + (p.actor || '') + ' · ' + time + '</span>' +
            '<span class="text-[10px] text-cyan-600 font-semibold">查看详情 →</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // ---- 方案详情弹窗 ----
    var currentProposalDetailId = null;

    function showProposalDetail(proposalId) {
      var state = ensureNegotiationState();
      if (!state) return;
      var p = state.proposals.find(function(x) { return x.id === proposalId; });
      if (!p) return;
      currentProposalDetailId = proposalId;

      var overlay = document.getElementById('proposalDetailOverlay');
      if (!overlay) return;
      overlay.classList.remove('hidden');

      var isFinancer = p.perspective === 'financer';
      var roleName = isFinancer ? '融资方' : '投资方';
      var time = p.createdAt ? p.createdAt.slice(0, 16).replace('T', ' ') : '';
      setText('pdTitle', '方案详情 · ' + p.id);
      var metaEl = document.getElementById('pdMeta');
      if (metaEl) metaEl.textContent = '由 ' + (p.actor || roleName) + ' 于 ' + time + ' 提交 · 状态：' + getProposalStatusText(p.status);

      // 公共条款
      var t = p.publicTerms || {};
      var pubEl = document.getElementById('pdPublic');
      if (pubEl) pubEl.innerHTML =
        pdCell('融资金额', Number(t.amountWan || 0).toFixed(1) + ' 万') +
        pdCell('分成比例', Number(t.sharePct || 0).toFixed(2) + '%') +
        pdCell('APR', Number(t.aprPct || 0).toFixed(2) + '%') +
        pdCell('合作期限', Number(t.termMonths || 0).toFixed(0) + ' 月');

      // 私有预测
      var priv = p.privateData || {};
      var srcMap = { system: '模型预估', borrower: '融资方预估', self: '自行填写' };
      var privEl = document.getElementById('pdPrivate');
      if (privEl) privEl.innerHTML =
        pdCell('预测月均营业额', Number(priv.revenueWan || 0).toFixed(1) + ' 万') +
        pdCell('来源', srcMap[priv.source] || priv.source || '--');

      // 派生指标
      var d = p.derivedData || {};
      var derEl = document.getElementById('pdDerived');
      if (derEl) derEl.innerHTML =
        pdCell('月回款', fmtWanOrDash(d.monthlyPaybackWan)) +
        pdCell('建议融资上限', fmtWanOrDash(d.suggestedAmountWan)) +
        pdCell('建议分成比例', fmtPctOrDash(d.suggestedSharePct)) +
        pdCell('触达月数', fmtMonOrDash(d.touchMonths)) +
        pdCell('总回款', fmtWanOrDash(d.totalPaybackWan)) +
        pdCell('实际APR', fmtPctOrDash(d.actualAprPct)) +
        pdCell('回收倍数', Number.isFinite(d.recoveryMultiple) ? d.recoveryMultiple.toFixed(2) + 'x' : '--');

      // 编辑区：仅方案发起方视角可编辑
      var editSection = document.getElementById('pdEditSection');
      var canEdit = (p.perspective === (currentPerspective || 'investor')) && (p.status === 'draft' || p.status === 'pending');
      if (editSection) {
        editSection.classList.toggle('hidden', !canEdit);
        if (canEdit) {
          var ea = document.getElementById('pdEditAmount');
          var es = document.getElementById('pdEditShare');
          var ep = document.getElementById('pdEditApr');
          var et = document.getElementById('pdEditTerm');
          if (ea) ea.value = t.amountWan || '';
          if (es) es.value = t.sharePct || '';
          if (ep) ep.value = t.aprPct || '';
          if (et) et.value = t.termMonths || '';
          var saveBtn = document.getElementById('pdSaveEditBtn');
          if (saveBtn) saveBtn.onclick = function() { saveProposalEdit(proposalId); };
        }
      }

      // 沟通消息
      renderProposalMessages(p);
      var sendBtn = document.getElementById('pdSendMsgBtn');
      if (sendBtn) sendBtn.onclick = function() { sendProposalMessage(proposalId); };
    }

    function pdCell(label, value) {
      return '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">' + label + '</p><p class="font-semibold text-gray-800 text-xs">' + value + '</p></div>';
    }

    function fmtWanOrDash(v) { return Number.isFinite(v) ? v.toFixed(1) + ' 万' : '--'; }
    function fmtPctOrDash(v) { return Number.isFinite(v) ? v.toFixed(2) + '%' : '--'; }
    function fmtMonOrDash(v) { return Number.isFinite(v) ? v.toFixed(1) + ' 月' : '--'; }

    function closeProposalDetail() {
      var overlay = document.getElementById('proposalDetailOverlay');
      if (overlay) overlay.classList.add('hidden');
      currentProposalDetailId = null;
    }

    function saveProposalEdit(proposalId) {
      var state = ensureNegotiationState();
      if (!state) return;
      var p = state.proposals.find(function(x) { return x.id === proposalId; });
      if (!p) return;

      var ea = document.getElementById('pdEditAmount');
      var es = document.getElementById('pdEditShare');
      var ep = document.getElementById('pdEditApr');
      var et = document.getElementById('pdEditTerm');
      var newAmount = parseFloat(ea ? ea.value : '');
      var newShare = parseFloat(es ? es.value : '');
      var newApr = parseFloat(ep ? ep.value : '');
      var newTerm = parseInt(et ? et.value : '', 10);

      if (Number.isFinite(newAmount) && newAmount > 0) p.publicTerms.amountWan = +newAmount.toFixed(1);
      if (Number.isFinite(newShare) && newShare > 0) p.publicTerms.sharePct = +newShare.toFixed(2);
      if (Number.isFinite(newApr) && newApr >= 0) p.publicTerms.aprPct = +newApr.toFixed(2);
      if (Number.isFinite(newTerm) && newTerm > 0) p.publicTerms.termMonths = newTerm;

      // 重算派生指标
      var mockState = {
        publicAmountWan: p.publicTerms.amountWan,
        publicSharePct: p.publicTerms.sharePct,
        publicAprPct: p.publicTerms.aprPct,
        publicTermMonths: p.publicTerms.termMonths,
        privateRevenueWan: p.privateData ? p.privateData.revenueWan : 0
      };
      var newDerived = computeWorkbenchDerived(mockState);
      p.derivedData = {
        monthlyPaybackWan: newDerived.monthlyPaybackWan,
        suggestedAmountWan: newDerived.suggestedAmountWan,
        suggestedSharePct: newDerived.suggestedSharePct,
        touchMonths: newDerived.touchMonths,
        totalPaybackWan: newDerived.totalPaybackWan,
        actualAprPct: newDerived.actualAprPct,
        recoveryMultiple: newDerived.recoveryMultiple
      };

      p.updatedAt = new Date().toISOString();
      saveNegotiationState();
      pushTimelineEvent('proposal_edited', '修改方案 ' + p.id, p.publicTerms);
      showProposalDetail(proposalId);
      renderNegotiationTab();
      showToast('success', '方案已更新', '公共条款与派生指标已重算');
    }

    function renderProposalMessages(p) {
      var box = document.getElementById('pdMessages');
      if (!box) return;
      var msgs = p.messages || [];
      if (msgs.length === 0) {
        box.innerHTML = '<p class="text-xs text-gray-400 text-center py-2">暂无沟通记录</p>';
        return;
      }
      box.innerHTML = msgs.map(function(m) {
        var isFinancer = m.perspective === 'financer';
        var align = isFinancer ? 'text-right' : 'text-left';
        var bgCls = isFinancer ? 'bg-amber-50 border-amber-100' : 'bg-teal-50 border-teal-100';
        var roleName = isFinancer ? '融资方' : '投资方';
        var time = m.at ? m.at.slice(11, 16) : '';
        return '<div class="' + align + '">' +
          '<div class="inline-block max-w-[80%] p-2 rounded-lg border ' + bgCls + ' text-xs text-gray-700">' +
            '<span class="font-semibold">' + roleName + '</span> <span class="text-gray-400">' + time + '</span>' +
            '<p class="mt-0.5">' + m.text + '</p>' +
          '</div></div>';
      }).join('');
      box.scrollTop = box.scrollHeight;
    }

    function sendProposalMessage(proposalId) {
      var input = document.getElementById('pdMsgInput');
      if (!input) return;
      var text = input.value.trim();
      if (!text) return;

      var state = ensureNegotiationState();
      if (!state) return;
      var p = state.proposals.find(function(x) { return x.id === proposalId; });
      if (!p) return;

      if (!p.messages) p.messages = [];
      p.messages.push({
        perspective: currentPerspective || 'investor',
        actor: (currentUser && (currentUser.displayName || currentUser.username)) || (currentPerspective === 'financer' ? '融资方' : '投资方'),
        text: text,
        at: new Date().toISOString()
      });
      input.value = '';
      saveNegotiationState();
      renderProposalMessages(p);
    }

    // ---- 提案状态与记录 ----
    function getProposalStatusText(status) {
      if (status === 'draft') return '草稿';
      if (status === 'pending') return '待响应';
      if (status === 'accepted') return '已接受';
      if (status === 'rejected') return '已拒绝';
      if (status === 'countered') return '反提案';
      if (status === 'withdrawn') return '已撤回';
      if (status === 'agreed') return '条款达成';
      return status || '未知';
    }

    function renderNegotiationProposals(state) {
      const list = document.getElementById('negProposalList');
      if (!list) return;
      if (!state.proposals.length && !state.memos.length) {
        list.textContent = '暂无提案记录。';
        return;
      }

      const proposalHtml = state.proposals.map(function(p) {
        var isFinancer = p.perspective === 'financer';
        var roleName = isFinancer ? '融资方' : '投资方';
        var actions = [];
        if (p.status === 'draft' || p.status === 'pending') {
          actions.push('<button onclick="respondNegotiation(\'' + p.id + '\',\'accept\')" class="px-2 py-1 text-[11px] rounded bg-emerald-600 text-white">接受</button>');
          actions.push('<button onclick="respondNegotiation(\'' + p.id + '\',\'reject\')" class="px-2 py-1 text-[11px] rounded bg-rose-600 text-white">拒绝</button>');
          actions.push('<button onclick="respondNegotiation(\'' + p.id + '\',\'counter\')" class="px-2 py-1 text-[11px] rounded bg-cyan-600 text-white">反提案</button>');
          if (p.perspective === (currentPerspective || 'investor')) {
            actions.push('<button onclick="withdrawNegotiationProposal(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700">撤回</button>');
          }
        } else if (p.status === 'accepted') {
          actions.push('<button onclick="confirmNegotiationTerms(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded bg-teal-600 text-white">确认条款达成</button>');
        } else if (p.status === 'countered' && p.counterTerms) {
          // 反提案发起方可撤回
          if (p.counterBy === (currentPerspective || 'investor')) {
            actions.push('<button onclick="withdrawCounterProposal(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700">撤回反提案</button>');
          }
          // 原方案方可接受反提案
          if (p.perspective === (currentPerspective || 'investor')) {
            actions.push('<button onclick="acceptCounterProposal(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded bg-emerald-600 text-white">接受反提案</button>');
          }
        }

        var counterByName = p.counterBy === 'financer' ? '融资方' : '投资方';
        return '<div class="p-3 rounded-xl border border-gray-100 bg-gray-50">' +
          '<div class="flex items-center justify-between mb-1"><p class="text-xs font-semibold text-gray-700">' + roleName + ' · ' + p.id + '</p><span class="text-[11px] px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">' + getProposalStatusText(p.status) + '</span></div>' +
          '<p class="text-xs text-gray-500 mb-1">' + formatTermsInline(p.publicTerms) + '</p>' +
          (p.counterTerms ? '<p class="text-xs text-cyan-700 mb-1">' + counterByName + '反提案：' + formatTermsInline(p.counterTerms) + '</p>' : '') +
          (actions.length ? '<div class="flex flex-wrap gap-1 mt-2">' + actions.join('') + '</div>' : '') +
        '</div>';
      }).join('');

      const memoHtml = state.memos.map(function(m) {
        return '<div class="p-3 rounded-xl border border-indigo-100 bg-indigo-50">' +
          '<p class="text-xs font-semibold text-indigo-700 mb-1">纪要 · ' + (m.status === 'confirmed' ? '已确认' : '待确认') + '</p>' +
          '<p class="text-xs text-indigo-700">' + m.content + '</p>' +
        '</div>';
      }).join('');

      list.innerHTML = proposalHtml + memoHtml;
    }

    function renderNegotiationTab() {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      var intent = (typeof ensureIntentState === 'function') ? ensureIntentState() : null;

      var gate = document.getElementById('negotiationGateTip');
      if (gate) {
        var count = state.proposals ? state.proposals.length : 0;
        if (count > 0) {
          gate.className = 'text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-700';
          gate.textContent = '共 ' + count + ' 个方案';
        } else {
          gate.className = 'text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700';
          gate.textContent = '在条款工作台提交方案后，方案将出现在此处';
        }
      }

      renderProposalGrid(state);
      renderNegotiationProposals(state);

      var invite = document.getElementById('negInviteBox');
      if (invite) {
        if (state.invite) invite.textContent = '链接：' + state.invite.link + '（角色：' + (state.invite.role === 'negotiator' ? '谈判者' : '观察者') + '，有效期至 ' + state.invite.expiresAt.slice(0, 10) + '）';
        else invite.textContent = '尚未生成邀请链接。';
      }

      var payloadBox = document.getElementById('negContractPayloadBox');
      if (payloadBox) {
        var payload = contractPayloadByDeal[currentDeal.id];
        payloadBox.textContent = payload ? JSON.stringify(payload, null, 2) : '尚未达成条款，暂无输出。';
      }
    }

    // ---- 谈判操作 ----
    function findProposalById(proposalId) {
      var state = ensureNegotiationState();
      if (!state) return null;
      return state.proposals.find(function(p) { return p.id === proposalId; }) || null;
    }

    function respondNegotiation(proposalId, action) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || (proposal.status !== 'draft' && proposal.status !== 'pending')) return;
      if (action === 'accept') {
        proposal.status = 'accepted';
        pushTimelineEvent('proposal_accepted', '接受方案 ' + proposal.id, proposal.publicTerms);
        saveNegotiationState();
        renderNegotiationTab();
        showToast('success', '已接受', '可点击"确认条款达成"完成锁定');
      } else if (action === 'reject') {
        proposal.status = 'rejected';
        pushTimelineEvent('proposal_rejected', '拒绝方案 ' + proposal.id, proposal.publicTerms);
        saveNegotiationState();
        renderNegotiationTab();
        showToast('info', '已拒绝', '可调整参数后重新提交');
      } else if (action === 'counter') {
        // 打开反提案弹窗，预填原方案数据
        openCounterOverlay(proposalId);
      }
    }

    // ---- 反提案弹窗 ----
    var counterTargetProposalId = null;

    function openCounterOverlay(proposalId) {
      var proposal = findProposalById(proposalId);
      if (!proposal) return;
      counterTargetProposalId = proposalId;
      var overlay = document.getElementById('counterOverlay');
      if (overlay) overlay.classList.remove('hidden');

      var info = document.getElementById('counterOrigInfo');
      if (info) info.textContent = '针对方案 ' + proposal.id + '（' + formatTermsInline(proposal.publicTerms) + '）';

      var t = proposal.publicTerms || {};
      var ea = document.getElementById('counterAmount');
      var es = document.getElementById('counterShare');
      var ep = document.getElementById('counterApr');
      var et = document.getElementById('counterTerm');
      if (ea) ea.value = t.amountWan || '';
      if (es) es.value = t.sharePct || '';
      if (ep) ep.value = t.aprPct || '';
      if (et) et.value = t.termMonths || '';

      var btn = document.getElementById('counterSubmitBtn');
      if (btn) btn.onclick = function() { submitCounterProposal(); };
    }

    function closeCounterOverlay() {
      var overlay = document.getElementById('counterOverlay');
      if (overlay) overlay.classList.add('hidden');
      counterTargetProposalId = null;
    }

    function submitCounterProposal() {
      if (!counterTargetProposalId || !currentDeal) return;
      var proposal = findProposalById(counterTargetProposalId);
      if (!proposal) return;

      var ea = document.getElementById('counterAmount');
      var es = document.getElementById('counterShare');
      var ep = document.getElementById('counterApr');
      var et = document.getElementById('counterTerm');
      var amount = parseFloat(ea ? ea.value : '');
      var share = parseFloat(es ? es.value : '');
      var apr = parseFloat(ep ? ep.value : '');
      var term = parseInt(et ? et.value : '', 10);

      if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(share) || share <= 0 || !Number.isFinite(apr) || !Number.isFinite(term) || term <= 0) {
        showToast('warning', '参数不完整', '请填写所有条款数值');
        return;
      }

      proposal.status = 'countered';
      proposal.counterTerms = {
        amountWan: +amount.toFixed(1),
        sharePct: +share.toFixed(2),
        aprPct: +apr.toFixed(2),
        termMonths: term
      };
      proposal.counterBy = currentPerspective || 'investor';
      proposal.counterAt = new Date().toISOString();

      saveNegotiationState();
      pushTimelineEvent('proposal_countered', '对方案 ' + proposal.id + ' 发起反提案', proposal.counterTerms);
      closeCounterOverlay();
      renderNegotiationTab();
      showToast('success', '反提案已提交', '对方可在谈判记录中查看您的反提案');
    }

    // ---- 撤回 ----
    function withdrawNegotiationProposal(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal) return;
      // 支持撤回：草稿、待响应、反提案状态
      if (proposal.status !== 'draft' && proposal.status !== 'pending' && proposal.status !== 'countered') {
        showToast('warning', '无法撤回', '当前状态不支持撤回');
        return;
      }
      proposal.status = 'withdrawn';
      saveNegotiationState();
      pushTimelineEvent('proposal_withdrawn', '撤回方案 ' + proposal.id, proposal.publicTerms);
      renderNegotiationTab();
      showToast('info', '方案已撤回', proposal.id);
    }

    // 撤回反提案（恢复原方案为待响应状态）
    function withdrawCounterProposal(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'countered') {
        showToast('warning', '无法撤回反提案', '当前状态不支持此操作');
        return;
      }
      proposal.status = 'pending';
      proposal.counterTerms = null;
      proposal.counterBy = null;
      proposal.counterAt = null;
      saveNegotiationState();
      pushTimelineEvent('counter_withdrawn', '撤回对方案 ' + proposal.id + ' 的反提案', proposal.publicTerms);
      renderNegotiationTab();
      showToast('info', '反提案已撤回', '方案恢复为待响应状态');
    }

    // 原方案方接受反提案 → 用反提案条款替换原方案，状态变为已接受
    function acceptCounterProposal(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'countered' || !proposal.counterTerms) return;
      proposal.publicTerms = proposal.counterTerms;
      proposal.status = 'accepted';
      proposal.counterTerms = null;
      saveNegotiationState();
      pushTimelineEvent('counter_accepted', '接受方案 ' + proposal.id + ' 的反提案条款', proposal.publicTerms);
      renderNegotiationTab();
      showToast('success', '已接受反提案', '可点击"确认条款达成"完成锁定');
    }

    function confirmNegotiationTerms(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'accepted') {
        showToast('warning', '无法确认', '仅已接受提案可确认达成');
        return;
      }
      proposal.status = 'agreed';
      currentDeal.status = 'confirmed';
      var original = allDeals.find(function(d) { return d.id === currentDeal.id; });
      if (original) original.status = 'confirmed';
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
      contractPayloadByDeal[currentDeal.id] = {
        dealId: currentDeal.id,
        projectName: currentDeal.name,
        sourceProposalId: proposal.id,
        confirmedAt: new Date().toISOString(),
        publicTerms: {
          amountWan: Number(proposal.publicTerms.amountWan),
          sharePct: Number(proposal.publicTerms.sharePct),
          aprPct: Number(proposal.publicTerms.aprPct),
          termMonths: Number(proposal.publicTerms.termMonths)
        }
      };
      saveContractPayloadState();
      saveNegotiationState();
      pushTimelineEvent('terms_confirmed', '方案 ' + proposal.id + ' 已达成并锁定公共条款', proposal.publicTerms);
      renderNegotiationTab();
      showToast('success', '条款已达成', '项目状态已更新为已确认');
    }

    function submitNegotiationMemo(status) {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      var input = document.getElementById('negMemoInput');
      var text = (input ? input.value : '').trim();
      if (!text) {
        showToast('warning', '纪要为空', '请先填写纪要内容');
        return;
      }
      state.memos.unshift({
        id: 'M_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        at: new Date().toISOString(),
        content: text,
        status: status
      });
      if (input) input.value = '';
      saveNegotiationState();
      pushTimelineEvent('memo_uploaded', '上传谈判纪要（' + (status === 'confirmed' ? '已确认' : '待确认') + '）', getPublicTermsFromWorkbench());
      renderNegotiationTab();
      showToast('success', '纪要已记录', status === 'confirmed' ? '纪要已确认' : '等待双方确认纪要');
    }

    function generateNegotiationInvite() {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      var role = (document.getElementById('negInviteRole') || {}).value || 'negotiator';
      var token = Math.random().toString(36).slice(2, 10);
      var expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      state.invite = {
        role: role,
        link: 'https://deal-connect.local/invite/' + token,
        expiresAt: expiresAt
      };
      saveNegotiationState();
      pushTimelineEvent('invite_created', '创建协作邀请（' + (role === 'negotiator' ? '谈判者' : '观察者') + '）', getPublicTermsFromWorkbench());
      renderNegotiationTab();
      showToast('success', '邀请链接已生成', '有效期至 ' + expiresAt.slice(0, 10));
    }

    // ---- 时间线 ----
    function getTimelineTypeMeta(type) {
      var map = {
        intent_submitted: { label: '提交意向', category: 'intent' },
        intent_accepted: { label: '意向接受', category: 'intent' },
        intent_rejected: { label: '意向拒绝', category: 'intent' },
        draft_saved: { label: '保存草稿', category: 'proposal' },
        proposal_submitted: { label: '提交方案', category: 'proposal' },
        proposal_edited: { label: '修改方案', category: 'proposal' },
        proposal_accepted: { label: '方案接受', category: 'proposal' },
        proposal_rejected: { label: '方案拒绝', category: 'proposal' },
        proposal_countered: { label: '反提案', category: 'proposal' },
        proposal_withdrawn: { label: '撤回方案', category: 'proposal' },
        counter_withdrawn: { label: '撤回反提案', category: 'proposal' },
        counter_accepted: { label: '接受反提案', category: 'proposal' },
        timeline_reloaded: { label: '回填历史版本', category: 'proposal' },
        terms_confirmed: { label: '条款达成', category: 'proposal' },
        memo_uploaded: { label: '上传纪要', category: 'memo' },
        invite_created: { label: '创建邀请', category: 'invite' }
      };
      return map[type] || { label: type || '未知事件', category: 'all' };
    }

    function getTimelineEventsForCurrentDeal() {
      if (!currentDeal) return [];
      return timelineByDeal[currentDeal.id] || [];
    }

    function renderTimelineTab() {
      if (!currentDeal) return;
      var allEvents = getTimelineEventsForCurrentDeal();
      var filterEl = document.getElementById('timelineFilterType');
      var filterVal = filterEl ? filterEl.value : 'all';
      var filteredEvents = allEvents.filter(function(e) {
        if (filterVal === 'all') return true;
        return getTimelineTypeMeta(e.type).category === filterVal;
      });

      var proposalCount = allEvents.filter(function(e) { return getTimelineTypeMeta(e.type).category === 'proposal'; }).length;
      var memoCount = allEvents.filter(function(e) { return getTimelineTypeMeta(e.type).category === 'memo'; }).length;
      setText('timelineCountAll', String(allEvents.length));
      setText('timelineCountProposal', String(proposalCount));
      setText('timelineCountMemo', String(memoCount));
      setText('timelineLastAt', allEvents[0] && allEvents[0].at ? allEvents[0].at.slice(0, 16).replace('T', ' ') : '--');

      var list = document.getElementById('timelineList');
      if (!list) return;
      if (!filteredEvents.length) {
        list.textContent = '暂无符合筛选条件的时间线事件。';
        return;
      }

      list.innerHTML = filteredEvents.map(function(e) {
        var meta = getTimelineTypeMeta(e.type);
        var terms = e.publicTerms ? formatTermsInline(e.publicTerms) : '无公共参数';
        var actor = (e.actor || '我方') + '（' + (e.role || 'investor') + '）';
        var at = e.at ? e.at.slice(0, 19).replace('T', ' ') : '--';
        return '<div class="p-3 rounded-xl border border-gray-100 bg-gray-50">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="flex items-center gap-2"><span class="text-[11px] px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">' + meta.label + '</span><span class="text-xs text-gray-500">' + at + '</span></div>' +
            (e.publicTerms ? '<button onclick="loadTimelineTermsToWorkbench(\'' + e.id + '\')" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700 hover:bg-white">基于此版修改</button>' : '') +
          '</div>' +
          '<p class="text-xs text-gray-700 mb-1">操作人：' + actor + '</p>' +
          '<p class="text-xs text-gray-700 mb-1">摘要：' + (e.summary || '无') + '</p>' +
          '<p class="text-xs text-gray-500">公共参数：' + terms + '</p>' +
        '</div>';
      }).join('');
    }

    function loadTimelineTermsToWorkbench(eventId) {
      if (!currentDeal) return;
      var events = getTimelineEventsForCurrentDeal();
      var event = events.find(function(e) { return e.id === eventId; });
      if (!event || !event.publicTerms) {
        showToast('warning', '无法加载版本', '该事件无公共参数快照');
        return;
      }
      applyPublicTermsToWorkbench(event.publicTerms);
      pushTimelineEvent('timeline_reloaded', '基于时间线事件 ' + eventId + ' 回填条款参数', event.publicTerms);
      showToast('success', '已回填到工作台', '你可以在条款工作台继续修改并提交');
      switchSessionTab('workbench');
    }
