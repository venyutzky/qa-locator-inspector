// QA Locator Inspector - Popup Script
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleButton');
    const status = document.getElementById('status');
    const historyContainer = document.getElementById('historyContainer');
    const exportButton = document.getElementById('exportButton');
    
    let isEnabled = false;
    
    // Initialize popup
    init();
    
    async function init() {
        await loadStatus();
        await loadHistory();
        bindEvents();
    }
    
    function bindEvents() {
        toggleButton.addEventListener('click', toggleInspector);
        exportButton.addEventListener('click', exportHistory);
    }
    
    async function loadStatus() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const response = await chrome.tabs.sendMessage(tab.id, {action: 'getStatus'});
            isEnabled = response?.enabled || false;
            updateUI();
        } catch (error) {
            console.log('Could not get status from content script');
            isEnabled = false;
            updateUI();
        }
    }
    
    async function toggleInspector() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const response = await chrome.tabs.sendMessage(tab.id, {action: 'toggle'});
            isEnabled = response?.enabled || false;
            updateUI();
        } catch (error) {
            console.error('Could not toggle inspector:', error);
            showError('Could not connect to page. Please refresh and try again.');
        }
    }
    
    function updateUI() {
        if (isEnabled) {
            toggleButton.textContent = 'Disable Inspector';
            toggleButton.className = 'toggle-button enabled';
            status.textContent = 'Inspector is active - hover over elements';
            status.className = 'status enabled';
        } else {
            toggleButton.textContent = 'Enable Inspector';
            toggleButton.className = 'toggle-button disabled';
            status.textContent = 'Click to start inspecting elements';
            status.className = 'status disabled';
        }
    }
    
    async function loadHistory() {
        try {
            const result = await chrome.storage.local.get(['history']);
            const history = result.history || [];
            
            if (history.length === 0) {
                historyContainer.innerHTML = '<div class="no-history">No locators copied yet</div>';
                exportButton.style.display = 'none';
                return;
            }
            
            exportButton.style.display = 'block';
            
            // Show last 5 entries
            const recentHistory = history.slice(0, 5);
            historyContainer.innerHTML = recentHistory.map((item, index) => `
                <div class="history-item">
                    <div class="history-locators">
                        <div class="history-css" onclick="copyToClipboard('${escapeHtml(item.css)}')" title="Click to copy CSS">
                            <span class="locator-type">CSS:</span> ${escapeHtml(item.css)}
                        </div>
                        ${item.xpath ? `
                            <div class="history-xpath" onclick="copyToClipboard('${escapeHtml(item.xpath)}')" title="Click to copy XPath">
                                <span class="locator-type">XPath:</span> ${escapeHtml(item.xpath)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="history-meta">
                        ${formatTimestamp(item.timestamp)} • ${getDomain(item.url)}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Could not load history:', error);
        }
    }
    
    async function exportHistory() {
        try {
            const result = await chrome.storage.local.get(['history']);
            const history = result.history || [];
            
            if (history.length === 0) {
                showError('No history to export');
                return;
            }
            
            // Create export data
            const exportData = {
                exportedAt: new Date().toISOString(),
                totalEntries: history.length,
                locators: history.map(item => ({
                    css: item.css,
                    xpath: item.xpath,
                    timestamp: item.timestamp,
                    url: item.url,
                    domain: getDomain(item.url)
                }))
            };
            
            // Download as JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `qa-locators-${timestamp}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
            
            showSuccess('History exported successfully!');
        } catch (error) {
            console.error('Could not export history:', error);
            showError('Failed to export history');
        }
    }
    
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showSuccess('Locator copied to clipboard!');
        } catch (error) {
            console.error('Could not copy to clipboard:', error);
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    function getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'Unknown';
        }
    }
    
    function showError(message) {
        showNotification(message, 'error');
    }
    
    function showSuccess(message) {
        showNotification(message, 'success');
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            ${type === 'success' ? 
                'background: #48bb78; color: white;' : 
                'background: #f56565; color: white;'
            }
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 2000);
    }
    
    // Refresh history when storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.history) {
            loadHistory();
        }
    });
});
