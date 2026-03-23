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
        actor: currentUser?.displayName || currentUser?.username || '我方',
        role: 'investor',
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
        drafts: { A: null, B: null, C: null },
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

    function renderNegotiationDraftCompare(state) {
      const box = document.getElementById('negDraftCompare');
      if (!box) return;
      box.innerHTML = ['A', 'B', 'C'].map((slot) => {
        const draft = state.drafts[slot];
        if (!draft) {
          return '<div class="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">' +
            '<p class="text-sm font-semibold text-gray-700 mb-1">草稿' + slot + '</p>' +
            '<p class="text-xs text-gray-400 mb-2">暂无内容</p>' +
            '<button onclick="saveNegotiationDraft(&apos;' + slot + '&apos;)" class="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-white">保存当前参数</button>' +
          '</div>';
        }
        return '<div class="p-3 rounded-xl border border-gray-100 bg-white">' +
          '<p class="text-sm font-semibold text-gray-800 mb-1">草稿' + slot + '</p>' +
          '<p class="text-xs text-gray-500 mb-2">' + formatTermsInline(draft.terms) + '</p>' +
          '<p class="text-xs text-gray-400 mb-2">备注：' + (draft.note || '无') + '</p>' +
          '<div class="grid grid-cols-2 gap-2">' +
            '<button onclick="loadNegotiationDraft(&apos;' + slot + '&apos;)" class="px-2 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">加载</button>' +
            '<button onclick="submitNegotiationProposalFromDraft(&apos;' + slot + '&apos;)" class="px-2 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700">提交</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function getProposalStatusText(status) {
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

      const proposalHtml = state.proposals.map((p) => {
        const actions = [];
        if (p.status === 'pending') {
          actions.push('<button onclick="respondNegotiation(&apos;' + p.id + '&apos;,&apos;accept&apos;)" class="px-2 py-1 text-[11px] rounded bg-emerald-600 text-white">模拟接受</button>');
          actions.push('<button onclick="respondNegotiation(&apos;' + p.id + '&apos;,&apos;reject&apos;)" class="px-2 py-1 text-[11px] rounded bg-rose-600 text-white">模拟拒绝</button>');
          actions.push('<button onclick="respondNegotiation(&apos;' + p.id + '&apos;,&apos;counter&apos;)" class="px-2 py-1 text-[11px] rounded bg-cyan-600 text-white">模拟反提案</button>');
          actions.push('<button onclick="withdrawNegotiationProposal(&apos;' + p.id + '&apos;)" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700">撤回</button>');
        } else if (p.status === 'accepted') {
          actions.push('<button onclick="confirmNegotiationTerms(&apos;' + p.id + '&apos;)" class="px-2 py-1 text-[11px] rounded bg-teal-600 text-white">确认条款达成</button>');
        } else if (p.status === 'countered' && p.counterTerms) {
          actions.push('<button onclick="applyCounterProposal(&apos;' + p.id + '&apos;)" class="px-2 py-1 text-[11px] rounded bg-amber-600 text-white">采纳反提案到工作台</button>');
        }

        return '<div class="p-3 rounded-xl border border-gray-100 bg-gray-50">' +
          '<div class="flex items-center justify-between mb-1"><p class="text-xs font-semibold text-gray-700">提案 ' + p.id + '</p><span class="text-[11px] px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">' + getProposalStatusText(p.status) + '</span></div>' +
          '<p class="text-xs text-gray-500 mb-1">' + formatTermsInline(p.terms) + '</p>' +
          '<p class="text-xs text-gray-500 mb-1">备注：' + (p.note || '无') + '</p>' +
          (p.counterTerms ? '<p class="text-xs text-cyan-700 mb-1">对方反提案：' + formatTermsInline(p.counterTerms) + '</p>' : '') +
          (actions.length ? '<div class="flex flex-wrap gap-1 mt-2">' + actions.join('') + '</div>' : '') +
        '</div>';
      }).join('');

      const memoHtml = state.memos.map((m) =>
        '<div class="p-3 rounded-xl border border-indigo-100 bg-indigo-50">' +
          '<p class="text-xs font-semibold text-indigo-700 mb-1">纪要 · ' + (m.status === 'confirmed' ? '已确认' : '待确认') + '</p>' +
          '<p class="text-xs text-indigo-700">' + m.content + '</p>' +
        '</div>'
      ).join('');

      list.innerHTML = proposalHtml + memoHtml;
    }

    function renderNegotiationTab() {
      if (!currentDeal) return;
      const state = ensureNegotiationState();
      const intent = ensureIntentState();
      const terms = getPublicTermsFromWorkbench();
      const gate = document.getElementById('negotiationGateTip');
      if (gate) {
        if (intent && intent.response === 'accepted') {
          gate.className = 'text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700';
          gate.textContent = '已建联，可正式谈判';
        } else {
          gate.className = 'text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700';
          gate.textContent = '建议先完成表达意向';
        }
      }
      setText('negAmount', terms ? Number(terms.amountWan).toFixed(1) + '万' : '--');
      setText('negShare', terms ? Number(terms.sharePct).toFixed(2) + '%' : '--');
      setText('negApr', terms ? Number(terms.aprPct).toFixed(2) + '%' : '--');
      setText('negTerm', terms ? Number(terms.termMonths).toFixed(0) + '月' : '--');
      renderNegotiationDraftCompare(state);
      renderNegotiationProposals(state);

      const invite = document.getElementById('negInviteBox');
      if (invite) {
        if (state.invite) invite.textContent = '链接：' + state.invite.link + '（角色：' + (state.invite.role === 'negotiator' ? '谈判者' : '观察者') + '，有效期至 ' + state.invite.expiresAt.slice(0, 10) + '）';
        else invite.textContent = '尚未生成邀请链接。';
      }

      const payloadBox = document.getElementById('negContractPayloadBox');
      if (payloadBox) {
        const payload = contractPayloadByDeal[currentDeal.id];
        payloadBox.textContent = payload ? JSON.stringify(payload, null, 2) : '尚未达成条款，暂无输出。';
      }
    }

    function saveNegotiationDraft(slot) {
      if (!currentDeal) return;
      const state = ensureNegotiationState();
      const terms = getPublicTermsFromWorkbench();
      if (!terms) return;
      const note = document.getElementById('negProposalNote')?.value || '';
      state.drafts[slot] = { terms, note, updatedAt: new Date().toISOString() };
      saveNegotiationState();
      pushTimelineEvent('draft_saved', '保存谈判草稿' + slot, terms);
      renderNegotiationTab();
      showToast('success', '草稿已保存', '草稿' + slot + ' 已更新');
    }

    function loadNegotiationDraft(slot) {
      if (!currentDeal) return;
      const state = ensureNegotiationState();
      const draft = state.drafts[slot];
      if (!draft) {
        showToast('warning', '草稿为空', '请先保存草稿' + slot);
        return;
      }
      applyPublicTermsToWorkbench(draft.terms);
      const noteEl = document.getElementById('negProposalNote');
      if (noteEl) noteEl.value = draft.note || '';
      renderNegotiationTab();
      showToast('info', '已加载草稿', '草稿' + slot + ' 已加载到当前谈判参数');
    }

    function createNegotiationProposal(terms, note, source) {
      if (!currentDeal) return null;
      const state = ensureNegotiationState();
      const proposal = {
        id: 'P_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        createdAt: new Date().toISOString(),
        source,
        terms,
        note: note || '',
        status: 'pending',
        counterTerms: null
      };
      state.proposals.unshift(proposal);
      saveNegotiationState();
      pushTimelineEvent('proposal_submitted', '提交谈判方案 ' + proposal.id, terms);
      renderNegotiationTab();
      return proposal;
    }

    function submitNegotiationProposalFromCurrent() {
      if (!currentDeal) return;
      const terms = getPublicTermsFromWorkbench();
      if (!terms) return;
      const note = document.getElementById('negProposalNote')?.value || '';
      const proposal = createNegotiationProposal(terms, note, 'current');
      if (proposal) showToast('success', '方案已提交', '提案编号：' + proposal.id);
    }

    function submitNegotiationProposalFromDraft(slot) {
      if (!currentDeal) return;
      const state = ensureNegotiationState();
      const draft = state.drafts[slot];
      if (!draft) {
        showToast('warning', '草稿为空', '请先保存草稿' + slot);
        return;
      }
      const proposal = createNegotiationProposal(draft.terms, draft.note || '', 'draft-' + slot);
      if (proposal) showToast('success', '草稿已提交', '提案编号：' + proposal.id);
    }

    function findProposalById(proposalId) {
      const state = ensureNegotiationState();
      if (!state) return null;
      return state.proposals.find((p) => p.id === proposalId) || null;
    }

    function respondNegotiation(proposalId, action) {
      if (!currentDeal) return;
      const proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'pending') return;
      if (action === 'accept') {
        proposal.status = 'accepted';
        pushTimelineEvent('proposal_accepted', '对方接受提案 ' + proposal.id, proposal.terms);
        showToast('success', '对方已接受', '可点击“确认条款达成”完成锁定');
      } else if (action === 'reject') {
        proposal.status = 'rejected';
        pushTimelineEvent('proposal_rejected', '对方拒绝提案 ' + proposal.id, proposal.terms);
        showToast('info', '对方已拒绝', '可调整参数后重新提交');
      } else if (action === 'counter') {
        proposal.status = 'countered';
        proposal.counterTerms = {
          amountWan: Number((proposal.terms.amountWan * 0.95).toFixed(1)),
          sharePct: Number((proposal.terms.sharePct + 0.6).toFixed(2)),
          aprPct: Number(Math.max(0, proposal.terms.aprPct - 0.5).toFixed(2)),
          termMonths: Number(Math.max(1, proposal.terms.termMonths + 2))
        };
        pushTimelineEvent('proposal_countered', '对方对提案 ' + proposal.id + ' 发起反提案', proposal.counterTerms);
        showToast('info', '收到反提案', '可一键采纳到条款工作台继续谈判');
      }
      saveNegotiationState();
      renderNegotiationTab();
    }

    function withdrawNegotiationProposal(proposalId) {
      if (!currentDeal) return;
      const proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'pending') {
        showToast('warning', '无法撤回', '仅“待响应”提案可撤回');
        return;
      }
      proposal.status = 'withdrawn';
      saveNegotiationState();
      pushTimelineEvent('proposal_withdrawn', '撤回提案 ' + proposal.id, proposal.terms);
      renderNegotiationTab();
      showToast('info', '提案已撤回', proposal.id);
    }

    function applyCounterProposal(proposalId) {
      if (!currentDeal) return;
      const proposal = findProposalById(proposalId);
      if (!proposal || !proposal.counterTerms) {
        showToast('warning', '无可用反提案', '请先等待对方反提案');
        return;
      }
      applyPublicTermsToWorkbench(proposal.counterTerms);
      pushTimelineEvent('counter_loaded', '已将反提案 ' + proposal.id + ' 加载到工作台', proposal.counterTerms);
      renderNegotiationTab();
      showToast('success', '反提案已加载', '请确认后再次提交方案');
    }

    function confirmNegotiationTerms(proposalId) {
      if (!currentDeal) return;
      const proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'accepted') {
        showToast('warning', '无法确认', '仅已接受提案可确认达成');
        return;
      }
      proposal.status = 'agreed';
      currentDeal.status = 'confirmed';
      const original = allDeals.find(d => d.id === currentDeal.id);
      if (original) original.status = 'confirmed';
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
      contractPayloadByDeal[currentDeal.id] = {
        dealId: currentDeal.id,
        projectName: currentDeal.name,
        sourceProposalId: proposal.id,
        confirmedAt: new Date().toISOString(),
        publicTerms: {
          amountWan: Number(proposal.terms.amountWan),
          sharePct: Number(proposal.terms.sharePct),
          aprPct: Number(proposal.terms.aprPct),
          termMonths: Number(proposal.terms.termMonths)
        }
      };
      saveContractPayloadState();
      saveNegotiationState();
      pushTimelineEvent('terms_confirmed', '提案 ' + proposal.id + ' 已达成并锁定公共条款', proposal.terms);
      renderNegotiationTab();
      showToast('success', '条款已达成', '项目状态已更新为已确认，且已生成合约通公共参数输出');
    }

    function submitNegotiationMemo(status) {
      if (!currentDeal) return;
      const state = ensureNegotiationState();
      const input = document.getElementById('negMemoInput');
      const text = (input?.value || '').trim();
      if (!text) {
        showToast('warning', '纪要为空', '请先填写纪要内容');
        return;
      }
      state.memos.unshift({
        id: 'M_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        at: new Date().toISOString(),
        content: text,
        status
      });
      if (input) input.value = '';
      saveNegotiationState();
      pushTimelineEvent('memo_uploaded', '上传谈判纪要（' + (status === 'confirmed' ? '已确认' : '待确认') + '）', getPublicTermsFromWorkbench());
      renderNegotiationTab();
      showToast('success', '纪要已记录', status === 'confirmed' ? '纪要已确认并同步公共条款' : '等待双方确认纪要');
    }

    function generateNegotiationInvite() {
      if (!currentDeal) return;
      const state = ensureNegotiationState();
      const role = document.getElementById('negInviteRole')?.value || 'negotiator';
      const token = Math.random().toString(36).slice(2, 10);
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      state.invite = {
        role,
        link: 'https://deal-connect.local/invite/' + token,
        expiresAt
      };
      saveNegotiationState();
      pushTimelineEvent('invite_created', '创建协作邀请（' + (role === 'negotiator' ? '谈判者' : '观察者') + '）', getPublicTermsFromWorkbench());
      renderNegotiationTab();
      showToast('success', '邀请链接已生成', '有效期至 ' + expiresAt.slice(0, 10));
    }

    function getTimelineTypeMeta(type) {
      const map = {
        intent_submitted: { label: '提交意向', category: 'intent' },
        intent_accepted: { label: '意向接受', category: 'intent' },
        intent_rejected: { label: '意向拒绝', category: 'intent' },
        draft_saved: { label: '保存草稿', category: 'proposal' },
        proposal_submitted: { label: '提交提案', category: 'proposal' },
        proposal_accepted: { label: '提案接受', category: 'proposal' },
        proposal_rejected: { label: '提案拒绝', category: 'proposal' },
        proposal_countered: { label: '反提案', category: 'proposal' },
        proposal_withdrawn: { label: '撤回提案', category: 'proposal' },
        counter_loaded: { label: '加载反提案', category: 'proposal' },
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
      const allEvents = getTimelineEventsForCurrentDeal();
      const filterVal = document.getElementById('timelineFilterType')?.value || 'all';
      const filteredEvents = allEvents.filter((e) => {
        if (filterVal === 'all') return true;
        return getTimelineTypeMeta(e.type).category === filterVal;
      });

      const proposalCount = allEvents.filter((e) => getTimelineTypeMeta(e.type).category === 'proposal').length;
      const memoCount = allEvents.filter((e) => getTimelineTypeMeta(e.type).category === 'memo').length;
      setText('timelineCountAll', String(allEvents.length));
      setText('timelineCountProposal', String(proposalCount));
      setText('timelineCountMemo', String(memoCount));
      setText('timelineLastAt', allEvents[0]?.at ? allEvents[0].at.slice(0, 16).replace('T', ' ') : '--');

      const list = document.getElementById('timelineList');
      if (!list) return;
      if (!filteredEvents.length) {
        list.textContent = '暂无符合筛选条件的时间线事件。';
        return;
      }

      list.innerHTML = filteredEvents.map((e) => {
        const meta = getTimelineTypeMeta(e.type);
        const terms = e.publicTerms ? formatTermsInline(e.publicTerms) : '无公共参数';
        const actor = (e.actor || '我方') + '（' + (e.role || 'investor') + '）';
        const at = e.at ? e.at.slice(0, 19).replace('T', ' ') : '--';
        return '<div class="p-3 rounded-xl border border-gray-100 bg-gray-50">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="flex items-center gap-2"><span class="text-[11px] px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">' + meta.label + '</span><span class="text-xs text-gray-500">' + at + '</span></div>' +
            (e.publicTerms ? '<button onclick="loadTimelineTermsToWorkbench(&apos;' + e.id + '&apos;)" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700 hover:bg-white">基于此版修改</button>' : '') +
          '</div>' +
          '<p class="text-xs text-gray-700 mb-1">操作人：' + actor + '</p>' +
          '<p class="text-xs text-gray-700 mb-1">摘要：' + (e.summary || '无') + '</p>' +
          '<p class="text-xs text-gray-500">公共参数：' + terms + '</p>' +
        '</div>';
      }).join('');
    }

    function loadTimelineTermsToWorkbench(eventId) {
      if (!currentDeal) return;
      const events = getTimelineEventsForCurrentDeal();
      const event = events.find((e) => e.id === eventId);
      if (!event || !event.publicTerms) {
        showToast('warning', '无法加载版本', '该事件无公共参数快照');
        return;
      }
      applyPublicTermsToWorkbench(event.publicTerms);
      pushTimelineEvent('timeline_reloaded', '基于时间线事件 ' + eventId + ' 回填条款参数', event.publicTerms);
      showToast('success', '已回填到工作台', '你可以在条款工作台继续修改并提交');
      switchSessionTab('workbench');
    }

