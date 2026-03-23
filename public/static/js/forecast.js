    // ==================== 营业额预估工作台 ====================

    // ---- Mock data generators ----
    function generateSystemForecast(deal) {
      // 系统平推预估：基于历史月均营收，按星期/节假日分组拟合趋势，产出未来10年逐月数据
      const baseRevenue = parseWanValue(deal.monthlyRevenue) || 120;
      const monthlyGrowthRate = 0.003; // ~3.7% annual
      const months = [];
      for (let i = 0; i < 120; i++) { // 10 years = 120 months
        const yearIdx = Math.floor(i / 12);
        const monthInYear = i % 12;
        // 轻微季节波动
        const seasonFactor = 1 + 0.08 * Math.sin((monthInYear - 2) * Math.PI / 6);
        // 逐年增长放缓
        const growthFactor = Math.pow(1 + monthlyGrowthRate, i) * (1 - yearIdx * 0.002);
        months.push(Math.max(1, +(baseRevenue * growthFactor * seasonFactor).toFixed(1)));
      }
      return months;
    }

    function generateBorrowerForecast(deal) {
      // 融资方上传预估：3年逐月数据，通常比系统预估乐观
      const baseRevenue = parseWanValue(deal.monthlyRevenue) || 120;
      const optimismFactor = 1.12; // 融资方偏乐观
      const monthlyGrowthRate = 0.005; // ~6.2% annual
      const months = [];
      for (let i = 0; i < 36; i++) { // 3 years = 36 months
        const monthInYear = i % 12;
        const seasonFactor = 1 + 0.06 * Math.sin((monthInYear - 1) * Math.PI / 6);
        const growthFactor = Math.pow(1 + monthlyGrowthRate, i);
        months.push(Math.max(1, +(baseRevenue * optimismFactor * growthFactor * seasonFactor).toFixed(1)));
      }
      return months;
    }

    // ---- Forecast state per deal ----
    let forecastByDeal = {};
    try {
      forecastByDeal = JSON.parse(localStorage.getItem('ec_forecastByDeal') || '{}');
    } catch(e) { forecastByDeal = {}; }

    function saveForecastState() {
      localStorage.setItem('ec_forecastByDeal', JSON.stringify(forecastByDeal));
    }

    function ensureForecastState(deal) {
      if (!deal) return null;
      if (forecastByDeal[deal.id]) return forecastByDeal[deal.id];
      forecastByDeal[deal.id] = {
        systemMonthly: generateSystemForecast(deal),
        borrowerMonthly: generateBorrowerForecast(deal),
        selfMode: 'quick', // quick | monthly | yearly
        selfQuickValue: null,
        selfMonthly: {}, // { "2026": [m1,m2,...m12], ... }
        selfYearly: {}, // { "2026": val, "2027": val, ... }
        selectedSource: null, // system | borrower | self
        selectedValue: null
      };
      saveForecastState();
      return forecastByDeal[deal.id];
    }

    let fcChartRange = '1y';
    let fcInputMode = 'quick';

    // ---- Main render ----
    function renderForecastTab() {
      if (!currentDeal) return;
      const state = ensureForecastState(currentDeal);

      renderFcSystemInfo(state);
      renderFcBorrowerInfo(state);
      renderFcSelfInputs(state);
      renderFcChart(state);
      renderFcSelectedStatus(state);
    }

    // ---- System forecast display ----
    function renderFcSystemInfo(state) {
      const el = document.getElementById('fcSystemInfo');
      if (!el) return;
      const data = state.systemMonthly;
      const avg1y = data.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
      const avg3y = data.slice(0, 36).reduce((a, b) => a + b, 0) / 36;
      const avg10y = data.reduce((a, b) => a + b, 0) / data.length;
      const min = Math.min(...data);
      const max = Math.max(...data);
      el.innerHTML =
        '<div class="p-2.5 rounded-lg bg-teal-50 border border-teal-100">' +
          '<p class="text-xs text-teal-700 font-medium">月均营业额（系统预估）</p>' +
          '<p class="text-lg font-bold text-teal-700">' + avg1y.toFixed(1) + '万/月</p>' +
          '<p class="text-[11px] text-teal-600">首年均值</p>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">3年均值</p><p class="text-xs font-bold text-gray-700">' + avg3y.toFixed(1) + '万</p></div>' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">10年均值</p><p class="text-xs font-bold text-gray-700">' + avg10y.toFixed(1) + '万</p></div>' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">波动区间</p><p class="text-xs font-bold text-gray-700">' + min.toFixed(0) + '-' + max.toFixed(0) + '万</p></div>' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">数据覆盖</p><p class="text-xs font-bold text-gray-700">120个月</p></div>' +
        '</div>' +
        '<p class="text-[10px] text-gray-400 mt-1">模型：按星期+节假日分组拟合趋势，系统自动生成，不可编辑。</p>';
    }

    // ---- Borrower forecast display ----
    function renderFcBorrowerInfo(state) {
      const el = document.getElementById('fcBorrowerInfo');
      if (!el) return;
      const data = state.borrowerMonthly;
      const avg1y = data.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
      const avg3y = data.reduce((a, b) => a + b, 0) / data.length;
      const min = Math.min(...data);
      const max = Math.max(...data);
      el.innerHTML =
        '<div class="p-2.5 rounded-lg bg-cyan-50 border border-cyan-100">' +
          '<p class="text-xs text-cyan-700 font-medium">月均营业额（融资方预估）</p>' +
          '<p class="text-lg font-bold text-cyan-700">' + avg1y.toFixed(1) + '万/月</p>' +
          '<p class="text-[11px] text-cyan-600">首年均值</p>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">3年均值</p><p class="text-xs font-bold text-gray-700">' + avg3y.toFixed(1) + '万</p></div>' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">波动区间</p><p class="text-xs font-bold text-gray-700">' + min.toFixed(0) + '-' + max.toFixed(0) + '万</p></div>' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">数据覆盖</p><p class="text-xs font-bold text-gray-700">36个月</p></div>' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">数据来源</p><p class="text-xs font-bold text-gray-700">发起通提交</p></div>' +
        '</div>' +
        '<p class="text-[10px] text-gray-400 mt-1">融资方在发起通自行上传，系统不校验真实性，由投资人自行判断。</p>';
    }

    // ---- Self input ----
    function renderFcSelfInputs(state) {
      fcInputMode = state.selfMode || 'quick';
      setFcInputMode(fcInputMode);

      // Quick value
      const quickEl = document.getElementById('fcQuickValue');
      if (quickEl && state.selfQuickValue) quickEl.value = String(state.selfQuickValue);

      // Year selector for monthly
      renderFcMonthlyYearSelector();
      renderFcMonthlyInputs();
      renderFcYearlyInputs();
    }

    function setFcInputMode(mode) {
      fcInputMode = mode;
      const modes = ['quick', 'monthly', 'yearly'];
      modes.forEach(m => {
        const panel = document.getElementById('fcInput' + m.charAt(0).toUpperCase() + m.slice(1));
        const btn = document.getElementById('fcMode' + m.charAt(0).toUpperCase() + m.slice(1));
        if (panel) panel.classList.toggle('hidden', m !== mode);
        if (btn) {
          btn.classList.toggle('bg-white', m === mode);
          btn.classList.toggle('shadow', m === mode);
          btn.classList.toggle('text-amber-700', m === mode);
          btn.classList.toggle('text-gray-500', m !== mode);
        }
      });
      if (currentDeal) {
        const state = ensureForecastState(currentDeal);
        state.selfMode = mode;
      }
    }

    function renderFcMonthlyYearSelector() {
      const sel = document.getElementById('fcMonthlyYear');
      if (!sel) return;
      const currentYear = new Date().getFullYear();
      sel.innerHTML = '';
      for (let y = currentYear; y <= currentYear + 9; y++) {
        sel.innerHTML += '<option value="' + y + '">' + y + '年</option>';
      }
    }

    function renderFcMonthlyInputs() {
      const grid = document.getElementById('fcMonthlyGrid');
      const yearSel = document.getElementById('fcMonthlyYear');
      if (!grid || !yearSel || !currentDeal) return;
      const state = ensureForecastState(currentDeal);
      const year = yearSel.value;
      const saved = (state.selfMonthly && state.selfMonthly[year]) || [];
      grid.innerHTML = '';
      for (let m = 0; m < 12; m++) {
        grid.innerHTML +=
          '<div>' +
            '<label class="text-[10px] text-gray-400">' + (m + 1) + '月</label>' +
            '<input type="text" inputmode="decimal" data-month="' + m + '" data-year="' + year + '"' +
            ' value="' + (saved[m] || '') + '"' +
            ' placeholder="--"' +
            ' class="fc-monthly-input w-full px-1.5 py-1 border border-gray-200 rounded text-[11px] text-center">' +
          '</div>';
      }
    }

    function renderFcYearlyInputs() {
      const grid = document.getElementById('fcYearlyGrid');
      if (!grid || !currentDeal) return;
      const state = ensureForecastState(currentDeal);
      const currentYear = new Date().getFullYear();
      grid.innerHTML = '';
      for (let y = currentYear; y <= currentYear + 9; y++) {
        const saved = (state.selfYearly && state.selfYearly[y]) || '';
        grid.innerHTML +=
          '<div class="flex items-center gap-2">' +
            '<span class="text-[11px] text-gray-500 w-10">' + y + '</span>' +
            '<input type="text" inputmode="decimal" data-year="' + y + '"' +
            ' value="' + saved + '"' +
            ' placeholder="月均（万）"' +
            ' class="fc-yearly-input flex-1 px-2 py-1 border border-gray-200 rounded text-[11px]">' +
          '</div>';
      }
    }

    function onFcQuickInput() {
      // Live preview update
      if (!currentDeal) return;
      const val = parseWanValue(document.getElementById('fcQuickValue')?.value);
      if (val > 0) {
        const state = ensureForecastState(currentDeal);
        state.selfQuickValue = val;
        renderFcChart(state);
      }
    }

    function saveFcSelfInput() {
      if (!currentDeal) {
        showToast('warning', '请先选择项目', '');
        return;
      }
      const state = ensureForecastState(currentDeal);
      let avgValue = 0;

      if (fcInputMode === 'quick') {
        const val = parseWanValue(document.getElementById('fcQuickValue')?.value);
        if (!val || val <= 0) {
          showToast('warning', '请输入月均营业额', '');
          return;
        }
        state.selfQuickValue = val;
        avgValue = val;
      } else if (fcInputMode === 'monthly') {
        const year = document.getElementById('fcMonthlyYear')?.value;
        const inputs = document.querySelectorAll('.fc-monthly-input');
        const monthData = [];
        inputs.forEach(inp => {
          const v = parseWanValue(inp.value);
          monthData.push(v > 0 ? v : 0);
        });
        if (!state.selfMonthly) state.selfMonthly = {};
        state.selfMonthly[year] = monthData;
        const filled = monthData.filter(v => v > 0);
        avgValue = filled.length > 0 ? filled.reduce((a, b) => a + b, 0) / filled.length : 0;
        if (avgValue <= 0) {
          showToast('warning', '请至少填写一个月的数据', '');
          return;
        }
      } else if (fcInputMode === 'yearly') {
        const inputs = document.querySelectorAll('.fc-yearly-input');
        const yearData = {};
        let total = 0, count = 0;
        inputs.forEach(inp => {
          const y = inp.dataset.year;
          const v = parseWanValue(inp.value);
          if (v > 0) { yearData[y] = v; total += v; count++; }
        });
        state.selfYearly = yearData;
        avgValue = count > 0 ? total / count : 0;
        if (avgValue <= 0) {
          showToast('warning', '请至少填写一年的数据', '');
          return;
        }
      }

      state.selfMode = fcInputMode;
      state.selectedSource = 'self';
      state.selectedValue = +avgValue.toFixed(1);
      saveForecastState();

      // Also save to researchInputsByDeal for workbench compatibility
      researchInputsByDeal[currentDeal.id] = {
        predictedMonthlyRevenue: avgValue,
        paybackMonths: 0
      };
      saveResearchInputs();

      applyForecastToWb('self');
    }

    // ---- Chart rendering ----
    function setFcChartRange(range) {
      fcChartRange = range;
      ['1y', '3y', '10y'].forEach(r => {
        const btn = document.getElementById('fcRange' + r);
        if (btn) {
          btn.classList.toggle('bg-teal-50', r === range);
          btn.classList.toggle('text-teal-700', r === range);
          btn.classList.toggle('text-gray-500', r !== range);
        }
      });
      if (currentDeal) renderFcChart(ensureForecastState(currentDeal));
    }

    function renderFcChart(state) {
      const container = document.getElementById('fcChartContainer');
      if (!container || !state) return;

      const rangeMonths = fcChartRange === '1y' ? 12 : fcChartRange === '3y' ? 36 : 120;
      const sysData = state.systemMonthly.slice(0, rangeMonths);
      const borData = state.borrowerMonthly.slice(0, Math.min(rangeMonths, 36));

      // Build self data array based on mode
      let selfData = [];
      if (state.selfQuickValue && state.selfQuickValue > 0) {
        selfData = new Array(rangeMonths).fill(state.selfQuickValue);
      }
      if (state.selfMode === 'monthly' && state.selfMonthly) {
        const currentYear = new Date().getFullYear();
        selfData = [];
        for (let i = 0; i < rangeMonths; i++) {
          const y = String(currentYear + Math.floor(i / 12));
          const m = i % 12;
          const arr = state.selfMonthly[y];
          selfData.push((arr && arr[m] > 0) ? arr[m] : 0);
        }
      }
      if (state.selfMode === 'yearly' && state.selfYearly) {
        const currentYear = new Date().getFullYear();
        selfData = [];
        for (let i = 0; i < rangeMonths; i++) {
          const y = String(currentYear + Math.floor(i / 12));
          selfData.push(state.selfYearly[y] || 0);
        }
      }

      // Find max value for scaling
      const allVals = [...sysData, ...borData, ...selfData].filter(v => v > 0);
      const maxVal = allVals.length > 0 ? Math.max(...allVals) : 100;
      const chartH = 160;

      // Render as SVG polylines
      const w = 100; // viewBox width percentage
      const stepX = rangeMonths > 1 ? w / (rangeMonths - 1) : w;

      function polyline(data, color, dashed) {
        if (!data || data.length === 0) return '';
        const points = data.map((v, i) => {
          const x = (i * stepX).toFixed(2);
          const y = (chartH - (v / maxVal) * (chartH - 20) - 10).toFixed(2);
          return x + ',' + y;
        }).join(' ');
        return '<polyline points="' + points + '" fill="none" stroke="' + color + '" stroke-width="1.5"' +
          (dashed ? ' stroke-dasharray="4,3"' : '') + ' />';
      }

      // X-axis labels
      let labels = '';
      const currentYear = new Date().getFullYear();
      if (rangeMonths <= 12) {
        for (let i = 0; i < 12; i += 2) {
          const x = (i * stepX).toFixed(2);
          labels += '<text x="' + x + '" y="' + (chartH - 1) + '" font-size="3" fill="#9ca3af" text-anchor="middle">' + (i + 1) + '月</text>';
        }
      } else if (rangeMonths <= 36) {
        for (let i = 0; i < 36; i += 6) {
          const x = (i * stepX).toFixed(2);
          const yr = currentYear + Math.floor(i / 12);
          labels += '<text x="' + x + '" y="' + (chartH - 1) + '" font-size="3" fill="#9ca3af" text-anchor="middle">' + yr + '/' + (i % 12 + 1) + '</text>';
        }
      } else {
        for (let i = 0; i < 120; i += 12) {
          const x = (i * stepX).toFixed(2);
          labels += '<text x="' + x + '" y="' + (chartH - 1) + '" font-size="3" fill="#9ca3af" text-anchor="middle">' + (currentYear + i / 12) + '</text>';
        }
      }

      container.innerHTML =
        '<svg viewBox="0 0 ' + w + ' ' + chartH + '" preserveAspectRatio="none" class="w-full h-full">' +
          polyline(sysData, '#14b8a6', false) +
          polyline(borData, '#0ea5e9', false) +
          polyline(selfData.filter(v => v > 0).length > 0 ? selfData : [], '#f59e0b', false) +
          labels +
        '</svg>';
    }

    // ---- Selected status ----
    function renderFcSelectedStatus(state) {
      const valEl = document.getElementById('fcSelectedValue');
      const srcEl = document.getElementById('fcSelectedSource');
      if (!valEl || !srcEl) return;

      if (state.selectedValue && state.selectedSource) {
        valEl.textContent = state.selectedValue.toFixed(1) + '万/月';
        const sourceLabels = { system: '系统预估', borrower: '融资方预估', self: '自行填写' };
        srcEl.textContent = '（来源：' + (sourceLabels[state.selectedSource] || state.selectedSource) + '）';
      } else {
        valEl.textContent = '未选择';
        srcEl.textContent = '';
      }
    }

    // ---- Apply to workbench ----
    function applyForecastToWb(source) {
      if (!currentDeal) {
        showToast('warning', '请先选择项目', '');
        return;
      }
      const state = ensureForecastState(currentDeal);
      let value = 0;

      if (source === 'system') {
        value = state.systemMonthly.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
      } else if (source === 'borrower') {
        value = state.borrowerMonthly.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
      } else if (source === 'self') {
        value = state.selectedValue || 0;
        if (!value || value <= 0) {
          showToast('warning', '请先填写并保存自行预估值', '');
          return;
        }
      }

      if (value <= 0) return;

      state.selectedSource = source;
      state.selectedValue = +value.toFixed(1);
      saveForecastState();

      // Save to researchInputsByDeal for workbench compatibility
      researchInputsByDeal[currentDeal.id] = {
        predictedMonthlyRevenue: value,
        paybackMonths: 0
      };
      saveResearchInputs();

      // Apply to workbench
      currentDeal.forecastMonthlyRevenue = value.toFixed(1) + '万/月';
      const original = allDeals.find(d => d.id === currentDeal.id);
      if (original) original.forecastMonthlyRevenue = currentDeal.forecastMonthlyRevenue;
      const wb = ensureWorkbenchState();
      if (wb) {
        wb.privateRevenueWan = +value.toFixed(1);
        wb.privateSource = source;
        saveWorkbenchState();
      }
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));

      renderFcSelectedStatus(state);
      renderFcChart(state);

      const sourceLabels = { system: '系统预估', borrower: '融资方预估', self: '自行填写' };
      showToast('success', '已采用' + sourceLabels[source], '月均 ' + value.toFixed(1) + '万 已带入条款工作台');
      switchSessionTab('workbench');
    }

    // Legacy compatibility
    function runRevenueForecast() { switchSessionTab('forecast'); }
    function applyForecastToWorkbench() { switchSessionTab('forecast'); }
    function runForecastCalc() { switchSessionTab('forecast'); }
