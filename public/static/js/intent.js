    function ensureIntentState() {
      if (!currentDeal) return null;
      const dealId = currentDeal.id;
      if (intentByDeal[dealId]) return intentByDeal[dealId];
      intentByDeal[dealId] = {
        investmentType: 'RBF固定',
        amountBand: '300-500',
        customMin: '',
        customMax: '',
        concerns: [],
        note: '',
        summary: '',
        submittedAt: '',
        response: 'none'
      };
      saveIntentState();
      return intentByDeal[dealId];
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

    function renderIntentSummaryAndResponse(state) {
      const summaryBox = document.getElementById('intentSummaryBox');
      const responseBox = document.getElementById('intentResponseBox');
      if (summaryBox) summaryBox.textContent = state.summary || '尚未生成摘要。';
      if (!responseBox) return;
      if (!state.submittedAt) {
        responseBox.className = 'p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700';
        responseBox.textContent = '尚未提交意向。';
        return;
      }
      if (state.response === 'accepted') {
        responseBox.className = 'p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700';
        responseBox.textContent = '融资方已接受沟通，可进入条款工作台继续推进。';
        return;
      }
      if (state.response === 'rejected') {
        responseBox.className = 'p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700';
        responseBox.textContent = '融资方暂不考虑，建议保留关注并等待后续窗口。';
        return;
      }
      responseBox.className = 'p-3 rounded-xl bg-cyan-50 border border-cyan-100 text-sm text-cyan-700';
      responseBox.textContent = '意向已发送，等待融资方响应。';
    }

    function renderIntentTab() {
      if (!currentDeal) return;
      const state = ensureIntentState();
      if (!state) return;
      const typeEl = document.getElementById('intentInvestmentType');
      const bandEl = document.getElementById('intentAmountBand');
      const minEl = document.getElementById('intentCustomMin');
      const maxEl = document.getElementById('intentCustomMax');
      const noteEl = document.getElementById('intentNote');
      if (typeEl) typeEl.value = state.investmentType || 'RBF固定';
      if (bandEl) bandEl.value = state.amountBand || '300-500';
      if (minEl) minEl.value = state.customMin || '';
      if (maxEl) maxEl.value = state.customMax || '';
      if (noteEl) noteEl.value = state.note || '';
      document.querySelectorAll('.intent-concern').forEach((el) => {
        const checkbox = el;
        checkbox.checked = state.concerns.includes(checkbox.value);
      });
      renderIntentSummaryAndResponse(state);
    }

    function updateIntentAndPreview() {
      if (!currentDeal) return;
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
      const state = ensureIntentState();
      if (!state) return;
      if (!state.summary) {
        generateIntentSummary();
        if (!state.summary) return;
      }
      state.submittedAt = new Date().toISOString();
      state.response = 'pending';
      currentDeal.status = 'interested';
      const original = allDeals.find(d => d.id === currentDeal.id);
      if (original) original.status = 'interested';
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
      saveIntentState();
      pushTimelineEvent('intent_submitted', '提交结构化意向', getPublicTermsFromWorkbench());
      renderIntentSummaryAndResponse(state);
      showToast('success', '意向已发送', '融资方将收到结构化意向摘要');
    }

    function mockIntentResponse(status) {
      if (!currentDeal) return;
      const state = ensureIntentState();
      if (!state || !state.submittedAt) {
        showToast('warning', '尚未提交意向', '请先完成意向发送');
        return;
      }
      if (status === 'accepted') {
        state.response = 'accepted';
        currentDeal.status = 'interested';
        const original = allDeals.find(d => d.id === currentDeal.id);
        if (original) original.status = 'interested';
        localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
        saveIntentState();
        pushTimelineEvent('intent_accepted', '融资方接受沟通，进入正式谈判', getPublicTermsFromWorkbench());
        renderIntentSummaryAndResponse(state);
        showToast('success', '融资方接受沟通', '已进入条款工作台');
        switchSessionTab('workbench');
        return;
      }
      if (status === 'rejected') {
        state.response = 'rejected';
        currentDeal.status = 'open';
        const original = allDeals.find(d => d.id === currentDeal.id);
        if (original) original.status = 'open';
        localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
        saveIntentState();
        pushTimelineEvent('intent_rejected', '融资方暂不考虑当前意向', getPublicTermsFromWorkbench());
        renderIntentSummaryAndResponse(state);
        showToast('info', '融资方暂不考虑', '项目已回到待参与状态');
      }
    }

