// public/js/admin_keys.js

async function loadAdminData() {
    try {
        // Attempt to fetch data using a stored token if it exists
        const token = sessionStorage.getItem('admin_token');
        const headers = token ? { 'Authorization': `Basic ${token}` } : {};
        
        const response = await fetch('/api/admin-data', { headers });
        
        // Handle Basic Auth prompt if unauthorized
        if (response.status === 401) {
            const credentialPrompt = btoa(prompt('Enter Admin Credentials (username:password):') || "");
            if (credentialPrompt) {
                sessionStorage.setItem('admin_token', credentialPrompt);
                window.location.reload(); // Reload to try again with the saved token
                return;
            }
            alert('Access Denied.');
            return;
        }

        if (response.status === 403) {
            alert('Invalid Credentials.');
            sessionStorage.removeItem('admin_token');
            window.location.reload();
            return;
        }

        if (response.ok) {
            renderDashboard(await response.json());
        }
    } catch (err) {
        console.error('Failed to parse secure administrative database framework payload:', err);
    }
}

function renderDashboard(data) {
    const activeKeys = Object.entries(data.activeKeys || {});
    const pendingPurchases = Object.entries(data.pendingPurchases || {});

    document.getElementById('active-count').textContent = activeKeys.length;
    document.getElementById('pending-count').textContent = pendingPurchases.length;

    if (activeKeys.length > 0) {
        document.getElementById('active-keys-container').classList.remove('d-none');
        document.getElementById('active-keys-empty').classList.add('d-none');
        document.getElementById('active-keys-body').innerHTML = activeKeys.map(([key, info]) => `
            <tr>
                <td><code>${key}</code></td>
                <td><span class="badge bg-primary text-capitalize">${info.plan || 'Premium'}</span></td>
                <td>${info.customer_email || 'N/A'}</td>
                <td>${info.created ? info.created.substring(0, 10) : 'N/A'}</td>
                <td>${info.expiry ? info.expiry.substring(0, 10) : 'N/A'}</td>
                <td>${info.used || 0} / ${info.max_files || 50}</td>
                <td><button class="btn btn-sm btn-outline-danger" onclick="revokeKey('${key}')">Revoke</button></td>
            </tr>
        `).join('');
    } else {
        document.getElementById('active-keys-empty').innerHTML = '<i class="fas fa-exclamation-triangle"></i> No active premium keys found.';
    }

    if (pendingPurchases.length > 0) {
        document.getElementById('pending-container').classList.remove('d-none');
        document.getElementById('pending-empty').classList.add('d-none');
        document.getElementById('pending-body').innerHTML = pendingPurchases.map(([req_id, info]) => `
            <tr>
                <td><code>${req_id}</code></td>
                <td>${info.email}</td>
                <td><span class="badge bg-warning text-dark text-capitalize">${info.plan || 'Premium'}</span></td>
                <td>$${info.price || '0'} USD</td>
                <td>${info.created ? info.created.substring(0, 10) : 'N/A'}</td>
                <td><small title="${info.customer_message || ''}">${info.customer_message ? (info.customer_message.substring(0, 50) + (info.customer_message.length > 50 ? '...' : '')) : 'None'}</small></td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-success" onclick="processAction('mark-paid', '${req_id}')">Mark Paid</button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="processAction('cancel-pending', '${req_id}')">Cancel</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } else {
        document.getElementById('pending-empty').innerHTML = '<i class="fas fa-check-circle"></i> No manual checkout tracking requests pending.';
    }
}

async function processAction(action, id) {
    if (!confirm(`Are you sure you want to perform this action (${action}) on Request ID: ${id}?`)) return;
    const token = sessionStorage.getItem('admin_token');
    
    const response = await fetch(`/api/admin-actions`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Basic ${token}` : ''
        },
        body: JSON.stringify({ action, id })
    });
    
    if (response.ok) {
        window.location.reload();
    } else {
        alert('Failed to execute database administrative transaction command loop.');
    }
}

async function revokeKey(key) {
    if (!confirm(`Are you completely sure you want to revoke key: ${key}? This action cannot be undone.`)) return;
    await processAction('revoke-key', key);
}

// Boot up sequence
window.addEventListener('DOMContentLoaded', loadAdminData);
