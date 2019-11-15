# page-cache

Support you to store data when jump to other page, restore data when go back or jump to original page.

## FEATURES

1. use SessionStorage in the default, support LocalStorage either(use `store2`)
2. only ESModule
3. support `checkGoBack`: restore if only goback to original page
4. support `timeout`, default 1h

## USAGE

```bash
> npm i -S page-cache
```

```javascript
import PageCache from 'page-cache';

const CACHE_PREFIX = 'CACHE_PREFIX';

const cache = new PageCache({
    prefix: CACHE_PREFIX,
    checkGoBack: true,
    timeout: 1000 * 60 * 60 * 24
});

// restore data when back to original page again
let {
    data1,
    data2 = 0
} = cache.restore(({data1 = {}} = {}) => data1 === 'xxx1'); // check if to restore

cache.set('data1', 'xxx');
setTimeout(() => {
    cache.set('data2', ++data2); // you could set anytime
    cache.set('data1', 'xxx1'); // or update anytime
    // don't worry about performance,
    // data will set to 'local/session storage' when page leaving
}, 1000);

```
