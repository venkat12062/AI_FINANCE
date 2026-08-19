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

    // Rupee Formatter
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);

    // Chart instances
    let cashFlowChart = null;
    let expensePieChart = null;

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    // 3. Load Dashboard Data
    const loadDashboard = async () => {
        try {
            // A. Overview KPIs
            const overRes = await Api.get('/dashboard/overview');
            if (overRes.ok && overRes.data.success) {
                const d = overRes.data.data;
                document.getElementById('kpi-balance').textContent = formatCurrency(d.currentBalance);
                document.getElementById('kpi-income').textContent = formatCurrency(d.monthlyIncome);
                document.getElementById('kpi-expense').textContent = formatCurrency(d.monthlyExpense);
                document.getElementById('kpi-savings').textContent = formatCurrency(d.monthlySavings);
                
                const savingsRate = d.monthlyIncome > 0 ? Math.round((d.monthlySavings / d.monthlyIncome) * 100) : 0;
                document.getElementById('kpi-savings-rate').textContent = `${savingsRate}% Rate`;
            }

            // B. Budget Overview
            const budRes = await Api.get('/dashboard/budget-overview');
            if (budRes.ok && budRes.data.success && budRes.data.data) {
                const b = budRes.data.data;
                document.getElementById('dash-budget-badge').textContent = `${b.percentageUsed}% Used`;
                document.getElementById('dash-budget-bar').style.width = `${Math.min(100, b.percentageUsed)}%`;
                document.getElementById('dash-budget-spent').textContent = formatCurrency(b.spentAmount);
                document.getElementById('dash-budget-limit').textContent = formatCurrency(b.budgetLimit);
                
                if (b.percentageUsed > 100) {
                    document.getElementById('dash-budget-bar').style.background = 'var(--danger)';
                    document.getElementById('dash-budget-badge').className = 'badge badge-danger';
                }
            } else {
                document.getElementById('dash-budget-badge').textContent = 'No Limit Set';
                document.getElementById('dash-budget-limit').textContent = 'N/A';
            }

            // C. Recent Transactions Table
            const txRes = await Api.get('/dashboard/recent-transactions');
            if (txRes.ok && txRes.data.success) {
                renderRecentTransactions(txRes.data.data);
            }

            // D. AI Insights Widget
            const aiRes = await Api.get('/ai/insights');
            if (aiRes.ok && aiRes.data.success) {
                renderAIWidget(aiRes.data.data);
            }

            // E. Charts
            const summaryRes = await Api.get('/dashboard/monthly-summary');
            const catRes = await Api.get('/dashboard/category-breakdown');

            if (summaryRes.ok && summaryRes.data.success) {
                renderCashFlowChart(summaryRes.data.data);
            }

            if (catRes.ok && catRes.data.success) {
                renderExpensePie(catRes.data.data.expense);
            }

            // F. Check Unread Notifications
            const notifRes = await Api.get('/notifications/unread-count');
            if (notifRes.ok && notifRes.data.count > 0) {
                const dot = document.getElementById('header-notif-dot');
                const badge = document.getElementById('sidebar-notif-badge');
                if (dot) dot.style.display = 'block';
                if (badge) {
                    badge.textContent = notifRes.data.count;
                    badge.style.display = 'inline-block';
                }
            }

        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    };

    // 4. Renderers
    const renderRecentTransactions = (transactions) => {
        const tbody = document.getElementById('recent-transactions-tbody');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 2rem;">No transactions recorded yet. <a href="/pages/expenses/expenses.html" style="color:var(--primary-light);">Add one</a></td></tr>';
            return;
        }

        tbody.innerHTML = transactions.map(t => `
            <tr>
                <td>${t.date}</td>
                <td><span class="badge badge-secondary">${t.category}</span></td>
                <td>${t.description || '-'}</td>
                <td><span class="badge ${t.type === 'Income' ? 'badge-success' : 'badge-danger'}">${t.type}</span></td>
                <td style="font-weight: 700; color: ${t.type === 'Income' ? 'var(--success)' : 'var(--danger)'};">
                    ${t.type === 'Income' ? '+' : '-'}${formatCurrency(t.amount)}
                </td>
            </tr>
        `).join('');
    };

    const renderAIWidget = (insights) => {
        const widgetBody = document.getElementById('ai-insights-widget-body');
        if (!widgetBody) return;

        if (insights.length === 0) {
            widgetBody.innerHTML = '<div class="text-muted" style="font-size:0.875rem;">Your financial trajectory is steady. No critical alerts today.</div>';
            return;
        }

        const top3 = insights.slice(0, 2);
        widgetBody.innerHTML = top3.map(ins => {
            const isWarn = (ins.category || ins.type) === 'Warning';
            return `
                <div class="ai-widget-item">
                    <i class="fas ${isWarn ? 'fa-triangle-exclamation text-danger' : 'fa-lightbulb text-primary'}"></i>
                    <div class="ai-widget-text">
                        <strong>${ins.title || (isWarn ? 'Budget Alert' : 'Smart Recommendation')}</strong>
                        ${ins.message}
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderCashFlowChart = (data) => {
        const canvas = document.getElementById('dashCashFlowChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (cashFlowChart) cashFlowChart.destroy();

        const labels = data.map(d => {
            const [y, m] = d.month.split('-');
            return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short' });
        });

        cashFlowChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Income',
                        data: data.map(d => d.income),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Expense',
                        data: data.map(d => d.expense),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 10 } },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
                },
                scales: {
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { callback: (v) => formatCurrency(v) } },
                    x: { grid: { display: false } }
                }
            }
        });
    };

    const renderExpensePie = (expenseList) => {
        const canvas = document.getElementById('dashExpensePieChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (expensePieChart) expensePieChart.destroy();

        const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

        expensePieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: expenseList.map(e => e.category),
                datasets: [{
                    data: expenseList.map(e => e.amount),
                    backgroundColor: colors.slice(0, expenseList.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 8 } },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}` } }
                }
            }
        });
    };

    // Initial Load
    loadDashboard();
});
