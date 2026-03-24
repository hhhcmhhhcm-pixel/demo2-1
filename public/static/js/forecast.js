    // ==================== 营业额预估工作台 ====================

    // ---- Mock data generators ----
    function generateSystemForecast(deal) {
      // 模型预估：基于历史月均营收，按星期/节假日分组拟合趋势，产出未来5年逐月数据
      const baseRevenue = parseWanValue(deal.monthlyRevenue) || 120;
      const monthlyGrowthRate = 0.003;
      const months = [];
      for (let i = 0; i < 60; i++) {
        const yearIdx = Math.floor(i / 12);
        const monthInYear = i % 12;
        const seasonFactor = 1 + 0.08 * Math.sin((monthInYear - 2) * Math.PI / 6);
        const growthFactor = Math.pow(1 + monthlyGrowthRate, i) * (1 - yearIdx * 0.002);
        months.push(Math.max(1, +(baseRevenue * growthFactor * seasonFactor).toFixed(1)));
      }
      return months;
    }

    function generateBorrowerForecast(deal) {
      // 融资方在参与通内填写的预估：仅3年36个月数据
      const baseRevenue = parseWanValue(deal.monthlyRevenue) || 120;
      const optimismFactor = 1.12;
      const monthlyGrowthRate = 0.005;
      const months = [];
      for (let i = 0; i < 36; i++) {
        const monthInYear = i % 12;
        const seasonFactor = 1 + 0.06 * Math.sin((monthInYear - 1) * Math.PI / 6);
        const growthFactor = Math.pow(1 + monthlyGrowthRate, i);
        months.push(Math.max(1, +(baseRevenue * optimismFactor * growthFactor * seasonFactor).toFixed(1)));
      }
      return months;
    }

    function generateHistoricalActual(deal) {
      // 历史实际数据：模拟最近6个月的真实营业额
      const baseRevenue = parseWanValue(deal.monthlyRevenue) || 120;
      const months = [];
      for (let i = 0; i < 6; i++) {
        const monthInYear = (new Date().getMonth() - 5 + i + 12) % 12;
        const seasonFactor = 1 + 0.05 * Math.sin((monthInYear - 2) * Math.PI / 6);
        const noise = 0.95 + Math.random() * 0.10;
        months.push(Math.max(1, +(baseRevenue * seasonFactor * noise).toFixed(1)));
      }
      return months;
    }

    // ---- Smooth curve helper: Catmull-Rom → cubic bezier SVG path ----
    function smoothPath(xyPoints, color, strokeWidth) {
      if (!xyPoints || xyPoints.length === 0) return '';
      if (xyPoints.length === 1) {
        return '<circle cx="' + xyPoints[0][0].toFixed(1) + '" cy="' + xyPoints[0][1].toFixed(1) + '" r="3" fill="' + color + '" />';
      }
      var d = 'M' + xyPoints[0][0].toFixed(1) + ',' + xyPoints[0][1].toFixed(1);
      if (xyPoints.length === 2) {
        d += ' L' + xyPoints[1][0].toFixed(1) + ',' + xyPoints[1][1].toFixed(1);
      } else {
        for (var i = 0; i < xyPoints.length - 1; i++) {
          var p0 = xyPoints[Math.max(i - 1, 0)];
          var p1 = xyPoints[i];
          var p2 = xyPoints[Math.min(i + 1, xyPoints.length - 1)];
          var p3 = xyPoints[Math.min(i + 2, xyPoints.length - 1)];
          var cp1x = p1[0] + (p2[0] - p0[0]) / 6;
          var cp1y = p1[1] + (p2[1] - p0[1]) / 6;
          var cp2x = p2[0] - (p3[0] - p1[0]) / 6;
          var cp2y = p2[1] - (p3[1] - p1[1]) / 6;
          d += ' C' + cp1x.toFixed(1) + ',' + cp1y.toFixed(1) + ' ' + cp2x.toFixed(1) + ',' + cp2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
        }
      }
      return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + (strokeWidth || 2) + '" stroke-linecap="round" stroke-linejoin="round" />';
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
      if (forecastByDeal[deal.id]) {
        // 向后兼容：如果旧缓存没有历史数据，补充生成
        if (!forecastByDeal[deal.id].historicalActual) {
          forecastByDeal[deal.id].historicalActual = generateHistoricalActual(deal);
          saveForecastState();
        }
        return forecastByDeal[deal.id];
      }
      forecastByDeal[deal.id] = {
        systemMonthly: generateSystemForecast(deal),
        borrowerMonthly: generateBorrowerForecast(deal),
        historicalActual: generateHistoricalActual(deal),
        selfMode: 'quick',
        selfQuickValue: null,
        selfMonthly: {},
        selfYearly: {},
        selectedSource: null,
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
      const avg5y = data.reduce((a, b) => a + b, 0) / data.length;
      const min = Math.min(...data);
      const max = Math.max(...data);
      el.innerHTML =
        '<div class="p-2.5 rounded-lg bg-teal-50 border border-teal-100">' +
          '<p class="text-xs text-teal-700 font-medium">月均营业额（模型预估）</p>' +
          '<p class="text-lg font-bold text-teal-700">' + avg1y.toFixed(1) + '万/月</p>' +
          '<p class="text-[11px] text-teal-600">首年均值</p>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">3年均值</p><p class="text-xs font-bold text-gray-700">' + avg3y.toFixed(1) + '万</p></div>' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">5年均值</p><p class="text-xs font-bold text-gray-700">' + avg5y.toFixed(1) + '万</p></div>' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">波动区间</p><p class="text-xs font-bold text-gray-700">' + min.toFixed(0) + '-' + max.toFixed(0) + '万</p></div>' +
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">数据覆盖</p><p class="text-xs font-bold text-gray-700">60个月</p></div>' +
        '</div>' +
        '<p class="text-[10px] text-gray-400 mt-1">按星期+节假日分组拟合趋势，模型自动生成，不可编辑。</p>';
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
          '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[10px] text-gray-500">数据来源</p><p class="text-xs font-bold text-gray-700">参与通内填写</p></div>' +
        '</div>' +
        '<p class="text-[10px] text-gray-400 mt-1">融资方在参与通内创建与编辑，可随时撤回。系统不校验真实性，由投资人自行判断。</p>';
    }

    // ---- Self input ----
    function renderFcSelfInputs(state) {
      fcInputMode = state.selfMode || 'quick';
      setFcInputMode(fcInputMode);

      const quickEl = document.getElementById('fcQuickValue');
      if (quickEl && state.selfQuickValue) quickEl.value = String(state.selfQuickValue);

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

    // Bug fix #3: 切换年份前先保存当前年份的输入到 state
    function saveCurrentMonthlyToState() {
      if (!currentDeal) return;
      const state = ensureForecastState(currentDeal);
      const inputs = document.querySelectorAll('.fc-monthly-input');
      if (inputs.length === 0) return;
      const year = inputs[0]?.dataset?.year;
      if (!year) return;
      const monthData = [];
      inputs.forEach(inp => {
        const v = parseWanValue(inp.value);
        monthData.push(v > 0 ? v : 0);
      });
      if (!state.selfMonthly) state.selfMonthly = {};
      state.selfMonthly[year] = monthData;
      saveForecastState();
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

    function onFcMonthlyYearChange() {
      // 切换年份前先保存当前 DOM 中的输入
      saveCurrentMonthlyToState();
      renderFcMonthlyInputs();
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
        // 先保存当前年份DOM中的数据
        saveCurrentMonthlyToState();
        // 计算所有已填写年份的总均值
        if (!state.selfMonthly) state.selfMonthly = {};
        let total = 0, count = 0;
        Object.keys(state.selfMonthly).forEach(yr => {
          const arr = state.selfMonthly[yr];
          if (arr) {
            arr.forEach(v => {
              if (v > 0) { total += v; count++; }
            });
          }
        });
        avgValue = count > 0 ? total / count : 0;
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

      applyForecastToWb('self');
    }

    // ---- Chart rendering ----
    function setFcChartRange(range) {
      fcChartRange = range;
      ['1y', '3y', '5y'].forEach(r => {
        const btn = document.getElementById('fcRange' + r);
        if (btn) {
          btn.classList.toggle('bg-teal-50', r === range);
          btn.classList.toggle('text-teal-700', r === range);
          btn.classList.toggle('text-gray-500', r !== range);
        }
      });
      if (currentDeal) renderFcChart(ensureForecastState(currentDeal));
    }

    // 构建自行填写数据——只返回实际有值的数据点，不补零
    function buildSelfDataPoints(state) {
      const currentYear = new Date().getFullYear();
      const points = []; // [{monthIdx, value}]

      if (state.selfMode === 'quick' && state.selfQuickValue > 0) {
        // 快捷模式：单一水平线，不限定长度，走势图按实际数据范围展示
        // 返回一个特殊标记
        return { type: 'flat', value: state.selfQuickValue };
      }

      if (state.selfMode === 'monthly' && state.selfMonthly) {
        Object.keys(state.selfMonthly).sort().forEach(yr => {
          const arr = state.selfMonthly[yr];
          if (!arr) return;
          const yearOffset = (parseInt(yr) - currentYear) * 12;
          arr.forEach((v, m) => {
            if (v > 0) points.push({ monthIdx: yearOffset + m, value: v });
          });
        });
      }

      if (state.selfMode === 'yearly' && state.selfYearly) {
        Object.keys(state.selfYearly).sort().forEach(yr => {
          const v = state.selfYearly[yr];
          if (v > 0) {
            const yearOffset = (parseInt(yr) - currentYear) * 12;
            // 展开为12个月同一值
            for (let m = 0; m < 12; m++) {
              points.push({ monthIdx: yearOffset + m, value: v });
            }
          }
        });
      }

      if (points.length === 0) return null;
      return { type: 'points', data: points };
    }

    function renderFcChart(state) {
      const container = document.getElementById('fcChartContainer');
      if (!container || !state) return;

      const rangeMonths = fcChartRange === '1y' ? 12 : fcChartRange === '3y' ? 36 : 60;

      // 历史实际数据：最多6个月
      const histData = state.historicalActual || [];
      const histLen = Math.min(histData.length, 6);
      const totalSlots = histLen + rangeMonths;

      // 数据切片
      const sysData = state.systemMonthly.slice(0, Math.min(rangeMonths, state.systemMonthly.length));
      const borData = state.borrowerMonthly.slice(0, Math.min(rangeMonths, state.borrowerMonthly.length));
      const selfResult = buildSelfDataPoints(state);

      // Y轴范围
      const allVals = [...histData.slice(histData.length - histLen), ...sysData, ...borData];
      if (selfResult) {
        if (selfResult.type === 'flat') allVals.push(selfResult.value);
        else selfResult.data.forEach(p => { if (p.monthIdx < rangeMonths) allVals.push(p.value); });
      }
      const filtered = allVals.filter(v => v > 0);
      const maxVal = filtered.length > 0 ? Math.max(...filtered) * 1.08 : 100;
      const minVal = filtered.length > 0 ? Math.min(...filtered) * 0.92 : 0;
      const valRange = maxVal - minVal || 1;

      // SVG dimensions — 加宽左边距以容纳"万"单位
      const svgW = 800;
      const svgH = 180;
      const padL = 58;
      const padR = 10;
      const padT = 10;
      const padB = 30;
      const plotW = svgW - padL - padR;
      const plotH = svgH - padT - padB;

      function toX(slot) { return padL + (totalSlots > 1 ? (slot / (totalSlots - 1)) * plotW : plotW / 2); }
      function toY(v) { return padT + plotH - ((v - minVal) / valRange) * plotH; }

      // 将数组转为 [x,y] 坐标对，用于 smoothPath
      function arrayToXY(data, slotOffset) {
        return data.map(function(v, i) { return [toX(slotOffset + i), toY(v)]; });
      }
      function pointsToXY(points) {
        return points.filter(function(p) { return p.monthIdx < rangeMonths; })
          .map(function(p) { return [toX(histLen + p.monthIdx), toY(p.value)]; });
      }

      // 水平线（仅预估区域，实线）
      function flatLine(value, color) {
        var y = toY(value).toFixed(1);
        var x1 = toX(histLen).toFixed(1);
        var x2 = (svgW - padR).toFixed(1);
        return '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="2" />';
      }

      // Y轴网格+标签（加"万"单位）
      var gridAndYLabels = '';
      for (var t = 0; t <= 4; t++) {
        var val = minVal + (valRange * t / 4);
        var yPos = toY(val).toFixed(1);
        gridAndYLabels +=
          '<line x1="' + padL + '" y1="' + yPos + '" x2="' + (svgW - padR) + '" y2="' + yPos + '" stroke="#e5e7eb" stroke-width="0.5" />' +
          '<text x="' + (padL - 6) + '" y="' + (parseFloat(yPos) + 4) + '" font-size="10" fill="#9ca3af" text-anchor="end" font-family="Inter,sans-serif">' + val.toFixed(0) + '万</text>';
      }

      // 历史/预估分界线
      var dividerLine = '';
      if (histLen > 0) {
        var dx = toX(histLen - 0.5).toFixed(1);
        dividerLine = '<line x1="' + dx + '" y1="' + padT + '" x2="' + dx + '" y2="' + (svgH - padB) + '" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4,3" />';
      }

      // X轴标签 — 根据总slot数计算最小像素间距，防重叠
      var xLabels = '';
      var now = new Date();
      var baseYear = now.getFullYear();
      var baseMonth = now.getMonth();
      var minLabelGap = 55; // 标签最小像素间距

      // 收集所有候选标签 [{slot, label}]
      var candidateLabels = [];

      // 历史区间
      if (histLen > 0) {
        for (var i = 0; i < histLen; i++) {
          var offset = -(histLen - i);
          var hm = ((baseMonth + offset) % 12 + 12) % 12;
          var hy = baseYear + Math.floor((baseMonth + offset) / 12);
          candidateLabels.push({ slot: i, label: hy + '/' + (hm + 1), color: '#94a3b8' });
        }
      }

      // 预估区间
      for (var i = 0; i < rangeMonths; i++) {
        var fm = (baseMonth + i) % 12;
        var fy = baseYear + Math.floor((baseMonth + i) / 12);
        candidateLabels.push({ slot: histLen + i, label: fy + '/' + (fm + 1), color: '#9ca3af' });
      }

      // 按最小像素间距过滤：贪心选取
      var lastLabelX = -Infinity;
      for (var ci = 0; ci < candidateLabels.length; ci++) {
        var cx = toX(candidateLabels[ci].slot);
        if (cx - lastLabelX >= minLabelGap || ci === 0) {
          xLabels += '<text x="' + cx.toFixed(1) + '" y="' + (svgH - 6) + '" font-size="9" fill="' + candidateLabels[ci].color + '" text-anchor="middle" font-family="Inter,sans-serif">' + candidateLabels[ci].label + '</text>';
          lastLabelX = cx;
        }
      }

      // 所有曲线使用 smoothPath（Catmull-Rom 平滑）
      var histLine = '';
      if (histLen > 0) {
        var histSlice = histData.slice(histData.length - histLen);
        histLine = smoothPath(arrayToXY(histSlice, 0), '#94a3b8', 2);
      }

      var sysLine = smoothPath(arrayToXY(sysData, histLen), '#14b8a6', 2);
      var borLine = smoothPath(arrayToXY(borData, histLen), '#0ea5e9', 2);

      var selfLine = '';
      if (selfResult) {
        if (selfResult.type === 'flat') {
          selfLine = flatLine(selfResult.value, '#f59e0b');
        } else {
          selfLine = smoothPath(pointsToXY(selfResult.data), '#f59e0b', 2);
        }
      }

      // Hover tooltip
      var tooltipAreas = '';
      var barW = Math.max(4, plotW / totalSlots);
      for (var s = 0; s < totalSlots; s++) {
        var rx = toX(s) - barW / 2;
        var isHist = s < histLen;
        var histVal = '--', sysVal = '--', borVal = '--', selfVal = '--';

        // 计算该slot对应的年/月
        var slotOffset = isHist ? -(histLen - s) : (s - histLen);
        var slotM = ((baseMonth + slotOffset) % 12 + 12) % 12;
        var slotY = baseYear + Math.floor((baseMonth + slotOffset) / 12);
        var slotDate = slotY + '年' + (slotM + 1) + '月';

        if (isHist) {
          var hi = histData.length - histLen + s;
          histVal = hi >= 0 && hi < histData.length ? histData[hi].toFixed(1) : '--';
        } else {
          var fi = s - histLen;
          sysVal = fi < sysData.length ? sysData[fi].toFixed(1) : '--';
          borVal = fi < borData.length ? borData[fi].toFixed(1) : '--';
          if (selfResult) {
            if (selfResult.type === 'flat') {
              selfVal = selfResult.value.toFixed(1);
            } else {
              var pt = selfResult.data.find(function(p) { return p.monthIdx === fi; });
              if (pt) selfVal = pt.value.toFixed(1);
            }
          }
        }
        var slotCx = toX(s).toFixed(1);
        tooltipAreas +=
          '<rect x="' + rx.toFixed(1) + '" y="' + padT + '" width="' + barW.toFixed(1) + '" height="' + plotH + '" fill="transparent" class="fc-hover-rect"' +
          ' data-cx="' + slotCx + '" data-date="' + slotDate + '" data-hist="' + histVal + '" data-sys="' + sysVal + '" data-bor="' + borVal + '" data-self="' + selfVal + '" data-ishist="' + (isHist ? '1' : '0') + '" />';
      }

      // 纵向参考线（hover时显示）
      var crosshairLine = '<line id="fcCrosshair" x1="0" y1="' + padT + '" x2="0" y2="' + (svgH - padB) + '" stroke="#9ca3af" stroke-width="1" stroke-dasharray="4,3" style="display:none;" />';

      container.innerHTML =
        '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" class="w-full h-full" style="overflow:visible;">' +
          gridAndYLabels +
          dividerLine +
          histLine +
          sysLine +
          borLine +
          selfLine +
          xLabels +
          crosshairLine +
          tooltipAreas +
        '</svg>' +
        '<div id="fcTooltip" class="hidden absolute bg-gray-800 text-white text-[10px] rounded-lg px-2 py-1.5 pointer-events-none shadow-lg z-10" style="white-space:nowrap;"></div>';

      // Hover listeners
      var crosshair = container.querySelector('#fcCrosshair');
      container.querySelectorAll('.fc-hover-rect').forEach(function(rect) {
        rect.addEventListener('mouseenter', function(e) {
          var tip = document.getElementById('fcTooltip');
          if (!tip) return;
          // 显示纵向参考线
          if (crosshair) {
            crosshair.setAttribute('x1', this.dataset.cx);
            crosshair.setAttribute('x2', this.dataset.cx);
            crosshair.style.display = '';
          }
          var dateHtml = '<span style="color:#e2e8f0;font-weight:600;">' + this.dataset.date + '</span><br>';
          if (this.dataset.ishist === '1') {
            tip.innerHTML = dateHtml + '<span style="color:#cbd5e1;">历史实际: ' + this.dataset.hist + '万</span>';
          } else {
            tip.innerHTML = dateHtml +
              '<span style="color:#5eead4;">模型: ' + this.dataset.sys + '万</span><br>' +
              '<span style="color:#7dd3fc;">融资方: ' + this.dataset.bor + '万</span><br>' +
              '<span style="color:#fcd34d;">自填: ' + this.dataset.self + '万</span>';
          }
          tip.classList.remove('hidden');
        });
        rect.addEventListener('mousemove', function(e) {
          var tip = document.getElementById('fcTooltip');
          if (!tip) return;
          var cr = container.getBoundingClientRect();
          tip.style.left = (e.clientX - cr.left + 12) + 'px';
          tip.style.top = (e.clientY - cr.top - 10) + 'px';
        });
        rect.addEventListener('mouseleave', function() {
          var tip = document.getElementById('fcTooltip');
          if (tip) tip.classList.add('hidden');
          if (crosshair) crosshair.style.display = 'none';
        });
      });
    }

    // ---- Selected status ----
    function renderFcSelectedStatus(state) {
      const valEl = document.getElementById('fcSelectedValue');
      const srcEl = document.getElementById('fcSelectedSource');
      if (!valEl || !srcEl) return;
      if (state.selectedValue && state.selectedSource) {
        valEl.textContent = state.selectedValue.toFixed(1) + '万/月';
        const sourceLabels = { system: '模型预估', borrower: '融资方预估', self: '自行填写' };
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

      researchInputsByDeal[currentDeal.id] = {
        predictedMonthlyRevenue: value,
        paybackMonths: 0
      };
      saveResearchInputs();

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

      const sourceLabels = { system: '模型预估', borrower: '融资方预估', self: '自行填写' };
      showToast('success', '已采用' + sourceLabels[source], '月均 ' + value.toFixed(1) + '万');
    }

    // Legacy compatibility
    function runRevenueForecast() { switchSessionTab('forecast'); }
    function applyForecastToWorkbench() { switchSessionTab('forecast'); }
    function runForecastCalc() { switchSessionTab('forecast'); }
