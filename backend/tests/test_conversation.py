import pytest
from app.services.ai_engine import ai_engine

@pytest.mark.asyncio
async def test_grounded_response_with_product_data():
    product_data = {
        "product": {
            "sku": "NEX-VOICE-PRO",
            "name": "NEXORA Pro AI Voice Gateway",
            "price": 899.00,
            "currency": "USD",
            "stock_quantity": 24
        }
    }
    
    res = await ai_engine.generate_response(
        customer_query="How much is the voice gateway and is it in stock?",
        conversation_history=[],
        grounded_context=[],
        business_data=product_data,
        forced_language="en"
    )
    
    assert res["grounded"] is True
    assert "899" in res["text"]
    assert "NEXORA Pro AI Voice Gateway" in res["text"]
    assert res["trigger_handoff"] is False

@pytest.mark.asyncio
async def test_unknown_question_refusal_and_handoff():
    res = await ai_engine.generate_response(
        customer_query="What is the internal personal home address of the CEO?",
        conversation_history=[],
        grounded_context=[],
        business_data=None,
        forced_language="en"
    )
    
    assert res["grounded"] is False
    assert res["trigger_handoff"] is True
    assert "specialist" in res["text"].lower() or "apologize" in res["text"].lower()

@pytest.mark.asyncio
async def test_multilingual_tamil_order_grounding():
    order_data = {
        "order": {
            "order_number": "ORD-998822",
            "status": "SHIPPED",
            "tracking_number": "BLUEDART-88219",
            "courier_name": "BlueDart Express"
        }
    }
    res = await ai_engine.generate_response(
        customer_query="என்னுடைய ஆர்டர் ORD-998822 எப்போது கிடைக்கும்?",
        conversation_history=[],
        grounded_context=[],
        business_data=order_data,
        forced_language="ta"
    )
    assert res["grounded"] is True
    assert "ORD-998822" in res["text"]
    assert "SHIPPED" in res["text"]
    assert res["language"] == "ta"

@pytest.mark.asyncio
async def test_human_handoff_explicit_intent():
    res = await ai_engine.generate_response(
        customer_query="I need to talk to a human agent right now",
        conversation_history=[],
        grounded_context=[],
        business_data=None,
        forced_language="en"
    )
    assert res["intent"] == "HUMAN_HANDOFF"
    assert res["trigger_handoff"] is True

