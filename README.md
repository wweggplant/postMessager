# postMessager

A support window, and iframe label page before communication library. Based on the postMessage. Use the typescript.

[online demo](http://wangjojo.gitee.io/postmessager/sample/)



# usage

page parent:

```html
<input type="text" id="text">
<button>send</button>    
<iframe src="child" frameborder="0"></iframe>
```
```javascript 
  const p = new PostMessager({
    id: 'parent',
    target: document.querySelector('iframe').contentWindow
  })
  // send message
  document.querySelector('button').addEventListener('click', function() {
    p.send('child', { message:  document.querySelector('input').value })
  })
```

page child:
```html
message from page parent:<p></p>
```
```javascript 
  const child = new PostMessager({
    id: 'child',
    target: window.parent
  });
  child.on('receive', function(content, event) {
    console.log(content.message)
    document.querySelector('p').innerHTML = content.message
  })
```

# reference

1. [postMessage`s compatibility](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7)
2. [postmate](https://github.com/dollarshaveclub/postmate)


