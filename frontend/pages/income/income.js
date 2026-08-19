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
    let incomeCategories = [];

    // DOM Elements
    const tbody = document.getElementById('income-tbody');
    const paginationContainer = document.getElementById('pagination-container');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const startDateFilter = document.getElementById('start-date-filter');
    const endDateFilter = document.getElementById('end-date-filter');
    const sortFilter = document.getElementById('sort-filter');
    const globalAlert = document.getElementById('global-alert');
    
    // Modal Elements
    const modal = document.getElementById('income-modal');
    const viewModal = document.getElementById('view-modal');
    const modalTitle = document.getElementById('modal-title');
    const incomeForm = document.getElementById('income-form');
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

    // Load Categories (Income only)
    const loadCategories = async () => {
        try {
            const response = await Api.get('/categories?type=Income');
            if (response.ok && response.data.success) {
                incomeCategories = response.data.data;
                const optionsHTML = incomeCategories.map(c => `<option value="${c.categoryId}">${c.categoryName}</option>`).join('');
                
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
            const response = await Api.get('/income/summary');
            if (response.ok && response.data.success) {
                const summary = response.data.data;
                document.getElementById('summary-total').textContent = formatCurrency(summary.totalIncome);
                document.getElementById('summary-month').textContent = formatCurrency(summary.thisMonthIncome);
                document.getElementById('summary-avg').textContent = formatCurrency(summary.averageIncome);
                document.getElementById('summary-count').textContent = summary.incomeCount;
            }
        } catch (error) {
            console.error('Failed to load summary');
        }
    };

    // Load Income Records
    const loadIncome = async (page = 1) => {
        try {
            currentPage = page;
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading income records...</td></tr>';
            
            const search = searchInput.value.trim();
            const categoryId = categoryFilter.value;
            const startDate = startDateFilter.value;
            const endDate = endDateFilter.value;
            const [sortBy, sortOrder] = sortFilter.value.split('-');
            
            let queryParams = [`page=${page}`, `limit=${limit}`, `sortBy=${sortBy}`, `sortOrder=${sortOrder}`];
            if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
            if (categoryId) queryParams.push(`categoryId=${categoryId}`);
            if (startDate) queryParams.push(`startDate=${startDate}`);
            if (endDate) queryParams.push(`endDate=${endDate}`);
            
            const response = await Api.get(`/income?${queryParams.join('&')}`);
            
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
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No income records found.</td></tr>';
            return;
        }

        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${formatDate(record.transactionDate)}</td>
                <td><span class="badge badge-income">${record.categoryName}</span></td>
                <td>${record.description || '-'}</td>
                <td class="text-success font-weight-bold">${formatCurrency(record.amount)}</td>
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
        loadIncome(page);
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
        debounceTimer = setTimeout(() => loadIncome(1), 300);
    });

    [categoryFilter, startDateFilter, endDateFilter, sortFilter].forEach(el => {
        el.addEventListener('change', () => loadIncome(1));
    });

    // Modals
    const openModal = (isEdit = false) => {
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        
        if (!isEdit) {
            incomeForm.reset();
            transactionIdInput.value = '';
            modalTitle.textContent = 'Add Income';
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
            const response = await Api.get(`/income/${id}`);
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
            const response = await Api.get(`/income/${id}`);
            if (response.ok && response.data.success) {
                const record = response.data.data;
                
                modalTitle.textContent = 'Edit Income';
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
    incomeForm.addEventListener('submit', async (e) => {
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
                response = await Api.put(`/income/${transactionId}`, payload);
            } else {
                response = await Api.post('/income', payload);
            }

            if (response.ok && response.data.success) {
                showAlert(response.data.message, true);
                closeModal();
                loadSummary();
                loadIncome(currentPage);
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
        if (!confirm('Are you sure you want to delete this income record?')) return;

        try {
            const response = await Api.delete(`/income/${id}`);
            
            if (response.ok && response.data.success) {
                showAlert(response.data.message, true);
                loadSummary();
                loadIncome(1);
            } else {
                showAlert(response.data.message || 'Failed to delete record');
            }
        } catch (error) {
            showAlert('Network error');
        }
    };

    // Initialize
    loadCategories().then(() => {
        loadSummary();
        loadIncome();
    });
});
