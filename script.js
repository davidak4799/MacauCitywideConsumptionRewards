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
        this.messageTimeout = null; // 添加消息超时计时器属性
    }

    // 添加显示消息的方法
    showMessage(message, duration = 2000) {
        const messageEl = document.getElementById('saveMessage');
        messageEl.textContent = message;
        messageEl.classList.remove('hidden');
        
        // 使用 requestAnimationFrame 确保过渡效果正常工作
        requestAnimationFrame(() => {
            messageEl.classList.add('show');
        });

        // 清除之前的定时器
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // 设置新的定时器
        this.messageTimeout = setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                messageEl.classList.add('hidden');
            }, 300); // 等待淡出动画完成
        }, duration);
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
            const amount = document.getElementById('amount').value;
            
            if (this.currentPlatform && amount) {
                // 添加記錄
                this.rewardManager.addRecord(this.currentPlatform, amount);

                // 清空輸入框
                document.getElementById('amount').value = '';
                
                // 清除按鈕選中狀態
                document.querySelectorAll('.amount-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });

                // 獲取該平台的記錄數
                const platformRecords = this.rewardManager.records.filter(
                    r => r.platform === this.currentPlatform
                );
                
                if (platformRecords.length < 3) {
                    // 显示保存成功消息，包含金额信息
                    this.showMessage(`已保存 $${amount} - 第${platformRecords.length}次記錄，可繼續輸入下一次金額`);
                } else {
                    // 显示保存成功消息，包含金额信息
                    this.showMessage(`已保存 $${amount} - 返回首頁`);
                    setTimeout(() => {
                        this.showPage('platformPage');
                    }, 1500);
                }
            }
        });

        // 底部導航
        document.getElementById('homeBtn').addEventListener('click', () => this.showPage('platformPage'));
        document.getElementById('recordBtn').addEventListener('click', () => this.showPage('recordPage'));

        // 返回按鈕
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showPage('platformPage'));
        });

        // 修改清理所有記錄的事件監聽器
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            const totalRecords = this.rewardManager.records.length;
            const totalAmount = this.rewardManager.getTotalAmount();
            
            this.rewardManager.clearAllRecords();
            this.showMessage(`已清除所有記錄 (共${totalRecords}筆，$${totalAmount})`);
            this.updateRecordPage();
        });

        // 修改快速金額按鈕的事件監聽
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = e.target.dataset.amount;
                document.getElementById('amount').value = amount;
                
                // 更新按鈕選中狀態
                document.querySelectorAll('.amount-btn').forEach(button => {
                    button.classList.remove('selected');
                });
                e.target.classList.add('selected');
                
                // 自動保存邏輯
                if (this.currentPlatform && amount) {
                    // 添加記錄
                    this.rewardManager.addRecord(this.currentPlatform, amount);
                    
                    // 清空輸入框
                    document.getElementById('amount').value = '';
                    
                    // 清除按鈕選中狀態
                    e.target.classList.remove('selected');
                    
                    // 獲取該平台的記錄數
                    const platformRecords = this.rewardManager.records.filter(
                        r => r.platform === this.currentPlatform
                    );
                    
                    if (platformRecords.length < 3) {
                        // 显示保存成功消息，包含金额信息
                        this.showMessage(`已保存 $${amount} - 第${platformRecords.length}次記錄，可繼續輸入下一次金額`);
                    } else {
                        // 显示保存成功消息，包含金额信息
                        this.showMessage(`已保存 $${amount} - 返回首頁`);
                        setTimeout(() => {
                            this.showPage('platformPage');
                        }, 1500);
                    }
                }
            });
        });

        // 監聽輸入框變化
        document.getElementById('amount').addEventListener('input', (e) => {
            const value = e.target.value;
            document.querySelectorAll('.amount-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.amount === value);
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
        
        // 按平台分組記錄，並按時間排序以確定順序
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
                amount: record.amount,
                date: record.date
            });
            platformStats[record.platform].total += record.amount;
        });

        // 更新平台總計顯示，添加序號
        const summaryHtml = Object.entries(platformStats)
            .map(([platform, data]) => {
                // 對記錄按時間排序
                data.records.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                const amountsList = data.records
                    .map((record, index) => `
                        <div class="amount-item" data-record-id="${record.id}">
                            <span class="amount-order">第${index + 1}次：</span>
                            <span class="amount-value">$${record.amount.toFixed(2)}</span>
                            <div class="amount-actions">
                                <button class="edit-amount-btn" onclick="pageManager.editRecord('${record.id}')">✎</button>
                                <button class="delete-amount-btn" onclick="pageManager.deleteAmount('${record.id}', '${platform}')">×</button>
                            </div>
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

        // 更新詳細記錄列表，顯示完整信息
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

    // 修改删除金额的方法
    deleteAmount(id, platform) {
        const recordToDelete = this.rewardManager.records.find(r => r.id === parseInt(id));
        if (!recordToDelete) return;

        // 删除记录
        this.rewardManager.deleteRecord(parseInt(id));
        
        // 显示删除成功的提示
        this.showMessage(`已刪除 ${this.platformNames[platform]} 的記錄 ($${recordToDelete.amount})`);
        
        // 更新页面
        this.updateRecordPage();
    }

    // 修改清除平台记录的方法
    clearPlatformRecords(platform) {
        // 获取该平台的记录总数和总金额
        const platformRecords = this.rewardManager.records.filter(r => r.platform === platform);
        const totalAmount = platformRecords.reduce((sum, record) => sum + record.amount, 0);
        
        // 删除该平台的所有记录
        this.rewardManager.records = this.rewardManager.records.filter(
            record => record.platform !== platform
        );
        this.rewardManager.saveRecords();
        
        // 显示删除成功的提示
        this.showMessage(`已清除 ${this.platformNames[platform]} 的所有記錄 (共${platformRecords.length}筆，$${totalAmount})`);
        
        // 更新页面
        this.updateRecordPage();
    }

    // 修改編輯記錄的方法
    editRecord(id) {
        const record = this.rewardManager.records.find(r => r.id === parseInt(id));
        if (!record) return;

        // 獲取該平台的所有記錄並按時間倒序排序
        const platformRecords = this.rewardManager.records
            .filter(r => r.platform === record.platform)
            .sort((a, b) => new Date(a.date) - new Date(b.date));  // 按時間正序排序

        // 計算這是該平台的第幾次記錄
        const recordIndex = platformRecords.findIndex(r => r.id === parseInt(id)) + 1;

        // 更新編輯模態框的HTML
        const modal = document.getElementById('editModal');
        modal.querySelector('.modal-content').innerHTML = `
            <h3>編輯記錄</h3>
            <div class="edit-platform-info">
                <span>平台：${this.platformNames[record.platform]}</span>
                <span>第${recordIndex}次記錄</span>
                <span>原金額：$${record.amount.toFixed(2)}</span>
                <span>記錄時間：${new Date(record.date).toLocaleString()}</span>
            </div>
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

        // 顯示模態框
        modal.classList.remove('hidden');

        // 設置當前金額按鈕的選中狀態
        const currentAmount = record.amount.toString();
        modal.querySelectorAll('.amount-btn').forEach(btn => {
            if (btn.dataset.amount === currentAmount) {
                btn.classList.add('selected');
            }
        });

        // 添加快速選擇按鈕的事件監聽
        modal.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amountInput = document.getElementById('editAmount');
                amountInput.value = btn.dataset.amount;
                modal.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        const confirmBtn = document.getElementById('confirmEdit');
        const cancelBtn = document.getElementById('cancelEdit');

        const handleConfirm = () => {
            const newAmount = document.getElementById('editAmount').value;
            if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) >= 0) {
                this.rewardManager.updateRecord(parseInt(id), newAmount);
                this.updateRecordPage();
                modal.classList.add('hidden');
            } else {
                alert('請輸入有效的金額');
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