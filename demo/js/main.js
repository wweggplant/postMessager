const p = new PostMessager({name: 'main', container: window, domain: location.href })
const s = p.connect(() => document.querySelector('iframe').contentWindow)