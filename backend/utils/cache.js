const cache = new Map();

// Default TTL: 5 minutes (in milliseconds)
const DEFAULT_TTL = 5 * 60 * 1000;

let hits = 0;
let misses = 0;

const set = (key, value, ttl = DEFAULT_TTL) => {
    const expiresAt = Date.now() + ttl;
    cache.set(key, { value, expiresAt });
};

const get = (key) => {
    const item = cache.get(key);
    
    if (!item) {
        misses++;
        return null;
    }
    
    if (Date.now() > item.expiresAt) {
        cache.delete(key);
        misses++;
        return null;
    }
    
    hits++;
    return item.value;
};

const del = (key) => {
    cache.delete(key);
};

const clear = () => {
    cache.clear();
};

const getCacheStats = () => {
    return { hits, misses, keys: cache.size };
};

// Expose internal cache map exclusively for cleanup job
const _getCacheMap = () => cache;

module.exports = {
    set,
    get,
    del,
    clear,
    getCacheStats,
    _getCacheMap
};
