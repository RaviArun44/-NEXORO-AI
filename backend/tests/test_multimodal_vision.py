import os
import io
import pytest
from PIL import Image
from app.services.vision_service import vision_service
from app.services.ai_engine import ai_engine
from app.services.speech_service import speech_service
from app.core.config import settings

@pytest.fixture
def sample_images(tmp_path):
    """Creates two dummy test images to verify multi-image vision analysis."""
    # Image 1: Blue rectangle
    img1_path = str(tmp_path / "test_product_blue.jpg")
    img1 = Image.new("RGB", (300, 200), color=(30, 80, 220))
    img1.save(img1_path, "JPEG")

    # Image 2: Red rectangle
    img2_path = str(tmp_path / "test_product_red.jpg")
    img2 = Image.new("RGB", (300, 200), color=(220, 40, 40))
    img2.save(img2_path, "JPEG")

    return [img1_path, img2_path]

def test_single_image_analysis(sample_images):
    img_path = sample_images[0]
    analysis = vision_service.analyze_image_file(img_path, "product_sample.jpg")

    assert analysis["width"] == 300
    assert analysis["height"] == 200
    assert analysis["format"] == "JPEG"
    assert "Blue" in analysis["dominant_colors"] or len(analysis["dominant_colors"]) > 0
    assert "detected_category" in analysis

@pytest.mark.asyncio
async def test_multi_image_comparative_answer(sample_images):
    info1 = vision_service.analyze_image_file(sample_images[0], "blue.jpg")
    info2 = vision_service.analyze_image_file(sample_images[1], "red.jpg")

    res = await vision_service.generate_image_answer(
        images_info=[info1, info2],
        user_query="Can you compare these two uploaded product images?",
        language="en"
    )

    assert res["grounded"] is True
    assert res["images_count"] == 2
    assert "Image 1" in res["reply_text"]
    assert "Image 2" in res["reply_text"]

@pytest.mark.asyncio
async def test_tamil_multi_image_answer(sample_images):
    info1 = vision_service.analyze_image_file(sample_images[0], "blue.jpg")
    info2 = vision_service.analyze_image_file(sample_images[1], "red.jpg")

    res = await vision_service.generate_image_answer(
        images_info=[info1, info2],
        user_query="இந்த இரண்டு படங்களையும் ஒப்பிட்டு சொல்லுங்கள்",
        language="ta"
    )

    assert res["grounded"] is True
    assert "பகுப்பாய்வு" in res["reply_text"] or "படங்களையும்" in res["reply_text"]

@pytest.mark.asyncio
async def test_smart_conversation_never_silent():
    # 1. Greeting
    greet_res = await ai_engine.generate_response(
        customer_query="Hello! How are you doing today?",
        conversation_history=[],
        grounded_context=[],
        forced_language="en"
    )
    assert greet_res["grounded"] is True
    assert "Khaira" in greet_res["text"]
    assert greet_res["trigger_handoff"] is False

    # 2. General Explanation Question
    explain_res = await ai_engine.generate_response(
        customer_query="Can you explain how artificial intelligence works in voice automation?",
        conversation_history=[],
        grounded_context=[],
        forced_language="en"
    )
    assert len(explain_res["text"]) > 20
    assert explain_res["trigger_handoff"] is False

    # 3. Random / Out of context message
    random_res = await ai_engine.generate_response(
        customer_query="xyz999qwerty unsupported random sentence",
        conversation_history=[],
        grounded_context=[],
        forced_language="en"
    )
    assert len(random_res["text"]) > 20
    assert "Khaira" in random_res["text"] or "assist" in random_res["text"] or "clarify" in random_res["text"]
    assert random_res["trigger_handoff"] is False

@pytest.mark.asyncio
async def test_speech_synthesis_config():
    tts = await speech_service.synthesize_speech("Hello, this is a test audio response.", language="en")
    assert tts["text"] == "Hello, this is a test audio response."
    assert tts["voice_id"] == "en-IN-NeerjaNeural"
    assert tts["language"] == "en"

    tts_ta = await speech_service.synthesize_speech("வணக்கம்", language="ta")
    assert tts_ta["voice_id"] == "ta-IN-PallaviNeural"
    assert tts_ta["language"] == "ta"
