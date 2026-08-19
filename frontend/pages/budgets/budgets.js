document.addEventListener('DOMContentLoaded', () => {
    // 1. Guard route
    if (typeof Auth !== 'undefined') {
        Auth.protectPage();
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }

    // DOM Elements
    const tbody = document.getElementById('budget-tbody');
    const alertsContainer = document.getElementById('alerts-container');
    const globalAlert = document.getElementById('global-alert');
    
    // Modal Elements
    const modal = document.getElementById('budget-modal');
    const modalTitle = document.getElementById('modal-title');
    const budgetForm = document.getElementById('budget-form');
    const budgetIdInput = document.getElementById('budget-id');
    const monthInput = document.getElementById('month');
    const yearInput = document.getElementById('year');
    const budgetLimitInput = document.getElementById('budgetLimit');

    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
    };

    const showAlert = (message, isSuccess = false) => {
        globalAlert.textContent = message;
        globalAlert.className = `alert ${isSuccess ? 'alert-success' : 'alert-error'}`;
        globalAlert.classList.remove('hidden');
        setTimeout(() => globalAlert.classList.add('hidden'), 5000);
    };

    const getProgressColorClass = (percentage) => {
        if (percentage >= 100) return 'bg-exceeded';
        if (percentage >= 90) return 'bg-critical';
        if (percentage >= 75) return 'bg-warning-level';
        return 'bg-safe';
    };

    const getStatusInfo = (percentage) => {
        if (percentage >= 100) return { label: 'Exceeded', class: 'status-exceeded' };
        if (percentage >= 90) return { label: 'Critical', class: 'status-critical' };
        if (percentage >= 75) return { label: 'Warning', class: 'status-warning' };
        return { label: 'Safe', class: 'status-safe' };
    };

    // Load Alerts
    const loadAlerts = async () => {
        try {
            const response = await Api.get('/budgets/alerts');
            if (response.ok && response.data.success) {
                const alerts = response.data.data;
                alertsContainer.innerHTML = '';
                
                alerts.forEach(alert => {
                    const icon = alert.type === 'critical' ? 'fa-exclamation-triangle' : 
                                 alert.type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle';
                    
                    alertsContainer.innerHTML += `
                        <div class="alert-item alert-${alert.type}">
                            <i class="fas ${icon}"></i>
                            <span>${alert.message}</span>
                        </div>
                    `;
                });
            }
        } catch (error) {
            console.error('Failed to load alerts');
        }
    };

    // Load Summary
    const loadSummary = async () => {
        try {
            const response = await Api.get('/budgets/summary');
            if (response.ok && response.data.success) {
                const summary = response.data.data;
                document.getElementById('summary-total').textContent = formatCurrency(summary.totalBudget);
                document.getElementById('summary-spent').textContent = formatCurrency(summary.totalSpent);
                document.getElementById('summary-remaining').textContent = formatCurrency(summary.remainingBudget);
                document.getElementById('summary-usage').textContent = summary.overallUsagePercent + '%';
            }
        } catch (error) {
            console.error('Failed to load summary');
        }
    };

    // Load Current Month Widget
    const loadCurrentBudget = async () => {
        try {
            const response = await Api.get('/budgets/current');
            if (response.ok && response.data.success) {
                const budget = response.data.data;
                const widget = document.getElementById('current-month-widget');
                
                if (budget) {
                    widget.classList.remove('hidden');
                    document.getElementById('current-limit').textContent = formatCurrency(budget.budgetLimit);
                    document.getElementById('current-spent').textContent = formatCurrency(budget.spentAmount);
                    document.getElementById('current-remaining').textContent = formatCurrency(budget.remainingAmount);
                    
                    const fill = document.getElementById('current-progress');
                    const text = document.getElementById('current-progress-text');
                    
                    // Reset class
                    fill.className = 'progress-bar-fill';
                    fill.classList.add(getProgressColorClass(budget.percentageUsed));
                    
                    // Animate width
                    setTimeout(() => {
                        fill.style.width = Math.min(budget.percentageUsed, 100) + '%';
                    }, 100);
                    
                    text.textContent = budget.percentageUsed + '% Used';
                } else {
                    widget.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Failed to load current budget');
        }
    };

    // Load Budgets List
    const loadBudgets = async () => {
        try {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading budgets...</td></tr>';
            const response = await Api.get('/budgets');
            
            if (response.ok && response.data.success) {
                renderTable(response.data.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load records</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Network error</td></tr>`;
        }
    };

    const renderTable = (budgets) => {
        if (!budgets || budgets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No budgets found.</td></tr>';
            return;
        }

        tbody.innerHTML = budgets.map(budget => {
            const status = getStatusInfo(budget.percentageUsed);
            const colorClass = getProgressColorClass(budget.percentageUsed);
            const remainingClass = budget.remainingAmount < 0 ? 'text-danger' : 'text-success';
            
            return `
            <tr>
                <td class="font-weight-bold">${monthNames[budget.month]} ${budget.year}</td>
                <td>${formatCurrency(budget.budgetLimit)}</td>
                <td>${formatCurrency(budget.spentAmount)}</td>
                <td class="${remainingClass} font-weight-bold">${formatCurrency(budget.remainingAmount)}</td>
                <td>
                    <div class="mini-progress">
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill ${colorClass}" style="width: ${Math.min(budget.percentageUsed, 100)}%"></div>
                        </div>
                        <span class="progress-text">${budget.percentageUsed}%</span>
                    </div>
                </td>
                <td><span class="status-badge ${status.class}">${status.label}</span></td>
                <td>
                    <button class="action-btn edit" data-id="${budget.budgetId}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-id="${budget.budgetId}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');

        attachActionListeners();
    };

    const attachActionListeners = () => {
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await prepareEditMode(id);
            });
        });

        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteRecord(id);
            });
        });
    };

    // Modals
    const openModal = (isEdit = false) => {
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        
        if (!isEdit) {
            budgetForm.reset();
            budgetIdInput.value = '';
            modalTitle.textContent = 'Create Budget';
            
            // Default to current month/year
            const d = new Date();
            monthInput.value = d.getMonth() + 1;
            yearInput.value = d.getFullYear();
        }
        
        modal.classList.remove('hidden');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
    };

    document.getElementById('open-add-modal-btn').addEventListener('click', () => openModal(false));
    document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', closeModal));

    const prepareEditMode = async (id) => {
        try {
            const response = await Api.get(`/budgets/${id}`);
            if (response.ok && response.data.success) {
                const record = response.data.data;
                
                modalTitle.textContent = 'Edit Budget';
                budgetIdInput.value = record.budgetId;
                monthInput.value = record.month;
                yearInput.value = record.year;
                budgetLimitInput.value = record.budgetLimit;
                
                openModal(true);
            }
        } catch (e) {
            showAlert('Failed to load budget details');
        }
    };

    // Form Submit
    budgetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        
        const budgetId = budgetIdInput.value;
        const payload = {
            month: parseInt(monthInput.value),
            year: parseInt(yearInput.value),
            budgetLimit: parseFloat(budgetLimitInput.value)
        };

        if (!payload.month || !payload.year || isNaN(payload.budgetLimit) || payload.budgetLimit <= 0) {
            if (!payload.month) document.getElementById('month-error').textContent = 'Required';
            if (!payload.year) document.getElementById('year-error').textContent = 'Required';
            if (isNaN(payload.budgetLimit) || payload.budgetLimit <= 0) document.getElementById('budgetLimit-error').textContent = 'Must be > 0';
            return;
        }

        const btn = document.getElementById('save-btn');
        const btnText = document.getElementById('save-btn-text');
        const spinner = document.getElementById('save-btn-spinner');

        btn.disabled = true;
        btnText.textContent = 'Saving...';
        spinner.classList.remove('hidden');

        try {
            let response;
            if (budgetId) {
                response = await Api.put(`/budgets/${budgetId}`, payload);
            } else {
                response = await Api.post('/budgets', payload);
            }

            if (response.ok && response.data.success) {
                showAlert(response.data.message, true);
                closeModal();
                refreshData();
            } else {
                if (response.data.errors) {
                    response.data.errors.forEach(err => {
                        const errEl = document.getElementById(`${err.field}-error`);
                        if (errEl) errEl.textContent = err.message;
                        document.getElementById(err.field).classList.add('error');
                    });
                } else {
                    showAlert(response.data.message || 'Failed to save');
                }
            }
        } catch (error) {
            showAlert('Network error');
        } finally {
            btn.disabled = false;
            btnText.textContent = 'Save';
            spinner.classList.add('hidden');
        }
    });

    // Delete Record
    const deleteRecord = async (id) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;

        try {
            const response = await Api.delete(`/budgets/${id}`);
            
            if (response.ok && response.data.success) {
                showAlert(response.data.message, true);
                refreshData();
            } else {
                showAlert(response.data.message || 'Failed to delete budget');
            }
        } catch (error) {
            showAlert('Network error');
        }
    };

    const refreshData = () => {
        loadAlerts();
        loadSummary();
        loadCurrentBudget();
        loadBudgets();
    };

    // Initialize
    refreshData();
});
