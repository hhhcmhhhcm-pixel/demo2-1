    function ensureWorkbenchState() {
      if (!currentDeal) return null;
      const dealId = currentDeal.id;
      if (workbenchByDeal[dealId]) return workbenchByDeal[dealId];
      const savedResearch = researchInputsByDeal[dealId];
      const defaultRevenue = savedResearch?.predictedMonthlyRevenue || parseWanValue(currentDeal.monthlyRevenue) || 100;
      workbenchByDeal[dealId] = {
        publicAmountWan: null,
        publicSharePct: null,
        publicAprPct: null,
        publicTermMonths: null,
        privateRevenueWan: Number(defaultRevenue.toFixed(1)),
        privateSource: 'system'
      };
      saveWorkbenchState();
      return workbenchByDeal[dealId];
    }

    // 自动推算合作期限：触达月数 × 4，优先用模型预估，无模型则用融资方预估
    function computeAutoTermMonths(state) {
      if (!currentDeal || !state) return null;
      if (state.publicAmountWan == null || state.publicSharePct == null || state.publicAprPct == null) return null;
      var fcState = (typeof ensureForecastState === 'function') ? ensureForecastState(currentDeal) : null;
      var modelRevenue = 0;
      // 优先用模型预估
      if (fcState && fcState.systemMonthly && fcState.systemMonthly.length > 0) {
        modelRevenue = fcState.systemMonthly.slice(0, 12).reduce(function(a, b) { return a + b; }, 0) / 12;
      }
      // 如果无模型预估（如项目不满6个月），回退到融资方预估
      if (modelRevenue <= 0 && fcState && fcState.borrowerMonthly && fcState.borrowerMonthly.length > 0) {
        modelRevenue = fcState.borrowerMonthly.slice(0, 12).reduce(function(a, b) { return a + b; }, 0) / 12;
      }
      if (modelRevenue <= 0) return null;

      var amountWan = state.publicAmountWan;
      var sharePct = state.publicSharePct;
      var aprPct = state.publicAprPct;
      var monthlyPayback = modelRevenue * sharePct / 100;
      var touchDen = monthlyPayback - amountWan * aprPct / 100 / 12;

      if (touchDen > 0 && amountWan > 0) {
        var touch = amountWan / touchDen;
        return Math.max(1, Math.round(touch * 4));
      }
      return null;
    }

    function formatWan(v) {
      return Number.isFinite(v) ? v.toFixed(1) + ' 万' : '--';
    }

    function formatPct(v) {
      return Number.isFinite(v) ? v.toFixed(2) + '%' : '--';
    }

    function formatMonths(v) {
      return Number.isFinite(v) ? v.toFixed(1) + ' 个月' : '--';
    }

    function setText(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    function computeWorkbenchDerived(state) {
      const amountWan = state.publicAmountWan != null ? state.publicAmountWan : NaN;
      const sharePct = state.publicSharePct != null ? state.publicSharePct : NaN;
      const aprPct = state.publicAprPct != null ? state.publicAprPct : NaN;
      const termMonths = state.publicTermMonths != null ? state.publicTermMonths : NaN;
      const revenueWan = state.privateRevenueWan;

      const shareRatio = sharePct / 100;
      const aprRatio = aprPct / 100;
      const monthlyPaybackWan = revenueWan * shareRatio;

      const suggestAmountDen = 1 + (aprRatio * termMonths / 12);
      const suggestedAmountWan = (monthlyPaybackWan > 0 && termMonths > 0 && suggestAmountDen > 0)
        ? (monthlyPaybackWan * termMonths / suggestAmountDen)
        : NaN;

      const suggestedSharePct = (amountWan > 0 && revenueWan > 0 && termMonths > 0)
        ? (amountWan * (1 + aprRatio * termMonths / 12) / (revenueWan * termMonths) * 100)
        : NaN;

      const touchDen = monthlyPaybackWan - amountWan * aprRatio / 12;
      const touchMonths = (amountWan > 0 && touchDen > 0) ? (amountWan / touchDen) : NaN;

      const validMonths = Number.isFinite(touchMonths) && touchMonths > 0 ? touchMonths : termMonths;
      const totalPaybackWan = Number.isFinite(validMonths) && validMonths > 0 ? monthlyPaybackWan * validMonths : NaN;
      const actualAprPct = (amountWan > 0 && Number.isFinite(totalPaybackWan) && validMonths > 0)
        ? (((totalPaybackWan / amountWan) - 1) * 12 / validMonths * 100)
        : NaN;
      const recoveryMultiple = (amountWan > 0 && Number.isFinite(totalPaybackWan))
        ? (totalPaybackWan / amountWan)
        : NaN;

      return {
        monthlyPaybackWan,
        suggestedAmountWan,
        suggestedSharePct,
        touchMonths,
        totalPaybackWan,
        actualAprPct,
        recoveryMultiple,
        touchDen
      };
    }

    function recalcWorkbench() {
      const state = ensureWorkbenchState();
      if (!state || !currentDeal) return;

      var hasPublicInput = state.publicAmountWan != null && state.publicSharePct != null && state.publicAprPct != null;

      if (!hasPublicInput) {
        // 公共条款未填完，派生指标全部显示占位符
        state.publicTermMonths = null;
        var termEl = document.getElementById('wbTerm');
        if (termEl) termEl.value = '';
        saveWorkbenchState();
        var emptyDerived = { monthlyPaybackWan: NaN, suggestedAmountWan: NaN, suggestedSharePct: NaN, touchMonths: NaN, totalPaybackWan: NaN, actualAprPct: NaN, recoveryMultiple: NaN, touchDen: NaN };
        workbenchDerivedByDeal[currentDeal.id] = emptyDerived;
        setText('wbMonthlyPayback', '--');
        setText('wbSuggestAmount', '--');
        setText('wbSuggestShare', '--');
        setText('wbTouchMonths', '--');
        setText('wbTotalPayback', '--');
        setText('wbActualApr', '--');
        setText('wbRecoveryMultiple', '--');
        setText('wbFormulaHint', '请先填写公共条款区的融资金额、分成比例和封顶APR。');
        return;
      }

      // 第一轮：先用临时期限算出触达月数
      const derived = computeWorkbenchDerived(state);

      // 自动推算合作期限 = 触达月数 × 4（优先用模型预估营业额，回退融资方预估）
      var autoTerm = computeAutoTermMonths(state);
      // 如果派生触达月数有效，直接用 触达月数 × 4（保证显示一致性）
      if (Number.isFinite(derived.touchMonths) && derived.touchMonths > 0) {
        autoTerm = Math.max(1, Math.round(derived.touchMonths * 4));
      }
      state.publicTermMonths = autoTerm;
      var termEl = document.getElementById('wbTerm');
      if (termEl) termEl.value = state.publicTermMonths != null ? String(state.publicTermMonths) : '';
      saveWorkbenchState();

      // 第二轮：用最终期限重算派生指标（建议金额/比例依赖期限）
      const finalDerived = computeWorkbenchDerived(state);
      workbenchDerivedByDeal[currentDeal.id] = finalDerived;

      setText('wbMonthlyPayback', formatWan(finalDerived.monthlyPaybackWan));
      setText('wbSuggestAmount', formatWan(finalDerived.suggestedAmountWan));
      setText('wbSuggestShare', formatPct(finalDerived.suggestedSharePct));
      setText('wbTouchMonths', formatMonths(finalDerived.touchMonths));
      setText('wbTotalPayback', formatWan(finalDerived.totalPaybackWan));
      setText('wbActualApr', formatPct(finalDerived.actualAprPct));
      setText('wbRecoveryMultiple', Number.isFinite(finalDerived.recoveryMultiple) ? finalDerived.recoveryMultiple.toFixed(2) + 'x' : '--');

      if (finalDerived.touchDen <= 0) {
        setText('wbFormulaHint', '公式状态：当前参数下无法触达回本（分母<=0），建议提高分成比例或降低融资金额。');
      } else {
        setText('wbFormulaHint', '公式状态：已基于当前公共条款与私有预测完成倒推/正推计算。');
      }
    }

    function renderWorkbench() {
      if (!currentDeal) return;
      var state = ensureWorkbenchState();
      if (!state) return;
      var amount = document.getElementById('wbAmount');
      var share = document.getElementById('wbShare');
      var apr = document.getElementById('wbApr');
      var term = document.getElementById('wbTerm');
      var revenue = document.getElementById('wbRevenue');
      var source = document.getElementById('wbRevenueSource');
      if (amount) amount.value = state.publicAmountWan != null ? String(state.publicAmountWan) : '';
      if (share) share.value = state.publicSharePct != null ? String(state.publicSharePct) : '';
      if (apr) apr.value = state.publicAprPct != null ? String(state.publicAprPct) : '';
      if (term) term.value = state.publicTermMonths != null ? String(state.publicTermMonths) : '';

      // 兼容旧数据：如果 source 是 research，映射到 self
      var src = state.privateSource === 'research' ? 'self' : state.privateSource;
      if (source) source.value = src;

      // 用预估工作台的真实数据刷新私有营业额
      var fcValue = getForecastValueBySource(src);
      if (fcValue > 0) {
        state.privateRevenueWan = +fcValue.toFixed(1);
        saveWorkbenchState();
      }
      if (revenue) revenue.value = String(state.privateRevenueWan);

      recalcWorkbench();
    }

    function updateWorkbenchAndRecalc() {
      const state = ensureWorkbenchState();
      if (!state) return;
      var amountVal = (document.getElementById('wbAmount')?.value || '').trim();
      state.publicAmountWan = amountVal !== '' ? parseWanValue(amountVal) : null;
      var shareVal = (document.getElementById('wbShare')?.value || '').trim();
      var shareParsed = parseFloat(shareVal);
      state.publicSharePct = shareVal !== '' && Number.isFinite(shareParsed) ? shareParsed : null;
      var aprVal = (document.getElementById('wbApr')?.value || '').trim();
      var aprParsed = parseFloat(aprVal);
      state.publicAprPct = aprVal !== '' && Number.isFinite(aprParsed) ? aprParsed : null;
      state.privateRevenueWan = parseWanValue(document.getElementById('wbRevenue')?.value || state.privateRevenueWan);
      const sourceVal = document.getElementById('wbRevenueSource')?.value || state.privateSource;
      state.privateSource = sourceVal;
      saveWorkbenchState();
      recalcWorkbench();
    }

    // 从营业额预估工作台获取指定来源的首年月均值
    function getForecastValueBySource(source) {
      if (!currentDeal) return 0;
      // 确保预估数据已初始化（即使用户没打开过预估工作台 tab）
      var fcState = (typeof ensureForecastState === 'function') ? ensureForecastState(currentDeal) : null;
      if (!fcState) return 0;

      if (source === 'system' && fcState.systemMonthly && fcState.systemMonthly.length > 0) {
        return fcState.systemMonthly.slice(0, 12).reduce(function(a, b) { return a + b; }, 0) / 12;
      }
      if (source === 'borrower' && fcState.borrowerMonthly && fcState.borrowerMonthly.length > 0) {
        return fcState.borrowerMonthly.slice(0, 12).reduce(function(a, b) { return a + b; }, 0) / 12;
      }
      if (source === 'self') {
        // 优先用已选值，其次用快捷值
        if (fcState.selectedSource === 'self' && fcState.selectedValue > 0) return fcState.selectedValue;
        if (fcState.selfQuickValue > 0) return fcState.selfQuickValue;
      }
      return 0;
    }

    // 切换来源时，从营业额预估工作台读取对应数值
    function onWbSourceChange() {
      var state = ensureWorkbenchState();
      if (!state || !currentDeal) return;
      var source = document.getElementById('wbRevenueSource')?.value;
      if (!source) return;

      var value = getForecastValueBySource(source);

      var revenueEl = document.getElementById('wbRevenue');
      if (revenueEl) revenueEl.value = value > 0 ? value.toFixed(1) : '0';

      state.privateSource = source;
      state.privateRevenueWan = value > 0 ? +value.toFixed(1) : 0;
      saveWorkbenchState();
      recalcWorkbench();
    }

    // 用户直接修改数值时：自动切到"自行填写"，并同步到营业额预估工作台快捷模式
    function onWbRevenueDirectInput() {
      var state = ensureWorkbenchState();
      if (!state || !currentDeal) return;

      // 自动切换来源到"自行填写"
      var sourceEl = document.getElementById('wbRevenueSource');
      if (sourceEl && sourceEl.value !== 'self') {
        sourceEl.value = 'self';
      }
      state.privateSource = 'self';

      var val = parseWanValue(document.getElementById('wbRevenue')?.value);
      state.privateRevenueWan = val > 0 ? +val.toFixed(1) : 0;
      saveWorkbenchState();

      // 同步到营业额预估工作台（快捷填写模式）
      if (val > 0 && typeof ensureForecastState === 'function') {
        var fcState = ensureForecastState(currentDeal);
        if (fcState) {
          fcState.selfMode = 'quick';
          fcState.selfQuickValue = +val.toFixed(1);
          fcState.selectedSource = 'self';
          fcState.selectedValue = +val.toFixed(1);
          if (typeof saveForecastState === 'function') saveForecastState();
        }
      }

      recalcWorkbench();
    }

    function applySuggestedAmount() {
      if (!currentDeal) return;
      updateWorkbenchAndRecalc();
      const derived = workbenchDerivedByDeal[currentDeal.id];
      if (!derived || !Number.isFinite(derived.suggestedAmountWan) || derived.suggestedAmountWan <= 0) {
        showToast('warning', '无法倒推金额', '请先检查营业额、比例、APR、期限参数。');
        return;
      }
      const amount = document.getElementById('wbAmount');
      if (amount) amount.value = derived.suggestedAmountWan.toFixed(1);
      updateWorkbenchAndRecalc();
      showToast('success', '已应用倒推金额', '公共融资金额已更新为建议值。');
    }

    function applySuggestedShare() {
      if (!currentDeal) return;
      updateWorkbenchAndRecalc();
      const derived = workbenchDerivedByDeal[currentDeal.id];
      if (!derived || !Number.isFinite(derived.suggestedSharePct) || derived.suggestedSharePct <= 0) {
        showToast('warning', '无法倒推比例', '请先检查金额、营业额、APR、期限参数。');
        return;
      }
      const share = document.getElementById('wbShare');
      if (share) share.value = derived.suggestedSharePct.toFixed(2);
      updateWorkbenchAndRecalc();
      showToast('success', '已应用倒推比例', '公共分成比例已更新为建议值。');
    }

    function applyForwardTouchMonths() {
      if (!currentDeal) return;
      updateWorkbenchAndRecalc();
      const derived = workbenchDerivedByDeal[currentDeal.id];
      if (!derived || !Number.isFinite(derived.touchMonths) || derived.touchMonths <= 0) {
        showToast('warning', '无法正推触达月数', '当前参数下分母<=0，请调整金额或比例。');
        return;
      }
      const term = document.getElementById('wbTerm');
      if (term) term.value = Math.max(1, Math.round(derived.touchMonths)).toString();
      updateWorkbenchAndRecalc();
      showToast('success', '已应用正推触达月数', '公共合作期限已同步为触达月数。');
    }

    function submitWorkbenchProposal() {
      if (!currentDeal) return;
      updateWorkbenchAndRecalc();
      var state = ensureWorkbenchState();
      if (!state) return;
      if (state.publicAmountWan == null || state.publicSharePct == null || state.publicAprPct == null) {
        showToast('warning', '公共条款未填完', '请先填写融资金额、分成比例和封顶APR后再提交方案。');
        return;
      }
      var derived = workbenchDerivedByDeal[currentDeal.id] || computeWorkbenchDerived(state);
      var negState = ensureNegotiationState();
      if (!negState) return;
      var proposal = {
        id: 'P_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        createdAt: new Date().toISOString(),
        perspective: currentPerspective || 'investor',
        actor: (currentUser && (currentUser.displayName || currentUser.username)) || (currentPerspective === 'financer' ? '融资方' : '投资方'),
        publicTerms: {
          amountWan: state.publicAmountWan,
          sharePct: state.publicSharePct,
          aprPct: state.publicAprPct,
          termMonths: state.publicTermMonths
        },
        privateData: {
          revenueWan: state.privateRevenueWan,
          source: state.privateSource
        },
        derivedData: {
          monthlyPaybackWan: derived.monthlyPaybackWan,
          suggestedAmountWan: derived.suggestedAmountWan,
          suggestedSharePct: derived.suggestedSharePct,
          touchMonths: derived.touchMonths,
          totalPaybackWan: derived.totalPaybackWan,
          actualAprPct: derived.actualAprPct,
          recoveryMultiple: derived.recoveryMultiple
        },
        status: 'draft',
        messages: []
      };
      negState.proposals.unshift(proposal);
      saveNegotiationState();
      pushTimelineEvent('proposal_submitted', (proposal.actor) + ' 提交方案 ' + proposal.id, proposal.publicTerms);
      showToast('success', '方案已提交', '方案编号：' + proposal.id + '，可在谈判Tab查看多方案对比。');
    }

    function refreshWorkbenchPrefill() {
      const hint = document.getElementById('workbenchPrefillHint');
      if (!hint) return;
      const saved = currentDeal ? researchInputsByDeal[currentDeal.id] : null;
      if (!currentDeal || !saved || !saved.predictedMonthlyRevenue) {
        hint.textContent = '暂无从做功课带入的营业额预估值。';
        return;
      }
      hint.textContent = '已带入「' + currentDeal.name + '」营业额预估：' + saved.predictedMonthlyRevenue.toFixed(1) + '万/月。下一步将用于条款工作台派生指标计算。';
    }
