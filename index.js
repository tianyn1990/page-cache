import store2 from 'store2';

const TIMESTAMP = 'TIMESTAMP'; // 时间戳的缓存关键字
const DEF_TIMEOUT = 1000 * 60 * 60; // 默认超时时间 1h

// 离开页面时保存页面数据，重新进入或通过后退操作回到页面时获取保存的数据
class PageCache{
    /**
     * @param {String}  prefix [必填] 关键字前缀
     * @param {String}  type 缓存类型 session/local（默认'session'，使用sessionStorage）
     * @param {Number}  timeout 缓存超时时间，毫秒（默认3600000=1h）
     * @param {Boolean} checkGoBack 是否只在页面返回的时候才可以获取缓存数据
     */
    constructor({ prefix, type = 'session', timeout = DEF_TIMEOUT, checkGoBack = false } = {}) {
        if(typeof prefix !== 'string') {
            throw new Error('Expected paremeter `prefix` is String');
        }
        if(~prefix.indexOf('?') || ~prefix.indexOf('&')) {
            throw new Error('Expected paremeter `prefix` don\'t have `?` or `&` character');
        }
        if(!~['session', 'local'].indexOf(type)) {
            throw new Error('Expected paremeter `type` is \'session\' or \'local\'');
        }
        this.prefix = prefix;
        this.type = type;
        this.store = store2[this.type]; // 缓存工具对象（由缓存类型确定）
        this.timeout = timeout; // 缓存数据超时时间
        this.noStore = true; // 是否没有缓存数据
        this.data = {}; // 所有需要缓存的数据
        this.checkGoBack = checkGoBack;
        this.urlQueryTag = `&cache_${prefix}=1`; // 页面返回标记

        // 离开页面时，缓存所有数据
        window.addEventListener('unload', () => {
            if(this.noStore) {
                return;
            }

            // 在url参数中上添加标记
            if(this.checkGoBack) {
                const link = location.href;
                const newlink = `${link}${~link.indexOf('?') ? '' : '?'}${this.urlQueryTag}`;
                history.replaceState && history.replaceState({}, null, newlink);
            }

            Object.keys(this.data || {}).forEach((key) => {
                this.store.set(this._getCacheKey(key), this.data[key]);
            });
        });
    }
    /**
     * 添加缓存
     * @param {String} key 缓存关键字（获取缓存数据时，返回的也是这个key）
     * @param {String|Number|Boolean|Object} data 缓存的数据
     */
    set(key, data) {
        if(typeof key !== 'string') {
            throw new Error('Expected paremeter `key` is String');
        }
        this.data[key] = data;
        // 第一次添加缓存，同时添加时间戳
        if(this.noStore) {
            this.noStore = false;
            this.data[TIMESTAMP] = +new Date();
        }
    }
    /**
     * 删除并返回所有缓存数据
     * @param {Function} check 传入的校验函数。缓存内容超时or校验函数返回false，则返回空对象
     */
    restore(check) {
        const keys = this.store.keys();
        // 清空并获取所有存储的值
        let res = {};
        keys.forEach((cacheKey) => {
            if(cacheKey.indexOf(this.prefix) === 0) {
                const data = this.store.remove(cacheKey);
                res[this._getOriginKey(cacheKey)] = data;
            }
        });
        // 校验：页面返回的时候才可以获取缓存数据
        if(this.checkGoBack) {
            const link = location.href;
            if(!~link.indexOf(this.urlQueryTag)) {
                return {};
            }
            history.replaceState({}, null, link.replace(this.urlQueryTag, ''));
        }
        // 时间戳不存在 or 超时 -> 返回空
        const timestamp = res[TIMESTAMP];
        if(!timestamp || (+new Date() - timestamp) > this.timeout) {
            return {};
        }
        // 传入的校验函数返回false
        if(typeof check === 'function' && !check(res)) {
            return {};
        }
        return res;
    }
    _getCacheKey(key) {
        return `${this.prefix}${key}`;
    }
    _getOriginKey(cacheKey) {
        return cacheKey.replace(this.prefix, '');
    }
}

export default PageCache;