
// 画面左上に簡易エラートーストを出すユーティリティ
export class ErrorOverlay {
  private root?: HTMLDivElement;
  constructor() {}

  ensureRoot() {
    if (!this.root) {
      this.root = document.createElement('div');
      Object.assign(this.root.style, {
        position: 'fixed',
        left: '12px',
        top: '12px',
        zIndex: '9999',
        maxWidth: '40vw',
        font: '12px/1.4 ui-sans-serif,system-ui,Segoe UI,Roboto,Arial',
        color: '#fff',
      });
      document.body.appendChild(this.root);
    }
  }

  warn(msg: string) {
    this.ensureRoot();
    const el = document.createElement('div');
    Object.assign(el.style, {
      marginBottom: '8px',
      background: 'rgba(255,140,0,.9)',
      padding: '8px 10px',
      borderRadius: '6px',
      boxShadow: '0 2px 6px rgba(0,0,0,.2)',
      whiteSpace: 'pre-wrap',
    });
    el.textContent = `⚠ ${msg}`;
    this.root!.appendChild(el);
    setTimeout(() => el.remove(), 8000);
  }

  error(msg: string) {
    this.ensureRoot();
    const el = document.createElement('div');
    Object.assign(el.style, {
      marginBottom: '8px',
      background: 'rgba(220,53,69,.95)',
      padding: '8px 10px',
      borderRadius: '6px',
      boxShadow: '0 2px 6px rgba(0,0,0,.25)',
      whiteSpace: 'pre-wrap',
    });
    el.textContent = `❌ ${msg}`;
    this.root!.appendChild(el);
    setTimeout(() => el.remove(), 12000);
  }
}

export const errorOverlay = new ErrorOverlay();
