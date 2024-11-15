// 數據管理
class RewardManager {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('rewardRecords')) || [];
    }

    addRecord(platform, amount) {
        const record = {
            id: Date.now(),
            platform,
            amount: parseFloat(amount),
            date: new Date().toISOString()
        };
        this.records.unshift(record);
        this.saveRecords();
        return record;
    }

    getRecords() {
        return this.records;
    }

    getPlatformSummary() {
        return this.records.reduce((summary, record) => {
            summary[record.platform] = (summary[record.platform] || 0) + record.amount;
            return summary;
        }, {});
    }

    saveRecords() {
        localStorage.setItem('rewardRecords', JSON.stringify(this.records));
    }

    deleteRecord(id) {
        this.records = this.records.filter(record => record.id !== id);
        this.saveRecords();
    }

    updateRecord(id, newAmount) {
        const record = this.records.find(record => record.id === id);
        if (record) {
            record.amount = parseFloat(newAmount);
            this.saveRecords();
        }
    }

    getTotalAmount() {
        return this.records.reduce((total, record) => total + record.amount, 0);
    }

    clearAllRecords() {
        this.records = [];
        this.saveRecords();
    }

    // 添加新方法來獲取平台詳細統計
    getPlatformDetails() {
        // 按平台分組並記錄每筆金額
        const details = {};
        this.records.forEach(record => {
            if (!details[record.platform]) {
                details[record.platform] = {
                    amounts: [],
                    total: 0
                };
            }
            details[record.platform].amounts.push(record.amount);
            details[record.platform].total += record.amount;
        });
        return details;
    }
}

// 頁面管理
class PageManager {
    constructor() {
        this.rewardManager = new RewardManager();
        this.currentPlatform = null;
        this.initializeEventListeners();
        this.showPage('platformPage');
    }

    initializeEventListeners() {
        // 平台選擇
        document.querySelectorAll('.platform-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentPlatform = item.dataset.platform;
                document.getElementById('selectedPlatform').textContent = this.currentPlatform;
                this.showPage('inputPage');
            });
        });

        // 保存按鈕
        document.getElementById('saveButton').addEventListener('click', () => {
            const amount1 = document.getElementById('amount1').value;
            const amount2 = document.getElementById('amount2').value;
            const amount3 = document.getElementById('amount3').value;
            
            if (this.currentPlatform) {
                // 添加非空的金額記錄
                if (amount1) {
                    this.rewardManager.addRecord(this.currentPlatform, amount1);
                }
                if (amount2) {
                    this.rewardManager.addRecord(this.currentPlatform, amount2);
                }
                if (amount3) {
                    this.rewardManager.addRecord(this.currentPlatform, amount3);
                }

                // 清空輸入框
                document.getElementById('amount1').value = '';
                document.getElementById('amount2').value = '';
                document.getElementById('amount3').value = '';
                
                this.showPage('platformPage');
            }
        });

        // 底部導航
        document.getElementById('homeBtn').addEventListener('click', () => this.showPage('platformPage'));
        document.getElementById('recordBtn').addEventListener('click', () => this.showPage('recordPage'));

        // 返回按鈕
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showPage('platformPage'));
        });

        // 添加清理所有記錄的事件監聽器
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            if (confirm('確定要清理所有記錄嗎？此操作不可恢復！')) {
                this.rewardManager.clearAllRecords();
                this.updateRecordPage();
            }
        });

        // 添加快速金額按鈕事件監聽器
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                const amount = e.target.dataset.amount;
                const input = document.getElementById(targetId);
                
                // 更新輸入框的值
                input.value = amount;
                
                // 更新按鈕選中狀態
                const buttonGroup = e.target.parentElement;
                buttonGroup.querySelectorAll('.amount-btn').forEach(button => {
                    button.classList.remove('selected');
                });
                e.target.classList.add('selected');
            });
        });

        // 監聽輸入框變化，更新按鈕選中狀態
        ['amount1', 'amount2', 'amount3'].forEach(inputId => {
            document.getElementById(inputId).addEventListener('input', (e) => {
                const value = e.target.value;
                const buttonGroup = e.target.nextElementSibling;
                buttonGroup.querySelectorAll('.amount-btn').forEach(btn => {
                    btn.classList.toggle('selected', btn.dataset.amount === value);
                });
            });
        });
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        document.getElementById(pageId).classList.remove('hidden');

        if (pageId === 'recordPage') {
            this.updateRecordPage();
        }

        // 更新底部導航狀態
        document.querySelectorAll('.bottom-nav button').forEach(btn => {
            btn.classList.remove('active');
        });
        if (pageId === 'platformPage') {
            document.getElementById('homeBtn').classList.add('active');
        } else if (pageId === 'recordPage') {
            document.getElementById('recordBtn').classList.add('active');
        }
    }

    updateRecordPage() {
        const platformDetails = this.rewardManager.getPlatformDetails();
        
        // 生成包含計算過程的HTML
        const summaryHtml = Object.entries(platformDetails)
            .map(([platform, data]) => {
                const amountsList = data.amounts
                    .map(amount => `$${amount.toFixed(2)}`)
                    .join(' + ');
                return `
                    <div class="summary-item">
                        <div class="platform-name">${platform}</div>
                        <div class="calculation-process">
                            <div class="amounts-list">${amountsList}</div>
                            <div class="total-amount">= $${data.total.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }).join('');
        
        document.getElementById('platformSummary').innerHTML = summaryHtml;
        
        // 更新總金額
        const totalAmount = this.rewardManager.getTotalAmount();
        document.getElementById('totalAmount').textContent = `$${totalAmount.toFixed(2)}`;

        const records = this.rewardManager.getRecords();
        const recordsHtml = records.map(record => `
            <div class="record-item" data-id="${record.id}">
                <div class="record-platform">${record.platform}</div>
                <div class="record-amount">$${record.amount.toFixed(2)}</div>
                <div class="record-date">${new Date(record.date).toLocaleDateString()}</div>
                <div class="record-actions">
                    <button class="edit-btn" onclick="pageManager.editRecord('${record.id}')">編輯</button>
                    <button class="delete-btn" onclick="pageManager.deleteRecord('${record.id}')">刪除</button>
                </div>
            </div>
        `).join('');
        document.getElementById('recordsList').innerHTML = recordsHtml;
    }

    editRecord(id) {
        const record = this.rewardManager.records.find(r => r.id === parseInt(id));
        if (!record) return;

        const modal = document.getElementById('editModal');
        const amountInput = document.getElementById('editAmount');
        
        amountInput.value = record.amount;
        modal.classList.remove('hidden');

        const confirmBtn = document.getElementById('confirmEdit');
        const cancelBtn = document.getElementById('cancelEdit');

        const handleConfirm = () => {
            const newAmount = amountInput.value;
            if (newAmount) {
                this.rewardManager.updateRecord(parseInt(id), newAmount);
                this.updateRecordPage();
                modal.classList.add('hidden');
            }
            cleanup();
        };

        const handleCancel = () => {
            modal.classList.add('hidden');
            cleanup();
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    }

    deleteRecord(id) {
        if (confirm('確定要刪除這條記錄嗎？')) {
            this.rewardManager.deleteRecord(parseInt(id));
            this.updateRecordPage();
        }
    }
}

// 創建全局實例以供HTML中的onclick使用
const pageManager = new PageManager(); 