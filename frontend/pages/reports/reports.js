document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Protection
    if (typeof Auth !== 'undefined') {
        Auth.protectPage();
    }

    // 2. User Info & Header Setup
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

    // 3. State & Variables
    let currentPreset = 'thisMonth';
    let currentStartDate = '';
    let currentEndDate = '';

    // Chart Instances
    let trendChart = null;
    let savingsChart = null;
    let budgetDoughnut = null;
    let expensePieChart = null;
    let incomePieChart = null;

    // Formatting utils (Indian Rupees ₹)
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);

    const showAlert = (message, isError = false) => {
        const globalAlert = document.getElementById('global-alert');
        if (!globalAlert) return;
        globalAlert.textContent = message;
        globalAlert.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
        globalAlert.classList.remove('hidden');
        setTimeout(() => globalAlert.classList.add('hidden'), 5000);
    };

    // Chart Defaults for High Aesthetic / Dark Mode
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    // 4. Export Menu Dropdown Logic
    const exportMenuBtn = document.getElementById('export-menu-btn');
    const exportDropdown = document.getElementById('export-dropdown');
    if (exportMenuBtn && exportDropdown) {
        exportMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => exportDropdown.classList.remove('show'));
    }

    // Export Handlers (PDF, CSV, Excel)
    const handleExport = async (type) => {
        try {
            exportDropdown.classList.remove('show');
            showAlert(`Preparing ${type.toUpperCase()} export...`);

            const token = Auth.getToken();
            let query = `?preset=${currentPreset}`;
            if (currentPreset === 'custom' && currentStartDate && currentEndDate) {
                query += `&startDate=${currentStartDate}&endDate=${currentEndDate}`;
            }

            const response = await fetch(`/api/reports/export/${type === 'excel' ? 'csv' : type}${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = type === 'excel' ? 'xlsx' : type;
            a.download = `financial_report_${currentPreset}_${new Date().toISOString().split('T')[0]}.${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            showAlert(`Downloaded ${type.toUpperCase()} report successfully!`);
        } catch (err) {
            showAlert(`Failed to export ${type.toUpperCase()}`, true);
        }
    };

    document.getElementById('export-pdf-btn')?.addEventListener('click', () => handleExport('pdf'));
    document.getElementById('export-csv-btn')?.addEventListener('click', () => handleExport('csv'));
    document.getElementById('export-excel-btn')?.addEventListener('click', () => handleExport('excel'));

    // 5. Filter Preset Pills & Custom Date Handling
    const presetPills = document.querySelectorAll('.preset-pill');
    const customRow = document.getElementById('custom-date-row');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const applyCustomBtn = document.getElementById('apply-custom-btn');

    presetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            presetPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const preset = pill.dataset.preset;
            currentPreset = preset;

            if (preset === 'custom') {
                customRow.style.display = 'flex';
            } else {
                customRow.style.display = 'none';
                loadReportsData();
            }
        });
    });

    if (applyCustomBtn) {
        applyCustomBtn.addEventListener('click', () => {
            if (!startDateInput.value || !endDateInput.value) {
                showAlert('Please select both start and end dates', true);
                return;
            }
            if (new Date(startDateInput.value) > new Date(endDateInput.value)) {
                showAlert('Start date cannot be after end date', true);
                return;
            }
            currentStartDate = startDateInput.value;
            currentEndDate = endDateInput.value;
            loadReportsData();
        });
    }

    // 6. Main Data Loading Routine
    const loadReportsData = async () => {
        let query = `?preset=${currentPreset}`;
        if (currentPreset === 'custom') {
            query += `&startDate=${currentStartDate}&endDate=${currentEndDate}`;
        }

        try {
            // A. Summary & KPIs
            const summaryRes = await Api.get(`/reports/summary${query}`);
            if (summaryRes.ok && summaryRes.data.success) {
                const s = summaryRes.data.data;
                document.getElementById('rep-total-income').textContent = formatCurrency(s.totalIncome);
                document.getElementById('rep-total-expense').textContent = formatCurrency(s.totalExpense);
                
                const savingsEl = document.getElementById('rep-net-savings');
                savingsEl.textContent = formatCurrency(s.netSavings);
                savingsEl.style.color = s.netSavings >= 0 ? 'var(--success)' : 'var(--danger)';

                document.getElementById('rep-savings-rate').textContent = `${s.savingsRate}%`;
                const rateBar = document.getElementById('savings-rate-bar');
                if (rateBar) rateBar.style.width = `${Math.min(100, Math.max(0, s.savingsRate))}%`;

                document.getElementById('rep-budget-util').textContent = `${s.budgetUtilization}%`;
                document.getElementById('rep-budget-limit-label').textContent = s.budgetLimit > 0 ? `Limit: ${formatCurrency(s.budgetLimit)}` : 'No budget set';

                if (s.highestExpenseCategory) {
                    document.getElementById('rep-top-expense-cat').textContent = s.highestExpenseCategory.name;
                    document.getElementById('rep-top-expense-val').textContent = `${formatCurrency(s.highestExpenseCategory.amount)} (${s.highestExpenseCategory.percentage}%)`;
                }

                if (s.highestIncomeSource) {
                    document.getElementById('rep-top-income-src').textContent = s.highestIncomeSource.name;
                    document.getElementById('rep-top-income-val').textContent = `${formatCurrency(s.highestIncomeSource.amount)} (${s.highestIncomeSource.percentage}%)`;
                }

                renderBudgetDoughnut(s.totalExpense, s.budgetLimit);
            }

            // B. Category Analysis
            const catRes = await Api.get(`/reports/category-analysis${query}`);
            if (catRes.ok && catRes.data.success) {
                renderCategoryCharts(catRes.data.data.income, catRes.data.data.expense);
            }

            // C. 12-Month Trends
            const trendRes = await Api.get('/reports/monthly-analysis');
            if (trendRes.ok && trendRes.data.success) {
                renderTrendCharts(trendRes.data.data);
            }

        } catch (err) {
            console.error('Reports load error:', err);
        }
    };

    // 7. Chart Renderers

    // Trend & Cash Flow Line Chart
    const renderTrendCharts = (monthlyData) => {
        const labels = monthlyData.map(d => {
            const [y, m] = d.month.split('-');
            return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        });
        const incomeData = monthlyData.map(d => d.income);
        const expenseData = monthlyData.map(d => d.expense);
        const savingsData = monthlyData.map(d => d.savings);

        // 1. Cashflow Trend Chart
        const trendCanvas = document.getElementById('trendChart');
        if (trendCanvas) {
            const ctx = trendCanvas.getContext('2d');
            if (trendChart) trendChart.destroy();

            // Gradient backgrounds
            const incomeGrad = ctx.createLinearGradient(0, 0, 0, 300);
            incomeGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
            incomeGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

            const expenseGrad = ctx.createLinearGradient(0, 0, 0, 300);
            expenseGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
            expenseGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

            trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Income',
                            data: incomeData,
                            borderColor: '#10b981',
                            backgroundColor: incomeGrad,
                            borderWidth: 2.5,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 4,
                            pointBackgroundColor: '#10b981'
                        },
                        {
                            label: 'Expense',
                            data: expenseData,
                            borderColor: '#ef4444',
                            backgroundColor: expenseGrad,
                            borderWidth: 2.5,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 4,
                            pointBackgroundColor: '#ef4444'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.06)' },
                            ticks: { callback: (v) => formatCurrency(v) }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 2. Savings Progression Bar Chart
        const savingsCanvas = document.getElementById('savingsBarChart');
        if (savingsCanvas) {
            const ctx = savingsCanvas.getContext('2d');
            if (savingsChart) savingsChart.destroy();

            savingsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Net Savings',
                        data: savingsData,
                        backgroundColor: savingsData.map(v => v >= 0 ? 'rgba(99, 102, 241, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
                        borderColor: savingsData.map(v => v >= 0 ? '#6366f1' : '#ef4444'),
                        borderWidth: 1.5,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: { label: (ctx) => ` Savings: ${formatCurrency(ctx.raw)}` }
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.06)' },
                            ticks: { callback: (v) => formatCurrency(v) }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    };

    // Budget Doughnut Chart
    const renderBudgetDoughnut = (spent, limit) => {
        const canvas = document.getElementById('budgetDoughnutChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (budgetDoughnut) budgetDoughnut.destroy();

        const remaining = Math.max(0, limit - spent);
        const exceeded = spent > limit ? spent - limit : 0;

        budgetDoughnut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: exceeded > 0 ? ['Budget Used', 'Over Budget'] : ['Spent', 'Remaining Budget'],
                datasets: [{
                    data: exceeded > 0 ? [limit, exceeded] : [spent, remaining],
                    backgroundColor: exceeded > 0 ? ['#f59e0b', '#ef4444'] : ['#f59e0b', 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } },
                    tooltip: {
                        callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}` }
                    }
                }
            }
        });
    };

    // Category Breakdowns
    const renderCategoryCharts = (incomeList, expenseList) => {
        const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

        // Expense Pie
        const expCanvas = document.getElementById('expensePieChart');
        if (expCanvas) {
            const ctx = expCanvas.getContext('2d');
            if (expensePieChart) expensePieChart.destroy();

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
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } },
                        tooltip: {
                            callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}` }
                        }
                    }
                }
            });
        }

        // Income Pie
        const incCanvas = document.getElementById('incomePieChart');
        if (incCanvas) {
            const ctx = incCanvas.getContext('2d');
            if (incomePieChart) incomePieChart.destroy();

            incomePieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: incomeList.map(i => i.category),
                    datasets: [{
                        data: incomeList.map(i => i.amount),
                        backgroundColor: [...colors].reverse().slice(0, incomeList.length),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } },
                        tooltip: {
                            callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}` }
                        }
                    }
                }
            });
        }
    };

    // Initial Load
    loadReportsData();
});
