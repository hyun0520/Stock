const cache = new Map();

function getTTLByRange(range) {
  switch (range) {
    case "1d":
      return Number(process.env.CHART_TTL_1D || 3600);
    case "1w":
      return Number(process.env.CHART_TTL_1W || 7200);
    case "1m":
      return Number(process.env.CHART_TTL_1M || 10800);
    default:
      return Number(process.env.CHART_TTL_LONG || 21600);
  }
}

export function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expireAt) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

export function setCache(key, data, range) {
  const ttl = getTTLByRange(range);
  cache.set(key, {
    data,
    expireAt: Date.now() + ttl * 1000
  });
}
