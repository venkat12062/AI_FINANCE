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

    // State
    let currentPage = 1;
    const limit = 10;
    let expenseCategories = [];
    let topCategoriesChartInstance = null;
    let monthlyTrendChartInstance = null;

    // DOM Elements
    const tbody = document.getElementById('expense-tbody');
    const paginationContainer = document.getElementById('pagination-container');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const minAmountFilter = document.getElementById('min-amount-filter');
    const maxAmountFilter = document.getElementById('max-amount-filter');
    const startDateFilter = document.getElementById('start-date-filter');
    const endDateFilter = document.getElementById('end-date-filter');
    const sortFilter = document.getElementById('sort-filter');
    const globalAlert = document.getElementById('global-alert');
    
    // Modal Elements
    const modal = document.getElementById('expense-modal');
    const viewModal = document.getElementById('view-modal');
    const modalTitle = document.getElementById('modal-title');
    const expenseForm = document.getElementById('expense-form');
    const transactionIdInput = document.getElementById('transaction-id');
    const categoryIdInput = document.getElementById('categoryId');
    const amountInput = document.getElementById('amount');
    const transactionDateInput = document.getElementById('transactionDate');
    const descriptionInput = document.getElementById('description');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const showAlert = (message, isSuccess = false) => {
        globalAlert.textContent = message;
        globalAlert.className = `alert ${isSuccess ? 'alert-success' : 'alert-error'}`;
        globalAlert.classList.remove('hidden');
        setTimeout(() => globalAlert.classList.add('hidden'), 5000);
    };

    // Load Categories (Expense only)
    const loadCategories = async () => {
        try {
            const response = await Api.get('/categories?type=Expense');
            if (response.ok && response.data.success) {
                expenseCategories = response.data.data;
                const optionsHTML = expenseCategories.map(c => `<option value="${c.categoryId}">${c.categoryName}</option>`).join('');
                
                // Populate both filter and form dropdowns
                categoryFilter.innerHTML = '<option value="">All Categories</option>' + optionsHTML;
                categoryIdInput.innerHTML = '<option value="">Select Category</option>' + optionsHTML;
            }
        } catch (error) {
            console.error('Failed to load categories');
        }
    };

    // Load Summary
    const loadSummary = async () => {
        try {
            const response = await Api.get('/expenses/summary');
            if (response.ok && response.data.success) {
                const summary = response.data.data;
                document.getElementById('summary-total').textContent = formatCurrency(summary.totalExpense);
                document.getElementById('summary-month').textContent = formatCurrency(summary.thisMonthExpense);
                document.getElementById('summary-avg').textContent = formatCurrency(summary.averageExpense);
                document.getElementById('summary-count').textContent = summary.expenseCount;
            }
        } catch (error) {
            console.error('Failed to load summary');
        }
    };

    // Load Top Categories for Chart
    const loadTopCategoriesChart = async () => {
        try {
            const response = await Api.get('/expenses/top-categories');
            if (response.ok && response.data.success) {
                const data = response.data.data;
                const labels = data.map(d => d.categoryName);
                const amounts = data.map(d => d.totalAmount);

                const ctx = document.getElementById('topCategoriesChart').getContext('2d');
                if (topCategoriesChartInstance) topCategoriesChartInstance.destroy();

                topCategoriesChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: amounts,
                            backgroundColor: [
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(56, 189, 248, 0.8)',
                                'rgba(139, 92, 246, 0.8)'
                            ],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right', labels: { color: '#9ca3af' } },
                            tooltip: { callbacks: { label: (ctx) => ' ' + formatCurrency(ctx.raw) } }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load top categories for chart');
        }
    };

    // Load Monthly Trend for Chart
    const loadMonthlyTrendChart = async () => {
        try {
            const response = await Api.get('/expenses/monthly-trend');
            if (response.ok && response.data.success) {
                const data = response.data.data;
                const labels = data.map(d => {
                    const [year, month] = d.monthKey.split('-');
                    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                });
                const amounts = data.map(d => d.totalAmount);

                const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
                if (monthlyTrendChartInstance) monthlyTrendChartInstance.destroy();

                monthlyTrendChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Total Expenses',
                            data: amounts,
                            backgroundColor: 'rgba(239, 68, 68, 0.6)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#9ca3af' } },
                            x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: (ctx) => ' ' + formatCurrency(ctx.raw) } }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load monthly trend for chart');
        }
    };

    // Load Expense Records
    const loadExpenses = async (page = 1) => {
        try {
            currentPage = page;
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading expense records...</td></tr>';
            
            const search = searchInput.value.trim();
            const categoryId = categoryFilter.value;
            const minAmount = minAmountFilter.value;
            const maxAmount = maxAmountFilter.value;
            const startDate = startDateFilter.value;
            const endDate = endDateFilter.value;
            const [sortBy, sortOrder] = sortFilter.value.split('-');
            
            let queryParams = [`page=${page}`, `limit=${limit}`, `sortBy=${sortBy}`, `sortOrder=${sortOrder}`];
            if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
            if (categoryId) queryParams.push(`categoryId=${categoryId}`);
            if (minAmount) queryParams.push(`minAmount=${minAmount}`);
            if (maxAmount) queryParams.push(`maxAmount=${maxAmount}`);
            if (startDate) queryParams.push(`startDate=${startDate}`);
            if (endDate) queryParams.push(`endDate=${endDate}`);
            
            const response = await Api.get(`/expenses?${queryParams.join('&')}`);
            
            if (response.ok && response.data.success) {
                renderTable(response.data.data.records);
                renderPagination(response.data.data.pagination);
            } else {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load records</td></tr>`;
                paginationContainer.innerHTML = '';
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Network error</td></tr>`;
        }
    };

    const renderTable = (records) => {
        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No expense records found.</td></tr>';
            return;
        }

        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${formatDate(record.transactionDate)}</td>
                <td><span class="badge badge-expense">${record.categoryName}</span></td>
                <td>${record.description || '-'}</td>
                <td class="text-danger font-weight-bold">${formatCurrency(record.amount)}</td>
                <td>
                    <button class="action-btn view" data-id="${record.transactionId}" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" data-id="${record.transactionId}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-id="${record.transactionId}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        attachActionListeners();
    };

    const renderPagination = (pagination) => {
        if (pagination.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        paginationContainer.innerHTML = `
            <div class="pagination-info">
                Showing page ${pagination.page} of ${pagination.totalPages} (Total: ${pagination.total})
            </div>
            <div class="pagination-buttons">
                <button class="page-btn" ${pagination.page === 1 ? 'disabled' : ''} onclick="window.changePage(${pagination.page - 1})">Previous</button>
                <button class="page-btn" ${pagination.page === pagination.totalPages ? 'disabled' : ''} onclick="window.changePage(${pagination.page + 1})">Next</button>
            </div>
        `;
    };

    // Global func for pagination buttons
    window.changePage = (page) => {
        loadExpenses(page);
    };

    const attachActionListeners = () => {
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await viewRecord(id);
            });
        });

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

    // Filters & Search Events
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => loadExpenses(1), 300);
    });

    [categoryFilter, minAmountFilter, maxAmountFilter, startDateFilter, endDateFilter, sortFilter].forEach(el => {
        el.addEventListener('change', () => loadExpenses(1));
    });

    // Modals
    const openModal = (isEdit = false) => {
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        
        if (!isEdit) {
            expenseForm.reset();
            transactionIdInput.value = '';
            modalTitle.textContent = 'Add Expense';
            // Default to today
            transactionDateInput.value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.remove('hidden');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
    };

    document.getElementById('open-add-modal-btn').addEventListener('click', () => openModal(false));
    document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', closeModal));

    // View Modal
    const closeViewModal = () => viewModal.classList.add('hidden');
    document.querySelectorAll('.close-view-btn').forEach(btn => btn.addEventListener('click', closeViewModal));

    const viewRecord = async (id) => {
        try {
            const response = await Api.get(`/expenses/${id}`);
            if (response.ok && response.data.success) {
                const record = response.data.data;
                document.getElementById('view-id').textContent = `#${record.transactionId}`;
                document.getElementById('view-date').textContent = formatDate(record.transactionDate);
                document.getElementById('view-category').textContent = record.categoryName;
                document.getElementById('view-amount').textContent = formatCurrency(record.amount);
                document.getElementById('view-description').textContent = record.description || 'No description';
                
                viewModal.classList.remove('hidden');
            }
        } catch (e) {
            showAlert('Failed to load record details');
        }
    };

    const prepareEditMode = async (id) => {
        try {
            const response = await Api.get(`/expenses/${id}`);
            if (response.ok && response.data.success) {
                const record = response.data.data;
                
                modalTitle.textContent = 'Edit Expense';
                transactionIdInput.value = record.transactionId;
                categoryIdInput.value = record.categoryId;
                amountInput.value = record.amount;
                // HTML date input expects YYYY-MM-DD
                transactionDateInput.value = new Date(record.transactionDate).toISOString().split('T')[0];
                descriptionInput.value = record.description || '';
                
                openModal(true);
            }
        } catch (e) {
            showAlert('Failed to load record details');
        }
    };

    // Form Submit
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        
        const transactionId = transactionIdInput.value;
        const payload = {
            categoryId: categoryIdInput.value,
            amount: parseFloat(amountInput.value),
            transactionDate: transactionDateInput.value,
            description: descriptionInput.value.trim()
        };

        if (!payload.categoryId || isNaN(payload.amount) || payload.amount <= 0 || !payload.transactionDate) {
            if (!payload.categoryId) document.getElementById('categoryId-error').textContent = 'Required';
            if (isNaN(payload.amount) || payload.amount <= 0) document.getElementById('amount-error').textContent = 'Must be > 0';
            if (!payload.transactionDate) document.getElementById('transactionDate-error').textContent = 'Required';
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
            if (transactionId) {
                response = await Api.put(`/expenses/${transactionId}`, payload);
            } else {
                response = await Api.post('/expenses', payload);
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
        if (!confirm('Are you sure you want to delete this expense record?')) return;

        try {
            const response = await Api.delete(`/expenses/${id}`);
            
            if (response.ok && response.data.success) {
                showAlert(response.data.message, true);
                refreshData();
            } else {
                showAlert(response.data.message || 'Failed to delete record');
            }
        } catch (error) {
            showAlert('Network error');
        }
    };

    const refreshData = () => {
        loadSummary();
        loadTopCategoriesChart();
        loadMonthlyTrendChart();
        loadExpenses(currentPage);
    };

    // Initialize
    loadCategories().then(() => {
        refreshData();
    });
});
