document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth !== 'undefined') {
        Auth.protectPage();
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }

    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileCloseBtn = document.getElementById('mobile-close-btn');

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => sidebar.classList.add('open'));
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', () => sidebar.classList.remove('open'));

    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const processingOverlay = document.getElementById('processing-overlay');
    const resultPanel = document.getElementById('result-panel');
    const closeResultBtn = document.getElementById('close-result-btn');
    const globalAlert = document.getElementById('global-alert');
    const createExpenseForm = document.getElementById('create-expense-form');
    const categorySelect = document.getElementById('res-category');
    const tbody = document.getElementById('receipts-tbody');

    // Modal
    const previewModal = document.getElementById('preview-modal');
    const previewImg = document.getElementById('preview-img');

    const showAlert = (message, isError = false) => {
        globalAlert.textContent = message;
        globalAlert.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
        globalAlert.classList.remove('hidden');
        setTimeout(() => globalAlert.classList.add('hidden'), 5000);
    };

    // Load Categories
    const loadCategories = async () => {
        try {
            const response = await Api.get('/categories');
            if (response.ok && response.data.success) {
                const categories = response.data.data.filter(c => c.category_type === 'Expense');
                categorySelect.innerHTML = '<option value="">Select Category</option>' + 
                    categories.map(c => `<option value="${c.category_id}" data-name="${c.category_name}">${c.category_name}</option>`).join('');
            }
        } catch (error) {
            console.error('Failed to load categories');
        }
    };

    // Load Receipt History
    const loadHistory = async () => {
        try {
            const response = await Api.get('/receipts');
            if (response.ok && response.data.success) {
                const receipts = response.data.data;
                
                if (receipts.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No receipts found.</td></tr>';
                    return;
                }

                tbody.innerHTML = receipts.map(r => `
                    <tr>
                        <td>${new Date(r.created_at).toLocaleDateString()}</td>
                        <td>
                            <img src="${r.image_url}" class="receipt-thumb" onclick="previewReceipt('${r.image_url}')">
                        </td>
                        <td>
                            <button class="btn btn-icon text-danger delete-btn" data-id="${r.receipt_id}" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('');

                // Bind delete buttons
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.currentTarget.dataset.id;
                        if (confirm('Are you sure you want to delete this receipt?')) {
                            await deleteReceipt(id);
                        }
                    });
                });
            }
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load history.</td></tr>';
        }
    };

    const deleteReceipt = async (id) => {
        try {
            const response = await Api.delete(`/receipts/${id}`);
            if (response.ok) {
                showAlert('Receipt deleted successfully');
                loadHistory();
            } else {
                showAlert('Failed to delete receipt', true);
            }
        } catch (error) {
            showAlert('Failed to delete receipt', true);
        }
    };

    // Global func for preview
    window.previewReceipt = (url) => {
        previewImg.src = url;
        previewModal.style.display = 'flex';
    };

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => previewModal.style.display = 'none');
    });

    // Upload Handlers
    browseBtn.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        }
    });

    const handleFileUpload = async (file) => {
        // Validation
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showAlert('Invalid file type. Please upload a JPG, PNG, or WEBP image.', true);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showAlert('File is too large. Maximum size is 5MB.', true);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        processingOverlay.classList.remove('hidden');

        try {
            const token = Auth.getToken();
            const response = await fetch('/api/receipts/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showAlert('Receipt processed successfully');
                showResultPanel(result.data);
                loadHistory(); // Refresh history table to show new image
            } else {
                showAlert(result.message || 'Failed to process receipt', true);
            }
        } catch (error) {
            showAlert('Network error occurred while uploading receipt.', true);
        } finally {
            processingOverlay.classList.add('hidden');
            fileInput.value = ''; // Reset input
        }
    };

    const showResultPanel = (data) => {
        document.getElementById('res-receipt-id').value = data.receiptId;
        document.getElementById('res-amount').value = data.amount || '';
        document.getElementById('res-date').value = data.date || new Date().toISOString().split('T')[0];
        document.getElementById('res-raw-text').textContent = data.ocrText || 'No text extracted.';

        // Try to match suggested category with options
        const suggested = data.suggestedCategory;
        if (suggested) {
            let matched = false;
            Array.from(categorySelect.options).forEach(opt => {
                if (opt.dataset.name === suggested) {
                    opt.selected = true;
                    matched = true;
                }
            });
            // Fallback to "Other Expense" if not directly matched, or leave blank
            if (!matched) {
                Array.from(categorySelect.options).forEach(opt => {
                    if (opt.dataset.name === 'Other Expense') opt.selected = true;
                });
            }
        }

        resultPanel.classList.remove('hidden');
    };

    closeResultBtn.addEventListener('click', () => {
        resultPanel.classList.add('hidden');
    });

    createExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            receiptId: document.getElementById('res-receipt-id').value,
            amount: document.getElementById('res-amount').value,
            date: document.getElementById('res-date').value,
            categoryId: document.getElementById('res-category').value,
            description: document.getElementById('res-desc').value
        };

        const btn = document.getElementById('save-expense-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const response = await Api.post('/receipts/create-expense', payload);
            if (response.ok && response.data.success) {
                showAlert('Expense created automatically from receipt!');
                resultPanel.classList.add('hidden');
            } else {
                showAlert(response.data.message || 'Failed to create expense', true);
            }
        } catch (error) {
            showAlert('Network error occurred.', true);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create Expense';
        }
    });

    // Init
    loadCategories();
    loadHistory();
});
