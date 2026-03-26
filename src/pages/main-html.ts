export const MAIN_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>参与通 Deal Connect</title>
  <meta name="description" content="参与通 Deal Connect — 投资者的智能机会看板。基于评估通AI筛子，精准匹配发起通项目。">
  <meta name="theme-color" content="#0a2e2a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='url(%23g)'/%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='64' y2='64'%3E%3Cstop offset='0%25' stop-color='%232EC4B6'/%3E%3Cstop offset='100%25' stop-color='%2328A696'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M20 20 L44 32 L20 44 Z' fill='white' opacity='0.95'/%3E%3C/svg%3E">
  <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
  <link rel="preconnect" href="https://cdn.tailwindcss.com" crossorigin>
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
  <link href="/static/base.css" rel="stylesheet">
</head>
<body class="bg-gray-50 min-h-screen">

  <!-- ==================== Loading Screen ==================== -->
  <div id="app-loading">
    <div style="width:56px; height:72px; position:relative; margin-bottom:8px;">
      <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #2EC4B6 0%, #3DD8CA 100%); position:absolute; top:0; left:4px; box-shadow: 0 4px 20px rgba(46,196,182,0.4); animation: pulse 2s ease-in-out infinite;"></div>
      <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #28A696 0%, #2EC4B6 100%); position:absolute; bottom:0; left:4px; box-shadow: 0 4px 20px rgba(40,166,150,0.35); opacity:0.85; animation: pulse 2s ease-in-out infinite 0.3s;"></div>
    </div>
    <div class="loading-text" style="font-family:'Montserrat',sans-serif; font-weight:900; letter-spacing:0.05em;">DEAL CONNECT</div>
    <div class="loading-sub" style="font-size:14px; letter-spacing:0.15em; margin-top:4px;">参与通</div>
    <div class="loading-sub" id="loadingStatus" style="margin-top:12px;">正在初始化...</div>
    <div style="width: 200px; height: 3px; background: rgba(255,255,255,0.15); border-radius: 99px; margin-top: 16px; overflow: hidden;">
      <div id="loadingBar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #2EC4B6, #3DD8CA); border-radius: 99px; transition: width 0.4s ease;"></div>
    </div>
    <div style="margin-top:24px; font-size:9px; letter-spacing:0.2em; color:rgba(255,255,255,0.4); font-family:'Montserrat',sans-serif;">POWERED BY MICRO CONNECT GROUP</div>
  </div>

  <!-- ==================== Onboarding Modal ==================== -->
  <div id="onboardingModal" class="hidden fixed inset-0 bg-black/60 onboarding-modal flex items-center justify-center z-[300]">
    <div class="onboarding-card bg-white rounded-3xl max-w-2xl w-full mx-4 overflow-hidden">
      <div class="relative h-48 overflow-hidden" style="background: linear-gradient(135deg, #5DC4B3 0%, #49A89A 50%, #32ade6 100%);">
        <div class="absolute inset-0 pattern-bg"></div>
        <button onclick="closeOnboarding()" class="absolute top-4 right-4 z-20 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"><i class="fas fa-times"></i></button>
        <div class="absolute bottom-4 left-1/2 z-20 transform -translate-x-1/2 flex space-x-2">
          <button onclick="goToOBStep(0)" class="step-dot w-2.5 h-2.5 rounded-full bg-white/50 active" data-step="0"></button>
          <button onclick="goToOBStep(1)" class="step-dot w-2.5 h-2.5 rounded-full bg-white/50" data-step="1"></button>
          <button onclick="goToOBStep(2)" class="step-dot w-2.5 h-2.5 rounded-full bg-white/50" data-step="2"></button>
          <button onclick="goToOBStep(3)" class="step-dot w-2.5 h-2.5 rounded-full bg-white/50" data-step="3"></button>
        </div>
        <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div class="animate-float"><div class="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center"><i id="obIcon" class="fas fa-filter text-white text-4xl"></i></div></div>
        </div>
      </div>
      <div class="p-8 relative overflow-hidden" style="min-height: 280px;">
        <!-- Step 0: 欢迎 -->
        <div id="obStep0" class="ob-step active text-center">
          <h2 class="text-2xl font-bold text-gray-900 mb-3">欢迎使用参与通</h2>
          <p class="text-gray-500 mb-8">投资者的智能机会看板 — 精准匹配，高效参与</p>
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="p-4 bg-amber-50 rounded-2xl"><div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-paper-plane text-amber-600 text-xl"></i></div><p class="text-sm font-medium text-gray-700">发起通</p><p class="text-xs text-gray-400 mt-1">机会来源</p></div>
            <div class="p-4 bg-cyan-50 rounded-2xl"><div class="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-filter text-cyan-600 text-xl"></i></div><p class="text-sm font-medium text-gray-700">评估通筛子</p><p class="text-xs text-gray-400 mt-1">AI精筛</p></div>
            <div class="p-4 bg-teal-50 rounded-2xl"><div class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-hand-pointer text-teal-600 text-xl"></i></div><p class="text-sm font-medium text-gray-700">参与决策</p><p class="text-xs text-gray-400 mt-1">你的选择</p></div>
          </div>
        </div>
        <!-- Step 1: 发起通来源 -->
        <div id="obStep1" class="ob-step" style="display:none;">
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0"><div class="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200"><i class="fas fa-paper-plane text-white text-2xl"></i></div></div>
            <div class="flex-1"><span class="text-xs font-semibold text-amber-600 uppercase tracking-wide">数据来源</span><h3 class="text-xl font-bold text-gray-900 mt-1 mb-3">机会来自发起通</h3><p class="text-gray-500 mb-4">融资方通过「发起通」上传经营数据、商业计划，生成标准化的投资机会。这些机会经过平台初筛后流入参与通。</p>
              <div class="flex items-center space-x-4 text-sm"><div class="flex items-center text-gray-400"><i class="fas fa-check-circle text-amber-500 mr-2"></i><span>标准化数据</span></div><div class="flex items-center text-gray-400"><i class="fas fa-check-circle text-amber-500 mr-2"></i><span>实时更新</span></div></div>
            </div>
          </div>
        </div>
        <!-- Step 2: 评估通筛子 -->
        <div id="obStep2" class="ob-step" style="display:none;">
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0"><div class="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200"><i class="fas fa-filter text-white text-2xl"></i></div></div>
            <div class="flex-1"><span class="text-xs font-semibold text-cyan-600 uppercase tracking-wide">智能筛选</span><h3 class="text-xl font-bold text-gray-900 mt-1 mb-3">评估通提供AI筛子</h3><p class="text-gray-500 mb-4">评估通内置多种AI筛选模型（筛子），每个筛子有不同的评估标准。选择筛子后，只展示通过该筛子的项目；不选则看到全部。</p>
              <div class="flex flex-wrap gap-2">
                <span class="sieve-chip active"><i class="fas fa-brain"></i>行业偏好</span>
                <span class="sieve-chip"><i class="fas fa-shield-alt"></i>风控优先</span>
                <span class="sieve-chip"><i class="fas fa-chart-line"></i>高回报</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Step 3: 参与决策 -->
        <div id="obStep3" class="ob-step" style="display:none;">
          <div class="flex items-start space-x-6">
            <div class="flex-shrink-0"><div class="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200"><i class="fas fa-hand-pointer text-white text-2xl"></i></div></div>
            <div class="flex-1"><span class="text-xs font-semibold text-teal-600 uppercase tracking-wide">投资参与</span><h3 class="text-xl font-bold text-gray-900 mt-1 mb-3">筛后精准参与</h3><p class="text-gray-500 mb-4">在筛后的高质量机会中，查看详细评估报告、对比项目，对心仪项目表达参与意向。后续流入条款通和合约通。</p>
              <div class="flex items-center space-x-3">
                <div class="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium"><i class="fas fa-eye mr-1"></i>浏览筛后</div>
                <i class="fas fa-arrow-right text-gray-300"></i>
                <div class="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium"><i class="fas fa-hand-point-up mr-1"></i>表达意向</div>
                <i class="fas fa-arrow-right text-gray-300"></i>
                <div class="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-sm font-medium"><i class="fas fa-file-contract mr-1"></i>进入条款</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="px-8 pb-8 flex items-center justify-between">
        <button onclick="closeOnboarding()" class="text-sm text-gray-400 hover:text-gray-600 transition-colors">跳过教程</button>
        <div class="flex items-center space-x-3">
          <button id="obPrev" onclick="obPrev()" class="hidden px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all"><i class="fas fa-arrow-left mr-2"></i>上一步</button>
          <button id="obNext" onclick="obNext()" class="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-200 transition-all font-medium">开始探索<i class="fas fa-arrow-right ml-2"></i></button>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== Page 0: Login / Register ==================== -->
  <div id="pageAuth" class="page active flex-col min-h-screen cyber-bg particles-bg">
    <div class="flex-1 flex items-center justify-center p-4 relative z-10">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden animate-scale-in" style="box-shadow: 0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08);">
        <div class="p-8 text-center" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
          <div class="mx-auto mb-5 animate-float" style="width:52px; height:68px; position:relative;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #2EC4B6 0%, #3DD8CA 100%); position:absolute; top:0; left:4px; box-shadow: 0 4px 16px rgba(46,196,182,0.35);"></div>
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #28A696 0%, #2EC4B6 100%); position:absolute; bottom:0; left:4px; box-shadow: 0 4px 16px rgba(40,166,150,0.3); opacity:0.85;"></div>
          </div>
          <h1 style="font-family:'Montserrat',sans-serif; font-weight:900; font-size:22px; letter-spacing:0.04em; color:#1a1a1a; line-height:1.15; margin-bottom:6px;">DEAL<br>CONNECT</h1>
          <div style="width:120px; height:2.5px; background:#2EC4B6; margin:8px auto 10px; border-radius:2px;"></div>
          <p style="font-family:'Montserrat',sans-serif; font-size:9px; letter-spacing:0.2em; color:#666; font-weight:500;">POWERED BY MICRO CONNECT GROUP</p>
          <p class="text-lg font-bold mt-3" style="color:#1a1a1a;">参与通</p>
          <p class="text-xs text-gray-400 mt-1">投资者的智能机会看板</p>
        </div>
        <div class="flex" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
          <button onclick="switchAuthTab('login')" id="tabLogin" class="flex-1 py-3 text-center font-semibold" style="color:#2EC4B6; border-bottom: 2px solid #2EC4B6;">登录</button>
          <button onclick="switchAuthTab('register')" id="tabRegister" class="flex-1 py-3 text-center font-semibold" style="color:#86868b;">注册</button>
        </div>
        <!-- Login Form -->
        <div id="formLogin" class="p-6">
          <form onsubmit="event.preventDefault(); handleLogin();" autocomplete="on">
          <div class="space-y-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">用户名 / 邮箱</label><input type="text" id="loginUsername" placeholder="请输入用户名或邮箱" autocomplete="username" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" onkeydown="if(event.key==='Enter')document.getElementById('loginPassword').focus()"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">密码</label><div class="password-wrapper" style="position:relative;"><input type="password" id="loginPassword" placeholder="请输入密码" autocomplete="current-password" class="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"><button type="button" onclick="togglePwdVis('loginPassword', this)" class="password-toggle" tabindex="-1" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#9ca3af;cursor:pointer;padding:4px;"><i class="fas fa-eye"></i></button></div></div>
            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center text-gray-600 cursor-pointer whitespace-nowrap"><input type="checkbox" id="rememberMe" class="mr-2 rounded" style="width:16px;height:16px;flex-shrink:0;"><span>记住我</span></label>
              <a href="#" class="text-teal-600 hover:text-teal-700" onclick="event.preventDefault(); showToast('info','密码重置','此功能即将上线')">忘记密码？</a>
            </div>
            <button type="submit" class="w-full py-3 btn-primary rounded-xl font-medium shadow-lg"><i class="fas fa-sign-in-alt mr-2"></i>登录</button>
            <button type="button" onclick="handleGuestLogin()" class="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"><i class="fas fa-user-secret mr-2"></i>游客模式（体验功能）</button>
          </div>
          <p id="loginError" class="hidden mt-4 text-sm text-red-500 text-center"></p>
          </form>
          <div class="mt-6 pt-6 border-t border-gray-100">
            <p class="text-xs text-gray-400 text-center mb-3">企业用户</p>
            <button onclick="showToast('info','SSO登录即将上线','企业统一认证接口已预留')" class="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"><i class="fas fa-building mr-2"></i>公司SSO登录（即将上线）</button>
          </div>
        </div>
        <!-- Register Form -->
        <div id="formRegister" class="hidden p-6">
          <form onsubmit="event.preventDefault(); handleRegister();" autocomplete="on">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-sm font-medium text-gray-700 mb-1">用户名 <span class="text-red-500">*</span></label><input type="text" id="regUsername" placeholder="用于登录" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"></div>
              <div><label class="block text-sm font-medium text-gray-700 mb-1">姓名</label><input type="text" id="regDisplayName" placeholder="显示名称" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"></div>
            </div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">邮箱 <span class="text-red-500">*</span></label><input type="email" id="regEmail" placeholder="your@email.com" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">手机号</label><input type="tel" id="regPhone" placeholder="13800138000" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">密码 <span class="text-red-500">*</span></label><div class="password-wrapper" style="position:relative;"><input type="password" id="regPassword" placeholder="至少6位" autocomplete="new-password" class="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"><button type="button" onclick="togglePwdVis('regPassword', this)" class="password-toggle" tabindex="-1" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#9ca3af;cursor:pointer;padding:4px;"><i class="fas fa-eye"></i></button></div></div>
            <button type="submit" class="w-full py-3 btn-primary rounded-xl font-medium shadow-lg"><i class="fas fa-user-plus mr-2"></i>注册</button>
          </div>
          <p id="regError" class="hidden mt-4 text-sm text-red-500 text-center"></p>
          </form>
        </div>
        <div class="px-6 pb-4 text-center"><p class="text-xs text-gray-400">&copy; 2026 参与通 Deal Connect · Micro Connect Group</p></div>
      </div>
    </div>
  </div>

  <!-- ==================== Page 1: Dashboard (投资者看板) ==================== -->
  <div id="pageDashboard" class="page flex-col min-h-screen grid-bg">
    <!-- Navbar -->
    <nav class="px-5 py-3">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div style="width:32px; height:36px; position:relative; flex-shrink:0;">
            <div style="width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #2EC4B6, #3DD8CA); position:absolute; top:0; left:3px;"></div>
            <div style="width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg, #28A696, #2EC4B6); position:absolute; bottom:0; left:3px; opacity:0.85;"></div>
          </div>
          <div>
            <h1 class="text-base font-bold tracking-tight" style="color:#1a1a1a;">参与通</h1>
            <p class="text-xs -mt-0.5" style="color:#86868b; font-family:'Montserrat',sans-serif; letter-spacing:0.05em; font-weight:600; font-size:9px;">DEAL CONNECT</p>
          </div>
        </div>
        <div class="flex items-center space-x-1.5">
          <button onclick="showOnboarding()" class="tooltip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all" style="color: #6b7280; background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);" data-tip="新手引导"><i class="fas fa-question-circle text-xs"></i><span>帮助</span></button>
          <div class="h-5 mx-0.5" style="width: 1px; background: rgba(0,0,0,0.08);"></div>
          <button id="perspectiveToggleBtn" onclick="togglePerspective()" class="tooltip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all" style="color: #a16207; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.16);" data-tip="视角切换"><i id="perspectiveToggleIcon" class="fas fa-arrows-rotate text-xs"></i><span id="perspectiveToggleText">切换融资方视角</span></button>
          <button id="aiRecommendBtn" onclick="showToast('info','AI推荐引擎','正在基于您的筛子偏好生成推荐')" class="tooltip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all" style="color: #49A89A; background: rgba(93,196,179,0.06); border: 1px solid rgba(93,196,179,0.12);" data-tip="AI推荐"><i class="fas fa-robot"></i><span>推荐</span></button>
          <!-- User avatar -->
          <div class="pl-1.5 ml-0.5 relative">
            <button onclick="toggleUserDD(event)" id="navUserBtn" class="flex items-center space-x-2 px-2 py-1.5 rounded-full transition-all" style="background: rgba(0,0,0,0.02);" onmouseover="this.style.background='rgba(93,196,179,0.08)'" onmouseout="this.style.background='rgba(0,0,0,0.02)'">
              <div id="navAvatar" class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background: linear-gradient(135deg, #5DC4B3, #3D8F83); box-shadow: 0 2px 8px rgba(93,196,179,0.3);">U</div>
              <span id="navName" class="text-xs font-semibold max-w-[70px] truncate" style="color: #374151;">用户</span>
              <i class="fas fa-chevron-down text-xs" style="color: #9ca3af; font-size: 10px;"></i>
            </button>
            <div id="userDropdown" class="user-dropdown">
              <div class="user-dropdown-header"><div class="flex items-center space-x-3"><div id="ddAvatar" class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style="background: linear-gradient(135deg, #5DC4B3, #3D8F83);">U</div><div><div id="ddName" class="font-semibold text-gray-900 text-sm">用户</div><div id="ddRole" class="text-xs text-gray-500">投资者</div></div></div></div>
              <div class="py-1">
                <button class="user-dropdown-item" onclick="showToast('info','个人中心','功能开发中'); closeUserDD();"><i class="fas fa-user-circle"></i>个人中心</button>
                <button class="user-dropdown-item investor-only" onclick="showToast('info','筛子偏好','可在评估通中管理您的筛子模型'); closeUserDD();"><i class="fas fa-sliders-h"></i>筛子偏好设置</button>
                <button class="user-dropdown-item" onclick="showOnboarding(); closeUserDD();"><i class="fas fa-graduation-cap"></i>新手引导</button>
                <div class="user-dropdown-divider"></div>
                <button class="user-dropdown-item danger" onclick="closeUserDD(); handleLogout();"><i class="fas fa-sign-out-alt"></i>退出登录</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div id="dashboardContentSurface" class="flex-1 p-4">
      <div class="max-w-7xl mx-auto">
        <!-- Hero Banner -->
        <div id="dashboardHero" class="relative overflow-hidden rounded-2xl mb-5 p-6" style="background: linear-gradient(135deg, #0a2e2a 0%, #0f3d36 40%, #164e47 100%);">
          <div id="dashboardHeroGlow" class="absolute inset-0" style="background: radial-gradient(ellipse at 70% 30%, rgba(93,196,179,0.35) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(46,196,182,0.2) 0%, transparent 50%); pointer-events:none;"></div>
          <div class="relative z-10 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white mb-1" style="letter-spacing: -0.02em;" id="welcomeText">欢迎回来</h2>
              <p id="heroSubtitle" class="text-sm" style="color: rgba(255,255,255,0.6);">发起通的投资机会，经您的评估通筛子精选后展示于此</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right hidden sm:block">
                <p class="text-xs" style="color:rgba(255,255,255,0.4);">数据来源</p>
                <p class="text-sm font-semibold text-amber-300"><i class="fas fa-paper-plane mr-1"></i>发起通 Originate</p>
              </div>
              <div class="investor-only w-px h-10 bg-white/10 hidden sm:block"></div>
              <div class="investor-only text-right hidden sm:block">
                <p class="text-xs" style="color:rgba(255,255,255,0.4);">筛选引擎</p>
                <p class="text-sm font-semibold text-cyan-300"><i class="fas fa-filter mr-1"></i>评估通 Assess</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div class="stat-card animate-fade-in cursor-pointer" onclick="showAllDeals()">
            <div class="flex items-center justify-between"><div><p class="stat-label">全部机会</p><p class="stat-value" id="statTotal">0</p><p class="text-xs text-gray-400 mt-0.5">来自发起通</p></div><div class="icon-container icon-container-sm" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 4px 12px rgba(245,158,11,0.3);"><i class="fas fa-paper-plane text-white text-sm"></i></div></div>
          </div>
          <div class="stat-card investor-only animate-fade-in delay-100 cursor-pointer" onclick="showAllDeals()">
            <div class="flex items-center justify-between"><div><p class="stat-label">筛后通过</p><p class="stat-value" id="statFiltered">0</p><p class="text-xs text-gray-400 mt-0.5">当前筛子匹配</p></div><div class="icon-container icon-container-sm" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); box-shadow: 0 4px 12px rgba(6,182,212,0.3);"><i class="fas fa-filter text-white text-sm"></i></div></div>
          </div>
          <div class="stat-card animate-fade-in delay-200 cursor-pointer" onclick="filterByStatus('interested')">
            <div class="flex items-center justify-between"><div><p class="stat-label">已表达意向</p><p class="stat-value" id="statInterested">0</p></div><div class="icon-container icon-container-sm icon-gradient-warning"><i class="fas fa-hand-point-up text-white text-sm"></i></div></div>
          </div>
          <div class="stat-card animate-fade-in delay-300 cursor-pointer" onclick="filterByStatus('confirmed')">
            <div class="flex items-center justify-between"><div><p class="stat-label">已确认参与</p><p class="stat-value" id="statConfirmed">0</p></div><div class="icon-container icon-container-sm icon-gradient-success"><i class="fas fa-check-double text-white text-sm"></i></div></div>
          </div>
        </div>

        <!-- ===== 筛子选择器 (核心新功能) ===== -->
        <div class="investor-only bg-white rounded-2xl p-4 mb-4 border border-gray-100" style="box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, rgba(6,182,212,0.12), rgba(14,165,233,0.12));"><i class="fas fa-filter text-cyan-600 text-sm"></i></div>
              <div>
                <h3 class="text-sm font-bold text-gray-800">评估通 · AI筛子</h3>
                <p class="text-xs text-gray-400">选择筛子模型过滤机会，不选则展示全部</p>
              </div>
            </div>
            <button onclick="showSieveManager()" class="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-cyan-50 transition-colors"><i class="fas fa-cogs mr-1"></i>管理筛子</button>
          </div>
          <div class="flex flex-wrap gap-2" id="sieveSelector">
            <!-- 动态渲染 by renderSieveSelector() -->
          </div>
          <!-- 筛子说明 -->
          <div id="sieveDescription" class="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 hidden">
            <i class="fas fa-info-circle text-cyan-500 mr-1"></i>
            <span id="sieveDescText">选择筛子后查看说明</span>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <h2 id="dashboardListTitle" class="text-base font-bold text-gray-800">投资机会</h2>
            <span id="filterLabel" class="text-xs text-gray-400 font-medium">· 展示全部</span>
          </div>
          <div class="flex items-center gap-2">
            <div id="dashboardViewModeGroup" class="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
              <button id="viewModeStore" onclick="setDashboardViewMode('store')" class="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-50 text-teal-700">项目视图</button>
              <button id="viewModeBrand" onclick="setDashboardViewMode('brand')" class="px-2.5 py-1 text-xs font-semibold rounded-md text-gray-600 hover:bg-gray-50">品牌视图</button>
            </div>
            <div class="relative">
              <input type="text" id="dealSearch" placeholder="搜索公司/品牌/项目/行业/地区" class="search-input px-3 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs bg-white w-56" oninput="renderDeals(); updateDealSearchClearBtn();">
              <button id="dealSearchClear" onclick="clearDealSearch()" class="hidden absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs leading-none" aria-label="清空搜索">
                <i class="fas fa-times-circle"></i>
              </button>
            </div>
            <select class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" id="filterIndustry" onchange="renderDeals()">
              <option value="all">全部行业</option>
              <option value="餐饮">餐饮</option>
              <option value="零售">零售</option>
              <option value="演艺">演艺</option>
              <option value="教育">教育</option>
              <option value="健康">健康</option>
              <option value="科技">科技</option>
            </select>
            <select class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" id="filterStatus" onchange="renderDeals()">
              <option value="all">全部状态</option>
              <option value="open">待参与</option>
              <option value="interested">已意向</option>
              <option value="confirmed">已确认</option>
              <option value="closed">已关闭</option>
              <option value="skipped">已跳过</option>
            </select>
            <select class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" id="sortBy" onchange="renderDeals()">
              <option value="push_desc">按推送时间</option>
              <option value="score_desc">按AI评分</option>
              <option value="amount_desc">按金额(高到低)</option>
              <option value="amount_asc">按金额(低到高)</option>
            </select>
          </div>
        </div>
        <p id="kybHintLine" class="text-[11px] text-gray-400 mb-3"><i class="fas fa-shield-check mr-1 dashboard-kyb-hint-icon text-teal-500"></i>资产定向搜索仅匹配 KYB 已认证项目</p>

        <!-- Deal Grid -->
        <div id="dealGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"></div>

        <!-- Empty State -->
        <div id="emptyState" class="hidden py-6 animate-fade-in">
          <div class="max-w-3xl mx-auto">
            <div class="text-center mb-6">
              <div class="empty-state-icon mx-auto animate-float"><i class="fas fa-filter"></i></div>
              <h3 class="text-xl font-bold text-gray-800 mb-2" style="letter-spacing:-0.02em;">等待发起通的投资机会</h3>
              <p id="emptyStateSubtitle" class="text-sm text-gray-500">机会由融资方通过发起通上传，经评估通筛子过滤后展示于此</p>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <button onclick="loadDemoData()" class="group text-left p-5 rounded-2xl border transition-all" style="background: rgba(255,255,255,0.9); border-color: rgba(0,0,0,0.06);" onmouseover="this.style.borderColor='rgba(52,199,89,0.3)';this.style.boxShadow='0 8px 32px rgba(52,199,89,0.08)';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(0,0,0,0.06)';this.style.boxShadow='none';this.style.transform='none'">
                <div class="w-12 h-12 icon-container icon-container-lg icon-gradient-success mb-4 group-hover:scale-105 transition-transform" style="border-radius:16px;"><i class="fas fa-database text-white text-lg"></i></div>
                <h4 class="font-bold text-gray-800 mb-1 text-base">加载演示数据</h4>
                <p class="text-sm text-gray-500 leading-relaxed">体验完整功能，查看模拟的发起通项目经筛子过滤后的效果</p>
              </button>
              <div class="investor-only text-left p-5 rounded-2xl border" style="background: rgba(255,255,255,0.9); border-color: rgba(0,0,0,0.06);">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style="background: linear-gradient(135deg, rgba(6,182,212,0.12), rgba(14,165,233,0.12));"><i class="fas fa-filter text-cyan-600 text-lg"></i></div>
                <h4 class="font-bold text-gray-800 mb-1 text-base">配置您的筛子</h4>
                <p class="text-sm text-gray-500 leading-relaxed">在评估通中设置您的AI筛选标准，让参与通自动展示匹配机会</p>
              </div>
            </div>
            <div class="investor-only rounded-2xl p-5 border" style="background: rgba(255,255,255,0.8); border-color: rgba(0,0,0,0.04);">
              <h4 class="text-xs font-bold uppercase tracking-wider mb-4" style="color: #86868b;"><i class="fas fa-route mr-1.5" style="color: #5DC4B3;"></i>数据流向</h4>
              <div class="flex items-center justify-center gap-3 flex-wrap">
                <div class="flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-xl"><i class="fas fa-paper-plane text-amber-500"></i><span class="text-sm font-semibold text-amber-700">发起通</span></div>
                <i class="fas fa-long-arrow-alt-right text-gray-300"></i>
                <div class="flex items-center gap-2 px-4 py-2.5 bg-cyan-50 rounded-xl"><i class="fas fa-filter text-cyan-500"></i><span class="text-sm font-semibold text-cyan-700">评估通筛子</span></div>
                <i class="fas fa-long-arrow-alt-right text-gray-300"></i>
                <div class="flex items-center gap-2 px-4 py-2.5 bg-teal-50 rounded-xl border-2 border-teal-200"><i class="fas fa-hand-pointer text-teal-500"></i><span class="text-sm font-bold text-teal-700">参与通（此页）</span></div>
                <i class="fas fa-long-arrow-alt-right text-gray-300"></i>
                <div class="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl"><i class="fas fa-file-contract text-gray-400"></i><span class="text-sm font-semibold text-gray-500">条款通</span></div>
              </div>
            </div>
            <p class="mt-4 text-xs text-gray-400"><i class="fas fa-question-circle mr-1"></i>首次使用？<button onclick="showOnboarding()" class="text-teal-500 hover:text-teal-600 underline font-medium">查看新手引导</button></p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== Page 2: Project Session ==================== -->
  <div id="pageProjectSession" class="page flex-col h-screen grid-bg">
    <nav class="px-4 py-2.5 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <button onclick="goToDashboard()" class="back-btn flex items-center px-2.5 py-1.5 text-gray-600 hover:text-teal-600 rounded-lg text-sm"><i class="fas fa-arrow-left mr-1.5"></i><span class="font-medium">返回看板</span></button>
          <div class="border-l border-gray-200 pl-3">
            <div class="flex items-center space-x-2"><h1 class="font-bold text-gray-900 text-sm" id="detailTitle">项目名称</h1><span id="detailStatus" class="badge badge-warning">待参与</span></div>
            <p class="text-xs text-gray-500"><span class="source-tag source-originate"><i class="fas fa-paper-plane"></i>发起通</span> <span id="detailIndustry">行业</span> · <span id="detailDate">日期</span></p>
          </div>
        </div>
        <div class="flex items-center space-x-1.5">
          <button id="detailPerspectiveBtn" onclick="togglePerspective()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style="color:#a16207;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.16)">
            <i id="detailPerspectiveIcon" class="fas fa-arrows-rotate text-xs"></i>
            <span id="detailPerspectiveText">切换融资方视角</span>
          </button>
          <div class="w-px h-6 bg-gray-200 mx-1"></div>
          <button onclick="showToast('info','分享','分享链接已复制')" class="tooltip p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 text-sm" data-tip="分享"><i class="fas fa-share-alt"></i></button>
          <button onclick="showToast('info','收藏','已添加到收藏夹')" class="tooltip p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 text-sm" data-tip="收藏"><i class="fas fa-bookmark"></i></button>
          <div class="w-px h-6 bg-gray-200 mx-1"></div>
          <button onclick="expressIntent()" id="btnExpressIntent" class="investor-only btn-primary text-xs py-1.5 px-4" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);"><i class="fas fa-hand-point-up mr-1"></i>我要参与</button>
        </div>
      </div>
    </nav>

    <!-- Session Tabs -->
    <div class="px-4 pb-2 flex-shrink-0">
      <div class="max-w-7xl mx-auto bg-white rounded-xl border border-gray-100 p-1 flex flex-wrap gap-1">
        <button id="sessionTabBtn-research" onclick="switchSessionTab('research')" class="session-tab-btn px-3 py-2 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700">
          <i class="fas fa-book-open mr-1"></i>做功课
        </button>
        <button id="sessionTabBtn-forecast" onclick="switchSessionTab('forecast')" class="session-tab-btn px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <i class="fas fa-chart-line mr-1"></i>营业额预估
        </button>
        <button id="sessionTabBtn-workbench" onclick="switchSessionTab('workbench')" class="session-tab-btn px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <i class="fas fa-sliders-h mr-1"></i>条款工作台
        </button>
        <button id="sessionTabBtn-intent" onclick="switchSessionTab('intent')" class="session-tab-btn px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <i class="fas fa-hand-point-up mr-1"></i>意向处理
        </button>
        <button id="sessionTabBtn-negotiation" onclick="switchSessionTab('negotiation')" class="session-tab-btn px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <i class="fas fa-folder-open mr-1"></i>方案管理
        </button>
        <button id="sessionTabBtn-memo" onclick="switchSessionTab('memo')" class="session-tab-btn px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <i class="fas fa-file-lines mr-1"></i>沟通备忘录
        </button>
        <button id="sessionTabBtn-timeline" onclick="switchSessionTab('timeline')" class="session-tab-btn px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <i class="fas fa-stream mr-1"></i>时间线
        </button>
      </div>
    </div>

    <!-- Tab: 做功课 -->
    <div id="sessionTab-research" class="flex flex-1 overflow-hidden">
      <div id="researchLeftPanel" class="w-2/5 border-r border-gray-200 flex flex-col bg-white overflow-y-auto">
        <div class="p-5" id="detailLeft">
          <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p class="text-sm">加载中...</p></div>
        </div>
      </div>
      <div class="w-3/5 flex flex-col bg-slate-50 overflow-y-auto">
        <div class="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <div class="flex items-center space-x-2"><span class="text-sm font-semibold text-gray-700"><i class="fas fa-book-open mr-1.5 text-cyan-500"></i>做功课工作台</span></div>
          <div class="flex bg-gray-100 rounded-lg p-0.5">
            <button onclick="switchDetailView('onepager')" id="btnOnepager" class="px-2.5 py-1 rounded-md text-xs font-semibold bg-white shadow text-teal-600"><i class="fas fa-file-lines mr-1"></i>一页纸</button>
            <button onclick="switchDetailView('comparables')" id="btnComparables" class="px-2.5 py-1 rounded-md text-xs font-semibold text-gray-600"><i class="fas fa-scale-balanced mr-1"></i>同行参考</button>
          </div>
        </div>
        <div class="flex-1 p-5" id="detailRight">
          <div class="text-center py-16 text-gray-400"><i class="fas fa-chart-area text-4xl mb-3 opacity-40"></i><p class="text-sm">选择一个项目开始做功课</p></div>
        </div>
      </div>
    </div>

    <!-- Tab: 营业额预估工作台 -->
    <div id="sessionTab-forecast" class="hidden flex-1 overflow-y-auto p-5">
      <div class="max-w-7xl mx-auto space-y-4">
        <div class="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 class="text-base font-bold text-gray-900 mb-2"><i class="fas fa-chart-line mr-2 text-teal-600"></i>营业额预估工作台</h3>
          <p class="text-sm text-gray-500">汇聚模型预估与融资方预估，支持自行填写，产出月均营业额供条款工作台使用。</p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 p-5">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-bold text-gray-800"><i class="fas fa-chart-area mr-1.5 text-cyan-500"></i>走势对比图</h4>
            <div class="flex gap-2">
              <button onclick="setFcChartRange('1y')" id="fcRange1y" class="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700">近1年</button>
              <button onclick="setFcChartRange('3y')" id="fcRange3y" class="px-2 py-0.5 rounded text-[10px] font-semibold text-gray-500">近3年</button>
              <button onclick="setFcChartRange('5y')" id="fcRange5y" class="px-2 py-0.5 rounded text-[10px] font-semibold text-gray-500">近5年</button>
            </div>
          </div>
          <div class="flex items-center gap-4 mb-3 text-[10px]">
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-1.5 rounded" style="background:#94a3b8;"></span>历史实际</span>
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-1.5 rounded" style="background:#14b8a6;"></span>模型预估</span>
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-1.5 rounded" style="background:#0ea5e9;"></span>融资方预估</span>
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-1.5 rounded" style="background:#f59e0b;"></span>我的填写</span>
          </div>
          <div id="fcChartContainer" class="h-48 relative overflow-hidden rounded-lg bg-gray-50 border border-gray-100 p-3">
            <div class="text-center py-12 text-gray-400"><i class="fas fa-chart-area text-3xl mb-2 opacity-40"></i><p class="text-sm">选择项目后展示走势图</p></div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl border border-gray-100 p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-gray-800"><i class="fas fa-robot mr-1.5 text-teal-500"></i>模型预估</h4>
              <span class="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-600">只读 · 5年</span>
            </div>
            <div id="fcSystemInfo" class="space-y-2">
              <p class="text-xs text-gray-400">选择项目后显示</p>
            </div>
            <button onclick="applyForecastToWb('system')" class="w-full mt-3 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700"><i class="fas fa-check mr-1"></i>采用模型预估</button>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-gray-800"><i class="fas fa-upload mr-1.5 text-cyan-500"></i>融资方预估</h4>
              <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-50 text-cyan-600">参与通内 · 3年</span>
            </div>
            <div id="fcBorrowerInfo" class="space-y-2">
              <p class="text-xs text-gray-400">选择项目后显示</p>
            </div>
            <button onclick="applyForecastToWb('borrower')" class="w-full mt-3 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"><i class="fas fa-check mr-1"></i>采用融资方预估</button>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-gray-800"><i class="fas fa-pen mr-1.5 text-amber-500"></i>自行填写</h4>
              <span class="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-600">可编辑</span>
            </div>
            <div class="space-y-3">
              <div class="flex bg-gray-100 rounded-lg p-0.5">
                <button onclick="setFcInputMode('quick')" id="fcModeQuick" class="flex-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-white shadow text-amber-700">快捷填写</button>
                <button onclick="setFcInputMode('monthly')" id="fcModeMonthly" class="flex-1 px-2 py-1 rounded-md text-[11px] font-semibold text-gray-500">逐月填写</button>
                <button onclick="setFcInputMode('yearly')" id="fcModeYearly" class="flex-1 px-2 py-1 rounded-md text-[11px] font-semibold text-gray-500">逐年填写</button>
              </div>
              <div id="fcInputQuick">
                <label class="block text-xs text-gray-500 mb-1">月均营业额预估（万）</label>
                <input id="fcQuickValue" type="text" inputmode="decimal" placeholder="例如 150" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="onFcQuickInput()">
              </div>
              <div id="fcInputMonthly" class="hidden">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs text-gray-500">逐月营业额（万）</label>
                  <select id="fcMonthlyYear" class="text-[11px] px-2 py-0.5 border border-gray-200 rounded bg-white" onchange="onFcMonthlyYearChange()"></select>
                </div>
                <div id="fcMonthlyGrid" class="grid grid-cols-4 gap-1.5"></div>
              </div>
              <div id="fcInputYearly" class="hidden">
                <label class="text-xs text-gray-500 mb-1 block">逐年月均营业额（万）</label>
                <div id="fcYearlyGrid" class="space-y-1.5"></div>
              </div>
              <button onclick="saveFcSelfInput()" class="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600"><i class="fas fa-save mr-1"></i>保存并采用</button>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 p-4">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm font-bold text-gray-800"><i class="fas fa-check-circle mr-1.5 text-teal-500"></i>当前所选预估方案月均营业额</span>
              <span id="fcSelectedValue" class="ml-2 text-sm font-bold text-teal-600">未选择</span>
              <span id="fcSelectedSource" class="ml-1 text-xs text-gray-400"></span>
            </div>
            <button onclick="switchSessionTab('workbench')" class="px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"><i class="fas fa-arrow-right mr-1"></i>前往条款工作台</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: 条款工作台 -->
    <div id="sessionTab-workbench" class="hidden flex-1 overflow-y-auto p-5">
      <div class="max-w-7xl mx-auto space-y-4">
        <div class="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 class="text-base font-bold text-gray-900 mb-2"><i class="fas fa-sliders-h mr-2 text-cyan-600"></i>RBF 条款工作台</h3>
          <p class="text-sm text-gray-500">三区分离：公共条款（双方可见）/ 私有预测（仅自己可见）/ 派生指标（仅自己可见）。</p>
          <p class="text-xs text-cyan-700 mt-3 p-2.5 rounded-lg bg-cyan-50 border border-cyan-100" id="workbenchPrefillHint">暂无从做功课带入的营业额预估值。</p>
        </div>

        <div id="workbenchPanel" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl border border-gray-100 p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-gray-800"><i class="fas fa-eye mr-1.5 text-gray-500"></i>公共条款区</h4>
              <span class="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500">双方可见</span>
            </div>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">融资金额（万）</label>
                <input id="wbAmount" type="number" min="1" placeholder="请输入融资金额" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="updateWorkbenchAndRecalc()">
                <button onclick="applySuggestedAmount()" class="w-full mt-1.5 px-2 py-1.5 text-[11px] font-medium rounded-lg border border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700">按照分成比例推算融资金额</button>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">分成比例（%）</label>
                <input id="wbShare" type="number" step="0.1" min="0.1" placeholder="请输入分成比例" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="updateWorkbenchAndRecalc()">
                <button onclick="applySuggestedShare()" class="w-full mt-1.5 px-2 py-1.5 text-[11px] font-medium rounded-lg border border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700">按照融资金额推算分成比例</button>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">YITO封顶APR（%）</label>
                <input id="wbApr" type="number" step="0.1" min="0" placeholder="请输入封顶APR" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="updateWorkbenchAndRecalc()">
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">合作期限（月）<span class="text-gray-400 ml-1">自动推算</span></label>
                <input id="wbTerm" type="number" min="1" placeholder="自动推算" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed" disabled>
              </div>
              <button onclick="submitWorkbenchProposal()" class="w-full mt-1 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700">提交方案（草稿）</button>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-gray-800"><i class="fas fa-lock mr-1.5 text-indigo-500"></i>私有预测区</h4>
              <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">仅自己可见</span>
            </div>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">预测月均营业额来源</label>
                <select id="wbRevenueSource" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" onchange="onWbSourceChange()">
                  <option value="system">模型预估</option>
                  <option value="borrower">融资方预估</option>
                  <option value="self">自行填写</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">预测月均营业额（万）</label>
                <input id="wbRevenue" type="number" step="0.1" min="0.1" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="onWbRevenueDirectInput()">
              </div>
              <p class="text-[11px] text-gray-400">提示：私有预测不会向融资方或下游系统透出。</p>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-gray-800"><i class="fas fa-function mr-1.5 text-amber-500"></i>派生指标区</h4>
              <span class="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700">仅自己可见</span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"><span class="text-gray-500">月回款</span><span id="wbMonthlyPayback" class="font-semibold text-gray-800">--</span></div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"><span class="text-gray-500">建议可融资金额上限</span><span id="wbSuggestAmount" class="font-semibold text-gray-800">--</span></div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"><span class="text-gray-500">建议分成比例</span><span id="wbSuggestShare" class="font-semibold text-gray-800">--</span></div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"><span class="text-gray-500">预估触达月数</span><span id="wbTouchMonths" class="font-semibold text-gray-800">--</span></div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"><span class="text-gray-500">YITO触达总回款</span><span id="wbTotalPayback" class="font-semibold text-gray-800">--</span></div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"><span class="text-gray-500">实际APR</span><span id="wbActualApr" class="font-semibold text-gray-800">--</span></div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"><span class="text-gray-500">回收倍数</span><span id="wbRecoveryMultiple" class="font-semibold text-gray-800">--</span></div>
            </div>
            <p id="wbFormulaHint" class="text-[11px] text-gray-400 mt-2">公式状态：等待输入参数。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: 表达意向 -->
    <div id="sessionTab-intent" class="hidden flex-1 overflow-y-auto p-5">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div id="intentFormCard" class="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 id="intentFormTitle" class="text-base font-bold text-gray-900 mb-4"><i class="fas fa-hand-point-up mr-2 text-teal-600"></i>结构化意向填写</h3>
          <div id="intentFormBody" class="space-y-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">投资类型</label>
              <select id="intentInvestmentType" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" onchange="updateIntentAndPreview()">
                <option value="RBF固定">RBF固定</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">金额区间</label>
              <select id="intentAmountBand" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" onchange="updateIntentAndPreview()">
                <option value="100-300">100万 - 300万</option>
                <option value="300-500">300万 - 500万</option>
                <option value="500-800">500万 - 800万</option>
                <option value="800+">800万以上</option>
                <option value="custom">自定义区间</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-500 mb-1">自定义最小值（万）</label>
                <input id="intentCustomMin" type="number" min="0" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="updateIntentAndPreview()">
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">自定义最大值（万）</label>
                <input id="intentCustomMax" type="number" min="0" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="updateIntentAndPreview()">
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">核心关注点（可多选）</label>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <label class="flex items-center gap-2 p-2 rounded-lg border border-gray-100"><input class="intent-concern" type="checkbox" value="现金流稳定性" onchange="updateIntentAndPreview()"><span>现金流稳定性</span></label>
                <label class="flex items-center gap-2 p-2 rounded-lg border border-gray-100"><input class="intent-concern" type="checkbox" value="历史履约记录" onchange="updateIntentAndPreview()"><span>历史履约记录</span></label>
                <label class="flex items-center gap-2 p-2 rounded-lg border border-gray-100"><input class="intent-concern" type="checkbox" value="分成比例上限" onchange="updateIntentAndPreview()"><span>分成比例上限</span></label>
                <label class="flex items-center gap-2 p-2 rounded-lg border border-gray-100"><input class="intent-concern" type="checkbox" value="退出周期可控" onchange="updateIntentAndPreview()"><span>退出周期可控</span></label>
                <label class="flex items-center gap-2 p-2 rounded-lg border border-gray-100"><input class="intent-concern" type="checkbox" value="门店扩张潜力" onchange="updateIntentAndPreview()"><span>门店扩张潜力</span></label>
                <label class="flex items-center gap-2 p-2 rounded-lg border border-gray-100"><input class="intent-concern" type="checkbox" value="团队执行能力" onchange="updateIntentAndPreview()"><span>团队执行能力</span></label>
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">备注（可选）</label>
              <textarea id="intentNote" rows="3" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="updateIntentAndPreview()" placeholder="补充您的关注点或谈判偏好"></textarea>
            </div>
            <div id="intentFormActions" class="grid grid-cols-2 gap-2">
              <button onclick="generateIntentSummary()" class="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">生成意向摘要</button>
              <button onclick="submitIntent()" class="px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700">确认并发送意向</button>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div id="intentRequestQueueCard" class="hidden bg-white rounded-2xl border border-gray-100 p-5">
            <div class="flex items-center justify-between mb-2">
              <h3 id="intentRequestQueueTitle" class="text-base font-bold text-gray-900"><i class="fas fa-inbox mr-2 text-amber-600"></i>收到的意向请求</h3>
              <span id="intentRequestCount" class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">0</span>
            </div>
            <p id="intentRequestQueueHint" class="text-[11px] text-gray-400 mb-3">按提交时间展示，优先处理最新请求。</p>
            <div id="intentRequestList" class="space-y-2 text-sm text-gray-600 max-h-80 overflow-y-auto pr-1">暂无意向请求。</div>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 id="intentSummaryTitle" class="text-base font-bold text-gray-900 mb-3"><i class="fas fa-file-signature mr-2 text-cyan-600"></i>意向摘要确认</h3>
            <div id="intentSummaryBox" class="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-500">尚未生成摘要。</div>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 id="intentResponseTitle" class="text-base font-bold text-gray-900 mb-3"><i class="fas fa-reply mr-2 text-amber-600"></i>融资方响应</h3>
            <div id="intentResponseBox" class="p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700">尚未提交意向。</div>
            <div id="intentResponseActions" class="grid grid-cols-2 gap-2 mt-3">
              <button id="btnIntentAccept" onclick="mockIntentResponse('accepted')" class="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">接受沟通</button>
              <button id="btnIntentReject" onclick="mockIntentResponse('rejected')" class="px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700">暂不考虑</button>
            </div>
            <p id="intentResponseTip" class="text-[11px] text-gray-400 mt-2">验收说明：接受沟通后建议进入条款工作台；暂不考虑则项目留在列表待观察。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: 方案管理 -->
    <div id="sessionTab-negotiation" class="hidden flex-1 overflow-y-auto p-5">
      <div class="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="xl:col-span-2 space-y-4">
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base font-bold text-gray-900"><i class="fas fa-layer-group mr-2 text-cyan-600"></i>多方案对比</h3>
              <span id="negotiationGateTip" class="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700">在条款工作台提交方案后，方案将出现在此处</span>
            </div>
            <div id="negProposalGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <p id="negProposalEmpty" class="text-sm text-gray-400 col-span-full py-6 text-center">暂无方案，请在条款工作台中提交方案草稿。</p>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 class="text-base font-bold text-gray-900 mb-3"><i class="fas fa-paper-plane mr-2 text-teal-600"></i>方案管理</h3>
            <div id="negProposalList" class="space-y-2 text-sm text-gray-600">暂无提案记录。</div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 class="text-base font-bold text-gray-900 mb-3"><i class="fas fa-user-plus mr-2 text-emerald-600"></i>邀请协作</h3>
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-gray-500 mb-1">角色</label>
                <select id="negInviteRole" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="negotiator">谈判者</option>
                  <option value="observer">观察者</option>
                </select>
              </div>
              <button onclick="generateNegotiationInvite()" class="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">生成7天有效邀请链接</button>
              <div id="negInviteBox" class="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-500">尚未生成邀请链接。</div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 class="text-base font-bold text-gray-900 mb-3"><i class="fas fa-file-export mr-2 text-cyan-600"></i>合约通输出预览</h3>
            <pre id="negContractPayloadBox" class="p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] leading-5 text-gray-600 whitespace-pre-wrap">尚未达成条款，暂无输出。</pre>
            <p class="text-[11px] text-gray-400 mt-2">约束：仅公共参数会流向合约通，私有预测与派生指标不会外传。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: 沟通备忘录 -->
    <div id="sessionTab-memo" class="hidden flex-1 overflow-y-auto p-5">
      <div class="max-w-3xl mx-auto space-y-4">
        <div class="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 class="text-base font-bold text-gray-900 mb-2"><i class="fas fa-file-lines mr-2 text-indigo-600"></i>沟通备忘录</h3>
          <p class="text-sm text-gray-500 mb-4">微信为主沟通，系统沉淀共识。请结构化记录并走确认流程。</p>
          <p id="memoEditorHint" class="text-[11px] text-gray-400 mb-3">当前为新建模式。必填：议题、达成内容。</p>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">议题（必填）</label>
              <input id="memoTopic" type="text" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="例如：分成比例上限确认">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">达成内容（必填）</label>
              <textarea id="memoAgreedContent" rows="3" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="记录双方已达成的一致内容"></textarea>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">边界条件</label>
              <textarea id="memoBoundary" rows="2" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="例如：仅适用于首批门店，超出需重新确认"></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">生效日期</label>
                <input id="memoEffectiveDate" type="date" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">关联方案</label>
                <select id="memoRelatedProposalId" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">未关联方案</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">摘要正文（可选）</label>
              <textarea id="memoSummaryBody" rows="2" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="补充摘要或对外确认口径"></textarea>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-3">
            <button onclick="saveMemoDraft()" class="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">保存草稿</button>
            <button onclick="submitMemoForConfirmation()" class="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">提交确认</button>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 class="text-sm font-bold text-gray-800 mb-3"><i class="fas fa-list mr-1.5 text-indigo-500"></i>历史纪要</h3>
          <div id="memoHistoryList" class="space-y-2 text-sm text-gray-600">暂无沟通纪要。</div>
        </div>
      </div>
    </div>

      <!-- 方案详情弹窗 -->
      <div id="proposalDetailOverlay" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40" onclick="if(event.target===this)closeProposalDetail()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
          <div class="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h3 id="pdTitle" class="text-sm font-bold text-gray-900">方案详情</h3>
              <p id="pdMeta" class="text-xs text-gray-500 mt-0.5"></p>
            </div>
            <button onclick="closeProposalDetail()" class="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><i class="fas fa-times"></i></button>
          </div>
          <div class="p-5 space-y-4">
            <!-- 公共条款 -->
            <div>
              <h4 class="text-xs font-bold text-gray-700 mb-2"><i class="fas fa-eye mr-1 text-gray-400"></i>公共条款</h4>
              <div id="pdPublic" class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm"></div>
            </div>
            <!-- 私有预测 -->
            <div>
              <h4 class="text-xs font-bold text-gray-700 mb-2"><i class="fas fa-lock mr-1 text-indigo-400"></i>私有预测</h4>
              <div id="pdPrivate" class="grid grid-cols-2 gap-2 text-sm"></div>
            </div>
            <!-- 派生指标 -->
            <div>
              <h4 class="text-xs font-bold text-gray-700 mb-2"><i class="fas fa-calculator mr-1 text-amber-400"></i>派生指标</h4>
              <div id="pdDerived" class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm"></div>
            </div>
            <!-- 编辑区（仅方案发起方可见） -->
            <div id="pdEditSection" class="hidden border-t border-gray-100 pt-4">
              <h4 class="text-xs font-bold text-gray-700 mb-2"><i class="fas fa-pen mr-1 text-cyan-400"></i>修改方案</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><label class="block text-[11px] text-gray-500 mb-0.5">融资金额（万）</label><input id="pdEditAmount" type="number" min="1" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"></div>
                <div><label class="block text-[11px] text-gray-500 mb-0.5">分成比例（%）</label><input id="pdEditShare" type="number" step="0.1" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"></div>
                <div><label class="block text-[11px] text-gray-500 mb-0.5">APR（%）</label><input id="pdEditApr" type="number" step="0.1" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"></div>
                <div><label class="block text-[11px] text-gray-500 mb-0.5">合作期限（月）</label><input id="pdEditTerm" type="number" min="1" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"></div>
              </div>
              <button id="pdSaveEditBtn" class="mt-2 w-full px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700">保存修改</button>
            </div>
            <!-- 沟通区 -->
            <div class="border-t border-gray-100 pt-4">
              <h4 class="text-xs font-bold text-gray-700 mb-2"><i class="fas fa-comments mr-1 text-teal-400"></i>方案沟通</h4>
              <div id="pdMessages" class="space-y-2 max-h-40 overflow-y-auto mb-2"></div>
              <div class="flex gap-2">
                <input id="pdMsgInput" type="text" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs" placeholder="输入沟通内容...">
                <button id="pdSendMsgBtn" class="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700">发送</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 反提案弹窗 -->
    <div id="counterOverlay" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40" onclick="if(event.target===this)closeCounterOverlay()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
        <div class="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 class="text-sm font-bold text-gray-900"><i class="fas fa-reply mr-1.5 text-cyan-600"></i>发起反提案</h3>
            <p id="counterOrigInfo" class="text-xs text-gray-500 mt-0.5"></p>
          </div>
          <button onclick="closeCounterOverlay()" class="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><i class="fas fa-times"></i></button>
        </div>
        <div class="p-5 space-y-4">
          <!-- 反提案条款编辑 -->
          <div>
            <h4 class="text-xs font-bold text-gray-700 mb-2"><i class="fas fa-pen mr-1 text-cyan-400"></i>反提案条款</h4>
            <p class="text-[11px] text-gray-400 mb-2">修改您希望调整的条款，合作期限自动推算。</p>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-[11px] text-gray-500 mb-0.5">融资金额（万）</label><input id="counterAmount" type="number" min="1" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="recalcCounterTerm()"></div>
              <div><label class="block text-[11px] text-gray-500 mb-0.5">分成比例（%）</label><input id="counterShare" type="number" step="0.1" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="recalcCounterTerm()"></div>
              <div><label class="block text-[11px] text-gray-500 mb-0.5">APR（%）</label><input id="counterApr" type="number" step="0.1" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" oninput="recalcCounterTerm()"></div>
              <div><label class="block text-[11px] text-gray-500 mb-0.5">合作期限（月）<span class="text-gray-400 ml-1">自动推算</span></label><input id="counterTerm" type="number" min="1" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed" disabled></div>
            </div>
          </div>
          <!-- 当前条款工作台方案视图 -->
          <div class="border-t border-gray-100 pt-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-gray-700"><i class="fas fa-sliders-h mr-1 text-amber-400"></i>当前条款工作台方案</h4>
              <button onclick="closeCounterOverlay();switchSessionTab('workbench')" class="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-cyan-200 text-cyan-600 hover:bg-cyan-50"><i class="fas fa-arrow-right mr-1"></i>前往条款工作台</button>
            </div>
            <div class="space-y-2">
              <div>
                <p class="text-[10px] text-gray-400 mb-1">公共条款</p>
                <div id="counterWbPublic" class="grid grid-cols-4 gap-1.5 text-xs"></div>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 mb-1">私有预测</p>
                <div id="counterWbPrivate" class="grid grid-cols-2 gap-1.5 text-xs"></div>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 mb-1">派生指标</p>
                <div id="counterWbDerived" class="grid grid-cols-3 gap-1.5 text-xs"></div>
              </div>
            </div>
          </div>
          <button id="counterSubmitBtn" class="w-full px-3 py-2.5 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700">提交反提案</button>
        </div>
      </div>
    </div>

    <!-- Tab: 时间线 -->
    <div id="sessionTab-timeline" class="hidden flex-1 overflow-y-auto p-5">
      <div class="max-w-7xl mx-auto space-y-4">
        <div class="bg-white rounded-2xl border border-gray-100 p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold text-gray-900"><i class="fas fa-stream mr-2 text-indigo-600"></i>全程操作时间线</h3>
            <button onclick="renderTimelineTab()" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">刷新</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
            <div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100"><p class="text-xs text-gray-500">事件总数</p><p id="timelineCountAll" class="font-semibold text-gray-800">0</p></div>
            <div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100"><p class="text-xs text-gray-500">方案事件</p><p id="timelineCountProposal" class="font-semibold text-gray-800">0</p></div>
            <div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100"><p class="text-xs text-gray-500">纪要事件</p><p id="timelineCountMemo" class="font-semibold text-gray-800">0</p></div>
            <div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100"><p class="text-xs text-gray-500">最近更新</p><p id="timelineLastAt" class="font-semibold text-gray-800">--</p></div>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <label class="text-xs text-gray-500">筛选类型</label>
            <select id="timelineFilterType" class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" onchange="renderTimelineTab()">
              <option value="all">全部</option>
              <option value="proposal">提案相关</option>
              <option value="memo">纪要相关</option>
              <option value="intent">意向相关</option>
              <option value="invite">邀请相关</option>
            </select>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 p-5">
          <div id="timelineList" class="space-y-3 text-sm text-gray-600">暂无时间线事件。</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== Confirm Dialog ==================== -->
  <div id="confirmModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl max-w-sm w-full mx-4 overflow-hidden animate-scale-in">
      <div class="confirm-dialog" style="padding:32px; text-align:center;">
        <div id="confirmIcon" class="confirm-icon warning" style="width:56px;height:56px;margin:0 auto 16px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(245,158,11,0.1);"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;font-size:24px;"></i></div>
        <h3 id="confirmTitle" class="text-lg font-bold text-gray-900 mb-2">确认操作</h3>
        <p id="confirmMessage" class="text-sm text-gray-500 mb-6">确定要执行此操作吗？</p>
        <div class="flex gap-3 justify-center"><button onclick="hideConfirm()" class="btn-secondary rounded-xl px-5 py-2">取消</button><button id="confirmAction" onclick="hideConfirm()" class="btn-primary rounded-xl px-5 py-2">确认</button></div>
      </div>
    </div>
  </div>

  <!-- ==================== JavaScript ==================== -->
  <script src="/static/js/state.js"></script>
  <script src="/static/js/shared.js"></script>
  <script src="/static/js/intent.js"></script>
  <script src="/static/js/negotiation.js"></script>
  <script src="/static/js/forecast.js"></script>
  <script src="/static/js/workbench.js"></script>
  <script src="/static/js/auth.js"></script>
  <script src="/static/js/sieves.js"></script>
  <script src="/static/js/dashboard.js"></script>
  <script src="/static/js/project-session.js"></script>
  <script src="/static/js/ui.js"></script>
  <script src="/static/js/app-init.js"></script>
</body>
</html>`
