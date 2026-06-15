type RequestMetric = {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
};

type RouteMetric = {
  count: number;
  errors: number;
  totalLatencyMs: number;
  maxLatencyMs: number;
};

export class RuntimeMetrics {
  private static readonly startedAt = Date.now();
  private static totalRequests = 0;
  private static totalErrors = 0;
  private static inFlightRequests = 0;
  private static totalLatencyMs = 0;
  private static readonly statusCounts = new Map<number, number>();
  private static readonly routes = new Map<string, RouteMetric>();

  static onRequestStart() {
    this.inFlightRequests += 1;
  }

  static onRequestEnd(metric: RequestMetric) {
    this.inFlightRequests = Math.max(0, this.inFlightRequests - 1);
    this.totalRequests += 1;
    this.totalLatencyMs += metric.durationMs;

    if (metric.statusCode >= 500) {
      this.totalErrors += 1;
    }

    this.statusCounts.set(
      metric.statusCode,
      (this.statusCounts.get(metric.statusCode) ?? 0) + 1,
    );

    const key = `${metric.method} ${metric.route}`;
    const current = this.routes.get(key) ?? {
      count: 0,
      errors: 0,
      totalLatencyMs: 0,
      maxLatencyMs: 0,
    };

    current.count += 1;
    current.totalLatencyMs += metric.durationMs;
    current.maxLatencyMs = Math.max(current.maxLatencyMs, metric.durationMs);
    if (metric.statusCode >= 500) current.errors += 1;

    this.routes.set(key, current);
  }

  static snapshot() {
    const uptimeMs = Date.now() - this.startedAt;
    const avgLatencyMs =
      this.totalRequests > 0 ? this.totalLatencyMs / this.totalRequests : 0;

    const topRoutes = Array.from(this.routes.entries())
      .map(([route, metric]) => ({
        route,
        count: metric.count,
        errors: metric.errors,
        avgLatencyMs:
          metric.count > 0 ? metric.totalLatencyMs / metric.count : 0,
        maxLatencyMs: metric.maxLatencyMs,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      uptimeMs,
      uptimeSeconds: Math.floor(uptimeMs / 1000),
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      inFlightRequests: this.inFlightRequests,
      avgLatencyMs,
      statusCounts: Object.fromEntries(this.statusCounts.entries()),
      topRoutes,
      memory: process.memoryUsage(),
    };
  }

  static toPrometheus() {
    const snapshot = this.snapshot();
    const lines = [
      '# HELP app_uptime_seconds Process uptime in seconds.',
      '# TYPE app_uptime_seconds gauge',
      `app_uptime_seconds ${snapshot.uptimeSeconds}`,
      '# HELP app_http_requests_total Total HTTP requests handled.',
      '# TYPE app_http_requests_total counter',
      `app_http_requests_total ${snapshot.totalRequests}`,
      '# HELP app_http_errors_total Total HTTP 5xx responses.',
      '# TYPE app_http_errors_total counter',
      `app_http_errors_total ${snapshot.totalErrors}`,
      '# HELP app_http_in_flight_requests Current in-flight HTTP requests.',
      '# TYPE app_http_in_flight_requests gauge',
      `app_http_in_flight_requests ${snapshot.inFlightRequests}`,
      '# HELP app_http_avg_latency_ms Average HTTP request latency in milliseconds.',
      '# TYPE app_http_avg_latency_ms gauge',
      `app_http_avg_latency_ms ${snapshot.avgLatencyMs.toFixed(2)}`,
      '# HELP app_memory_rss_bytes Resident set memory size in bytes.',
      '# TYPE app_memory_rss_bytes gauge',
      `app_memory_rss_bytes ${snapshot.memory.rss}`,
      '# HELP app_memory_heap_used_bytes Used heap memory in bytes.',
      '# TYPE app_memory_heap_used_bytes gauge',
      `app_memory_heap_used_bytes ${snapshot.memory.heapUsed}`,
    ];

    for (const [statusCode, count] of Object.entries(snapshot.statusCounts)) {
      lines.push(
        `app_http_responses_total{status_code="${statusCode}"} ${count}`,
      );
    }

    return `${lines.join('\n')}\n`;
  }
}
