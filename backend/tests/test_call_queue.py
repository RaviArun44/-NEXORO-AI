import pytest
import asyncio
from app.services.call_queue_manager import CallQueueManager, CallQueueItem

@pytest.mark.asyncio
async def test_queue_priority_ordering():
    manager = CallQueueManager(max_concurrent_calls=10, queue_capacity=100)
    
    normal_item = CallQueueItem("c_normal", "+1001", priority=10)
    vip_item = CallQueueItem("c_vip", "+1002", priority=1)
    urgent_item = CallQueueItem("c_urgent", "+1003", priority=2)

    await manager.enqueue_call(normal_item)
    await manager.enqueue_call(vip_item)
    await manager.enqueue_call(urgent_item)

    # Pop order must be: VIP (1) -> Urgent (2) -> Normal (10)
    first = await manager._priority_queue.get()
    second = await manager._priority_queue.get()
    third = await manager._priority_queue.get()

    assert first.call_id == "c_vip"
    assert second.call_id == "c_urgent"
    assert third.call_id == "c_normal"

@pytest.mark.asyncio
async def test_rate_limiting():
    manager = CallQueueManager(rate_limit_per_minute=3)
    caller = "+91-98401-RATE-TEST"

    assert manager.check_rate_limit(caller) is True
    assert manager.check_rate_limit(caller) is True
    assert manager.check_rate_limit(caller) is True
    # 4th request within 1 min must be rejected
    assert manager.check_rate_limit(caller) is False

@pytest.mark.asyncio
async def test_concurrency_slots_and_metrics():
    manager = CallQueueManager(max_concurrent_calls=2, queue_capacity=10)

    # Acquire slot 1
    slot1 = await manager.acquire_concurrency_slot(timeout=1.0)
    assert slot1 is True

    # Acquire slot 2
    slot2 = await manager.acquire_concurrency_slot(timeout=1.0)
    assert slot2 is True

    # 3rd attempt must timeout since limit is 2
    slot3 = await manager.acquire_concurrency_slot(timeout=0.1)
    assert slot3 is False

    # Release slot 1
    manager.release_concurrency_slot()
    # Now slot should be available
    slot3_retry = await manager.acquire_concurrency_slot(timeout=1.0)
    assert slot3_retry is True

    manager.release_concurrency_slot()
    manager.release_concurrency_slot()

@pytest.mark.asyncio
async def test_high_volume_concurrency_simulation():
    manager = CallQueueManager(max_concurrent_calls=50, queue_capacity=500)
    # Simulate 100 concurrent calls
    result = await manager.simulate_concurrent_load(num_calls=100, turn_duration_ms=10)
    
    assert result["simulated_calls"] == 100
    assert result["successful_calls"] == 100
    assert result["failed_calls"] == 0
    assert result["success_rate_percent"] == 100.0
    assert result["calls_per_second_throughput"] > 0

