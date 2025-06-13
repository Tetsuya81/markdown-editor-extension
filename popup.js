// Markdown Editor - Popup Script
class MarkdownEditor {
    constructor() {
        this.editor = document.getElementById('markdownEditor');
        this.copyButton = document.getElementById('copyButton');
        this.clearButton = document.getElementById('clearButton');
        this.themeToggle = document.getElementById('themeToggle');
        this.closeButton = document.getElementById('closeButton');
        
        // OS判定
        this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        this.modifierKey = this.isMac ? 'metaKey' : 'ctrlKey';
        this.modifierSymbol = this.isMac ? '⌘' : 'Ctrl+';
        
        // ショートカット表示状態
        this.showingShortcuts = false;
        
        this.init();
    }
    
    init() {
        // イベントリスナーの設定
        this.copyButton.addEventListener('click', () => this.copyToClipboard());
        this.clearButton.addEventListener('click', () => this.clearEditor());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.closeButton.addEventListener('click', () => this.closePopup());
        
        // エディタの自動保存機能
        this.editor.addEventListener('input', () => this.autoSave());
        
        // 初期化時に保存されたテキストとテーマを復元
        this.loadSavedText();
        this.loadSavedTheme();
        
        // キーボードショートカット
        this.setupKeyboardShortcuts();
        
        // ショートカットヒント機能
        this.setupShortcutHints();
        
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
            this.updateThemeIcon('Light');
        } else if (currentTheme === 'light') {
            // light -> dark
            newTheme = 'dark';
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            this.updateThemeIcon('Dark');
        } else {
            // dark -> auto
            newTheme = 'auto';
            body.classList.remove('light-theme', 'dark-theme');
            this.updateThemeIcon('Auto');
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
    updateThemeIcon(text) {
        const iconElement = this.themeToggle.querySelector('.text-icon');
        iconElement.textContent = text;
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
                this.updateThemeIcon('Light');
            } else if (theme === 'dark') {
                body.classList.add('dark-theme');
                this.updateThemeIcon('Dark');
            } else {
                // auto の場合はシステム設定に従う
                this.updateThemeIcon('Auto');
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
            // Cmd+Option+C または Ctrl+Alt+C でコピー
            if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === 'c') {
                e.preventDefault();
                this.copyToClipboard();
            }
            
            // Cmd+Option+E または Ctrl+Alt+E でクリア (Erase)
            if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === 'e') {
                e.preventDefault();
                this.clearEditor();
            }
            
            // Cmd+Option+T または Ctrl+Alt+T でテーマ切り替え (Theme)
            if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === 't') {
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
    
    // ポップアップを閉じる
    closePopup() {
        window.close();
    }
    
    // ショートカットヒント機能のセットアップ
    setupShortcutHints() {
        // グローバルなキーイベントをリッスン
        document.addEventListener('keydown', (e) => {
            // ESCキーで閉じる
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closePopup();
            }
            
            // Cmd/Ctrlキーが押されたらショートカットを表示
            if (e[this.modifierKey] && !this.showingShortcuts) {
                this.showingShortcuts = true;
                this.updateButtonsToShortcuts();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            // Cmd/Ctrlキーが離されたら通常表示に戻す
            if (!e[this.modifierKey] && this.showingShortcuts) {
                this.showingShortcuts = false;
                this.updateButtonsToNormal();
            }
        });
        
        // フォーカスが外れたときも通常表示に戻す
        window.addEventListener('blur', () => {
            if (this.showingShortcuts) {
                this.showingShortcuts = false;
                this.updateButtonsToNormal();
            }
        });
    }
    
    // ボタンをショートカット表示に更新
    updateButtonsToShortcuts() {
        const currentTheme = this.getCurrentTheme();
        const themeShortcut = currentTheme.charAt(0).toUpperCase();
        const altSymbol = this.isMac ? '⌥' : 'Alt+';
        
        this.themeToggle.querySelector('.text-icon').textContent = `${this.modifierSymbol}${altSymbol}T`;
        this.copyButton.querySelector('.text-icon').textContent = `${this.modifierSymbol}${altSymbol}C`;
        this.clearButton.querySelector('.text-icon').textContent = `${this.modifierSymbol}${altSymbol}E`;
        this.closeButton.querySelector('.text-icon').textContent = 'ESC';
    }
    
    // ボタンを通常表示に戻す
    updateButtonsToNormal() {
        const currentTheme = this.getCurrentTheme();
        const themeText = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
        
        this.updateThemeIcon(themeText);
        this.copyButton.querySelector('.text-icon').textContent = 'Copy';
        this.clearButton.querySelector('.text-icon').textContent = 'Clear';
        this.closeButton.querySelector('.text-icon').textContent = '×';
    }
}

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});

