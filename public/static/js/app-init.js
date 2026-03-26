    // ==================== Init ====================
    function initApp() {
      const bar = document.getElementById('loadingBar');
      const status = document.getElementById('loadingStatus');
      const steps = [
        { p: 25, t: '连接发起通数据...' },
        { p: 50, t: '加载评估通筛子...' },
        { p: 75, t: '初始化参与通看板...' },
        { p: 100, t: '准备就绪' }
      ];
      let i = 0;
      const tick = setInterval(() => {
        if (i >= steps.length) {
          clearInterval(tick);
          setTimeout(() => {
            document.getElementById('app-loading').classList.add('fade-out');
            setTimeout(() => document.getElementById('app-loading').style.display = 'none', 500);
          }, 300);
          return;
        }
        bar.style.width = steps[i].p + '%'; status.textContent = steps[i].t; i++;
      }, 400);

      // 尝试从 localStorage 恢复
      const saved = localStorage.getItem('ec_allDeals');
      if (saved) { try { allDeals = JSON.parse(saved); } catch(e) {} }
      const savedResearch = localStorage.getItem('ec_researchInputsByDeal');
      if (savedResearch) { try { researchInputsByDeal = JSON.parse(savedResearch); } catch(e) {} }
      const savedWorkbench = localStorage.getItem('ec_workbenchByDeal');
      if (savedWorkbench) { try { workbenchByDeal = JSON.parse(savedWorkbench); } catch(e) {} }
      const savedIntent = localStorage.getItem('ec_intentByDeal');
      if (savedIntent) { try { intentByDeal = JSON.parse(savedIntent); } catch(e) {} }
      const savedIntentRead = localStorage.getItem('ec_intentReadByDeal');
      if (savedIntentRead) { try { intentReadByDeal = JSON.parse(savedIntentRead); } catch(e) {} }
      const savedNegotiation = localStorage.getItem('ec_negotiationByDeal');
      if (savedNegotiation) { try { negotiationByDeal = JSON.parse(savedNegotiation); } catch(e) {} }
      const savedTimeline = localStorage.getItem('ec_timelineByDeal');
      if (savedTimeline) { try { timelineByDeal = JSON.parse(savedTimeline); } catch(e) {} }
      const savedContractPayload = localStorage.getItem('ec_contractPayloadByDeal');
      if (savedContractPayload) { try { contractPayloadByDeal = JSON.parse(savedContractPayload); } catch(e) {} }
      const savedPerspective = localStorage.getItem('ec_perspective');
      if (savedPerspective === 'investor' || savedPerspective === 'financer') currentPerspective = savedPerspective;
      document.body.setAttribute('data-perspective', currentPerspective);
      updatePerspectiveUI();
    }

    document.addEventListener('DOMContentLoaded', initApp);
