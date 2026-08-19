document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Protection
    if (typeof Auth !== 'undefined') {
        Auth.protectPage();
    }

    // 2. User Info
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    if (user) {
        const nameEl = document.getElementById('sidebar-user-name');
        const avatarEl = document.getElementById('sidebar-avatar');
        if (nameEl) nameEl.textContent = user.name || 'Account';
        if (avatarEl) avatarEl.textContent = (user.name ? user.name.charAt(0) : 'U').toUpperCase();
    }

    // Logout Handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }

    // Mobile Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // State
    let allInsights = [];
    let currentFilter = 'all';

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);

    // Refresh Button Handler
    const refreshBtn = document.getElementById('refresh-insights-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const orig = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            refreshBtn.disabled = true;
            await loadAdvisorData();
            refreshBtn.innerHTML = orig;
            refreshBtn.disabled = false;
        });
    }

    // Tab Filters
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderInsightsList();
        });
    });

    // 3. Load Advisor Data
    const loadAdvisorData = async () => {
        try {
            // A. Financial Health Score
            const scoreRes = await Api.get('/ai/financial-health');
            if (scoreRes.ok && scoreRes.data.success) {
                renderScoreCard(scoreRes.data.data);
            }

            // B. Insights List
            const insRes = await Api.get('/ai/insights');
            if (insRes.ok && insRes.data.success) {
                allInsights = insRes.data.data;
                updateCounts();
                renderInsightsList();
            }

            // C. Spending Analysis & Subscriptions
            const spendRes = await Api.get('/ai/spending-analysis');
            if (spendRes.ok && spendRes.data.success) {
                renderSpendingAnalysis(spendRes.data.data);
            }

        } catch (err) {
            console.error('Failed to load advisor data:', err);
        }
    };

    // 4. Render Score Card & Gauge
    const renderScoreCard = (data) => {
        const score = data.healthScore || 50;
        const scoreEl = document.getElementById('score-value');
        const meterEl = document.getElementById('score-meter');
        const statusEl = document.getElementById('health-status-badge');
        const labelEl = document.getElementById('score-label-text');

        if (scoreEl) scoreEl.textContent = score;
        if (statusEl) {
            statusEl.textContent = data.status || 'Good';
            if (score >= 80) statusEl.style.background = 'var(--success-bg)', statusEl.style.color = 'var(--success)';
            else if (score >= 60) statusEl.style.background = 'var(--primary-glow)', statusEl.style.color = 'var(--primary-light)';
            else if (score >= 40) statusEl.style.background = 'var(--warning-bg)', statusEl.style.color = 'var(--warning)';
            else statusEl.style.background = 'var(--danger-bg)', statusEl.style.color = 'var(--danger)';
        }

        if (labelEl) labelEl.textContent = data.label || 'Balanced Progress';

        // Animate circular meter
        if (meterEl) {
            const deg = Math.round((score / 100) * 360);
            let color = 'var(--primary)';
            if (score >= 80) color = 'var(--success)';
            else if (score < 40) color = 'var(--danger)';
            meterEl.style.background = `conic-gradient(${color} ${deg}deg, var(--bg-surface-elevated) 0deg)`;
        }

        // Sub-dimensions
        if (data.dimensions) {
            const dims = data.dimensions;
            updateDim('dim-savings', dims.savingsScore || 75);
            updateDim('dim-budget', dims.budgetScore || 75);
            updateDim('dim-expense', dims.expenseScore || 75);
            updateDim('dim-income', dims.incomeScore || 75);
        }
    };

    const updateDim = (prefix, val) => {
        const valEl = document.getElementById(`${prefix}-val`);
        const barEl = document.getElementById(`${prefix}-bar`);
        if (valEl) valEl.textContent = `${val} / 100`;
        if (barEl) barEl.style.width = `${val}%`;
    };

    // 5. Update Tab Counts
    const updateCounts = () => {
        const counts = { all: allInsights.length, Recommendation: 0, Warning: 0, Achievement: 0, Prediction: 0 };
        allInsights.forEach(ins => {
            const cat = ins.category || ins.type || 'Recommendation';
            if (counts[cat] !== undefined) counts[cat]++;
        });

        document.getElementById('count-all').textContent = counts.all;
        document.getElementById('count-rec').textContent = counts.Recommendation;
        document.getElementById('count-warn').textContent = counts.Warning;
        document.getElementById('count-ach').textContent = counts.Achievement;
        document.getElementById('count-pred').textContent = counts.Prediction;
    };

    // 6. Render Insights Cards
    const renderInsightsList = () => {
        const container = document.getElementById('insights-container');
        if (!container) return;

        const filtered = currentFilter === 'all'
            ? allInsights
            : allInsights.filter(i => (i.category || i.type) === currentFilter);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="card card-glass text-center" style="grid-column: 1 / -1; padding: 3rem;">
                    <i class="fas fa-sparkles text-primary" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p style="font-weight: 600; color: var(--text-primary);">No insights in this category</p>
                    <span class="text-muted">Your finances are steady! Log new transactions to trigger updated advice.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(ins => {
            const cat = ins.category || ins.type || 'Recommendation';
            let badgeClass = 'badge-primary';
            let icon = ins.icon || 'fa-lightbulb';

            if (cat === 'Warning') badgeClass = 'badge-danger', icon = icon || 'fa-triangle-exclamation';
            if (cat === 'Achievement') badgeClass = 'badge-success', icon = icon || 'fa-award';
            if (cat === 'Prediction') badgeClass = 'badge-purple', icon = icon || 'fa-crystal-ball';

            return `
                <div class="insight-card">
                    <div class="insight-card-header">
                        <div class="insight-badge-group">
                            <span class="badge ${badgeClass}"><i class="fas ${icon}"></i> ${cat}</span>
                            ${ins.impact ? `<span class="badge badge-secondary" style="font-size:0.7rem;">Impact: ${ins.impact}</span>` : ''}
                        </div>
                    </div>
                    <div class="insight-title">${ins.title || 'Smart Financial Advisory'}</div>
                    <p class="insight-desc">${ins.message}</p>
                    <div class="insight-card-footer">
                        <span><i class="fas fa-robot"></i> Generated by AI Advisor</span>
                        <span>${ins.created_at ? new Date(ins.created_at).toLocaleDateString() : 'Just now'}</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    // 7. Render Subscriptions & Spending Breakdown
    const renderSpendingAnalysis = (data) => {
        // Subscriptions
        const subContainer = document.getElementById('subscriptions-list');
        if (subContainer && data.recurringSubscriptions) {
            if (data.recurringSubscriptions.length > 0) {
                subContainer.innerHTML = data.recurringSubscriptions.map(s => `
                    <div class="sub-item">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div class="kpi-icon-wrap" style="width:32px; height:32px; font-size:0.85rem;"><i class="fas fa-arrows-rotate"></i></div>
                            <div>
                                <div style="font-weight:600; font-size:0.875rem; color:var(--text-primary);">${s.description}</div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">${s.frequency}</div>
                            </div>
                        </div>
                        <div style="font-weight:700; color:var(--danger);">${formatCurrency(s.amount)}</div>
                    </div>
                `).join('');
            } else {
                subContainer.innerHTML = '<div class="text-center text-muted" style="padding: 1.5rem;">No recurring subscriptions found.</div>';
            }
        }

        // Top Categories
        const catContainer = document.getElementById('category-concentration-list');
        if (catContainer && data.topCategories) {
            if (data.topCategories.length > 0) {
                catContainer.innerHTML = data.topCategories.map(c => `
                    <div class="cat-con-item">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <span style="font-weight:600; font-size:0.875rem; color:var(--text-primary);">${c.category}</span>
                            <span class="badge ${c.deltaPercentage > 0 ? 'badge-danger' : 'badge-success'}" style="font-size:0.7rem;">
                                ${c.deltaPercentage > 0 ? '+' : ''}${c.deltaPercentage}% vs last mo
                            </span>
                        </div>
                        <div style="font-weight:700; color:var(--text-primary);">${formatCurrency(c.amount)} (${c.percentage}%)</div>
                    </div>
                `).join('');
            } else {
                catContainer.innerHTML = '<div class="text-center text-muted" style="padding: 1.5rem;">No spending recorded this month.</div>';
            }
        }
    };

    // Initial Load
    loadAdvisorData();
});
