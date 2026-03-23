    // ==================== Render Deals ====================
    function renderDeals() {
      const grid = document.getElementById('dealGrid');
      const empty = document.getElementById('emptyState');
      const searchVal = (document.getElementById('dealSearch')?.value || '').toLowerCase();
      const filterVal = document.getElementById('filterStatus')?.value || 'all';
      const industryVal = document.getElementById('filterIndustry')?.value || 'all';
      const sortVal = document.getElementById('sortBy')?.value || 'push_desc';

      let filtered = dealsList.filter(d => {
        if (industryVal !== 'all' && d.industry !== industryVal) return false;
        if (filterVal === 'skipped' && !d.skipped) return false;
        if (filterVal !== 'all' && filterVal !== 'skipped' && d.status !== filterVal) return false;
        if (searchVal) {
          // 仅 KYB 已认证项目可参与资产定向搜索
          if (!d.kybVerified) return false;
          const searchFields = [d.companyName, d.brandName, d.storeName, d.name, d.industry, d.location]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!searchFields.includes(searchVal)) return false;
        }
        return true;
      });
      filtered = filtered.sort((a, b) => {
        if (sortVal === 'score_desc') return parseFloat(b.aiScore) - parseFloat(a.aiScore);
        if (sortVal === 'amount_desc') return b.amount - a.amount;
        if (sortVal === 'amount_asc') return a.amount - b.amount;
        return (new Date(b.originateDate).getTime()) - (new Date(a.originateDate).getTime());
      });

      // Update stats
      document.getElementById('statTotal').textContent = allDeals.length;
      document.getElementById('statFiltered').textContent = dealsList.length;
      document.getElementById('statInterested').textContent = allDeals.filter(d => d.status === 'interested').length;
      document.getElementById('statConfirmed').textContent = allDeals.filter(d => d.status === 'confirmed').length;

      if (filtered.length === 0) { grid.innerHTML = ''; empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');

      const statusMap = {
        open: { label: '待参与', cls: 'badge-warning', icon: 'fa-clock' },
        interested: { label: '已意向', cls: 'badge-primary', icon: 'fa-hand-point-up' },
        confirmed: { label: '已确认', cls: 'badge-success', icon: 'fa-check-double' },
        closed: { label: '已关闭', cls: 'badge-danger', icon: 'fa-lock' }
      };
      const disclosureMap = {
        disclosed: { label: '历史履约: 已披露', cls: 'bg-emerald-50 text-emerald-700' },
        undisclosed: { label: '历史履约: 未披露', cls: 'bg-amber-50 text-amber-700' },
        none: { label: '历史履约: 无历史数据', cls: 'bg-gray-100 text-gray-600' }
      };

      grid.innerHTML = filtered.map(d => {
        const st = statusMap[d.status] || statusMap.open;
        const disclosure = disclosureMap[d.historyDisclosure || 'none'] || disclosureMap.none;
        const hasMatch = d.matchScore !== null && d.matchScore !== undefined;
        const matchColor = hasMatch ? (d.matchScore >= 80 ? '#10b981' : d.matchScore >= 60 ? '#f59e0b' : '#ef4444') : '#6b7280';
        const title = dashboardViewMode === 'brand' ? (d.brandName || d.name) : (d.storeName || d.name);
        const subtitle = dashboardViewMode === 'brand'
          ? (d.companyName || d.originator || '融资主体') + ' · ' + d.industry + ' · ' + d.location
          : (d.brandName || '品牌') + ' · ' + d.industry + ' · ' + d.location;

        return '<div class="project-card group cursor-pointer animate-fade-in" onclick="openDetail(\'' + d.id + '\')">' +
          // Header: name + status
          '<div class="flex items-center justify-between mb-2">' +
            '<div class="flex items-center space-x-2 min-w-0">' +
              '<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, rgba(93,196,179,0.12), rgba(73,168,154,0.12));"><i class="fas fa-briefcase" style="color: #5DC4B3;"></i></div>' +
              '<div class="min-w-0"><h3 class="font-bold text-gray-900 text-sm group-hover:text-teal-600 transition-colors truncate">' + title + '</h3><p class="text-xs text-gray-500 truncate">' + subtitle + '</p></div>' +
            '</div>' +
            '<div class="flex items-center gap-1.5"><span class="badge ' + st.cls + ' flex-shrink-0"><i class="fas ' + st.icon + ' mr-1"></i>' + st.label + '</span>' +
            (d.skipped ? '<span class="badge badge-danger"><i class="fas fa-forward mr-1"></i>已跳过</span>' : '') + '</div>' +
          '</div>' +
          // 来源标签 + 披露标签 + 筛子标签
          '<div class="flex flex-wrap items-center gap-1.5 mb-2">' +
            '<span class="source-tag source-originate"><i class="fas fa-paper-plane" style="font-size:8px;"></i>发起通</span>' +
            '<span class="text-[10px] px-2 py-0.5 rounded ' + disclosure.cls + '">' + disclosure.label + '</span>' +
            '<span class="text-[10px] px-2 py-0.5 rounded ' + (d.kybVerified ? 'bg-cyan-50 text-cyan-700' : 'bg-rose-50 text-rose-700') + '">' + (d.kybVerified ? 'KYB已认证' : 'KYB未认证') + '</span>' +
            (hasMatch ? '<span class="sieve-tag sieve-pass"><i class="fas fa-check" style="font-size:8px;"></i>' + (d.sieveName || '筛子') + '</span>' : '') +
            (hasMatch ? '<span class="text-xs font-bold" style="color:' + matchColor + ';">' + d.matchScore + '%匹配</span>' : '') +
          '</div>' +
          // 匹配度条
          (hasMatch ? '<div class="match-bar mb-2"><div class="match-bar-fill" style="width:' + d.matchScore + '%; background: ' + matchColor + ';"></div></div>' : '') +
          // Metrics
          '<div class="flex items-center justify-between text-xs">' +
            '<div class="flex items-center space-x-3">' +
              '<span class="text-gray-500"><i class="fas fa-yen-sign mr-1 text-teal-500"></i>' + (d.amount/10000).toFixed(0) + '万</span>' +
              '<span class="text-gray-500"><i class="fas fa-percentage mr-1 text-amber-500"></i>' + d.revenueShare + '</span>' +
              '<span class="text-gray-500"><i class="fas fa-calendar mr-1 text-cyan-500"></i>' + d.period + '</span>' +
            '</div>' +
            '<div class="flex items-center"><i class="fas fa-star text-amber-400 mr-1"></i><span class="font-bold text-gray-700">' + d.aiScore + '</span></div>' +
          '</div>' +
          // Footer
          '<div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">' +
            '<span class="text-xs text-gray-400"><i class="fas fa-paper-plane mr-1 text-amber-300"></i>' + d.originateDate + '</span>' +
            '<div class="flex items-center gap-3">' +
              '<button onclick="event.stopPropagation(); toggleSkip(\'' + d.id + '\')" class="text-xs font-medium ' + (d.skipped ? 'text-rose-600' : 'text-gray-400 hover:text-rose-600') + ' transition-colors"><i class="fas fa-forward mr-1"></i>' + (d.skipped ? '取消跳过' : '标记跳过') + '</button>' +
              '<button onclick="event.stopPropagation(); toggleIntent(\'' + d.id + '\')" class="text-xs font-medium ' + (d.status === 'interested' || d.status === 'confirmed' ? 'text-teal-600' : 'text-gray-400 hover:text-teal-600') + ' transition-colors"><i class="fas fa-hand-point-up mr-1"></i>' + (d.status === 'interested' ? '已有意向' : d.status === 'confirmed' ? '已确认' : '表达意向') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function filterByStatus(status) {
      const sel = document.getElementById('filterStatus');
      if (sel) { sel.value = status; renderDeals(); }
    }

    function toggleIntent(id) {
      const deal = allDeals.find(d => d.id === id);
      if (!deal) return;
      if (deal.status === 'open') { deal.status = 'interested'; showToast('success', '已表达意向', deal.name); }
      else if (deal.status === 'interested') { deal.status = 'open'; showToast('info', '已取消意向', deal.name); }
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
      // 重新应用筛子
      selectSieve(currentSieve);
    }

    function toggleSkip(id) {
      const deal = allDeals.find(d => d.id === id);
      if (!deal) return;
      deal.skipped = !deal.skipped;
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
      selectSieve(currentSieve);
      showToast(deal.skipped ? 'warning' : 'info', deal.skipped ? '已标记跳过' : '已取消跳过', deal.name);
    }


