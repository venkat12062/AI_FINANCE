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
    const desktopBellBtn = document.getElementById('desktop-bell-btn');
    const mobileBellBtn = document.getElementById('mobile-bell-btn');
    const notifDropdown = document.getElementById('notification-dropdown');
    const desktopBadge = document.getElementById('desktop-badge-count');
    const mobileBadge = document.getElementById('mobile-badge-count');
    const dropdownList = document.getElementById('dropdown-list');
    
    const sumTotal = document.getElementById('sum-total');
    const sumUnread = document.getElementById('sum-unread');
    const sumWarnings = document.getElementById('sum-warnings');
    const sumCritical = document.getElementById('sum-critical');
    
    const mainList = document.getElementById('main-notification-list');
    const generateBtn = document.getElementById('generate-btn');
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    const markAllReadDropdownBtn = document.getElementById('mark-all-read-dropdown-btn');
    const globalAlert = document.getElementById('global-alert');

    let allNotifications = [];

    const showAlert = (message, isError = false) => {
        globalAlert.textContent = message;
        globalAlert.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
        globalAlert.classList.remove('hidden');
        setTimeout(() => globalAlert.classList.add('hidden'), 5000);
    };

    // Toggle Dropdown
    const toggleDropdown = (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
    };
    
    if(desktopBellBtn) desktopBellBtn.addEventListener('click', toggleDropdown);
    if(mobileBellBtn) mobileBellBtn.addEventListener('click', toggleDropdown); // Share same dropdown logic for demo

    document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && !desktopBellBtn.contains(e.target) && !mobileBellBtn.contains(e.target)) {
            notifDropdown.classList.add('hidden');
        }
    });

    // Helper mapping
    const getIconMap = (type) => {
        switch(type) {
            case 'Info': return { icon: 'fa-info-circle', cls: 'type-info' };
            case 'Success': return { icon: 'fa-check-circle', cls: 'type-success' };
            case 'Warning': return { icon: 'fa-exclamation-triangle', cls: 'type-warning' };
            case 'Critical': return { icon: 'fa-skull-crossbones', cls: 'type-critical' };
            default: return { icon: 'fa-bell', cls: 'type-info' };
        }
    };

    const loadData = async () => {
        try {
            const [notifRes, countRes] = await Promise.all([
                Api.get('/notifications?limit=50'),
                Api.get('/notifications/unread-count')
            ]);

            if (notifRes.ok && notifRes.data.success) {
                allNotifications = notifRes.data.data;
                renderMainList();
                renderDropdown();
                updateSummary();
            }

            if (countRes.ok) {
                const count = countRes.data.count;
                updateBadges(count);
            }
        } catch (error) {
            console.error('Failed to load notifications');
        }
    };

    const updateBadges = (count) => {
        const text = count > 99 ? '99+' : count;
        if (count > 0) {
            desktopBadge.textContent = text;
            desktopBadge.classList.remove('hidden');
            if(mobileBadge) {
                mobileBadge.textContent = text;
                mobileBadge.classList.remove('hidden');
            }
        } else {
            desktopBadge.classList.add('hidden');
            if(mobileBadge) mobileBadge.classList.add('hidden');
        }
    };

    const updateSummary = () => {
        sumTotal.textContent = allNotifications.length;
        sumUnread.textContent = allNotifications.filter(n => !n.is_read).length;
        sumWarnings.textContent = allNotifications.filter(n => n.notification_type === 'Warning').length;
        sumCritical.textContent = allNotifications.filter(n => n.notification_type === 'Critical').length;
    };

    const renderMainList = () => {
        if (allNotifications.length === 0) {
            mainList.innerHTML = `
                <div class="empty-state text-center text-muted" style="padding: 3rem;">
                    <i class="fas fa-bell-slash fa-3x" style="margin-bottom: 1rem;"></i>
                    <p>No notifications to display.</p>
                </div>
            `;
            return;
        }

        mainList.innerHTML = allNotifications.map(n => {
            const map = getIconMap(n.notification_type);
            return `
                <div class="notification-card ${!n.is_read ? 'unread' : ''}">
                    <div class="notif-icon ${map.cls}">
                        <i class="fas ${map.icon}"></i>
                    </div>
                    <div class="notif-content">
                        <h4>${n.title}</h4>
                        <p>${n.message}</p>
                        <span class="notif-time">${new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <div class="notif-actions">
                        ${!n.is_read ? `<button class="btn btn-sm btn-outline mark-read-btn" data-id="${n.notification_id}">Mark Read</button>` : ''}
                        <button class="btn btn-sm btn-icon text-danger del-btn" data-id="${n.notification_id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');

        attachActionListeners();
    };

    const renderDropdown = () => {
        const latest = allNotifications.slice(0, 5);
        if (latest.length === 0) {
            dropdownList.innerHTML = '<div class="dropdown-item text-center text-muted">No recent alerts.</div>';
            return;
        }

        dropdownList.innerHTML = latest.map(n => `
            <div class="dropdown-item ${!n.is_read ? 'unread' : ''}" onclick="window.location.href='notifications.html'">
                <p><strong>${n.title}</strong></p>
                <p class="text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${n.message}</p>
                <small>${new Date(n.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
    };

    const attachActionListeners = () => {
        document.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await Api.put(`/notifications/${id}/read`);
                loadData();
            });
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if(confirm('Delete this notification?')) {
                    await Api.delete(`/notifications/${id}`);
                    loadData();
                }
            });
        });
    };

    // Actions
    const handleMarkAllRead = async () => {
        try {
            await Api.put('/notifications/read-all');
            showAlert('All notifications marked as read.');
            loadData();
            notifDropdown.classList.add('hidden');
        } catch (e) {
            showAlert('Failed to mark all as read.', true);
        }
    };

    if(markAllReadBtn) markAllReadBtn.addEventListener('click', handleMarkAllRead);
    if(markAllReadDropdownBtn) markAllReadDropdownBtn.addEventListener('click', handleMarkAllRead);

    if(generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const originalHtml = generateBtn.innerHTML;
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            
            try {
                const response = await Api.post('/notifications/generate');
                if(response.ok) {
                    showAlert('Smart analysis complete. Checking for new alerts...');
                    await loadData();
                }
            } catch (e) {
                showAlert('Failed to run notification engine.', true);
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerHTML = originalHtml;
            }
        });
    }

    // Init
    loadData();

    // Auto Refresh every 60s
    setInterval(loadData, 60000);
});
