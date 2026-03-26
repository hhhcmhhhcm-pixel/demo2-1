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
        actor: (currentUser && (currentUser.displayName || currentUser.username)) || '我方',
        role: currentPerspective || 'investor',
        type,
        summary,
        publicTerms: publicTerms || null
      });
      saveTimelineState();
    }

    function ensureNegotiationState() {
      if (!currentDeal) return null;
      const dealId = currentDeal.id;
      if (negotiationByDeal[dealId]) {
        migrateMemoStateIfNeeded(negotiationByDeal[dealId]);
        ensureMemoEditorState(negotiationByDeal[dealId]);
        return negotiationByDeal[dealId];
      }
      negotiationByDeal[dealId] = {
        proposals: [],
        memos: [],
        memoEditor: { selectedMemoId: '', evidenceDraft: [] },
        invite: null
      };
      migrateMemoStateIfNeeded(negotiationByDeal[dealId]);
      saveNegotiationState();
      return negotiationByDeal[dealId];
    }

    function ensureMemoEditorState(state) {
      if (!state) return;
      if (!state.memoEditor || typeof state.memoEditor !== 'object') {
        state.memoEditor = {
          selectedMemoId: '',
          evidenceDraft: [],
          lastPrimaryAction: '',
          diffVersionA: '',
          diffVersionB: ''
        };
      }
      if (typeof state.memoEditor.selectedMemoId !== 'string') {
        state.memoEditor.selectedMemoId = '';
      }
      if (!Array.isArray(state.memoEditor.evidenceDraft)) {
        state.memoEditor.evidenceDraft = [];
      }
      if (typeof state.memoEditor.lastPrimaryAction !== 'string') {
        state.memoEditor.lastPrimaryAction = '';
      }
      if (typeof state.memoEditor.diffVersionA !== 'string') {
        state.memoEditor.diffVersionA = '';
      }
      if (typeof state.memoEditor.diffVersionB !== 'string') {
        state.memoEditor.diffVersionB = '';
      }
    }

    function migrateMemoStateIfNeeded(state) {
      if (!state || !Array.isArray(state.memos)) {
        if (state) state.memos = [];
        return;
      }
      var migrated = false;
      var now = new Date().toISOString();
      state.memos = state.memos.map(function(memo, idx) {
        if (memo && Array.isArray(memo.versions)) {
          memo.versions = memo.versions.map(function(version) {
            var v = version || {};
            var fallbackVersionStatus = (memo.status === 'confirmed' && v.version === memo.currentVersion) ? 'confirmed' : '';
            return {
              ...v,
              evidenceAnchors: normalizeMemoEvidenceAnchors(v.evidenceAnchors),
              confirmMeta: normalizeMemoConfirmMeta(v.confirmMeta, fallbackVersionStatus, v.author || '我方', v.updatedAt || v.createdAt || now)
            };
          });
          if (typeof memo.currentVersion !== 'number' || memo.currentVersion < 1) {
            memo.currentVersion = memo.versions.length || 1;
            migrated = true;
          }
          if (!memo.status) {
            memo.status = 'draft';
            migrated = true;
          }
          if (!memo.id) {
            memo.id = 'M_' + Date.now() + '_' + idx;
            migrated = true;
          }
          return memo;
        }
        migrated = true;
        var legacyStatus = memo && memo.status === 'confirmed' ? 'confirmed' : 'pending_confirmation';
        var legacyAt = (memo && memo.at) || now;
        var legacyContent = (memo && memo.content) || '';
        var legacyActor = (currentUser && (currentUser.displayName || currentUser.username)) || '我方';
        var legacyConfirmMeta = normalizeMemoConfirmMeta(null, legacyStatus, legacyActor, legacyAt);
        return {
          id: (memo && memo.id) || ('M_' + Date.now() + '_' + idx),
          currentVersion: 1,
          status: legacyStatus,
          createdAt: legacyAt,
          updatedAt: legacyAt,
          versions: [{
            version: 1,
            createdAt: legacyAt,
            updatedAt: legacyAt,
            author: (currentUser && (currentUser.displayName || currentUser.username)) || '我方',
            role: currentPerspective || 'investor',
            topic: '历史纪要',
            agreedContent: legacyContent,
            summaryBody: legacyContent,
            evidenceAnchors: [],
            confirmMeta: legacyConfirmMeta,
            rejectMeta: null
          }]
        };
      });
      if (migrated) saveNegotiationState();
    }

    function normalizeMemoEvidenceAnchors(items) {
      if (!Array.isArray(items)) return [];
      return items.map(function(item) {
        var src = item || {};
        var size = Number(src.fileSize);
        var sourceAtRaw = src.sourceAt || src.uploadedAt || '';
        var normalizedSourceAt = sourceAtRaw ? String(sourceAtRaw).slice(0, 16) : '';
        var recognizedText = String(src.recognizedText || '');
        var recognitionStatus = src.recognitionStatus || (recognizedText ? 'success' : 'pending');
        return {
          fileName: src.fileName || src.attachmentName || '未命名文件',
          fileSize: Number.isFinite(size) && size >= 0 ? size : 0,
          mimeType: src.mimeType || src.type || '',
          uploadedAt: src.uploadedAt || src.sourceAt || '',
          sourceRole: src.sourceRole || '',
          sourceAt: normalizedSourceAt,
          note: src.note || '',
          recognizedText: recognizedText,
          recognitionStatus: recognitionStatus,
          localId: src.localId || ('L_' + Date.now() + '_' + Math.floor(Math.random() * 1000))
        };
      });
    }

    function getMemoRecognitionStatusMeta(status) {
      if (status === 'success') return { label: '已识别', cls: 'bg-emerald-100 text-emerald-700' };
      if (status === 'unsupported') return { label: '不支持', cls: 'bg-gray-100 text-gray-600' };
      if (status === 'empty') return { label: '空文件', cls: 'bg-amber-100 text-amber-700' };
      if (status === 'error') return { label: '识别失败', cls: 'bg-rose-100 text-rose-700' };
      return { label: '待识别', cls: 'bg-slate-100 text-slate-600' };
    }

    function normalizeMemoConfirmMeta(raw, fallbackStatus, fallbackActor, fallbackAt) {
      var actor = fallbackActor || '我方';
      var at = fallbackAt || new Date().toISOString();
      var base = { investor: null, financer: null };
      if (raw && (raw.investor || raw.financer)) {
        return {
          investor: raw.investor ? { actor: raw.investor.actor || actor, at: raw.investor.at || at } : null,
          financer: raw.financer ? { actor: raw.financer.actor || actor, at: raw.financer.at || at } : null
        };
      }
      if (raw && raw.role) {
        var roleKey = raw.role === 'financer' ? 'financer' : 'investor';
        base[roleKey] = { actor: raw.actor || actor, at: raw.at || at };
      }
      if (fallbackStatus === 'confirmed' && !base.investor && !base.financer) {
        base.investor = { actor: actor, at: at };
        base.financer = { actor: actor, at: at };
      }
      return base;
    }

    function getMemoConfirmCount(confirmMeta) {
      var meta = normalizeMemoConfirmMeta(confirmMeta);
      var count = 0;
      if (meta.investor) count += 1;
      if (meta.financer) count += 1;
      return count;
    }

    function isMemoVersionFullyConfirmed(version) {
      if (!version) return false;
      return getMemoConfirmCount(version.confirmMeta) >= 2;
    }

    function getCurrentMemoRoleKey() {
      return currentPerspective === 'financer' ? 'financer' : 'investor';
    }

    function hasCurrentRoleConfirmed(version) {
      if (!version) return false;
      var roleKey = getCurrentMemoRoleKey();
      var meta = normalizeMemoConfirmMeta(version.confirmMeta);
      return !!meta[roleKey];
    }

    function getMemoCurrentVersion(memo) {
      if (!memo || !Array.isArray(memo.versions) || memo.versions.length === 0) return null;
      var v = memo.versions.find(function(item) { return item.version === memo.currentVersion; });
      return v || memo.versions[memo.versions.length - 1];
    }

    function getMemoVersionByNo(memo, versionNo) {
      if (!memo || !Array.isArray(memo.versions)) return null;
      var no = Number(versionNo);
      if (!Number.isFinite(no)) return null;
      return memo.versions.find(function(v) { return v.version === no; }) || null;
    }

    function getMemoVersionsDesc(memo) {
      if (!memo || !Array.isArray(memo.versions)) return [];
      return memo.versions.slice().sort(function(a, b) { return (b.version || 0) - (a.version || 0); });
    }

    function escapeMemoText(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function getMemoStatusMeta(status) {
      var map = {
        draft: { label: '草稿', cls: 'bg-gray-100 text-gray-600' },
        pending_confirmation: { label: '待确认', cls: 'bg-amber-100 text-amber-700' },
        confirmed: { label: '已确认', cls: 'bg-emerald-100 text-emerald-700' },
        rejected: { label: '已拒绝', cls: 'bg-rose-100 text-rose-700' },
        revised: { label: '已修订', cls: 'bg-indigo-100 text-indigo-700' }
      };
      return map[status] || { label: status || '未知', cls: 'bg-gray-100 text-gray-600' };
    }

    function memoContainsKeyword(memo, keyword) {
      if (!keyword) return true;
      var currentVersion = getMemoCurrentVersion(memo);
      var searchText = [
        memo.id,
        currentVersion && currentVersion.topic,
        currentVersion && currentVersion.summaryBody,
        currentVersion && currentVersion.agreedContent
      ].filter(Boolean).join(' ').toLowerCase();
      return searchText.includes(keyword);
    }

    function getMemoFilteredAndSorted(state) {
      var allMemos = state.memos || [];
      var statusFilter = (document.getElementById('memoFilterStatus')?.value || 'all').trim();
      var keyword = (document.getElementById('memoSearchInput')?.value || '').trim().toLowerCase();
      var filtered = allMemos.filter(function(memo) {
        if (statusFilter !== 'all' && memo.status !== statusFilter) return false;
        if (!memoContainsKeyword(memo, keyword)) return false;
        return true;
      });
      filtered.sort(function(a, b) {
        var aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        var bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      return {
        allCount: allMemos.length,
        filteredCount: filtered.length,
        statusFilter: statusFilter,
        keyword: keyword,
        items: filtered
      };
    }

    function renderMemoFilterMeta(result) {
      var meta = document.getElementById('memoFilterMeta');
      if (!meta || !result) return;
      var statusLabel = result.statusFilter === 'all' ? '全部状态' : (getMemoStatusMeta(result.statusFilter).label);
      var keywordLabel = result.keyword ? ('关键词：' + result.keyword) : '关键词：无';
      meta.textContent = '共 ' + result.allCount + ' 条，当前显示 ' + result.filteredCount + ' 条 · 状态：' + statusLabel + ' · ' + keywordLabel + ' · 默认按最近更新时间降序';
    }

    function getMemoFormData() {
      var state = ensureNegotiationState();
      return {
        topic: (document.getElementById('memoTopic')?.value || '').trim(),
        agreedContent: (document.getElementById('memoAgreedContent')?.value || '').trim(),
        summaryBody: (document.getElementById('memoSummaryBody')?.value || '').trim(),
        evidenceAnchors: normalizeMemoEvidenceAnchors(state?.memoEditor?.evidenceDraft || [])
      };
    }

    function setMemoFormData(data) {
      var source = data || {};
      var topic = document.getElementById('memoTopic');
      var agreedContent = document.getElementById('memoAgreedContent');
      var summaryBody = document.getElementById('memoSummaryBody');
      if (topic) topic.value = source.topic || '';
      if (agreedContent) agreedContent.value = source.agreedContent || '';
      if (summaryBody) summaryBody.value = source.summaryBody || '';
      var state = ensureNegotiationState();
      if (state) {
        ensureMemoEditorState(state);
        state.memoEditor.evidenceDraft = normalizeMemoEvidenceAnchors(source.evidenceAnchors);
      }
      renderMemoEvidenceEditor();
    }

    function renderMemoEvidenceEditor() {
      var state = ensureNegotiationState();
      if (!state) return;
      ensureMemoEditorState(state);
      var list = document.getElementById('memoEvidenceList');
      if (!list) return;
      var items = normalizeMemoEvidenceAnchors(state.memoEditor.evidenceDraft);
      state.memoEditor.evidenceDraft = items;
      if (items.length === 0) {
        list.innerHTML = '<p class="text-xs text-gray-400">暂无备忘录文件</p>';
        return;
      }
      list.innerHTML = items.map(function(item, idx) {
        var when = item.sourceAt ? item.sourceAt.replace('T', ' ') : '--';
        var type = item.mimeType || '--';
        var sourceRole = item.sourceRole || '--';
        var meta = getMemoRecognitionStatusMeta(item.recognitionStatus);
        var preview = String(item.recognizedText || '').trim();
        if (preview.length > 120) preview = preview.slice(0, 120) + '...';
        return '<div class="memo-evidence-row p-2 rounded-lg border border-gray-200 bg-white" data-index="' + idx + '">' +
          '<div class="flex items-start justify-between gap-2">' +
            '<div class="min-w-0">' +
              '<p class="text-xs font-medium text-gray-800 truncate">' + escapeMemoText(item.fileName || '未命名文件') + '</p>' +
              '<p class="text-[11px] text-gray-500 mt-0.5">' + escapeMemoText(type) + ' · ' + formatMemoFileSize(item.fileSize) + ' · 来源：' + escapeMemoText(sourceRole) + ' · 时间：' + escapeMemoText(when) + '</p>' +
              '<p class="text-[11px] mt-1"><span class="px-1.5 py-0.5 rounded ' + meta.cls + '">' + meta.label + '</span></p>' +
              (preview ? '<p class="text-[11px] text-gray-500 mt-1">识别预览：' + escapeMemoText(preview) + '</p>' : '') +
            '</div>' +
            '<button class="memo-evidence-remove-btn shrink-0 px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-600 hover:bg-gray-50" onclick="removeMemoEvidenceItem(' + idx + ')">删除</button>' +
          '</div>' +
          '<div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">' +
            '<div>' +
              '<label class="block text-[10px] text-gray-500 mb-0.5">来源角色</label>' +
              '<select class="memo-evidence-input w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white" onchange="updateMemoEvidenceField(' + idx + ', &quot;sourceRole&quot;, this.value)">' +
                '<option value="" ' + (!item.sourceRole ? 'selected' : '') + '>未填写</option>' +
                '<option value="投资方" ' + (item.sourceRole === '投资方' ? 'selected' : '') + '>投资方</option>' +
                '<option value="融资方" ' + (item.sourceRole === '融资方' ? 'selected' : '') + '>融资方</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label class="block text-[10px] text-gray-500 mb-0.5">来源时间</label>' +
              '<input type="datetime-local" class="memo-evidence-input w-full px-2 py-1.5 border border-gray-200 rounded text-xs" value="' + escapeMemoText(item.sourceAt || '') + '" oninput="updateMemoEvidenceField(' + idx + ', &quot;sourceAt&quot;, this.value)">' +
            '</div>' +
          '</div>' +
          '<div class="mt-2">' +
            '<label class="block text-[10px] text-gray-500 mb-0.5">备注（可选）</label>' +
            '<textarea class="memo-evidence-input w-full px-2 py-1.5 border border-gray-200 rounded text-xs" rows="2" placeholder="可填写补充说明" oninput="updateMemoEvidenceNote(' + idx + ', this.value)">' + escapeMemoText(item.note) + '</textarea>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function formatMemoFileSize(bytes) {
      var size = Number(bytes);
      if (!Number.isFinite(size) || size <= 0) return '--';
      if (size < 1024) return size + 'B';
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + 'KB';
      return (size / 1024 / 1024).toFixed(1) + 'MB';
    }

    function cleanMemoRecognizedText(text) {
      return String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\u0000/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    function isMemoTextLikeFile(file) {
      if (!file) return false;
      var type = String(file.type || '').toLowerCase();
      if (type.startsWith('text/')) return true;
      if (type === 'application/json' || type === 'application/xml' || type === 'application/x-yaml') return true;
      var name = String(file.name || '').toLowerCase();
      var dot = name.lastIndexOf('.');
      var ext = dot >= 0 ? name.slice(dot + 1) : '';
      return [
        'txt', 'md', 'markdown', 'csv', 'json', 'xml', 'yaml', 'yml',
        'log', 'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx'
      ].includes(ext);
    }

    async function recognizeMemoFileFromUpload(file) {
      var now = new Date().toISOString();
      var base = {
        fileName: (file && file.name) || '未命名文件',
        fileSize: Number(file && file.size) || 0,
        mimeType: (file && file.type) || '',
        uploadedAt: now,
        note: '',
        recognizedText: '',
        recognitionStatus: 'pending',
        localId: 'L_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
      };

      if (!isMemoTextLikeFile(file)) {
        base.recognitionStatus = 'unsupported';
        return base;
      }
      try {
        var raw = await file.text();
        var text = cleanMemoRecognizedText(raw);
        if (!text) {
          base.recognitionStatus = 'empty';
          return base;
        }
        if (text.length > 3000) text = text.slice(0, 3000) + '\n...[已截断]';
        base.recognizedText = text;
        base.recognitionStatus = 'success';
        return base;
      } catch (e) {
        base.recognitionStatus = 'error';
        return base;
      }
    }

    function triggerMemoEvidenceUpload() {
      var picker = document.getElementById('memoEvidenceFileInput');
      if (picker && !picker.disabled) picker.click();
    }

    async function handleMemoEvidenceFiles(fileList) {
      var state = ensureNegotiationState();
      if (!state) return;
      ensureMemoEditorState(state);
      var files = Array.from(fileList || []);
      if (!files.length) return;
      var roleLabel = currentPerspective === 'financer' ? '融资方' : '投资方';
      var analyzed = await Promise.all(files.map(function(file) {
        return recognizeMemoFileFromUpload(file);
      }));
      analyzed.forEach(function(item) {
        item.sourceRole = item.sourceRole || roleLabel;
        if (!item.sourceAt) item.sourceAt = String(item.uploadedAt || '').slice(0, 16);
        state.memoEditor.evidenceDraft.push(item);
      });
      var picker = document.getElementById('memoEvidenceFileInput');
      if (picker) picker.value = '';
      renderMemoEvidenceEditor();
      var successCount = analyzed.filter(function(item) { return item.recognitionStatus === 'success'; }).length;
      if (successCount > 0) {
        showToast('success', '文件已上传并识别', '已识别 ' + successCount + ' 个文件，可点击「AI识别写入摘要」');
      } else {
        showToast('info', '文件已上传', '当前文件类型暂无可识别文本');
      }
    }

    function removeMemoEvidenceItem(index) {
      var state = ensureNegotiationState();
      if (!state) return;
      ensureMemoEditorState(state);
      if (index < 0 || index >= state.memoEditor.evidenceDraft.length) return;
      state.memoEditor.evidenceDraft.splice(index, 1);
      renderMemoEvidenceEditor();
    }

    function updateMemoEvidenceField(index, field, value) {
      var state = ensureNegotiationState();
      if (!state) return;
      ensureMemoEditorState(state);
      if (!state.memoEditor.evidenceDraft[index]) return;
      state.memoEditor.evidenceDraft[index][field] = value || '';
    }

    function updateMemoEvidenceNote(index, value) {
      updateMemoEvidenceField(index, 'note', value);
    }

    function buildMemoSummaryFromEvidence(items) {
      var rows = (items || []).filter(function(item) {
        return item && item.recognitionStatus === 'success' && String(item.recognizedText || '').trim();
      });
      if (!rows.length) return '';
      var lines = ['【AI识别摘要】'];
      rows.forEach(function(item, idx) {
        var text = cleanMemoRecognizedText(item.recognizedText);
        if (text.length > 600) text = text.slice(0, 600) + '...';
        lines.push('');
        lines.push((idx + 1) + '. 文件：' + (item.fileName || '未命名文件'));
        lines.push(text || '（无可用文本）');
      });
      var out = lines.join('\n');
      if (out.length > 5000) out = out.slice(0, 5000) + '\n...[已截断]';
      return out;
    }

    function recognizeMemoFilesToSummary() {
      var state = ensureNegotiationState();
      if (!state) return;
      ensureMemoEditorState(state);
      var items = normalizeMemoEvidenceAnchors(state.memoEditor.evidenceDraft);
      state.memoEditor.evidenceDraft = items;
      if (!items.length) {
        showToast('warning', '暂无备忘录文件', '请先上传文件');
        return;
      }
      var summary = buildMemoSummaryFromEvidence(items);
      if (!summary) {
        showToast('warning', '暂无可识别文本', '请上传 txt/md/csv/json 等文本类文件');
        return;
      }
      var summaryBody = document.getElementById('memoSummaryBody');
      if (summaryBody) {
        var existing = String(summaryBody.value || '').trim();
        summaryBody.value = existing ? (existing + '\n\n' + summary) : summary;
      }
      showToast('success', 'AI识别完成', '内容已写入摘要正文');
    }

    function setMemoDiffDefaults(state, memo) {
      if (!state || !memo) return;
      ensureMemoEditorState(state);
      var versions = getMemoVersionsDesc(memo);
      if (!versions.length) {
        state.memoEditor.diffVersionA = '';
        state.memoEditor.diffVersionB = '';
        return;
      }
      var validA = versions.some(function(v) { return String(v.version) === String(state.memoEditor.diffVersionA); });
      var validB = versions.some(function(v) { return String(v.version) === String(state.memoEditor.diffVersionB); });
      if (!validA) state.memoEditor.diffVersionA = String(versions[0].version);
      if (!validB) state.memoEditor.diffVersionB = String(versions[Math.min(1, versions.length - 1)].version);
      if (state.memoEditor.diffVersionA === state.memoEditor.diffVersionB && versions.length > 1) {
        state.memoEditor.diffVersionB = String(versions[1].version);
      }
    }

    function setMemoDiffToLatestPair(state, memo) {
      if (!state || !memo) return;
      ensureMemoEditorState(state);
      var latestVersionNo = Number(memo.currentVersion || 0);
      if (!Number.isFinite(latestVersionNo) || latestVersionNo < 1) {
        state.memoEditor.diffVersionA = '';
        state.memoEditor.diffVersionB = '';
        return;
      }
      var previousVersionNo = latestVersionNo - 1;
      state.memoEditor.diffVersionA = String(previousVersionNo >= 1 ? previousVersionNo : latestVersionNo);
      state.memoEditor.diffVersionB = String(latestVersionNo);
    }

    function renderMemoDiffSelectors(state, memo) {
      var aSel = document.getElementById('memoDiffVersionA');
      var bSel = document.getElementById('memoDiffVersionB');
      if (!aSel || !bSel) return;
      if (!memo) {
        aSel.innerHTML = '<option value="">版本A</option>';
        bSel.innerHTML = '<option value="">版本B</option>';
        return;
      }
      setMemoDiffDefaults(state, memo);
      var versions = getMemoVersionsDesc(memo);
      var options = versions.map(function(v) {
        return '<option value="' + v.version + '">V' + v.version + '</option>';
      }).join('');
      aSel.innerHTML = options;
      bSel.innerHTML = options;
      aSel.value = state.memoEditor.diffVersionA;
      bSel.value = state.memoEditor.diffVersionB;
    }

    function renderMemoDiff(versionA, versionB) {
      var box = document.getElementById('memoDiffBox');
      if (!box) return;
      if (!versionA || !versionB) {
        box.innerHTML = '<p class="text-sm text-gray-400">请选择两个版本进行对比。</p>';
        return;
      }

      function normalizeDiffText(value) {
        var text = String(value == null ? '' : value).replace(/\r\n?/g, '\n');
        return text.trim() ? text : '（空）';
      }

      function renderDiffLine(lineNo, prefix, line, type) {
        var rowCls = type === 'add'
          ? 'bg-emerald-50/70'
          : type === 'del'
            ? 'bg-rose-50/70'
            : 'bg-transparent';
        var prefixCls = type === 'add'
          ? 'text-emerald-700'
          : type === 'del'
            ? 'text-rose-700'
            : 'text-gray-400';
        var textCls = type === 'add'
          ? 'text-emerald-900'
          : type === 'del'
            ? 'text-rose-900'
            : 'text-gray-700';
        var safeLine = escapeMemoText(line);
        if (!safeLine) safeLine = '&nbsp;';
        return '<div class="flex items-start px-2 py-0.5 ' + rowCls + '">' +
          '<span class="inline-block w-7 shrink-0 text-right pr-2 text-[10px] text-gray-400 select-none">' + lineNo + '</span>' +
          '<span class="inline-block w-4 shrink-0 font-bold ' + prefixCls + '">' + prefix + '</span>' +
          '<span class="break-words whitespace-pre-wrap font-mono text-[11px] leading-5 ' + textCls + '">' + safeLine + '</span>' +
        '</div>';
      }

      var fields = [
        { key: 'agreedContent', label: '达成内容', formatter: function(v) { return v || '无'; } },
        { key: 'summaryBody', label: '摘要正文', formatter: function(v) { return v || '无'; } }
      ];

      box.innerHTML = fields.map(function(field) {
        var aRaw = versionA[field.key];
        var bRaw = versionB[field.key];
        var aVal = normalizeDiffText(field.formatter(aRaw));
        var bVal = normalizeDiffText(field.formatter(bRaw));
        var changed = aVal !== bVal;
        var aLines = aVal.split('\n');
        var bLines = bVal.split('\n');
        var maxLines = Math.max(aLines.length, bLines.length);
        var leftRows = [];
        var rightRows = [];
        for (var i = 0; i < maxLines; i += 1) {
          var aLine = aLines[i] == null ? '' : aLines[i];
          var bLine = bLines[i] == null ? '' : bLines[i];
          var lineChanged = aLine !== bLine;
          leftRows.push(renderDiffLine(i + 1, lineChanged ? '-' : ' ', aLine, lineChanged ? 'del' : 'ctx'));
          rightRows.push(renderDiffLine(i + 1, lineChanged ? '+' : ' ', bLine, lineChanged ? 'add' : 'ctx'));
        }
        return '<div class="rounded-lg border ' + (changed ? 'border-cyan-200' : 'border-gray-200') + ' overflow-hidden bg-white">' +
          '<div class="flex items-center justify-between px-3 py-2 border-b border-gray-100">' +
            '<span class="text-xs font-semibold text-gray-700">' + field.label + '</span>' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded ' + (changed ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-200 text-gray-600') + '">' + (changed ? '已修改' : '无变化') + '</span>' +
          '</div>' +
          '<div class="px-3 py-1.5 border-b border-gray-100 text-[10px] text-gray-500 bg-gray-50 font-mono">@@ ' + field.label + ' @@</div>' +
          '<div class="grid grid-cols-1 md:grid-cols-2">' +
            '<div class="border-r border-gray-100">' +
              '<div class="px-3 py-1.5 text-[10px] font-semibold text-rose-700 bg-rose-50/70 border-b border-gray-100">V' + versionA.version + '（旧）</div>' +
              '<div class="font-mono">' + leftRows.join('') + '</div>' +
            '</div>' +
            '<div>' +
              '<div class="px-3 py-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50/70 border-b border-gray-100">V' + versionB.version + '（新）</div>' +
              '<div class="font-mono">' + rightRows.join('') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function renderMemoVersionHistory(state, memo) {
      var history = document.getElementById('memoVersionHistory');
      if (!history) return;
      if (!memo) {
        history.innerHTML = '<p class="text-sm text-gray-400">请选择一条备忘录查看版本历史。</p>';
        renderMemoDiffSelectors(state, null);
        renderMemoDiff(null, null);
        return;
      }

      var versions = getMemoVersionsDesc(memo);
      history.innerHTML = versions.map(function(v) {
        var isCurrent = v.version === memo.currentVersion;
        var isDeprecated = !isCurrent && memo.currentVersion > v.version;
        var confirmMeta = normalizeMemoConfirmMeta(v.confirmMeta, memo.status, v.author || '我方', v.updatedAt || v.createdAt);
        var confirmCount = getMemoConfirmCount(confirmMeta);
        var fullyConfirmed = isMemoVersionFullyConfirmed({ confirmMeta: confirmMeta });
        var inferredPending = !fullyConfirmed && !v.rejectMeta && ((isCurrent && memo.status === 'pending_confirmation') || (!isCurrent && confirmCount > 0));
        var vStatus = isDeprecated
          ? 'deprecated'
          : (fullyConfirmed ? 'confirmed' : (v.rejectMeta ? 'rejected' : (inferredPending ? 'pending_confirmation' : (isCurrent ? memo.status : 'history'))));
        var statusLabel = vStatus === 'confirmed'
          ? '已确认（2/2）'
          : vStatus === 'deprecated'
            ? '已废弃'
          : vStatus === 'rejected'
            ? '已拒绝'
            : vStatus === 'pending_confirmation'
              ? ('待确认（' + confirmCount + '/2）')
              : vStatus === 'draft'
                ? '草稿'
                : '历史版本';
        var statusCls = vStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
          : vStatus === 'deprecated' ? 'bg-gray-200 text-gray-600'
          : vStatus === 'rejected' ? 'bg-rose-100 text-rose-700'
          : vStatus === 'pending_confirmation' ? 'bg-amber-100 text-amber-700'
          : vStatus === 'draft' ? 'bg-gray-100 text-gray-600'
          : 'bg-indigo-100 text-indigo-700';
        var at = (v.updatedAt || v.createdAt || '').slice(0, 16).replace('T', ' ');
        var investorConfirm = confirmMeta.investor ? ((confirmMeta.investor.actor || '投资方') + ' @ ' + String(confirmMeta.investor.at || '').slice(0, 16).replace('T', ' ')) : '未确认';
        var financerConfirm = confirmMeta.financer ? ((confirmMeta.financer.actor || '融资方') + ' @ ' + String(confirmMeta.financer.at || '').slice(0, 16).replace('T', ' ')) : '未确认';
        return '<div class="p-2.5 rounded-lg border border-gray-100 bg-gray-50">' +
          '<div class="flex items-center justify-between">' +
            '<div class="text-xs text-gray-700 font-semibold">V' + v.version + (isCurrent ? '（当前）' : '') + '</div>' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded ' + statusCls + '">' + statusLabel + '</span>' +
          '</div>' +
          '<p class="text-[11px] text-gray-500 mt-1">编辑人：' + (v.author || '--') + ' · 角色：' + (v.role || '--') + ' · 时间：' + at + '</p>' +
          '<p class="text-[11px] text-gray-400 mt-1">双向确认：' + confirmCount + '/2（投资方' + (confirmMeta.investor ? '已确认' : '未确认') + '，融资方' + (confirmMeta.financer ? '已确认' : '未确认') + '）</p>' +
          '<p class="text-[11px] text-gray-400 mt-1">投资方确认：' + escapeMemoText(investorConfirm) + '</p>' +
          '<p class="text-[11px] text-gray-400 mt-1">融资方确认：' + escapeMemoText(financerConfirm) + '</p>' +
          '<div class="mt-1.5 flex items-center gap-2">' +
            '<button onclick="updateMemoDiffSelection(&quot;A&quot;, &quot;' + v.version + '&quot;)" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700 hover:bg-white">设为版本A</button>' +
            '<button onclick="updateMemoDiffSelection(&quot;B&quot;, &quot;' + v.version + '&quot;)" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700 hover:bg-white">设为版本B</button>' +
            '<button onclick="createMemoRevisionFromVersion(' + v.version + ')" class="px-2 py-1 text-[11px] rounded border border-cyan-200 text-cyan-700 hover:bg-cyan-50">基于此版本新建草稿</button>' +
          '</div>' +
        '</div>';
      }).join('');

      renderMemoDiffSelectors(state, memo);
      var vA = getMemoVersionByNo(memo, state.memoEditor.diffVersionA);
      var vB = getMemoVersionByNo(memo, state.memoEditor.diffVersionB);
      renderMemoDiff(vA, vB);
    }

    function updateMemoDiffSelection(which, versionNo) {
      var state = ensureNegotiationState();
      if (!state) return;
      ensureMemoEditorState(state);
      if (which === 'A') state.memoEditor.diffVersionA = String(versionNo || '');
      else state.memoEditor.diffVersionB = String(versionNo || '');
      saveNegotiationState();
      renderMemoTab();
    }

    function updateMemoEditorHint(text) {
      var hint = document.getElementById('memoEditorHint');
      if (hint) hint.textContent = text;
    }

    function clearMemoForm() {
      var state = ensureNegotiationState();
      if (!state) return;
      ensureMemoEditorState(state);
      state.memoEditor.selectedMemoId = '';
      setMemoLastPrimaryAction('new');
      setMemoFormData({});
      var rejectReason = document.getElementById('memoRejectReason');
      if (rejectReason) rejectReason.value = '';
      updateMemoEditorHint('当前为新建模式。必填：议题。');
      saveNegotiationState();
      renderMemoTab();
    }

    function selectMemoForEdit(memoId) {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      if (!state) return;
      ensureMemoEditorState(state);
      var memo = (state.memos || []).find(function(item) { return item.id === memoId; });
      if (!memo) return;
      var currentVersion = getMemoCurrentVersion(memo);
      if (!currentVersion) return;
      state.memoEditor.selectedMemoId = memoId;
      setMemoFormData(currentVersion);
      var rejectReason = document.getElementById('memoRejectReason');
      if (rejectReason) rejectReason.value = '';
      var statusMeta = getMemoStatusMeta(memo.status);
      updateMemoEditorHint('当前编辑：' + memo.id + ' · V' + memo.currentVersion + ' · ' + statusMeta.label + '。');
      saveNegotiationState();
      renderMemoTab();
    }

    function getSelectedMemo(state) {
      if (!state) return null;
      ensureMemoEditorState(state);
      return (state.memos || []).find(function(item) { return item.id === state.memoEditor.selectedMemoId; }) || null;
    }

    function canInvestorEditMemo(memo) {
      if (!memo) return true;
      return memo.status === 'draft' || memo.status === 'rejected' || memo.status === 'revised';
    }

    function setMemoFormDisabled(disabled) {
      [
        'memoTopic',
        'memoAgreedContent',
        'memoSummaryBody'
      ].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.disabled = !!disabled;
      });
      var addBtn = document.getElementById('memoEvidenceUploadBtn');
      if (addBtn) addBtn.disabled = !!disabled;
      var aiBtn = document.getElementById('memoEvidenceAiBtn');
      if (aiBtn) aiBtn.disabled = !!disabled;
      var fileInput = document.getElementById('memoEvidenceFileInput');
      if (fileInput) fileInput.disabled = !!disabled;
      document.querySelectorAll('.memo-evidence-input, .memo-evidence-remove-btn').forEach(function(el) {
        el.disabled = !!disabled;
      });
    }

    function applyMemoPrimaryBtnStyle(btn, baseClass, isActive, disabled) {
      if (!btn) return;
      btn.className = baseClass;
      btn.disabled = !!disabled;
      btn.classList.toggle('ring-2', !!isActive);
      btn.classList.toggle('ring-offset-1', !!isActive);
      btn.classList.toggle('ring-indigo-300', !!isActive);
    }

    function setMemoLastPrimaryAction(action) {
      var state = ensureNegotiationState();
      if (!state) return;
      ensureMemoEditorState(state);
      state.memoEditor.lastPrimaryAction = String(action || '');
    }

    function renderMemoActionBar(state, selectedMemo) {
      var saveBtn = document.getElementById('memoBtnSaveDraft');
      var submitBtn = document.getElementById('memoBtnSubmitConfirm');
      var newBtn = document.getElementById('memoBtnNew');
      var revisionBtn = document.getElementById('memoBtnCreateRevision');
      var financerActions = document.getElementById('memoFinancerActions');
      var confirmBtn = document.getElementById('memoBtnConfirm');
      var rejectBtn = document.getElementById('memoBtnReject');
      var rejectReason = document.getElementById('memoRejectReason');

      var selectedPending = !!selectedMemo && selectedMemo.status === 'pending_confirmation';
      var selectedVersion = selectedMemo ? getMemoCurrentVersion(selectedMemo) : null;
      var roleConfirmed = selectedPending && hasCurrentRoleConfirmed(selectedVersion);
      var confirmCount = selectedVersion ? getMemoConfirmCount(selectedVersion.confirmMeta) : 0;
      var editable = canInvestorEditMemo(selectedMemo);
      if (!selectedMemo) editable = true;
      var lastAction = (state && state.memoEditor && state.memoEditor.lastPrimaryAction) || '';

      setMemoFormDisabled(!editable);

      if (saveBtn) saveBtn.classList.remove('hidden');
      if (submitBtn) submitBtn.classList.remove('hidden');
      if (newBtn) newBtn.classList.remove('hidden');

      var showRevision = !!selectedMemo && !canInvestorEditMemo(selectedMemo);
      if (revisionBtn) revisionBtn.classList.toggle('hidden', !showRevision);

      applyMemoPrimaryBtnStyle(
        saveBtn,
        'px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed',
        lastAction === 'draft',
        !editable
      );
      applyMemoPrimaryBtnStyle(
        submitBtn,
        'px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed',
        lastAction === 'submit',
        !editable
      );
      applyMemoPrimaryBtnStyle(
        newBtn,
        'w-full px-3 py-2 text-xs font-semibold rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed',
        lastAction === 'new',
        false
      );
      applyMemoPrimaryBtnStyle(
        revisionBtn,
        'w-full px-3 py-2 text-xs font-semibold rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed',
        lastAction === 'revision',
        !showRevision
      );

      if (financerActions) financerActions.classList.toggle('hidden', !selectedMemo);
      if (confirmBtn) {
        confirmBtn.disabled = !selectedPending || roleConfirmed;
        confirmBtn.textContent = roleConfirmed ? '已确认（本方）' : '确认';
      }
      if (rejectBtn) rejectBtn.disabled = !selectedPending;
      if (rejectReason) rejectReason.disabled = !selectedPending;

      if (selectedMemo && !editable) {
        updateMemoEditorHint('当前版本为「' + getMemoStatusMeta(selectedMemo.status).label + '」，不可原地编辑；请先生成修订稿。');
      } else if (selectedPending && roleConfirmed) {
        updateMemoEditorHint('当前版本已完成本方确认（' + confirmCount + '/2），等待对方确认后生效。');
      }
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

    // ---- 多方案对比：动态渲染所有提交的方案卡片 ----
    function renderProposalGrid(state) {
      var grid = document.getElementById('negProposalGrid');
      var empty = document.getElementById('negProposalEmpty');
      if (!grid) return;

      var proposals = state.proposals || [];
      if (proposals.length === 0) {
        grid.innerHTML = '<p id="negProposalEmpty" class="text-sm text-gray-400 col-span-full py-6 text-center">暂无方案，请在条款工作台中提交方案草稿。</p>';
        return;
      }

      grid.innerHTML = proposals.map(function(p, idx) {
        var isFinancer = p.perspective === 'financer';
        var borderColor = isFinancer ? 'border-amber-200' : 'border-teal-200';
        var bgColor = isFinancer ? 'bg-amber-50/50' : 'bg-teal-50/50';
        var badgeColor = isFinancer ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700';
        var roleName = isFinancer ? '融资方' : '投资方';
        var statusText = getProposalStatusText(p.status);
        var statusCls = p.status === 'agreed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
        var t = p.publicTerms || {};
        var time = p.createdAt ? p.createdAt.slice(5, 16).replace('T', ' ') : '';

        return '<div class="p-3.5 rounded-xl border ' + borderColor + ' ' + bgColor + ' cursor-pointer hover:shadow-md transition-shadow" onclick="showProposalDetail(\'' + p.id + '\')">' +
          '<div class="flex items-center justify-between mb-2">' +
            '<span class="text-xs font-bold text-gray-800">方案 #' + (proposals.length - idx) + '</span>' +
            '<div class="flex items-center gap-1">' +
              '<span class="text-[10px] px-1.5 py-0.5 rounded ' + badgeColor + '">' + roleName + '</span>' +
              '<span class="text-[10px] px-1.5 py-0.5 rounded ' + statusCls + '">' + statusText + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-1.5 text-xs">' +
            '<div class="p-1.5 rounded bg-white/70"><span class="text-gray-400">金额</span> <span class="font-semibold text-gray-700">' + Number(t.amountWan || 0).toFixed(1) + '万</span></div>' +
            '<div class="p-1.5 rounded bg-white/70"><span class="text-gray-400">比例</span> <span class="font-semibold text-gray-700">' + Number(t.sharePct || 0).toFixed(2) + '%</span></div>' +
            '<div class="p-1.5 rounded bg-white/70"><span class="text-gray-400">APR</span> <span class="font-semibold text-gray-700">' + Number(t.aprPct || 0).toFixed(2) + '%</span></div>' +
            '<div class="p-1.5 rounded bg-white/70"><span class="text-gray-400">期限</span> <span class="font-semibold text-gray-700">' + Number(t.termMonths || 0).toFixed(0) + '月</span></div>' +
          '</div>' +
          '<div class="flex items-center justify-between mt-2">' +
            '<span class="text-[10px] text-gray-400">' + (p.actor || '') + ' · ' + time + '</span>' +
            '<span class="text-[10px] text-cyan-600 font-semibold">查看详情 →</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // ---- 方案详情弹窗 ----
    var currentProposalDetailId = null;

    function showProposalDetail(proposalId) {
      var state = ensureNegotiationState();
      if (!state) return;
      var p = state.proposals.find(function(x) { return x.id === proposalId; });
      if (!p) return;
      currentProposalDetailId = proposalId;

      var overlay = document.getElementById('proposalDetailOverlay');
      if (!overlay) return;
      overlay.classList.remove('hidden');

      var isFinancer = p.perspective === 'financer';
      var roleName = isFinancer ? '融资方' : '投资方';
      var time = p.createdAt ? p.createdAt.slice(0, 16).replace('T', ' ') : '';
      setText('pdTitle', '方案详情 · ' + p.id);
      var metaEl = document.getElementById('pdMeta');
      if (metaEl) metaEl.textContent = '由 ' + (p.actor || roleName) + ' 于 ' + time + ' 提交 · 状态：' + getProposalStatusText(p.status);

      // 公共条款
      var t = p.publicTerms || {};
      var pubEl = document.getElementById('pdPublic');
      if (pubEl) pubEl.innerHTML =
        pdCell('融资金额', Number(t.amountWan || 0).toFixed(1) + ' 万') +
        pdCell('分成比例', Number(t.sharePct || 0).toFixed(2) + '%') +
        pdCell('APR', Number(t.aprPct || 0).toFixed(2) + '%') +
        pdCell('合作期限', Number(t.termMonths || 0).toFixed(0) + ' 月');

      // 反提案对比
      var diffSection = document.getElementById('pdCounterDiff');
      var diffGrid = document.getElementById('pdCounterDiffGrid');
      if (diffSection && diffGrid) {
        if (p.status === 'countered' && p.counterTerms) {
          diffSection.classList.remove('hidden');
          var ct = p.counterTerms;
          var counterByName = p.counterBy === 'financer' ? '融资方' : '投资方';
          var fields = [
            { label: '融资金额', origVal: Number(t.amountWan || 0), counterVal: Number(ct.amountWan || 0), unit: '万', decimals: 1 },
            { label: '分成比例', origVal: Number(t.sharePct || 0), counterVal: Number(ct.sharePct || 0), unit: '%', decimals: 2 },
            { label: 'APR', origVal: Number(t.aprPct || 0), counterVal: Number(ct.aprPct || 0), unit: '%', decimals: 2 },
            { label: '合作期限', origVal: Number(t.termMonths || 0), counterVal: Number(ct.termMonths || 0), unit: '月', decimals: 0 }
          ];
          diffGrid.innerHTML = '<p class="text-[11px] text-gray-500 mb-2">反提案方：' + counterByName + ' · ' + (p.counterAt ? p.counterAt.slice(0, 16).replace('T', ' ') : '') + '</p>' +
            '<div class="grid grid-cols-4 gap-2">' + fields.map(function(f) {
              var changed = f.origVal !== f.counterVal;
              var delta = f.counterVal - f.origVal;
              var deltaStr = delta > 0 ? '+' + delta.toFixed(f.decimals) : delta.toFixed(f.decimals);
              var borderCls = changed ? 'border-cyan-200 bg-cyan-50/50' : 'border-gray-100 bg-gray-50';
              return '<div class="p-2 rounded-lg border ' + borderCls + '">' +
                '<p class="text-[11px] text-gray-400">' + f.label + '</p>' +
                '<p class="text-xs text-gray-400 line-through">' + f.origVal.toFixed(f.decimals) + ' ' + f.unit + '</p>' +
                '<p class="font-semibold text-xs ' + (changed ? 'text-cyan-700' : 'text-gray-700') + '">' + f.counterVal.toFixed(f.decimals) + ' ' + f.unit +
                (changed ? ' <span class="text-[10px] font-normal ' + (delta > 0 ? 'text-rose-500' : 'text-emerald-600') + '">(' + deltaStr + ')</span>' : '') +
                '</p></div>';
            }).join('') + '</div>';
        } else {
          diffSection.classList.add('hidden');
          diffGrid.innerHTML = '';
        }
      }

      // 私有预测
      var priv = p.privateData || {};
      var srcMap = { system: '模型预估', borrower: '融资方预估', self: '自行填写' };
      var privEl = document.getElementById('pdPrivate');
      if (privEl) privEl.innerHTML =
        pdCell('预测月均营业额', Number(priv.revenueWan || 0).toFixed(1) + ' 万') +
        pdCell('来源', srcMap[priv.source] || priv.source || '--');

      // 派生指标
      var d = p.derivedData || {};
      var derEl = document.getElementById('pdDerived');
      if (derEl) derEl.innerHTML =
        pdCell('月回款', fmtWanOrDash(d.monthlyPaybackWan)) +
        pdCell('建议融资上限', fmtWanOrDash(d.suggestedAmountWan)) +
        pdCell('建议分成比例', fmtPctOrDash(d.suggestedSharePct)) +
        pdCell('触达月数', fmtMonOrDash(d.touchMonths)) +
        pdCell('总回款', fmtWanOrDash(d.totalPaybackWan)) +
        pdCell('实际APR', fmtPctOrDash(d.actualAprPct)) +
        pdCell('回收倍数', Number.isFinite(d.recoveryMultiple) ? d.recoveryMultiple.toFixed(2) + 'x' : '--');

      // 编辑区：仅方案发起方视角可编辑
      var editSection = document.getElementById('pdEditSection');
      var canEdit = (p.perspective === (currentPerspective || 'investor')) && (p.status === 'draft' || p.status === 'pending');
      if (editSection) {
        editSection.classList.toggle('hidden', !canEdit);
        if (canEdit) {
          var ea = document.getElementById('pdEditAmount');
          var es = document.getElementById('pdEditShare');
          var ep = document.getElementById('pdEditApr');
          var et = document.getElementById('pdEditTerm');
          if (ea) ea.value = t.amountWan || '';
          if (es) es.value = t.sharePct || '';
          if (ep) ep.value = t.aprPct || '';
          if (et) et.value = t.termMonths || '';
          var saveBtn = document.getElementById('pdSaveEditBtn');
          if (saveBtn) saveBtn.onclick = function() { saveProposalEdit(proposalId); };
        }
      }

      // 沟通消息
      renderProposalMessages(p);
      var sendBtn = document.getElementById('pdSendMsgBtn');
      if (sendBtn) sendBtn.onclick = function() { sendProposalMessage(proposalId); };
    }

    function pdCell(label, value) {
      return '<div class="p-2 rounded-lg bg-gray-50 border border-gray-100"><p class="text-[11px] text-gray-400">' + label + '</p><p class="font-semibold text-gray-800 text-xs">' + value + '</p></div>';
    }

    function fmtWanOrDash(v) { return Number.isFinite(v) ? v.toFixed(1) + ' 万' : '--'; }
    function fmtPctOrDash(v) { return Number.isFinite(v) ? v.toFixed(2) + '%' : '--'; }
    function fmtMonOrDash(v) { return Number.isFinite(v) ? v.toFixed(1) + ' 月' : '--'; }

    function closeProposalDetail() {
      var overlay = document.getElementById('proposalDetailOverlay');
      if (overlay) overlay.classList.add('hidden');
      currentProposalDetailId = null;
    }

    function saveProposalEdit(proposalId) {
      var state = ensureNegotiationState();
      if (!state) return;
      var p = state.proposals.find(function(x) { return x.id === proposalId; });
      if (!p) return;

      var ea = document.getElementById('pdEditAmount');
      var es = document.getElementById('pdEditShare');
      var ep = document.getElementById('pdEditApr');
      var et = document.getElementById('pdEditTerm');
      var newAmount = parseFloat(ea ? ea.value : '');
      var newShare = parseFloat(es ? es.value : '');
      var newApr = parseFloat(ep ? ep.value : '');
      var newTerm = parseInt(et ? et.value : '', 10);

      if (Number.isFinite(newAmount) && newAmount > 0) p.publicTerms.amountWan = +newAmount.toFixed(1);
      if (Number.isFinite(newShare) && newShare > 0) p.publicTerms.sharePct = +newShare.toFixed(2);
      if (Number.isFinite(newApr) && newApr >= 0) p.publicTerms.aprPct = +newApr.toFixed(2);
      if (Number.isFinite(newTerm) && newTerm > 0) p.publicTerms.termMonths = newTerm;

      // 重算派生指标
      var mockState = {
        publicAmountWan: p.publicTerms.amountWan,
        publicSharePct: p.publicTerms.sharePct,
        publicAprPct: p.publicTerms.aprPct,
        publicTermMonths: p.publicTerms.termMonths,
        privateRevenueWan: p.privateData ? p.privateData.revenueWan : 0
      };
      var newDerived = computeWorkbenchDerived(mockState);
      p.derivedData = {
        monthlyPaybackWan: newDerived.monthlyPaybackWan,
        suggestedAmountWan: newDerived.suggestedAmountWan,
        suggestedSharePct: newDerived.suggestedSharePct,
        touchMonths: newDerived.touchMonths,
        totalPaybackWan: newDerived.totalPaybackWan,
        actualAprPct: newDerived.actualAprPct,
        recoveryMultiple: newDerived.recoveryMultiple
      };

      p.updatedAt = new Date().toISOString();
      saveNegotiationState();
      pushTimelineEvent('proposal_edited', '修改方案 ' + p.id, p.publicTerms);
      showProposalDetail(proposalId);
      renderNegotiationTab();
      showToast('success', '方案已更新', '公共条款与派生指标已重算');
    }

    function renderProposalMessages(p) {
      var box = document.getElementById('pdMessages');
      if (!box) return;
      var msgs = p.messages || [];
      if (msgs.length === 0) {
        box.innerHTML = '<p class="text-xs text-gray-400 text-center py-2">暂无沟通记录</p>';
        return;
      }
      box.innerHTML = msgs.map(function(m) {
        var isFinancer = m.perspective === 'financer';
        var align = isFinancer ? 'text-right' : 'text-left';
        var bgCls = isFinancer ? 'bg-amber-50 border-amber-100' : 'bg-teal-50 border-teal-100';
        var roleName = isFinancer ? '融资方' : '投资方';
        var time = m.at ? m.at.slice(11, 16) : '';
        return '<div class="' + align + '">' +
          '<div class="inline-block max-w-[80%] p-2 rounded-lg border ' + bgCls + ' text-xs text-gray-700">' +
            '<span class="font-semibold">' + roleName + '</span> <span class="text-gray-400">' + time + '</span>' +
            '<p class="mt-0.5">' + m.text + '</p>' +
          '</div></div>';
      }).join('');
      box.scrollTop = box.scrollHeight;
    }

    function sendProposalMessage(proposalId) {
      var input = document.getElementById('pdMsgInput');
      if (!input) return;
      var text = input.value.trim();
      if (!text) return;

      var state = ensureNegotiationState();
      if (!state) return;
      var p = state.proposals.find(function(x) { return x.id === proposalId; });
      if (!p) return;

      if (!p.messages) p.messages = [];
      p.messages.push({
        perspective: currentPerspective || 'investor',
        actor: (currentUser && (currentUser.displayName || currentUser.username)) || (currentPerspective === 'financer' ? '融资方' : '投资方'),
        text: text,
        at: new Date().toISOString()
      });
      input.value = '';
      saveNegotiationState();
      renderProposalMessages(p);
    }

    // ---- 提案状态与记录 ----
    function getProposalStatusText(status) {
      if (status === 'draft') return '草稿';
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
      if (!state.proposals.length) {
        list.textContent = '暂无提案记录。';
        return;
      }

      // 检测是否已有任一方案达成条款
      var hasAgreed = state.proposals.some(function(x) { return x.status === 'agreed'; });

      var totalProposals = state.proposals.length;
      list.innerHTML = state.proposals.map(function(p, idx) {
        var isFinancer = p.perspective === 'financer';
        var roleName = isFinancer ? '融资方' : '投资方';
        var proposalLabel = '方案 #' + (totalProposals - idx);
        var actions = [];
        var isSender = p.perspective === (currentPerspective || 'investor');
        var isReceiver = !isSender;
        // 当前方案非达成方案时，若已有达成方案则置灰
        var locked = hasAgreed && p.status !== 'agreed';
        var dis = locked ? ' disabled style="opacity:0.4;cursor:not-allowed;"' : '';

        if (p.status === 'draft' || p.status === 'pending') {
          if (isReceiver) {
            actions.push('<button onclick="acceptAndConfirmTerms(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded bg-emerald-600 text-white"' + dis + '>接受并达成条款</button>');
            actions.push('<button onclick="respondNegotiation(\'' + p.id + '\',\'reject\')" class="px-2 py-1 text-[11px] rounded bg-rose-600 text-white"' + dis + '>拒绝</button>');
            actions.push('<button onclick="respondNegotiation(\'' + p.id + '\',\'counter\')" class="px-2 py-1 text-[11px] rounded bg-cyan-600 text-white"' + dis + '>反提案</button>');
          }
          if (isSender) {
            actions.push('<button onclick="withdrawNegotiationProposal(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700"' + dis + '>撤回</button>');
          }
        } else if (p.status === 'agreed') {
          actions.push('<button onclick="revokeAgreedTerms(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded border border-rose-200 text-rose-600 hover:bg-rose-50">撤回条款达成</button>');
        } else if (p.status === 'countered' && p.counterTerms) {
          // 反提案发起方只能撤回
          if (p.counterBy === (currentPerspective || 'investor')) {
            actions.push('<button onclick="withdrawCounterProposal(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700"' + dis + '>撤回反提案</button>');
          }
          // 原方案方（被反提案方）可以接受或驳回
          if (isSender) {
            actions.push('<button onclick="acceptCounterProposal(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded bg-emerald-600 text-white"' + dis + '>接受反提案并达成</button>');
            actions.push('<button onclick="rejectCounterProposal(\'' + p.id + '\')" class="px-2 py-1 text-[11px] rounded bg-rose-600 text-white"' + dis + '>驳回反提案</button>');
          }
        }

        var counterByName = p.counterBy === 'financer' ? '融资方' : '投资方';
        return '<div class="p-3 rounded-xl border border-gray-100 bg-gray-50">' +
          '<div class="flex items-center justify-between mb-1"><p class="text-xs font-semibold text-gray-700">' + roleName + ' · ' + proposalLabel + '</p><span class="text-[11px] px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">' + getProposalStatusText(p.status) + '</span></div>' +
          '<p class="text-xs text-gray-500 mb-1">' + formatTermsInline(p.publicTerms) + '</p>' +
          (p.counterTerms ? '<p class="text-xs text-cyan-700 mb-1">' + counterByName + '反提案：' + formatTermsInline(p.counterTerms) + '</p>' : '') +
          (actions.length ? '<div class="flex flex-wrap gap-1 mt-2">' + actions.join('') + '</div>' : '') +
        '</div>';
      }).join('');
    }

    // ---- 沟通备忘录 Tab ----
    function renderMemoTab() {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      var list = document.getElementById('memoHistoryList');
      if (!list) return;
      ensureMemoEditorState(state);
      var allMemos = state.memos || [];
      if (allMemos.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">暂无沟通纪要。</p>';
        state.memoEditor.selectedMemoId = '';
        setMemoFormData({});
        updateMemoEditorHint('当前为新建模式。必填：议题。');
        renderMemoActionBar(state, null);
        renderMemoVersionHistory(state, null);
        renderMemoFilterMeta({ allCount: 0, filteredCount: 0, statusFilter: 'all', keyword: '' });
        saveNegotiationState();
        return;
      }

      var filteredResult = getMemoFilteredAndSorted(state);
      renderMemoFilterMeta(filteredResult);
      var memos = filteredResult.items;
      if (memos.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">暂无符合筛选条件的备忘录，请调整状态或关键词。</p>';
      } else {
      list.innerHTML = memos.map(function(m) {
        var currentVersion = getMemoCurrentVersion(m);
        var statusMeta = getMemoStatusMeta(m.status);
        var confirmCount = getMemoConfirmCount(currentVersion && currentVersion.confirmMeta);
        var statusText = statusMeta.label;
        if (m.status === 'pending_confirmation') statusText = '待确认（' + confirmCount + '/2）';
        if (m.status === 'confirmed') statusText = '已确认（2/2）';
        var time = (m.updatedAt || m.createdAt || (currentVersion && currentVersion.updatedAt) || '').slice(0, 16).replace('T', ' ');
        var selected = state.memoEditor.selectedMemoId === m.id;
        var summary = (currentVersion && currentVersion.summaryBody) || (currentVersion && currentVersion.agreedContent) || '';
        var shortSummary = summary.length > 90 ? (summary.slice(0, 90) + '...') : summary;
        var rejectMeta = currentVersion && currentVersion.rejectMeta ? currentVersion.rejectMeta : null;
        var rejectReason = rejectMeta && rejectMeta.reason ? rejectMeta.reason : '';
        var rejectRole = rejectMeta && rejectMeta.role ? rejectMeta.role : '';
        var rejectActor = rejectMeta && rejectMeta.actor ? rejectMeta.actor : '';
        var rejectAt = rejectMeta && rejectMeta.at ? String(rejectMeta.at).slice(0, 16).replace('T', ' ') : '';
        var evidences = normalizeMemoEvidenceAnchors(currentVersion && currentVersion.evidenceAnchors);
        var evidenceCount = evidences.length;
        var evidenceDetails = evidenceCount > 0
          ? ('<details class="mt-1.5 text-[11px] text-gray-500" onclick="event.stopPropagation()"><summary class="cursor-pointer select-none">查看证据详情（' + evidenceCount + '）</summary><div class="mt-1 space-y-1">' + evidences.map(function(ev, i) {
              var when = (ev.sourceAt || ev.uploadedAt) ? String(ev.sourceAt || ev.uploadedAt).replace('T', ' ').slice(0, 16) : '--';
              var sourceRole = ev.sourceRole || '--';
              return '<div class="p-1.5 rounded bg-gray-50 border border-gray-100"><span class="font-medium">#' + (i + 1) + '</span> ' + escapeMemoText(ev.fileName || '未命名文件') + ' · ' + escapeMemoText(formatMemoFileSize(ev.fileSize)) + ' · ' + escapeMemoText(ev.mimeType || '--') + ' · 来源：' + escapeMemoText(sourceRole) + ' · ' + escapeMemoText(when) + (ev.note ? ('<br><span class="text-gray-400">' + escapeMemoText(ev.note) + '</span>') : '') + '</div>';
            }).join('') + '</div></details>')
          : '<p class="text-[11px] text-gray-400 mt-1.5">备忘录文件：0</p>';
        return '<div onclick="selectMemoForEdit(\'' + m.id + '\')" class="w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ' + (selected ? 'border-indigo-300 bg-indigo-50' : 'border-indigo-100 bg-white hover:bg-indigo-50/40') + '">' +
          '<div class="flex items-center justify-between mb-1.5">' +
            '<div class="text-xs font-semibold text-indigo-700">纪要 · ' + m.id + ' · V' + m.currentVersion + '</div>' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded ' + statusMeta.cls + '">' + statusText + '</span>' +
          '</div>' +
          '<p class="text-xs text-gray-700 mb-1">议题：' + ((currentVersion && currentVersion.topic) || '--') + '</p>' +
          '<p class="text-xs text-gray-600 leading-relaxed">' + (shortSummary || '无摘要') + '</p>' +
          (rejectReason ? '<p class="text-[11px] text-rose-600 mt-1">拒绝原因：' + escapeMemoText(rejectReason) + '</p>' : '') +
          (rejectReason ? '<p class="text-[11px] text-rose-500 mt-1">拒绝信息：' + escapeMemoText(rejectActor || '--') + '（' + escapeMemoText(rejectRole || '--') + '） · ' + escapeMemoText(rejectAt || '--') + '</p>' : '') +
          evidenceDetails +
          '<div class="text-[10px] text-gray-400 mt-1.5 flex items-center justify-between">' +
            '<span>' + time + '</span>' +
            '<span>备忘录文件：' + evidenceCount + '</span>' +
          '</div>' +
        '</div>';
        }).join('');
      }

      var selectedMemo = getSelectedMemo(state);
      if (!selectedMemo) {
        setMemoFormData({});
        updateMemoEditorHint('当前为新建模式。必填：议题。');
        renderMemoActionBar(state, null);
        renderMemoVersionHistory(state, null);
        return;
      }
      var selectedVersion = getMemoCurrentVersion(selectedMemo);
      if (!selectedVersion) return;
      setMemoFormData(selectedVersion);
      var selectedMeta = getMemoStatusMeta(selectedMemo.status);
      var selectedConfirmCount = getMemoConfirmCount(selectedVersion.confirmMeta);
      var selectedStatusLabel = selectedMeta.label;
      if (selectedMemo.status === 'pending_confirmation') selectedStatusLabel = '待确认（' + selectedConfirmCount + '/2）';
      if (selectedMemo.status === 'confirmed') selectedStatusLabel = '已确认（2/2）';
      updateMemoEditorHint('当前编辑：' + selectedMemo.id + ' · V' + selectedMemo.currentVersion + ' · ' + selectedStatusLabel + '。');
      renderMemoActionBar(state, selectedMemo);
      renderMemoVersionHistory(state, selectedMemo);
    }

    function validateMemoCoreFields(data, targetStatus) {
      if (!data.topic) {
        showToast('warning', '请补充必填字段', '至少填写「议题」');
        return false;
      }
      return true;
    }

    function upsertMemoFromForm(targetStatus) {
      if (!currentDeal) return null;
      var state = ensureNegotiationState();
      if (!state) return null;
      ensureMemoEditorState(state);

      var payload = getMemoFormData();
      if (!validateMemoCoreFields(payload, targetStatus)) return null;

      var now = new Date().toISOString();
      var selectedId = state.memoEditor.selectedMemoId;
      var memo = (state.memos || []).find(function(item) { return item.id === selectedId; });
      var currentVersion = null;

      if (!memo) {
        memo = {
          id: 'M_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          currentVersion: 1,
          status: targetStatus,
          createdAt: now,
          updatedAt: now,
          versions: []
        };
        state.memos.unshift(memo);
      } else {
        if (!canInvestorEditMemo(memo)) {
          showToast('warning', '当前版本不可直接编辑', '请先点击「基于当前版本生成修订稿」');
          return null;
        }
        currentVersion = getMemoCurrentVersion(memo);
        var canUpdateCurrentDraft = memo.status === 'draft' && !!currentVersion;
        if (!canUpdateCurrentDraft) {
          memo.currentVersion = (memo.currentVersion || 0) + 1;
        }
        memo.status = targetStatus;
        memo.updatedAt = now;
      }

      if (!currentVersion || currentVersion.version !== memo.currentVersion) {
        currentVersion = {
          version: memo.currentVersion,
          createdAt: now,
          updatedAt: now,
          author: (currentUser && (currentUser.displayName || currentUser.username)) || '我方',
          role: currentPerspective || 'investor',
          topic: payload.topic,
          agreedContent: payload.agreedContent,
          summaryBody: payload.summaryBody,
          evidenceAnchors: normalizeMemoEvidenceAnchors(payload.evidenceAnchors),
          confirmMeta: normalizeMemoConfirmMeta(null, targetStatus),
          rejectMeta: null
        };
        memo.versions.push(currentVersion);
      } else {
        currentVersion.updatedAt = now;
        currentVersion.author = (currentUser && (currentUser.displayName || currentUser.username)) || '我方';
        currentVersion.role = currentPerspective || 'investor';
        currentVersion.topic = payload.topic;
        currentVersion.agreedContent = payload.agreedContent;
        currentVersion.summaryBody = payload.summaryBody;
        currentVersion.evidenceAnchors = normalizeMemoEvidenceAnchors(payload.evidenceAnchors);
        currentVersion.confirmMeta = normalizeMemoConfirmMeta(null, targetStatus);
        currentVersion.rejectMeta = null;
      }

      state.memoEditor.selectedMemoId = memo.id;
      setMemoDiffToLatestPair(state, memo);
      saveNegotiationState();
      return memo;
    }

    function saveMemoDraft() {
      var memo = upsertMemoFromForm('draft');
      if (!memo) return;
      setMemoLastPrimaryAction('draft');
      pushTimelineEvent('memo_draft_saved', '保存沟通备忘录草稿（' + memo.id + '）', getPublicTermsFromWorkbench());
      renderMemoTab();
      showToast('success', '草稿已保存', memo.id + ' · V' + memo.currentVersion);
    }

    function submitMemoForConfirmation() {
      var memo = upsertMemoFromForm('pending_confirmation');
      if (!memo) return;
      setMemoLastPrimaryAction('submit');
      pushTimelineEvent('memo_submitted', '提交沟通备忘录待确认（' + memo.id + '）', getPublicTermsFromWorkbench());
      renderMemoTab();
      showToast('success', '已提交确认', memo.id + ' 已进入待确认状态');
    }

    function createMemoRevision() {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      if (!state) return;
      var memo = getSelectedMemo(state);
      if (!memo) {
        showToast('warning', '未选择备忘录', '请先选择一条备忘录');
        return;
      }
      var currentVersion = getMemoCurrentVersion(memo);
      if (!currentVersion) return;
      createMemoRevisionByBaseVersion(state, memo, currentVersion);
    }

    function createMemoRevisionByBaseVersion(state, memo, baseVersion) {
      if (!state || !memo || !baseVersion) return;
      var now = new Date().toISOString();
      var nextVersionNo = (memo.currentVersion || 0) + 1;
      memo.currentVersion = nextVersionNo;
      memo.status = 'draft';
      memo.updatedAt = now;
      memo.versions.push({
        version: nextVersionNo,
        createdAt: now,
        updatedAt: now,
        author: (currentUser && (currentUser.displayName || currentUser.username)) || '我方',
        role: currentPerspective || 'investor',
        topic: baseVersion.topic || '',
        agreedContent: baseVersion.agreedContent || '',
        summaryBody: baseVersion.summaryBody || '',
        evidenceAnchors: normalizeMemoEvidenceAnchors(baseVersion.evidenceAnchors),
        revisedFromVersion: baseVersion.version,
        confirmMeta: normalizeMemoConfirmMeta(null, 'draft'),
        rejectMeta: null
      });
      state.memoEditor.selectedMemoId = memo.id;
      setMemoDiffToLatestPair(state, memo);
      state.memoEditor.lastPrimaryAction = 'revision';
      saveNegotiationState();
      pushTimelineEvent('memo_revised', '基于 ' + memo.id + ' V' + baseVersion.version + ' 生成修订稿 V' + nextVersionNo, getPublicTermsFromWorkbench());
      renderMemoTab();
      showToast('success', '修订稿已创建', memo.id + ' · V' + nextVersionNo + '（草稿）');
    }

    function createMemoRevisionFromVersion(versionNo) {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      if (!state) return;
      var memo = getSelectedMemo(state);
      if (!memo) {
        showToast('warning', '未选择备忘录', '请先选择一条备忘录');
        return;
      }
      var baseVersion = getMemoVersionByNo(memo, versionNo);
      if (!baseVersion) {
        showToast('warning', '版本不存在', '请选择有效版本后重试');
        return;
      }
      createMemoRevisionByBaseVersion(state, memo, baseVersion);
    }

    function confirmSelectedMemo() {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      if (!state) return;
      var memo = getSelectedMemo(state);
      if (!memo) {
        showToast('warning', '未选择备忘录', '请选择一条待确认备忘录');
        return;
      }
      if (memo.status !== 'pending_confirmation') {
        showToast('info', '当前状态不可确认', '仅待确认状态可执行确认');
        return;
      }
      var version = getMemoCurrentVersion(memo);
      if (!version) return;
      var now = new Date().toISOString();
      var roleKey = getCurrentMemoRoleKey();
      version.confirmMeta = normalizeMemoConfirmMeta(version.confirmMeta, memo.status, (currentUser && (currentUser.displayName || currentUser.username)) || '我方', now);
      if (version.confirmMeta[roleKey]) {
        showToast('info', '已完成本方确认', '当前版本已记录你的确认，等待对方确认');
        renderMemoTab();
        return;
      }
      version.confirmMeta[roleKey] = {
        actor: (currentUser && (currentUser.displayName || currentUser.username)) || (roleKey === 'financer' ? '融资方' : '投资方'),
        at: now
      };
      version.rejectMeta = null;
      var confirmCount = getMemoConfirmCount(version.confirmMeta);
      memo.status = confirmCount >= 2 ? 'confirmed' : 'pending_confirmation';
      memo.updatedAt = now;
      saveNegotiationState();
      if (memo.status === 'confirmed') {
        pushTimelineEvent('memo_confirmed', '完成双向确认（' + memo.id + ' · V' + memo.currentVersion + '）', getPublicTermsFromWorkbench());
      } else {
        pushTimelineEvent('memo_confirm_progress', '记录单方确认（' + memo.id + ' · V' + memo.currentVersion + '，' + confirmCount + '/2）', getPublicTermsFromWorkbench());
      }
      renderMemoTab();
      if (memo.status === 'confirmed') {
        showToast('success', '双方确认完成', memo.id + ' 已正式确认');
      } else {
        showToast('info', '已记录本方确认', memo.id + ' 当前确认进度 ' + confirmCount + '/2');
      }
    }

    function rejectSelectedMemo() {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      if (!state) return;
      var memo = getSelectedMemo(state);
      if (!memo) {
        showToast('warning', '未选择备忘录', '请选择一条待确认备忘录');
        return;
      }
      if (memo.status !== 'pending_confirmation') {
        showToast('info', '当前状态不可拒绝', '仅待确认状态可执行拒绝');
        return;
      }
      var reason = (document.getElementById('memoRejectReason')?.value || '').trim();
      if (!reason) {
        showToast('warning', '请填写拒绝原因', '拒绝备忘录时需填写原因');
        return;
      }
      var version = getMemoCurrentVersion(memo);
      var now = new Date().toISOString();
      memo.status = 'rejected';
      memo.updatedAt = now;
      if (version) {
        version.confirmMeta = normalizeMemoConfirmMeta(version.confirmMeta, 'rejected', (currentUser && (currentUser.displayName || currentUser.username)) || '我方', now);
        version.rejectMeta = {
          role: currentPerspective || 'financer',
          actor: (currentUser && (currentUser.displayName || currentUser.username)) || '融资方',
          at: now,
          reason: reason
        };
      }
      saveNegotiationState();
      pushTimelineEvent('memo_rejected', '拒绝备忘录（' + memo.id + ' · V' + memo.currentVersion + '）', getPublicTermsFromWorkbench());
      renderMemoTab();
      showToast('info', '已拒绝', memo.id + ' 已拒绝，原因已记录');
    }

    // ---- 方案动态时间线 ----
    function getNegTimelineIcon(type) {
      var map = {
        proposal_submitted: { icon: 'fa-plus-circle', color: '#0d9488' },
        proposal_edited: { icon: 'fa-pen', color: '#0891b2' },
        proposal_accepted: { icon: 'fa-check-circle', color: '#10b981' },
        proposal_rejected: { icon: 'fa-times-circle', color: '#ef4444' },
        proposal_countered: { icon: 'fa-reply', color: '#6366f1' },
        proposal_withdrawn: { icon: 'fa-undo', color: '#6b7280' },
        counter_withdrawn: { icon: 'fa-undo', color: '#6b7280' },
        counter_accepted: { icon: 'fa-check-double', color: '#10b981' },
        counter_rejected: { icon: 'fa-ban', color: '#ef4444' },
        terms_confirmed: { icon: 'fa-lock', color: '#059669' },
        terms_revoked: { icon: 'fa-lock-open', color: '#dc2626' },
        timeline_reloaded: { icon: 'fa-rotate', color: '#8b5cf6' }
      };
      return map[type] || { icon: 'fa-circle', color: '#9ca3af' };
    }

    // 将摘要中的 P_xxx ID 替换为"方案 #N"
    function replaceProposalIds(summary, proposals) {
      if (!summary || !proposals || !proposals.length) return summary || '--';
      var result = summary;
      proposals.forEach(function(p, idx) {
        if (result.indexOf(p.id) !== -1) {
          result = result.replace(new RegExp(p.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '方案 #' + (proposals.length - idx));
        }
      });
      return result;
    }

    function renderNegotiationTimeline() {
      if (!currentDeal) return;
      var allEvents = getTimelineEventsForCurrentDeal();
      // 只保留方案相关事件
      var proposalEvents = allEvents.filter(function(e) {
        return getTimelineTypeMeta(e.type).category === 'proposal';
      });

      // 筛选器：按方案ID过滤
      var filterEl = document.getElementById('negTimelineFilter');
      var filterVal = filterEl ? filterEl.value : 'all';

      // 构建方案ID列表供下拉选择
      var state = ensureNegotiationState();
      var proposals = state ? state.proposals : [];
      if (filterEl) {
        var currentVal = filterEl.value;
        var opts = '<option value="all">全部方案</option>';
        proposals.forEach(function(p, idx) {
          opts += '<option value="' + p.id + '">方案 #' + (proposals.length - idx) + '</option>';
        });
        filterEl.innerHTML = opts;
        filterEl.value = currentVal;
        // 如果之前的值不在新列表中，重置为all
        if (filterEl.value !== currentVal) filterEl.value = 'all';
        filterVal = filterEl.value;
      }

      // 按方案ID过滤
      var filtered = proposalEvents;
      if (filterVal !== 'all') {
        filtered = proposalEvents.filter(function(e) {
          return e.summary && e.summary.indexOf(filterVal) !== -1;
        });
      }

      var countEl = document.getElementById('negTimelineCount');
      if (countEl) countEl.textContent = filtered.length + ' 条';

      var list = document.getElementById('negTimelineList');
      if (!list) return;
      if (filtered.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">暂无方案动态。</p>';
        return;
      }

      list.innerHTML = filtered.map(function(e, idx) {
        var meta = getTimelineTypeMeta(e.type);
        var iconMeta = getNegTimelineIcon(e.type);
        var at = e.at ? e.at.slice(5, 16).replace('T', ' ') : '--';
        var actor = e.actor || '我方';
        var roleName = e.role === 'financer' ? '融资方' : '投资方';
        var isLast = idx === filtered.length - 1;
        var termsHtml = '';
        if (e.publicTerms) {
          var t = e.publicTerms;
          termsHtml = '<div class="mt-1.5 flex flex-wrap gap-1.5">' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">' + Number(t.amountWan || 0).toFixed(1) + '万</span>' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">' + Number(t.sharePct || 0).toFixed(2) + '%</span>' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">APR ' + Number(t.aprPct || 0).toFixed(2) + '%</span>' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">' + Number(t.termMonths || 0).toFixed(0) + '月</span>' +
          '</div>';
        }

        return '<div class="flex gap-3">' +
          // 时间轴线 + 图标
          '<div class="flex flex-col items-center flex-shrink-0" style="width:24px;">' +
            '<div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style="background:' + iconMeta.color + '15;"><i class="fas ' + iconMeta.icon + '" style="font-size:10px;color:' + iconMeta.color + ';"></i></div>' +
            (!isLast ? '<div class="w-px flex-1 bg-gray-200 my-0.5"></div>' : '') +
          '</div>' +
          // 内容
          '<div class="pb-3 flex-1 min-w-0">' +
            '<div class="flex items-center gap-2">' +
              '<span class="text-xs font-semibold text-gray-800">' + meta.label + '</span>' +
              '<span class="text-[10px] px-1.5 py-0.5 rounded ' + (e.role === 'financer' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600') + '">' + roleName + '</span>' +
              '<span class="text-[10px] text-gray-400 ml-auto flex-shrink-0">' + at + '</span>' +
            '</div>' +
            '<p class="text-[11px] text-gray-500 mt-0.5">' + actor + '：' + replaceProposalIds(e.summary, proposals) + '</p>' +
            termsHtml +
          '</div>' +
        '</div>';
      }).join('');
    }

    function renderNegotiationTab() {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      var intent = (typeof ensureIntentState === 'function') ? ensureIntentState() : null;

      var gate = document.getElementById('negotiationGateTip');
      if (gate) {
        const accepted = intent && (typeof hasAcceptedIntent === 'function' ? hasAcceptedIntent(intent) : intent.response === 'accepted');
        const pending = intent && (typeof hasPendingIntent === 'function' ? hasPendingIntent(intent) : intent.response === 'pending');
        if (accepted) {
          gate.className = 'text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700';
          gate.textContent = '已建联，可正式谈判';
        } else if (currentPerspective === 'financer' && pending) {
          gate.className = 'text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700';
          gate.textContent = '建议先完成意向处理';
        } else {
          var count = state.proposals ? state.proposals.length : 0;
          if (count > 0) {
            gate.className = 'text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-700';
            gate.textContent = '共 ' + count + ' 个方案';
          } else {
            gate.className = 'text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700';
            gate.textContent = '在条款工作台提交方案后，方案将出现在此处';
          }
        }
      }

      renderProposalGrid(state);
      renderNegotiationProposals(state);
      renderNegotiationTimeline();

      var invite = document.getElementById('negInviteBox');
      if (invite) {
        if (state.invite) invite.textContent = '链接：' + state.invite.link + '（角色：' + (state.invite.role === 'negotiator' ? '谈判者' : '观察者') + '，有效期至 ' + state.invite.expiresAt.slice(0, 10) + '）';
        else invite.textContent = '尚未生成邀请链接。';
      }

      var payloadBox = document.getElementById('negContractPayloadBox');
      if (payloadBox) {
        var payload = contractPayloadByDeal[currentDeal.id];
        if (payload && payload.publicTerms) {
          var pt = payload.publicTerms;
          var confirmedTime = payload.confirmedAt ? payload.confirmedAt.slice(0, 16).replace('T', ' ') : '--';
          payloadBox.innerHTML =
            '<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-100">' +
              '<div class="flex items-center gap-2 mb-3"><i class="fas fa-circle-check text-emerald-600"></i><span class="text-sm font-bold text-emerald-800">条款已达成</span><span class="text-[11px] text-emerald-600 ml-auto">' + confirmedTime + '</span></div>' +
              '<div class="grid grid-cols-2 gap-2 mb-3">' +
                '<div class="p-2.5 rounded-lg bg-white border border-emerald-100"><p class="text-[11px] text-gray-400">项目名称</p><p class="text-xs font-semibold text-gray-800">' + (payload.projectName || '--') + '</p></div>' +
                '<div class="p-2.5 rounded-lg bg-white border border-emerald-100"><p class="text-[11px] text-gray-400">融资金额</p><p class="text-xs font-semibold text-gray-800">' + Number(pt.amountWan).toFixed(1) + ' 万</p></div>' +
                '<div class="p-2.5 rounded-lg bg-white border border-emerald-100"><p class="text-[11px] text-gray-400">分成比例</p><p class="text-xs font-semibold text-gray-800">' + Number(pt.sharePct).toFixed(2) + '%</p></div>' +
                '<div class="p-2.5 rounded-lg bg-white border border-emerald-100"><p class="text-[11px] text-gray-400">封顶 APR</p><p class="text-xs font-semibold text-gray-800">' + Number(pt.aprPct).toFixed(2) + '%</p></div>' +
                '<div class="p-2.5 rounded-lg bg-white border border-emerald-100"><p class="text-[11px] text-gray-400">合作期限</p><p class="text-xs font-semibold text-gray-800">' + Number(pt.termMonths).toFixed(0) + ' 个月</p></div>' +
                '<div class="p-2.5 rounded-lg bg-white border border-emerald-100"><p class="text-[11px] text-gray-400">来源方案</p><p class="text-xs font-semibold text-gray-800">' + replaceProposalIds(payload.sourceProposalId, state.proposals) + '</p></div>' +
              '</div>' +
              '<p class="text-[11px] text-emerald-600"><i class="fas fa-info-circle mr-1"></i>以上为双方确认的公共条款，私有预测与派生指标不包含在内。</p>' +
            '</div>';
        } else {
          payloadBox.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">尚未达成条款。</p>';
        }
      }
    }

    // ---- 谈判操作 ----
    function findProposalById(proposalId) {
      var state = ensureNegotiationState();
      if (!state) return null;
      return state.proposals.find(function(p) { return p.id === proposalId; }) || null;
    }

    // 锁定条款的公共逻辑（接受 + 达成一步完成）
    function lockTermsForProposal(proposal) {
      proposal.status = 'agreed';
      currentDeal.status = 'confirmed';
      var original = allDeals.find(function(d) { return d.id === currentDeal.id; });
      if (original) original.status = 'confirmed';
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
      contractPayloadByDeal[currentDeal.id] = {
        dealId: currentDeal.id,
        projectName: currentDeal.name,
        sourceProposalId: proposal.id,
        confirmedAt: new Date().toISOString(),
        publicTerms: {
          amountWan: Number(proposal.publicTerms.amountWan),
          sharePct: Number(proposal.publicTerms.sharePct),
          aprPct: Number(proposal.publicTerms.aprPct),
          termMonths: Number(proposal.publicTerms.termMonths)
        }
      };
      saveContractPayloadState();
      saveNegotiationState();
    }

    // 一键接受并达成条款
    function acceptAndConfirmTerms(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || (proposal.status !== 'draft' && proposal.status !== 'pending')) return;
      lockTermsForProposal(proposal);
      pushTimelineEvent('terms_confirmed', '接受方案 ' + proposal.id + ' 并达成条款', proposal.publicTerms);
      renderNegotiationTab();
      showToast('success', '条款已达成', '项目状态已更新为已确认');
    }

    function respondNegotiation(proposalId, action) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || (proposal.status !== 'draft' && proposal.status !== 'pending')) return;
      if (action === 'reject') {
        proposal.status = 'rejected';
        pushTimelineEvent('proposal_rejected', '拒绝方案 ' + proposal.id, proposal.publicTerms);
        saveNegotiationState();
        renderNegotiationTab();
        showToast('info', '已拒绝', '可调整参数后重新提交');
      } else if (action === 'counter') {
        // 打开反提案弹窗，预填原方案数据
        openCounterOverlay(proposalId);
      }
    }

    // ---- 反提案弹窗 ----
    var counterTargetProposalId = null;

    function openCounterOverlay(proposalId) {
      var proposal = findProposalById(proposalId);
      if (!proposal) return;
      counterTargetProposalId = proposalId;
      var overlay = document.getElementById('counterOverlay');
      if (overlay) overlay.classList.remove('hidden');

      var info = document.getElementById('counterOrigInfo');
      if (info) info.textContent = '针对方案 ' + proposal.id + '（' + formatTermsInline(proposal.publicTerms) + '）';

      var t = proposal.publicTerms || {};
      var ea = document.getElementById('counterAmount');
      var es = document.getElementById('counterShare');
      var ep = document.getElementById('counterApr');
      if (ea) ea.value = t.amountWan || '';
      if (es) es.value = t.sharePct || '';
      if (ep) ep.value = t.aprPct || '';
      recalcCounterTerm();

      // 填充当前条款工作台方案视图
      renderCounterWbView();

      var btn = document.getElementById('counterSubmitBtn');
      if (btn) btn.onclick = function() { submitCounterProposal(); };
    }

    // 反提案弹窗内自动推算合作期限（与条款工作台同逻辑）
    function recalcCounterTerm() {
      var ea = document.getElementById('counterAmount');
      var es = document.getElementById('counterShare');
      var ep = document.getElementById('counterApr');
      var et = document.getElementById('counterTerm');
      if (!et || !currentDeal) return;

      var amount = parseFloat(ea ? ea.value : '') || 0;
      var share = parseFloat(es ? es.value : '') || 0;
      var apr = parseFloat(ep ? ep.value : '') || 0;

      // 用模型/融资方预估营业额计算触达月数 × 4（同 computeAutoTermMonths 逻辑）
      var fcState = (typeof ensureForecastState === 'function') ? ensureForecastState(currentDeal) : null;
      var modelRevenue = 0;
      if (fcState && fcState.systemMonthly && fcState.systemMonthly.length > 0) {
        modelRevenue = fcState.systemMonthly.slice(0, 12).reduce(function(a, b) { return a + b; }, 0) / 12;
      }
      if (modelRevenue <= 0 && fcState && fcState.borrowerMonthly && fcState.borrowerMonthly.length > 0) {
        modelRevenue = fcState.borrowerMonthly.slice(0, 12).reduce(function(a, b) { return a + b; }, 0) / 12;
      }

      var term = 24;
      if (modelRevenue > 0 && amount > 0 && share > 0) {
        var monthlyPayback = modelRevenue * share / 100;
        var touchDen = monthlyPayback - amount * apr / 100 / 12;
        if (touchDen > 0) {
          term = Math.max(1, Math.round((amount / touchDen) * 4));
        }
      }
      et.value = String(term);
    }

    // 渲染当前条款工作台方案到反提案弹窗
    function renderCounterWbView() {
      var wbState = ensureWorkbenchState();
      var derived = wbState ? (workbenchDerivedByDeal[currentDeal.id] || computeWorkbenchDerived(wbState)) : null;
      var srcMap = { system: '模型预估', borrower: '融资方预估', self: '自行填写' };

      var pubEl = document.getElementById('counterWbPublic');
      if (pubEl && wbState) {
        pubEl.innerHTML =
          counterMiniCell('金额', wbState.publicAmountWan.toFixed(1) + '万') +
          counterMiniCell('比例', wbState.publicSharePct.toFixed(2) + '%') +
          counterMiniCell('APR', wbState.publicAprPct.toFixed(2) + '%') +
          counterMiniCell('期限', wbState.publicTermMonths + '月');
      }

      var privEl = document.getElementById('counterWbPrivate');
      if (privEl && wbState) {
        privEl.innerHTML =
          counterMiniCell('月均营业额', wbState.privateRevenueWan.toFixed(1) + '万') +
          counterMiniCell('来源', srcMap[wbState.privateSource] || '--');
      }

      var derEl = document.getElementById('counterWbDerived');
      if (derEl && derived) {
        derEl.innerHTML =
          counterMiniCell('月回款', fmtWanOrDash(derived.monthlyPaybackWan)) +
          counterMiniCell('触达月数', fmtMonOrDash(derived.touchMonths)) +
          counterMiniCell('总回款', fmtWanOrDash(derived.totalPaybackWan)) +
          counterMiniCell('实际APR', fmtPctOrDash(derived.actualAprPct)) +
          counterMiniCell('回收倍数', Number.isFinite(derived.recoveryMultiple) ? derived.recoveryMultiple.toFixed(2) + 'x' : '--') +
          counterMiniCell('建议融资上限', fmtWanOrDash(derived.suggestedAmountWan));
      }
    }

    function counterMiniCell(label, value) {
      return '<div class="p-1.5 rounded bg-gray-50 border border-gray-100"><span class="text-[10px] text-gray-400">' + label + '</span><br><span class="font-semibold text-gray-700">' + value + '</span></div>';
    }

    function closeCounterOverlay() {
      var overlay = document.getElementById('counterOverlay');
      if (overlay) overlay.classList.add('hidden');
      counterTargetProposalId = null;
    }

    function submitCounterProposal() {
      if (!counterTargetProposalId || !currentDeal) return;
      var proposal = findProposalById(counterTargetProposalId);
      if (!proposal) return;

      var ea = document.getElementById('counterAmount');
      var es = document.getElementById('counterShare');
      var ep = document.getElementById('counterApr');
      var et = document.getElementById('counterTerm');
      var amount = parseFloat(ea ? ea.value : '');
      var share = parseFloat(es ? es.value : '');
      var apr = parseFloat(ep ? ep.value : '');
      var term = parseInt(et ? et.value : '', 10);

      if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(share) || share <= 0 || !Number.isFinite(apr) || !Number.isFinite(term) || term <= 0) {
        showToast('warning', '参数不完整', '请填写所有条款数值');
        return;
      }

      proposal.status = 'countered';
      proposal.counterTerms = {
        amountWan: +amount.toFixed(1),
        sharePct: +share.toFixed(2),
        aprPct: +apr.toFixed(2),
        termMonths: term
      };
      proposal.counterBy = currentPerspective || 'investor';
      proposal.counterAt = new Date().toISOString();

      saveNegotiationState();
      pushTimelineEvent('proposal_countered', '对方案 ' + proposal.id + ' 发起反提案', proposal.counterTerms);
      closeCounterOverlay();
      renderNegotiationTab();
      showToast('success', '反提案已提交', '对方可在谈判记录中查看您的反提案');
    }

    // ---- 撤回 ----
    function withdrawNegotiationProposal(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal) return;
      // 支持撤回：草稿、待响应、反提案状态
      if (proposal.status !== 'draft' && proposal.status !== 'pending' && proposal.status !== 'countered') {
        showToast('warning', '无法撤回', '当前状态不支持撤回');
        return;
      }
      proposal.status = 'withdrawn';
      saveNegotiationState();
      pushTimelineEvent('proposal_withdrawn', '撤回方案 ' + proposal.id, proposal.publicTerms);
      renderNegotiationTab();
      showToast('info', '方案已撤回', proposal.id);
    }

    // 撤回反提案（恢复原方案为待响应状态）
    function withdrawCounterProposal(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'countered') {
        showToast('warning', '无法撤回反提案', '当前状态不支持此操作');
        return;
      }
      proposal.status = 'pending';
      proposal.counterTerms = null;
      proposal.counterBy = null;
      proposal.counterAt = null;
      saveNegotiationState();
      pushTimelineEvent('counter_withdrawn', '撤回对方案 ' + proposal.id + ' 的反提案', proposal.publicTerms);
      renderNegotiationTab();
      showToast('info', '反提案已撤回', '方案恢复为待响应状态');
    }

    // 原方案方接受反提案 → 用反提案条款替换原方案，直接达成条款
    function acceptCounterProposal(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'countered' || !proposal.counterTerms) return;
      proposal.publicTerms = proposal.counterTerms;
      proposal.counterTerms = null;
      lockTermsForProposal(proposal);
      pushTimelineEvent('counter_accepted', '接受方案 ' + proposal.id + ' 的反提案条款并达成', proposal.publicTerms);
      renderNegotiationTab();
      showToast('success', '条款已达成', '已接受反提案并锁定条款');
    }

    // 原方案方驳回反提案 → 维持原提案，状态恢复为待响应
    function rejectCounterProposal(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'countered' || !proposal.counterTerms) return;
      var rejectedTerms = proposal.counterTerms;
      proposal.status = 'pending';
      proposal.counterTerms = null;
      proposal.counterBy = null;
      proposal.counterAt = null;
      saveNegotiationState();
      pushTimelineEvent('counter_rejected', '驳回方案 ' + proposal.id + ' 的反提案，维持原提案', proposal.publicTerms);
      renderNegotiationTab();
      showToast('info', '已驳回反提案', '原提案已恢复为待响应状态');
    }

    // 撤回已达成条款（协议未签署前可撤回）→ 恢复为待响应
    function revokeAgreedTerms(proposalId) {
      if (!currentDeal) return;
      var proposal = findProposalById(proposalId);
      if (!proposal || proposal.status !== 'agreed') {
        showToast('warning', '无法撤回', '仅条款达成状态可撤回');
        return;
      }
      proposal.status = 'pending';
      // 清除合约通输出
      delete contractPayloadByDeal[currentDeal.id];
      saveContractPayloadState();
      // 恢复项目状态
      currentDeal.status = 'interested';
      var original = allDeals.find(function(d) { return d.id === currentDeal.id; });
      if (original) original.status = 'interested';
      localStorage.setItem('ec_allDeals', JSON.stringify(allDeals));
      saveNegotiationState();
      pushTimelineEvent('terms_revoked', '撤回方案 ' + proposal.id + ' 的条款达成，恢复为待响应', proposal.publicTerms);
      renderNegotiationTab();
      showToast('info', '条款达成已撤回', '方案恢复为待响应状态，可重新接受或继续谈判');
    }

    function submitNegotiationMemo(status) {
      if (status === 'confirmed') {
        var memo = upsertMemoFromForm('confirmed');
        if (!memo) return;
        pushTimelineEvent('memo_uploaded', '上传沟通纪要（已确认）（' + memo.id + '）', getPublicTermsFromWorkbench());
        renderMemoTab();
        showToast('success', '纪要已记录', memo.id + ' 已确认');
        return;
      }
      submitMemoForConfirmation();
    }

    function generateNegotiationInvite() {
      if (!currentDeal) return;
      var state = ensureNegotiationState();
      var role = (document.getElementById('negInviteRole') || {}).value || 'negotiator';
      var token = Math.random().toString(36).slice(2, 10);
      var expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      state.invite = {
        role: role,
        link: 'https://deal-connect.local/invite/' + token,
        expiresAt: expiresAt
      };
      saveNegotiationState();
      pushTimelineEvent('invite_created', '创建协作邀请（' + (role === 'negotiator' ? '谈判者' : '观察者') + '）', getPublicTermsFromWorkbench());
      renderNegotiationTab();
      showToast('success', '邀请链接已生成', '有效期至 ' + expiresAt.slice(0, 10));
    }

    // ---- 时间线 ----
    function getTimelineTypeMeta(type) {
      var map = {
        intent_submitted: { label: '提交意向', category: 'intent' },
        intent_updated: { label: '修改意向', category: 'intent' },
        intent_accepted: { label: '意向接受', category: 'intent' },
        intent_rejected: { label: '意向拒绝', category: 'intent' },
        draft_saved: { label: '保存草稿', category: 'proposal' },
        proposal_submitted: { label: '提交方案', category: 'proposal' },
        proposal_edited: { label: '修改方案', category: 'proposal' },
        proposal_accepted: { label: '方案接受', category: 'proposal' },
        proposal_rejected: { label: '方案拒绝', category: 'proposal' },
        proposal_countered: { label: '反提案', category: 'proposal' },
        proposal_withdrawn: { label: '撤回方案', category: 'proposal' },
        counter_withdrawn: { label: '撤回反提案', category: 'proposal' },
        counter_accepted: { label: '接受反提案', category: 'proposal' },
        counter_rejected: { label: '驳回反提案', category: 'proposal' },
        timeline_reloaded: { label: '回填历史版本', category: 'proposal' },
        terms_confirmed: { label: '条款达成', category: 'proposal' },
        terms_revoked: { label: '撤回条款', category: 'proposal' },
        memo_uploaded: { label: '上传纪要', category: 'memo' },
        memo_draft_saved: { label: '保存备忘录草稿', category: 'memo' },
        memo_submitted: { label: '提交备忘录确认', category: 'memo' },
        memo_confirm_progress: { label: '单方确认进度', category: 'memo' },
        memo_confirmed: { label: '备忘录已确认', category: 'memo' },
        memo_rejected: { label: '备忘录已拒绝', category: 'memo' },
        memo_revised: { label: '备忘录已修订', category: 'memo' },
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
      var allEvents = getTimelineEventsForCurrentDeal();
      var filterEl = document.getElementById('timelineFilterType');
      var filterVal = filterEl ? filterEl.value : 'all';
      var filteredEvents = allEvents.filter(function(e) {
        if (filterVal === 'all') return true;
        return getTimelineTypeMeta(e.type).category === filterVal;
      });

      var proposalCount = allEvents.filter(function(e) { return getTimelineTypeMeta(e.type).category === 'proposal'; }).length;
      var memoCount = allEvents.filter(function(e) { return getTimelineTypeMeta(e.type).category === 'memo'; }).length;
      setText('timelineCountAll', String(allEvents.length));
      setText('timelineCountProposal', String(proposalCount));
      setText('timelineCountMemo', String(memoCount));
      setText('timelineLastAt', allEvents[0] && allEvents[0].at ? allEvents[0].at.slice(0, 16).replace('T', ' ') : '--');

      var list = document.getElementById('timelineList');
      if (!list) return;
      if (!filteredEvents.length) {
        list.textContent = '暂无符合筛选条件的时间线事件。';
        return;
      }

      list.innerHTML = filteredEvents.map(function(e) {
        var meta = getTimelineTypeMeta(e.type);
        var terms = e.publicTerms ? formatTermsInline(e.publicTerms) : '无公共参数';
        var actor = (e.actor || '我方') + '（' + (e.role || 'investor') + '）';
        var at = e.at ? e.at.slice(0, 19).replace('T', ' ') : '--';
        return '<div class="p-3 rounded-xl border border-gray-100 bg-gray-50">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<div class="flex items-center gap-2"><span class="text-[11px] px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">' + meta.label + '</span><span class="text-xs text-gray-500">' + at + '</span></div>' +
            (e.publicTerms ? '<button onclick="loadTimelineTermsToWorkbench(\'' + e.id + '\')" class="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-700 hover:bg-white">基于此版修改</button>' : '') +
          '</div>' +
          '<p class="text-xs text-gray-700 mb-1">操作人：' + actor + '</p>' +
          '<p class="text-xs text-gray-700 mb-1">摘要：' + (e.summary || '无') + '</p>' +
          '<p class="text-xs text-gray-500">公共参数：' + terms + '</p>' +
        '</div>';
      }).join('');
    }

    function loadTimelineTermsToWorkbench(eventId) {
      if (!currentDeal) return;
      var events = getTimelineEventsForCurrentDeal();
      var event = events.find(function(e) { return e.id === eventId; });
      if (!event || !event.publicTerms) {
        showToast('warning', '无法加载版本', '该事件无公共参数快照');
        return;
      }
      applyPublicTermsToWorkbench(event.publicTerms);
      pushTimelineEvent('timeline_reloaded', '基于时间线事件 ' + eventId + ' 回填条款参数', event.publicTerms);
      showToast('success', '已回填到工作台', '你可以在条款工作台继续修改并提交');
      switchSessionTab('workbench');
    }
