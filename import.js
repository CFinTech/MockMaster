// import.js
class MyTemplate extends HTMLElement {
    async connectedCallback() {
        const src = this.getAttribute('src');
        if (!src) {
            console.error('<my-template> 需要 src 属性');
            return;
        }
        try {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.innerHTML = await res.text();
            // 模板插入完毕，派发事件
            this.dispatchEvent(new CustomEvent('template-loaded', { bubbles: true }));
        } catch (err) {
            this.innerHTML = `<pre style="color:red">模板加载失败: ${err.message}</pre>`;
            console.error(err);
        }
    }
}
customElements.define('my-template', MyTemplate);
