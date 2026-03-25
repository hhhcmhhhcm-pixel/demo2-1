    // ==================== Detail Page ====================
    function openDetail(id) {
      currentDeal = dealsList.find(d => d.id === id) || allDeals.find(d => d.id === id);
      if (!currentDeal) return;
      document.getElementById('detailTitle').textContent = currentDeal.name;
      const statusMap = { open: { label: '待参与', cls: 'badge-warning' }, interested: { label: '已意向', cls: 'badge-primary' }, confirmed: { label: '已确认', cls: 'badge-success' }, closed: { label: '已关闭', cls: 'badge-danger' } };
      const st = statusMap[currentDeal.status] || statusMap.open;
      document.getElementById('detailStatus').className = 'badge ' + st.cls;
      document.getElementById('detailStatus').textContent = st.label;
      document.getElementById('detailIndustry').textContent = currentDeal.industry;
      document.getElementById('detailDate').textContent = currentDeal.originateDate;

      // 更新参与按钮
      const btn = document.getElementById('btnExpressIntent');
      if (currentDeal.status === 'confirmed') {
        btn.innerHTML = '<i class="fas fa-check-double mr-1"></i>已确认参与';
        btn.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      } else if (currentDeal.status === 'interested') {
        btn.innerHTML = '<i class="fas fa-file-signature mr-1"></i>查看意向';
        btn.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';
      } else {
        btn.innerHTML = '<i class="fas fa-hand-point-up mr-1"></i>表达意向';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }

      // Left panel — 项目信息（来自发起通）
      document.getElementById('detailLeft').innerHTML =
        '<div class="mb-5">' +
          '<div class="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-4 flex items-center gap-2"><i class="fas fa-paper-plane text-amber-500"></i><div><p class="text-xs font-bold text-amber-700">来自发起通</p><p class="text-xs text-amber-600">发起方：' + (currentDeal.originator || '未知') + '</p></div></div>' +
          '<div class="flex items-center space-x-3 mb-4"><div class="w-14 h-14 rounded-2xl flex items-center justify-center" style="background: linear-gradient(135deg, rgba(93,196,179,0.15), rgba(73,168,154,0.15));"><i class="fas fa-briefcase text-2xl" style="color: #5DC4B3;"></i></div><div><h2 class="text-lg font-bold text-gray-900">' + currentDeal.name + '</h2><p class="text-sm text-gray-500">' + currentDeal.industry + ' · ' + currentDeal.location + '</p></div></div>' +
          '<p class="text-sm text-gray-600 leading-relaxed mb-4">' + currentDeal.description + '</p>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-3 mb-5">' +
          '<div class="p-3 bg-teal-50 rounded-xl"><p class="text-xs text-gray-500 mb-1">投资金额</p><p class="text-lg font-bold text-teal-600">¥' + (currentDeal.amount/10000).toFixed(0) + '万</p></div>' +
          '<div class="p-3 bg-amber-50 rounded-xl"><p class="text-xs text-gray-500 mb-1">分成比例</p><p class="text-lg font-bold text-amber-600">' + currentDeal.revenueShare + '</p></div>' +
          '<div class="p-3 bg-cyan-50 rounded-xl"><p class="text-xs text-gray-500 mb-1">分成期限</p><p class="text-lg font-bold text-cyan-600">' + currentDeal.period + '</p></div>' +
          '<div class="p-3 bg-emerald-50 rounded-xl"><p class="text-xs text-gray-500 mb-1">AI评分</p><p class="text-lg font-bold text-emerald-600">' + currentDeal.aiScore + '<span class="text-xs text-gray-400">/10</span></p></div>' +
        '</div>' +
        '<div class="space-y-3"><h3 class="text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-store mr-1.5 text-amber-500"></i>经营数据（发起通提供）</h3>' +
          '<div class="p-3 bg-gray-50 rounded-xl border border-gray-100"><div class="flex items-center justify-between"><span class="text-xs font-medium text-gray-600">月均营收</span><span class="text-xs font-bold text-gray-800">' + (currentDeal.monthlyRevenue || '暂无') + '</span></div></div>' +
          '<div class="p-3 bg-gray-50 rounded-xl border border-gray-100"><div class="flex items-center justify-between"><span class="text-xs font-medium text-gray-600">员工人数</span><span class="text-xs font-bold text-gray-800">' + (currentDeal.employeeCount || '暂无') + '人</span></div></div>' +
          '<div class="p-3 bg-gray-50 rounded-xl border border-gray-100"><div class="flex items-center justify-between"><span class="text-xs font-medium text-gray-600">运营年限</span><span class="text-xs font-bold text-gray-800">' + (currentDeal.operatingYears || '暂无') + '年</span></div></div>' +
          '<div class="p-3 bg-gray-50 rounded-xl border border-gray-100"><div class="flex items-center justify-between"><span class="text-xs font-medium text-gray-600">风控评级</span><span class="text-xs font-bold text-emerald-600">' + (currentDeal.riskGrade || 'N/A') + '</span></div></div>' +
        '</div>';

      // Right panel — 做功课内容
      const hasMatch = currentDeal.matchScore !== null && currentDeal.matchScore !== undefined;
      const matchColor = hasMatch ? (currentDeal.matchScore >= 80 ? '#10b981' : currentDeal.matchScore >= 60 ? '#f59e0b' : '#ef4444') : '#6b7280';
      const industryRef = INDUSTRY_COMPARABLES[currentDeal.industry] || INDUSTRY_COMPARABLES.default;
      const savedResearch = researchInputsByDeal[currentDeal.id] || {};
      const onePagerSummary = '项目「' + currentDeal.name + '」属于' + currentDeal.industry + '行业，当前AI评分' + currentDeal.aiScore + '，分成比例' + currentDeal.revenueShare + '，拟融资' + (currentDeal.amount/10000).toFixed(0) + '万。结合运营年限' + currentDeal.operatingYears + '年与风控评级' + (currentDeal.riskGrade || 'N/A') + '，建议重点核验现金流稳定性和季节波动。';
      const riskHint = parseFloat(currentDeal.aiScore) >= 8.5 ? '风险整体可控，建议重点关注扩张节奏与回款稳定性。' : '建议加强风控复核，重点校验营收波动与团队执行力。';
      // 生成各筛子的评估结果（只评估用户面板中的筛子，融资方视角不渲染）
      var isFinancerView = currentPerspective === 'financer';
      let sieveResults = '';
      if (!isFinancerView) {
        mySieves.forEach(key => {
          const sieve = SIEVE_LIBRARY[key];
          if (!sieve) return;
          const testResult = sieve.filter([currentDeal]);
          const passed = testResult.length > 0;
          const score = passed ? testResult[0].matchScore : Math.floor(Math.random() * 35 + 10);
          const barColor = passed ? '#10b981' : '#ef4444';
          sieveResults += '<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">' +
            '<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background: ' + (passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') + ';"><i class="fas ' + sieve.icon + '" style="color:' + (passed ? '#10b981' : '#ef4444') + '; font-size:12px;"></i></div>' +
            '<div class="flex-1 min-w-0">' +
              '<div class="flex items-center justify-between mb-1"><span class="text-xs font-semibold text-gray-700">' + sieve.name + '</span><span class="sieve-tag ' + (passed ? 'sieve-pass' : 'sieve-fail') + '">' + (passed ? '<i class="fas fa-check" style="font-size:8px;"></i>通过' : '<i class="fas fa-times" style="font-size:8px;"></i>未通过') + '</span></div>' +
              '<div class="match-bar"><div class="match-bar-fill" style="width:' + score + '%; background:' + barColor + ';"></div></div>' +
              '<p class="text-xs text-gray-400 mt-1">' + score + '% 匹配度</p>' +
            '</div></div>';
        });
        if (mySieves.length === 0) {
          sieveResults = '<div class="text-center py-4"><p class="text-sm text-gray-400">暂未添加筛子</p><button onclick="goToDashboard(); setTimeout(showSieveManager, 300);" class="text-xs text-cyan-600 mt-1 hover:underline">去管理筛子</button></div>';
        }
      }

      const comparableCases = industryRef.cases.map((item, idx) =>
        '<div class="p-3 bg-gray-50 rounded-xl border border-gray-100">' +
          '<p class="text-xs text-gray-500 mb-1">案例 ' + (idx + 1) + '</p>' +
          '<p class="text-sm font-medium text-gray-700">' + item + '</p>' +
        '</div>'
      ).join('');

      document.getElementById('detailRight').innerHTML =
        '<div class="space-y-5">' +
          // 一页纸
          '<div id="sectionOnepager" class="bg-white rounded-2xl p-5 border border-gray-100">' +
            '<h3 class="text-sm font-bold text-gray-800 mb-3"><i class="fas fa-file-lines mr-1.5 text-cyan-500"></i>项目一页纸</h3>' +
            '<p class="text-sm text-gray-600 leading-relaxed mb-4">' + onePagerSummary + '</p>' +
            '<div class="grid grid-cols-2 gap-3 mb-4">' +
              '<div class="p-3 rounded-xl bg-cyan-50"><p class="text-xs text-gray-500">近12月月营收趋势</p><p class="text-sm font-bold text-cyan-700 mt-1">' + (currentDeal.monthlyRevenue || '暂无') + '</p></div>' +
              '<div class="p-3 rounded-xl bg-teal-50"><p class="text-xs text-gray-500">净利润率（估）</p><p class="text-sm font-bold text-teal-700 mt-1">' + (8 + Math.floor(parseFloat(currentDeal.aiScore) || 7)) + '%</p></div>' +
              '<div class="p-3 rounded-xl bg-amber-50"><p class="text-xs text-gray-500">主体信息</p><p class="text-sm font-bold text-amber-700 mt-1">' + (currentDeal.companyName || currentDeal.originator || '融资主体') + '</p></div>' +
              '<div class="p-3 rounded-xl bg-rose-50"><p class="text-xs text-gray-500">风险标注</p><p class="text-sm font-bold text-rose-700 mt-1">' + riskHint + '</p></div>' +
            '</div>' +
            (!isFinancerView && hasMatch ? '<div class="p-3 bg-gray-50 rounded-xl border border-gray-100"><div class="flex items-center justify-between"><p class="text-xs font-medium text-gray-600">当前筛子匹配度</p><p class="text-sm font-bold" style="color:' + matchColor + ';">' + currentDeal.matchScore + '%</p></div><div class="match-bar mt-2"><div class="match-bar-fill" style="width:' + currentDeal.matchScore + '%; background:' + matchColor + ';"></div></div></div>' : '') +
          '</div>' +
          // 同行业成交参考
          '<div id="sectionComparables" class="bg-white rounded-2xl p-5 border border-gray-100">' +
            '<h3 class="text-sm font-bold text-gray-800 mb-4"><i class="fas fa-scale-balanced mr-1.5 text-amber-500"></i>同行业成交参考</h3>' +
            '<div class="grid grid-cols-2 gap-3 mb-4">' +
              '<div class="p-3 rounded-xl bg-gray-50 border border-gray-100"><p class="text-xs text-gray-500">融资金额区间</p><p class="text-sm font-semibold text-gray-700 mt-1">' + industryRef.amountRange + '</p></div>' +
              '<div class="p-3 rounded-xl bg-gray-50 border border-gray-100"><p class="text-xs text-gray-500">分成比例区间</p><p class="text-sm font-semibold text-gray-700 mt-1">' + industryRef.shareRange + '</p></div>' +
              '<div class="p-3 rounded-xl bg-gray-50 border border-gray-100"><p class="text-xs text-gray-500">封顶APR区间</p><p class="text-sm font-semibold text-gray-700 mt-1">' + industryRef.aprRange + '</p></div>' +
              '<div class="p-3 rounded-xl bg-gray-50 border border-gray-100"><p class="text-xs text-gray-500">同行业门店月营收</p><p class="text-sm font-semibold text-gray-700 mt-1">' + industryRef.revenueRange + '</p></div>' +
            '</div>' +
            '<div class="space-y-2">' + comparableCases + '</div>' +
          '</div>' +
          // 营业额预估入口（已拆为独立Tab）
          '<div class="bg-white rounded-2xl p-4 border border-gray-100">' +
            '<div class="flex items-center justify-between">' +
              '<div class="flex items-center gap-2"><i class="fas fa-chart-line text-teal-500"></i><span class="text-sm font-bold text-gray-800">营业额预估</span></div>' +
              '<button onclick="switchSessionTab(&apos;forecast&apos;)" class="px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700"><i class="fas fa-arrow-right mr-1"></i>前往预估工作台</button>' +
            '</div>' +
            (savedResearch.predictedMonthlyRevenue ? '<p class="text-xs text-teal-600 mt-2">上次预测：' + savedResearch.predictedMonthlyRevenue.toFixed(1) + '万/月</p>' : '<p class="text-xs text-gray-400 mt-2">尚未计算，前往营业额预估工作台开始。</p>') +
          '</div>' +
          // 筛子评估结果（辅助）— 融资方视角不显示
          (!isFinancerView ? '<div class="bg-white rounded-2xl p-5 border border-gray-100"><h3 class="text-sm font-bold text-gray-800 mb-4"><i class="fas fa-filter mr-1.5 text-cyan-500"></i>筛子评估（辅助参考）</h3><div class="space-y-3">' + sieveResults + '</div>' +
          '<p class="text-xs text-gray-400 mt-3">说明：做功课阶段建议优先结合一页纸和同行参考，再用筛子结果做交叉验证。</p></div>' : '') +
        '</div>';

      switchDetailView('onepager');

      switchPage('pageProjectSession');
      switchSessionTab('research');
    }

    function goToDashboard() { switchPage('pageDashboard'); renderDeals(); }

    function expressIntent() {
      if (!currentDeal) return;
      if (currentDeal.status === 'confirmed') {
        showToast('info', '已确认参与', '此项目已在条款通处理中');
        return;
      }
      switchSessionTab('intent');
      showToast('info', '进入表达意向', '请先填写结构化意向并确认发送');
    }

    function switchDetailView(view) {
      const mapping = {
        onepager: { btn: 'btnOnepager', section: 'sectionOnepager' },
        comparables: { btn: 'btnComparables', section: 'sectionComparables' }
      };
      Object.keys(mapping).forEach(k => {
        const btn = document.getElementById(mapping[k].btn);
        if (!btn) return;
        btn.className = k === view
          ? 'px-2.5 py-1 rounded-md text-xs font-semibold bg-white shadow text-teal-600'
          : 'px-2.5 py-1 rounded-md text-xs font-semibold text-gray-600';
      });
      const target = mapping[view] ? document.getElementById(mapping[view].section) : null;
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
