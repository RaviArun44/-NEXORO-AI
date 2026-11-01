import pytest
from app.services.call_signaling import call_signaling

@pytest.mark.asyncio
async def test_call_signaling_lifecycle():
    call_data = {
        "id": "call-test-sig-123",
        "caller_name": "Test Customer",
        "caller_number": "+91-98401-00199",
        "status": "REQUESTED"
    }

    # 1. Notify call requested
    await call_signaling.notify_call_requested(call_data)
    pending = call_signaling.get_pending_calls()
    assert any(c["id"] == "call-test-sig-123" for c in pending)

    # 2. Notify call accepted
    await call_signaling.notify_call_accepted("call-test-sig-123", {"id": "call-test-sig-123", "status": "IN_PROGRESS"})
    pending_after_accept = call_signaling.get_pending_calls()
    assert not any(c["id"] == "call-test-sig-123" for c in pending_after_accept)

    # 3. Request another and reject
    call_data_2 = {"id": "call-test-sig-456", "status": "REQUESTED"}
    await call_signaling.notify_call_requested(call_data_2)
    assert any(c["id"] == "call-test-sig-456" for c in call_signaling.get_pending_calls())

    await call_signaling.notify_call_rejected("call-test-sig-456", "Agent unavailable")
    assert not any(c["id"] == "call-test-sig-456" for c in call_signaling.get_pending_calls())
