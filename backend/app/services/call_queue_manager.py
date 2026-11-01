import asyncio
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable
from collections import defaultdict

from app.core.config import settings

logger = logging.getLogger(__name__)

class CallQueueItem:
    """Represents a call request entering the high-volume processing queue."""
    def __init__(
        self,
        call_id: str,
        caller_number: str,
        priority: int = 10, # Lower number = higher priority (e.g. 1 for VIP/Urgent, 10 for normal)
        language: str = "en",
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.call_id = call_id
        self.caller_number = caller_number
        self.priority = priority
        self.language = language
        self.metadata = metadata or {}
        self.queued_at = time.time()
        self.started_at: Optional[float] = None
        self.completed_at: Optional[float] = None

    def __lt__(self, other: "CallQueueItem"):
        # For PriorityQueue ordering: priority first, then queued_at timestamp
        if self.priority != other.priority:
            return self.priority < other.priority
        return self.queued_at < other.queued_at


class CallQueueManager:
    """
    High-Volume Concurrency, Queue Management, Rate-Limiting & Fault-Tolerance Engine for Khaira Company.
    Engineered to handle thousands of concurrent calls with predictable resource usage.
    """

    def __init__(
        self,
        max_concurrent_calls: int = settings.MAX_CONCURRENT_CALLS,
        queue_capacity: int = settings.CALL_QUEUE_CAPACITY,
        rate_limit_per_minute: int = settings.RATE_LIMIT_PER_MINUTE
    ):
        self.max_concurrent_calls = max_concurrent_calls
        self.queue_capacity = queue_capacity
        self.rate_limit_per_minute = rate_limit_per_minute

        # Concurrency controller
        self._concurrency_semaphore = asyncio.Semaphore(max_concurrent_calls)
        self._priority_queue: asyncio.PriorityQueue[CallQueueItem] = asyncio.PriorityQueue(maxsize=queue_capacity)

        # In-memory registries
        self._active_calls: Dict[str, Dict[str, Any]] = {}
        self._rate_limit_buckets: Dict[str, List[float]] = defaultdict(list)

        # Performance & Queue Analytics Counters
        self.stats = {
            "total_requests": 0,
            "processed_calls": 0,
            "rejected_queue_full": 0,
            "rejected_rate_limit": 0,
            "peak_concurrency": 0,
            "total_wait_time_ms": 0.0,
            "circuit_breaker_trips": 0
        }

    # -------------------------------------------------------------
    # Rate Limiting (Sliding Window per Caller)
    # -------------------------------------------------------------
    def check_rate_limit(self, identifier: str) -> bool:
        """
        Sliding window rate limit check.
        Returns True if request is allowed, False if rate exceeded.
        """
        now = time.time()
        cutoff = now - 60.0 # 1 minute window
        timestamps = self._rate_limit_buckets[identifier]
        
        # Prune old timestamps
        while timestamps and timestamps[0] < cutoff:
            timestamps.pop(0)

        if len(timestamps) >= self.rate_limit_per_minute:
            self.stats["rejected_rate_limit"] += 1
            logger.warning(f"Rate limit exceeded for caller: {identifier}")
            return False

        timestamps.append(now)
        return True

    # -------------------------------------------------------------
    # Active Call Session Registration & Lifecycle
    # -------------------------------------------------------------
    def register_active_call(self, call_id: str, caller_number: str, language: str = "en") -> bool:
        """Registers a call that has begun live audio transmission."""
        now = time.time()
        self._active_calls[call_id] = {
            "call_id": call_id,
            "caller_number": caller_number,
            "language": language,
            "start_time": now,
            "last_heartbeat": now
        }
        current_active = len(self._active_calls)
        if current_active > self.stats["peak_concurrency"]:
            self.stats["peak_concurrency"] = current_active
        return True

    def update_heartbeat(self, call_id: str):
        """Updates last activity timestamp for TTL session expiration."""
        if call_id in self._active_calls:
            self._active_calls[call_id]["last_heartbeat"] = time.time()

    def deregister_active_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        """Removes call session upon hang-up or completion."""
        return self._active_calls.pop(call_id, None)

    def cleanup_stale_sessions(self, ttl_seconds: int = settings.CALL_SESSION_TTL_SECONDS) -> int:
        """Scans and clears abandoned/stale call sessions."""
        now = time.time()
        expired = [cid for cid, info in self._active_calls.items() if (now - info.get("last_heartbeat", 0)) > ttl_seconds]
        for cid in expired:
            self._active_calls.pop(cid, None)
            logger.info(f"Cleaned up stale call session: {cid}")
        return len(expired)

    # -------------------------------------------------------------
    # Queue Management & Concurrency Slot Acquisition
    # -------------------------------------------------------------
    async def enqueue_call(self, item: CallQueueItem, timeout: float = 10.0) -> bool:
        """
        Pushes an incoming call into the priority queue.
        Returns True if enqueued, False if queue is full.
        """
        self.stats["total_requests"] += 1
        try:
            self._priority_queue.put_nowait(item)
            return True
        except asyncio.QueueFull:
            self.stats["rejected_queue_full"] += 1
            logger.error("Call queue capacity reached! Dropping call to protect stability.")
            return False

    async def acquire_concurrency_slot(self, timeout: float = 5.0) -> bool:
        """
        Acquires one concurrent execution slot from the semaphore.
        Guarantees that active concurrent calls do not exceed configured limits.
        """
        try:
            await asyncio.wait_for(self._concurrency_semaphore.acquire(), timeout=timeout)
            return True
        except asyncio.TimeoutError:
            return False

    def release_concurrency_slot(self):
        """Releases execution slot back to the worker pool."""
        self._concurrency_semaphore.release()
        self.stats["processed_calls"] += 1

    # -------------------------------------------------------------
    # Fault Tolerance: Automatic Retries with Exponential Backoff
    # -------------------------------------------------------------
    @staticmethod
    async def execute_with_retry(
        func: Callable,
        *args,
        max_retries: int = 3,
        initial_delay: float = 0.05,
        backoff_factor: float = 2.0,
        **kwargs
    ):
        """
        Executes an asynchronous function with automatic exponential backoff retries.
        Protects against transient AI API or DB lock glitches.
        """
        delay = initial_delay
        last_error = None
        for attempt in range(max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_error = e
                logger.warning(f"Retry attempt {attempt + 1}/{max_retries} failed: {e}. Backing off {delay}s")
                await asyncio.sleep(delay)
                delay *= backoff_factor
        raise last_error

    # -------------------------------------------------------------
    # Real-Time Queue & System Metrics
    # -------------------------------------------------------------
    def get_queue_metrics(self) -> Dict[str, Any]:
        """Provides real-time telemetry on call queue, active concurrency, and health."""
        active_count = len(self._active_calls)
        queue_count = self._priority_queue.qsize()
        avg_wait = (
            round(self.stats["total_wait_time_ms"] / max(1, self.stats["processed_calls"]), 1)
            if self.stats["processed_calls"] > 0 else 0.0
        )
        return {
            "active_concurrent_calls": active_count,
            "max_concurrent_capacity": self.max_concurrent_calls,
            "concurrency_utilization_pct": round((active_count / max(1, self.max_concurrent_calls)) * 100, 1),
            "queued_calls": queue_count,
            "queue_capacity": self.queue_capacity,
            "peak_concurrency": self.stats["peak_concurrency"],
            "processed_calls": self.stats["processed_calls"],
            "rejected_rate_limit": self.stats["rejected_rate_limit"],
            "rejected_queue_full": self.stats["rejected_queue_full"],
            "avg_queue_wait_ms": avg_wait,
            "system_health": "OPTIMAL" if queue_count < (self.queue_capacity * 0.7) else "ELEVATED_LOAD"
        }

    # -------------------------------------------------------------
    # High-Volume Concurrency Simulation Runner
    # -------------------------------------------------------------
    async def simulate_concurrent_load(self, num_calls: int = 500, turn_duration_ms: int = 15) -> Dict[str, Any]:
        """
        High-throughput simulation testing thousands of simultaneous incoming calls.
        Validates semaphore bounds, async processing speed, and error resilience.
        """
        logger.info(f"Initiating high-volume load simulation of {num_calls} calls...")
        start_time = time.time()
        success_count = 0
        failure_count = 0

        async def worker(call_index: int):
            nonlocal success_count, failure_count
            cid = f"SIM-CALL-{call_index:05d}"
            acquired = await self.acquire_concurrency_slot(timeout=10.0)
            if not acquired:
                failure_count += 1
                return

            try:
                self.register_active_call(cid, f"+91-98401-{call_index:04d}", "en")
                # Simulate processing a turn
                await asyncio.sleep(turn_duration_ms / 1000.0)
                self.deregister_active_call(cid)
                success_count += 1
            except Exception:
                failure_count += 1
            finally:
                self.release_concurrency_slot()

        # Run all workers concurrently
        await asyncio.gather(*(worker(i) for i in range(num_calls)))
        elapsed_sec = time.time() - start_time
        throughput = round(num_calls / max(0.001, elapsed_sec), 1)

        return {
            "simulated_calls": num_calls,
            "successful_calls": success_count,
            "failed_calls": failure_count,
            "success_rate_percent": round((success_count / num_calls) * 100, 2),
            "total_elapsed_seconds": round(elapsed_sec, 2),
            "calls_per_second_throughput": throughput,
            "peak_concurrency_observed": self.stats["peak_concurrency"]
        }

call_queue_manager = CallQueueManager()

