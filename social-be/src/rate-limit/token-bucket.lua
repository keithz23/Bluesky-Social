-- KEYS[1] = bucket key
-- ARGV[1] = capacity, ARGV[2] = refill_rate (tokens/sec), ARGV[3] = now (ms), ARGV[4] = requested

local bucket = redis.call("HMGET", KEYS[1], "tokens", "last_refill")
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

if tokens == nil then
  tokens = capacity
  last_refill = now
end

local delta_sec = math.max(0, (now - last_refill) / 1000)
tokens = math.min(capacity, tokens + delta_sec * refill_rate)

local allowed = 0
if tokens >= requested then
  tokens = tokens - requested
  allowed = 1
end

redis.call("HMSET", KEYS[1], "tokens", tokens, "last_refill", now)
redis.call("PEXPIRE", KEYS[1], 3600000)

return {allowed, tokens}