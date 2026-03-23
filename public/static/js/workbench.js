    function ensureWorkbenchState() {
      if (!currentDeal) return null;
      const dealId = currentDeal.id;
      if (workbenchByDeal[dealId]) return workbenchByDeal[dealId];
      const savedResearch = researchInputsByDeal[dealId];
      const defaultRevenue = savedResearch?.predictedMonthlyRevenue || parseWanValue(currentDeal.monthlyRevenue) || 100;
      workbenchByDeal[dealId] = {
        publicAmountWan: Number((currentDeal.amount / 10000).toFixed(1)),
        publicSharePct: parseFloat(String(currentDeal.revenueShare || '').replace('%', '')) || 10,
        publicAprPct: 14,
        publicTermMonths: parseInt(currentDeal.period, 10) || 24,
        privateRevenueWan: Number(defaultRevenue.toFixed(1)),
        privateSource: savedResearch?.predictedMonthlyRevenue ? 'research' : 'system'
      };
      saveWorkbenchState();
      return workbenchByDeal[dealId];
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
      const amountWan = state.publicAmountWan;
      const sharePct = state.publicSharePct;
      const aprPct = state.publicAprPct;
      const termMonths = state.publicTermMonths;
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
      const derived = computeWorkbenchDerived(state);
      workbenchDerivedByDeal[currentDeal.id] = derived;

      setText('wbMonthlyPayback', formatWan(derived.monthlyPaybackWan));
      setText('wbSuggestAmount', formatWan(derived.suggestedAmountWan));
      setText('wbSuggestShare', formatPct(derived.suggestedSharePct));
      setText('wbTouchMonths', formatMonths(derived.touchMonths));
      setText('wbTotalPayback', formatWan(derived.totalPaybackWan));
      setText('wbActualApr', formatPct(derived.actualAprPct));
      setText('wbRecoveryMultiple', Number.isFinite(derived.recoveryMultiple) ? derived.recoveryMultiple.toFixed(2) + 'x' : '--');

      if (derived.touchDen <= 0) {
        setText('wbFormulaHint', '公式状态：当前参数下无法触达回本（分母<=0），建议提高分成比例或降低融资金额。');
      } else {
        setText('wbFormulaHint', '公式状态：已基于当前公共条款与私有预测完成倒推/正推计算。');
      }
    }

    function renderWorkbench() {
      if (!currentDeal) return;
      const state = ensureWorkbenchState();
      if (!state) return;
      const amount = document.getElementById('wbAmount');
      const share = document.getElementById('wbShare');
      const apr = document.getElementById('wbApr');
      const term = document.getElementById('wbTerm');
      const revenue = document.getElementById('wbRevenue');
      const source = document.getElementById('wbRevenueSource');
      if (amount) amount.value = String(state.publicAmountWan);
      if (share) share.value = String(state.publicSharePct);
      if (apr) apr.value = String(state.publicAprPct);
      if (term) term.value = String(state.publicTermMonths);
      if (revenue) revenue.value = String(state.privateRevenueWan);
      if (source) source.value = state.privateSource;
      recalcWorkbench();
    }

    function updateWorkbenchAndRecalc() {
      const state = ensureWorkbenchState();
      if (!state) return;
      state.publicAmountWan = parseWanValue(document.getElementById('wbAmount')?.value || state.publicAmountWan);
      const share = parseFloat(document.getElementById('wbShare')?.value || String(state.publicSharePct));
      const apr = parseFloat(document.getElementById('wbApr')?.value || String(state.publicAprPct));
      const term = parseInt(document.getElementById('wbTerm')?.value || String(state.publicTermMonths), 10);
      state.publicSharePct = Number.isFinite(share) ? share : state.publicSharePct;
      state.publicAprPct = Number.isFinite(apr) ? apr : state.publicAprPct;
      state.publicTermMonths = Number.isFinite(term) ? term : state.publicTermMonths;
      state.privateRevenueWan = parseWanValue(document.getElementById('wbRevenue')?.value || state.privateRevenueWan);
      const sourceVal = document.getElementById('wbRevenueSource')?.value || state.privateSource;
      state.privateSource = sourceVal;
      saveWorkbenchState();
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

    function useResearchForecast() {
      if (!currentDeal) return;
      const saved = researchInputsByDeal[currentDeal.id];
      if (!saved || !saved.predictedMonthlyRevenue) {
        showToast('warning', '无可用预估', '请先在做功课中完成营业额预估。');
        return;
      }
      const revenue = document.getElementById('wbRevenue');
      const source = document.getElementById('wbRevenueSource');
      if (revenue) revenue.value = saved.predictedMonthlyRevenue.toFixed(1);
      if (source) source.value = 'research';
      updateWorkbenchAndRecalc();
      showToast('success', '已带入做功课预估', '私有预测月营收已更新。');
    }

    function submitWorkbenchProposal() {
      if (!currentDeal) return;
      updateWorkbenchAndRecalc();
      const state = ensureWorkbenchState();
      const drafts = JSON.parse(localStorage.getItem('ec_workbenchDrafts') || '{}');
      drafts[currentDeal.id] = {
        savedAt: new Date().toISOString(),
        publicAmountWan: state.publicAmountWan,
        publicSharePct: state.publicSharePct,
        publicAprPct: state.publicAprPct,
        publicTermMonths: state.publicTermMonths
      };
      localStorage.setItem('ec_workbenchDrafts', JSON.stringify(drafts));
      showToast('success', '方案草稿已保存', '公共参数已记录，可在谈判Tab继续提交。');
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
