// Markdown Editor - Popup Script
class MarkdownEditor {
    constructor() {
        this.editor = document.getElementById('markdownEditor');
        this.copyButton = document.getElementById('copyButton');
        this.clearButton = document.getElementById('clearButton');
        this.themeToggle = document.getElementById('themeToggle');
        
        this.init();
    }
    
    init() {
        // イベントリスナーの設定
        this.copyButton.addEventListener('click', () => this.copyToClipboard());
        this.clearButton.addEventListener('click', () => this.clearEditor());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // エディタの自動保存機能
        this.editor.addEventListener('input', () => this.autoSave());
        
        // 初期化時に保存されたテキストとテーマを復元
        this.loadSavedText();
        this.loadSavedTheme();
        
        // キーボードショートカット
        this.setupKeyboardShortcuts();
        
        // エディタにフォーカス
        this.editor.focus();
    }
    
    // テーマ切り替え
    toggleTheme() {
        const body = document.body;
        const currentTheme = this.getCurrentTheme();
        let newTheme;
        
        if (currentTheme === 'auto') {
            // auto -> light
            newTheme = 'light';
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            this.updateThemeIcon('☀️');
        } else if (currentTheme === 'light') {
            // light -> dark
            newTheme = 'dark';
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            this.updateThemeIcon('🌙');
        } else {
            // dark -> auto
            newTheme = 'auto';
            body.classList.remove('light-theme', 'dark-theme');
            this.updateThemeIcon('🌓');
        }
        
        // テーマを保存
        chrome.storage.local.set({ 'theme': newTheme });
        this.showNotification(`テーマを${this.getThemeDisplayName(newTheme)}に変更しました`, 'info');
        
        // ボタンのフィードバック
        this.animateButton(this.themeToggle);
    }
    
    // 現在のテーマを取得
    getCurrentTheme() {
        const body = document.body;
        if (body.classList.contains('light-theme')) return 'light';
        if (body.classList.contains('dark-theme')) return 'dark';
        return 'auto';
    }
    
    // テーマアイコンを更新
    updateThemeIcon(icon) {
        const iconElement = this.themeToggle.querySelector('.icon');
        iconElement.textContent = icon;
    }
    
    // テーマ表示名を取得
    getThemeDisplayName(theme) {
        const names = {
            'auto': 'システム連動',
            'light': 'ライトモード',
            'dark': 'ダークモード'
        };
        return names[theme] || 'システム連動';
    }
    
    // 保存されたテーマを読み込み
    loadSavedTheme() {
        chrome.storage.local.get(['theme'], (result) => {
            const theme = result.theme || 'auto';
            const body = document.body;
            
            // テーマクラスをリセット
            body.classList.remove('light-theme', 'dark-theme');
            
            if (theme === 'light') {
                body.classList.add('light-theme');
                this.updateThemeIcon('☀️');
            } else if (theme === 'dark') {
                body.classList.add('dark-theme');
                this.updateThemeIcon('🌙');
            } else {
                // auto の場合はシステム設定に従う
                this.updateThemeIcon('🌓');
            }
        });
    }
    
    // クリップボードにコピー
    async copyToClipboard() {
        try {
            const text = this.editor.value;
            if (!text.trim()) {
                this.showNotification('コピーするテキストがありません', 'warning');
                return;
            }
            
            await navigator.clipboard.writeText(text);
            this.showNotification('クリップボードにコピーしました', 'success');
            
            // ボタンのフィードバック
            this.animateButton(this.copyButton);
        } catch (error) {
            console.error('コピーに失敗しました:', error);
            this.showNotification('コピーに失敗しました', 'error');
        }
    }
    
    // エディタをクリア
    clearEditor() {
        if (this.editor.value.trim() && !confirm('エディタの内容をクリアしますか？')) {
            return;
        }
        
        this.editor.value = '';
        this.editor.focus();
        this.autoSave();
        this.showNotification('エディタをクリアしました', 'info');
        
        // ボタンのフィードバック
        this.animateButton(this.clearButton);
    }
    
    // 自動保存
    autoSave() {
        const text = this.editor.value;
        chrome.storage.local.set({ 'markdownText': text });
    }
    
    // 保存されたテキストを読み込み
    loadSavedText() {
        chrome.storage.local.get(['markdownText'], (result) => {
            if (result.markdownText) {
                this.editor.value = result.markdownText;
            }
        });
    }
    
    // キーボードショートカットの設定
    setupKeyboardShortcuts() {
        this.editor.addEventListener('keydown', (e) => {
            // Cmd+C または Ctrl+C でコピー（全選択状態の場合）
            if ((e.metaKey || e.ctrlKey) && e.key === 'c' && this.isAllSelected()) {
                e.preventDefault();
                this.copyToClipboard();
            }
            
            // Cmd+K または Ctrl+K でクリア
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.clearEditor();
            }
            
            // Cmd+D または Ctrl+D でテーマ切り替え
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Tab キーでインデント
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertTab();
            }
        });
    }
    
    // 全選択状態かチェック
    isAllSelected() {
        return this.editor.selectionStart === 0 && 
               this.editor.selectionEnd === this.editor.value.length;
    }
    
    // タブ文字を挿入
    insertTab() {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const value = this.editor.value;
        
        this.editor.value = value.substring(0, start) + '  ' + value.substring(end);
        this.editor.selectionStart = this.editor.selectionEnd = start + 2;
        this.autoSave();
    }
    
    // 通知表示
    showNotification(message, type = 'info') {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 通知要素を作成
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // スタイルを適用
        Object.assign(notification.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
        });
        
        // タイプ別のスタイル
        const styles = {
            success: { background: 'rgba(52, 199, 89, 0.9)', color: 'white' },
            error: { background: 'rgba(255, 59, 48, 0.9)', color: 'white' },
            warning: { background: 'rgba(255, 149, 0, 0.9)', color: 'white' },
            info: { background: 'rgba(0, 122, 255, 0.9)', color: 'white' }
        };
        
        Object.assign(notification.style, styles[type]);
        
        document.body.appendChild(notification);
        
        // アニメーション
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });
        
        // 3秒後に削除
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // ボタンアニメーション
    animateButton(button) {
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = 'scale(1.05)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 100);
        }, 100);
    }
}

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});

