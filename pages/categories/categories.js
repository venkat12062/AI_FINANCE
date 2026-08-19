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
    const tbody = document.getElementById('categories-tbody');
    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('type-filter');
    const modal = document.getElementById('category-modal');
    const modalTitle = document.getElementById('modal-title');
    const categoryForm = document.getElementById('category-form');
    const categoryIdInput = document.getElementById('category-id');
    const categoryNameInput = document.getElementById('categoryName');
    const categoryTypeInput = document.getElementById('categoryType');
    const globalAlert = document.getElementById('global-alert');

    const showAlert = (message, isSuccess = false) => {
        globalAlert.textContent = message;
        globalAlert.className = `alert ${isSuccess ? 'alert-success' : 'alert-error'}`;
        globalAlert.classList.remove('hidden');
        setTimeout(() => globalAlert.classList.add('hidden'), 5000);
    };

    // Load Categories
    const loadCategories = async () => {
        try {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading categories...</td></tr>';
            
            const search = searchInput.value.trim();
            const type = typeFilter.value;
            
            let queryParams = [];
            if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
            if (type) queryParams.push(`type=${encodeURIComponent(type)}`);
            
            const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
            
            const response = await Api.get(`/categories${queryString}`);
            
            if (response.ok && response.data.success) {
                renderCategories(response.data.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load categories</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Network error</td></tr>`;
        }
    };

    const renderCategories = (categories) => {
        if (!categories || categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No categories found.</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>#${cat.categoryId}</td>
                <td>${cat.categoryName}</td>
                <td>
                    <span class="badge ${cat.categoryType === 'Income' ? 'badge-income' : 'badge-expense'}">
                        ${cat.categoryType}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit" data-id="${cat.categoryId}" data-name="${cat.categoryName}" data-type="${cat.categoryType}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-id="${cat.categoryId}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Attach event listeners to buttons
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                openModal({
                    categoryId: button.dataset.id,
                    categoryName: button.dataset.name,
                    categoryType: button.dataset.type
                });
            });
        });

        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteCategory(id);
            });
        });
    };

    // Event Listeners for Search & Filter
    searchInput.addEventListener('input', () => {
        // debounce search (simple implementation)
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            loadCategories();
        }, 300);
    });

    typeFilter.addEventListener('change', loadCategories);

    // Modal logic
    const openModal = (category = null) => {
        // Reset form & errors
        categoryForm.reset();
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        
        if (category) {
            modalTitle.textContent = 'Edit Category';
            categoryIdInput.value = category.categoryId;
            categoryNameInput.value = category.categoryName;
            categoryTypeInput.value = category.categoryType;
        } else {
            modalTitle.textContent = 'Add Category';
            categoryIdInput.value = '';
        }
        
        modal.classList.remove('hidden');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
    };

    document.getElementById('open-add-modal-btn').addEventListener('click', () => openModal());
    document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', closeModal));

    // Form submission
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset errors
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        
        const categoryId = categoryIdInput.value;
        const categoryName = categoryNameInput.value.trim();
        const categoryType = categoryTypeInput.value;

        if (!categoryName || !categoryType) {
            if (!categoryName) document.getElementById('categoryName-error').textContent = 'Required';
            if (!categoryType) document.getElementById('categoryType-error').textContent = 'Required';
            return;
        }

        const btn = document.getElementById('save-category-btn');
        const btnText = document.getElementById('save-btn-text');
        const spinner = document.getElementById('save-btn-spinner');

        btn.disabled = true;
        btnText.textContent = 'Saving...';
        spinner.classList.remove('hidden');

        try {
            const payload = { categoryName, categoryType };
            let response;
            
            if (categoryId) {
                // Update
                response = await Api.put(`/categories/${categoryId}`, payload);
            } else {
                // Create
                response = await Api.post('/categories', payload);
            }

            if (response.ok && response.data.success) {
                showAlert(response.data.message, true);
                closeModal();
                loadCategories();
            } else {
                // Map validation errors
                if (response.data.errors) {
                    response.data.errors.forEach(err => {
                        const errEl = document.getElementById(`${err.field}-error`);
                        if (errEl) errEl.textContent = err.message;
                        document.getElementById(err.field).classList.add('error');
                    });
                } else {
                    showAlert(response.data.message || 'Failed to save category');
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

    // Delete Logic
    const deleteCategory = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await Api.delete(`/categories/${id}`);
            
            if (response.ok && response.data.success) {
                showAlert(response.data.message, true);
                loadCategories();
            } else {
                showAlert(response.data.message || 'Failed to delete category');
            }
        } catch (error) {
            showAlert('Network error');
        }
    };

    // Initial load
    loadCategories();
});
