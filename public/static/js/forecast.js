    // ==================== 营业额预估工作台 ====================

    function renderForecastTab() {
      if (!currentDeal) return;
      const saved = researchInputsByDeal[currentDeal.id] || {};
      const defaultBase = saved.base || parseWanValue(currentDeal.monthlyRevenue) || 100;
      const defaultGrowth = Number.isFinite(saved.growth) ? saved.growth : 6;
      const defaultSeasonality = Number.isFinite(saved.seasonality) ? saved.seasonality : 0;

      const baseEl = document.getElementById('fcBase');
      const growthEl = document.getElementById('fcGrowth');
      const seasonalityEl = document.getElementById('fcSeasonality');
      if (baseEl) baseEl.value = String(defaultBase);
      if (growthEl) growthEl.value = String(defaultGrowth);
      if (seasonalityEl) seasonalityEl.value = String(defaultSeasonality);

      // Render previous result if exists
      const resultEl = document.getElementById('fcResult');
      if (resultEl && saved.predictedMonthlyRevenue) {
        resultEl.innerHTML =
          '<div class="p-3 rounded-xl bg-teal-50 border border-teal-100">' +
            '<p class="text-xs text-teal-700">预测月均营业额</p>' +
            '<p class="text-lg font-bold text-teal-700 mt-0.5">' + saved.predictedMonthlyRevenue.toFixed(1) + '万/月</p>' +
            '<p class="text-xs text-teal-600 mt-1">按当前分成比例估算，回本约 ' + (saved.paybackMonths || 0).toFixed(1) + ' 个月</p>' +
          '</div>';
        renderForecastChart(saved);
      }

      // Update link info
      renderForecastLinkInfo();
    }

    function runForecastCalc() {
      if (!currentDeal) {
        showToast('warning', '请先选择项目', '请从项目列表进入一个项目后再进行预估');
        return;
      }
      const baseInput = document.getElementById('fcBase');
      const rawBase = baseInput ? baseInput.value : '';
      const typedBase = parseWanValue(rawBase);
      const fallbackBase = parseWanValue(currentDeal.monthlyRevenue);
      const base = typedBase > 0 ? typedBase : fallbackBase;

      const growthRaw = parseFloat(document.getElementById('fcGrowth')?.value || '0');
      const seasonalityRaw = parseFloat(document.getElementById('fcSeasonality')?.value || '0');
      const growth = Number.isFinite(growthRaw) ? growthRaw : 0;
      const seasonality = Number.isFinite(seasonalityRaw) ? seasonalityRaw : 0;

      if (!base || base <= 0) {
        showToast('warning', '请输入营业额基准值', '建议输入最近3个月平均月营收（单位：万），例如 120.5');
        return;
      }
      if (baseInput && typedBase <= 0 && fallbackBase > 0) baseInput.value = String(fallbackBase);

      const predicted = Math.max(1, base * (1 + growth / 100) * (1 + seasonality / 100));
      const shareRatio = parseFloat(String(currentDeal.revenueShare || '').replace('%', '')) / 100 || 0.1;
      const monthlyPayback = predicted * shareRatio;
      const amountWan = currentDeal.amount / 10000;
      const paybackMonths = monthlyPayback > 0 ? (amountWan / monthlyPayback) : 0;

      const forecastData = { base, growth, seasonality, predictedMonthlyRevenue: predicted, paybackMonths };
      researchInputsByDeal[currentDeal.id] = forecastData;
      saveResearchInputs();

      const resultEl = document.getElementById('fcResult');
      if (resultEl) {
        resultEl.innerHTML =
          '<div class="p-3 rounded-xl bg-teal-50 border border-teal-100">' +
            '<p class="text-xs text-teal-700">预测月均营业额</p>' +
            '<p class="text-lg font-bold text-teal-700 mt-0.5">' + predicted.toFixed(1) + '万/月</p>' +
            '<p class="text-xs text-teal-600 mt-1">按当前分成比例估算，回本约 ' + paybackMonths.toFixed(1) + ' 个月</p>' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-2 mt-3">' +
            '<div class="p-2.5 rounded-lg bg-cyan-50 border border-cyan-100"><p class="text-xs text-gray-500">月回款</p><p class="text-sm font-bold text-cyan-700">' + monthlyPayback.toFixed(1) + '万</p></div>' +
            '<div class="p-2.5 rounded-lg bg-amber-50 border border-amber-100"><p class="text-xs text-gray-500">分成比例</p><p class="text-sm font-bold text-amber-700">' + (currentDeal.revenueShare || '--') + '</p></div>' +
          '</div>';
      }

      renderForecastChart(forecastData);
      renderForecastLinkInfo();
      showToast('success', '预测完成', '已生成营业额预估，可带入条款工作台');
    }

    function renderForecastChart(data) {
      const chartArea = document.getElementById('fcChartArea');
      const chartBars = document.getElementById('fcChartBars');
      if (!chartArea || !chartBars) return;

      chartArea.classList.remove('hidden');
      const base = data.base || 100;
      const growth = (data.growth || 0) / 100;
      const seasonality = (data.seasonality || 0) / 100;
      const months = [];
      for (let i = 0; i < 12; i++) {
        const monthVal = base * (1 + growth * (i / 12));
        const seasonalAdj = i < 6 ? (1 + seasonality / 2 * (i / 6)) : (1 + seasonality / 2 * ((12 - i) / 6));
        months.push(Math.max(1, monthVal * seasonalAdj));
      }
      const maxVal = Math.max(...months);
      const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
      chartBars.innerHTML = months.map((v, i) => {
        const h = maxVal > 0 ? Math.round((v / maxVal) * 100) : 0;
        return '<div class="flex-1 flex flex-col items-center gap-1">' +
          '<span class="text-[9px] text-gray-500">' + v.toFixed(0) + '</span>' +
          '<div class="w-full rounded-t" style="height:' + h + 'px; background: linear-gradient(180deg, #14b8a6 0%, #0d9488 100%);"></div>' +
          '<span class="text-[9px] text-gray-400">' + monthNames[i] + '</span>' +
        '</div>';
      }).join('');
    }

    function renderForecastLinkInfo() {
      if (!currentDeal) return;
      const saved = researchInputsByDeal[currentDeal.id];
      const linkInfo = document.getElementById('fcLinkInfo');
      if (!linkInfo) return;

      if (saved && saved.predictedMonthlyRevenue) {
        const val = saved.predictedMonthlyRevenue.toFixed(1);
        linkInfo.querySelector('p')?.remove();
        const hint = linkInfo.querySelector('.fc-link-hint');
        if (!hint) {
          const p = document.createElement('p');
          p.className = 'fc-link-hint text-xs text-teal-600 font-medium mb-2';
          p.textContent = '当前预估值：' + val + '万/月，选择带入方式：';
          linkInfo.insertBefore(p, linkInfo.firstChild);
        }
      }
    }

    function applyForecastToWb(source) {
      if (!currentDeal) {
        showToast('warning', '请先选择项目', '');
        return;
      }
      const saved = researchInputsByDeal[currentDeal.id];
      if (!saved || !saved.predictedMonthlyRevenue) {
        showToast('warning', '尚未生成预测', '请先点击"计算预估"');
        return;
      }
      currentDeal.forecastMonthlyRevenue = saved.predictedMonthlyRevenue.toFixed(1) + '万/月';
      const original = allDeals.find(d => d.id === currentDeal.id);
      if (original) original.forecastMonthlyRevenue = currentDeal.forecastMonthlyRevenue;

      const wb = ensureWorkbenchState();
      if (wb) {
        wb.privateRevenueWan = Number(saved.predictedMonthlyRevenue.toFixed(1));
        wb.privateSource = source || 'research';
        saveWorkbenchState();
      }
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
      switchSessionTab('workbench');
      showToast('success', '已带入条款工作台', '预测值：' + currentDeal.forecastMonthlyRevenue + '（来源：' + source + '）');
    }

    // Legacy compatibility — old onclick references in research tab
    function runRevenueForecast() { switchSessionTab('forecast'); }
    function applyForecastToWorkbench() { switchSessionTab('forecast'); }
