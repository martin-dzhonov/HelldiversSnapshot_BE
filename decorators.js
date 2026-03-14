const {
    defaultDetailsItem
} = require('./constants');

const withTiming = (handler) => async (req, res, next) => {
    const start = Date.now();
    try {
        await handler(req, res, next);
    } catch (err) {
        next(err);
    } finally {
        console.log(`${req.route?.path || req.originalUrl} took ${Date.now() - start}ms`);
    }
};

const withCache = (cache, getCacheKey, handler) => async (req, res) => {
    try {
        const cacheKey = getCacheKey(req);
        const cached = cache.get(cacheKey);
        if (cached !== undefined) return res.send(cached);

        const result = await handler(req, res);
        if (result !== undefined) {
            cache.set(cacheKey, result);
            return res.send(result);
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};



const withDetailsCache = (cache, getCacheKey, handler) => async (req, res) => {
    try {
      const cacheKey = getCacheKey(req);
  
      let items = cache.get(cacheKey);
  
      if (items === undefined) {
        items = await handler(req);
        if (items !== undefined) cache.set(cacheKey, items);
      }
  
      const item = items?.[req.query.id];
  
      res.send(item ?? defaultDetailsItem);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

module.exports = {
    withCache,
    withTiming,
    withDetailsCache
};