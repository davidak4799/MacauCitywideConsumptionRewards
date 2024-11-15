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
        const details = {};
        this.records.forEach(record => {
            if (!details[record.platform]) {
                details[record.platform] = {
                    amounts: [],
                    amountDetails: [],
                    total: 0
                };
            }
            details[record.platform].amounts.push(record.amount);
            details[record.platform].amountDetails.push({
                id: record.id,
                amount: record.amount
            });
            details[record.platform].total += record.amount;
        });
        return details;
    }
}

// 頁面管理
class PageManager {
    // 添加平台名稱映射
    constructor() {
        this.rewardManager = new RewardManager();
        this.currentPlatform = null;
        this.platformNames = {
            'BOC': '中國銀行',
            'Mpay': 'Mpay',
            'Alipay': '支付寶',
            'ICBC': '工商銀行',
            'Luso': '澳門國際銀行',
            'FPay': '豐付寶'
        };
        this.initializeEventListeners();
        this.showPage('platformPage');
    }

    initializeEventListeners() {
        // 平台選擇
        document.querySelectorAll('.platform-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentPlatform = item.dataset.platform;
                document.getElementById('selectedPlatform').textContent = 
                    this.platformNames[this.currentPlatform];
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
        const records = this.rewardManager.getRecords();
        
        // 按平台分組記錄
        const platformStats = {};
        records.forEach(record => {
            if (!platformStats[record.platform]) {
                platformStats[record.platform] = {
                    records: [],
                    total: 0
                };
            }
            platformStats[record.platform].records.push({
                id: record.id,
                amount: record.amount
            });
            platformStats[record.platform].total += record.amount;
        });

        // 更新平台總計顯示
        const summaryHtml = Object.entries(platformStats)
            .map(([platform, data]) => {
                const amountsList = data.records
                    .map(record => `
                        <div class="amount-item" data-record-id="${record.id}">
                            <span>$${record.amount.toFixed(2)}</span>
                        </div>
                    `)
                    .join(' + ');
                return `
                    <div class="summary-item" data-platform="${platform}">
                        <div class="platform-name">${this.platformNames[platform]}</div>
                        <div class="calculation-process">
                            <div class="amounts-list">${amountsList || '無記錄'}</div>
                            <div class="total-amount">
                                <div>獎勵總額 = $${data.total.toFixed(2)}</div>
                                <div>需消費金額 = $${(data.total * 3).toFixed(2)}</div>
                            </div>
                            <button class="clear-platform-btn" onclick="pageManager.clearPlatformRecords('${platform}')">
                                清除${this.platformNames[platform]}記錄
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        
        document.getElementById('platformSummary').innerHTML = summaryHtml;
        
        // 更新總金額
        const totalAmount = Object.values(platformStats)
            .reduce((sum, data) => sum + data.total, 0);
        document.getElementById('totalAmount').textContent = `$${totalAmount.toFixed(2)}`;

        // 更新詳細記錄列表
        const recordsHtml = records.map(record => `
            <div class="record-item" data-id="${record.id}" data-platform="${record.platform}">
                <div class="record-platform">${this.platformNames[record.platform]}</div>
                <div class="record-amount">$${record.amount.toFixed(2)}</div>
                <div class="record-date">${new Date(record.date).toLocaleDateString()}</div>
                <div class="record-actions">
                    <button class="edit-btn" onclick="pageManager.editRecord('${record.id}')">編輯</button>
                </div>
            </div>
        `).join('');
        document.getElementById('recordsList').innerHTML = recordsHtml;
    }

    // 添加清除指定平台記錄的方法
    clearPlatformRecords(platform) {
        if (confirm(`確定要清除 ${this.platformNames[platform]} 的所有記錄嗎？`)) {
            this.rewardManager.records = this.rewardManager.records.filter(
                record => record.platform !== platform
            );
            this.rewardManager.saveRecords();
            this.updateRecordPage();
        }
    }

    // 修改編輯記錄的方法，添加快速選擇按鈕
    editRecord(id) {
        const record = this.rewardManager.records.find(r => r.id === parseInt(id));
        if (!record) return;

        // 更新編輯模態框的HTML
        const modal = document.getElementById('editModal');
        modal.querySelector('.modal-content').innerHTML = `
            <h3>編輯記錄</h3>
            <input type="number" id="editAmount" placeholder="輸入新金額" value="${record.amount}">
            <div class="quick-amount-buttons">
                <button class="amount-btn" data-amount="100">100</button>
                <button class="amount-btn" data-amount="50">50</button>
                <button class="amount-btn" data-amount="20">20</button>
                <button class="amount-btn" data-amount="10">10</button>
                <button class="amount-btn" data-amount="0">0</button>
            </div>
            <div class="modal-buttons">
                <button id="cancelEdit">取消</button>
                <button id="confirmEdit">確認</button>
            </div>
        `;

        modal.classList.remove('hidden');

        // 添加快速選擇按鈕的事件監聽
        modal.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('editAmount').value = btn.dataset.amount;
                modal.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        const confirmBtn = document.getElementById('confirmEdit');
        const cancelBtn = document.getElementById('cancelEdit');

        const handleConfirm = () => {
            const newAmount = document.getElementById('editAmount').value;
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
}

// 創建全局實例以供HTML中的onclick使用
const pageManager = new PageManager(); 