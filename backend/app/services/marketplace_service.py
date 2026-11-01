import logging
from typing import Dict, Any, List, Optional
from decimal import Decimal

logger = logging.getLogger(__name__)

class MarketplaceService:
    """
    Unified Multi-Marketplace Integration & White-Label Catalog Engine.
    Combines inventory feeds from Amazon, Flipkart, and Meesho into a single,
    independent e-commerce catalog while maintaining internal fulfillment metadata.
    
    Official API Architecture:
    - Amazon: SP-API (Selling Partner API) / Product Advertising API
    - Flipkart: Affiliate Product Feed API
    - Meesho: Supplier / Dropship Catalog Integration
    """

    CATEGORIES = [
        {"name": "Electronics", "slug": "electronics", "icon": "Cpu", "description": "Smart gadgets, audio systems, and high-performance electronics"},
        {"name": "Mobiles and Accessories", "slug": "mobiles-accessories", "icon": "Smartphone", "description": "Latest smartphones, cases, chargers, and premium mobile gear"},
        {"name": "Laptops and Computers", "slug": "laptops-computers", "icon": "Laptop", "description": "Workstations, ultrabooks, gaming rigs, and computing accessories"},
        {"name": "Fashion and Clothing", "slug": "fashion-clothing", "icon": "Shirt", "description": "Trendy apparel, designer wear, and seasonal fashion collections"},
        {"name": "Men's Fashion", "slug": "mens-fashion", "icon": "User", "description": "Suits, casual shirts, denim, footwear, and men's lifestyle wear"},
        {"name": "Women's Fashion", "slug": "womens-fashion", "icon": "Sparkles", "description": "Ethnic wear, western dresses, jewelry, and luxury women's fashion"},
        {"name": "Home Appliances", "slug": "home-appliances", "icon": "Tv", "description": "Smart televisions, refrigerators, washing machines, and cooling units"},
        {"name": "Kitchen Products", "slug": "kitchen-products", "icon": "Coffee", "description": "Cookware, kitchen appliances, blenders, and culinary essentials"},
        {"name": "Beauty and Personal Care", "slug": "beauty-personal-care", "icon": "Heart", "description": "Skincare, haircare, perfumes, and daily grooming essentials"},
        {"name": "Grocery", "slug": "grocery", "icon": "ShoppingBag", "description": "Organic staples, dry fruits, beverages, and gourmet pantry supplies"},
        {"name": "Furniture", "slug": "furniture", "icon": "Home", "description": "Ergonomic chairs, wooden tables, modern sofas, and home decor"},
        {"name": "Sports and Fitness", "slug": "sports-fitness", "icon": "Activity", "description": "Gym equipment, running gear, yoga mats, and sports accessories"},
        {"name": "Books", "slug": "books", "icon": "BookOpen", "description": "Bestsellers, technical manuals, Indian literature, and academic textbooks"},
        {"name": "Toys and Baby Products", "slug": "toys-baby", "icon": "Smile", "description": "Educational toys, baby care, strollers, and child development kits"},
        {"name": "Automotive Accessories", "slug": "automotive", "icon": "Shield", "description": "Car chargers, tire inflators, bike riding gear, and vehicle detailing"},
        {"name": "Health and Lifestyle Products", "slug": "health-lifestyle", "icon": "Zap", "description": "Supplements, wellness trackers, posture correctors, and immunity boosters"},
    ]

    @classmethod
    def get_curated_catalog(cls) -> List[Dict[str, Any]]:
        """
        Returns rich curated seed products across all 16 categories.
        Internal sources (Amazon, Flipkart, Meesho) are tracked strictly in backend fields.
        Customer facing responses strip all third-party branding.
        """
        return [
            # 1. Electronics
            {
                "sku": "ELE-ANC-001",
                "name": "AuraWave Pro ANC Wireless Headphones",
                "category": "Electronics",
                "description": "High-fidelity wireless active noise-cancelling headphones with 45-hour playback, ambient transparency, and dual-microphone clarity.",
                "price": Decimal("2499.00"),
                "original_price": Decimal("4999.00"),
                "discount_pct": 50,
                "currency": "INR",
                "rating": 4.8,
                "reviews_count": 340,
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 45,
                "delivery_estimate": "Delivery Tomorrow by 2 PM",
                "specifications": {
                    "Driver Size": "40mm Dynamic Neodymium",
                    "Battery Life": "45 Hours (ANC off), 35 Hours (ANC on)",
                    "Bluetooth": "5.3 with AAC/SBC Codecs",
                    "Warranty": "1 Year Manufacturer Replacement"
                },
                "source_marketplace": "AMAZON",
                "source_product_id": "AMZ-B09W4V8G1X",
                "supplier_cost": Decimal("1800.00")
            },
            {
                "sku": "ELE-SPK-002",
                "name": "SoundPulse Waterproof Bluetooth Speaker",
                "category": "Electronics",
                "description": "IPX7 rugged waterproof outdoor speaker featuring 360-degree deep bass, RGB rhythmic lighting, and power bank charging capability.",
                "price": Decimal("1599.00"),
                "original_price": Decimal("2999.00"),
                "discount_pct": 47,
                "currency": "INR",
                "rating": 4.6,
                "reviews_count": 182,
                "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 60,
                "delivery_estimate": "Delivery within 2 business days",
                "specifications": {
                    "Output": "24W RMS Stereo",
                    "Water Resistance": "IPX7 Submersible",
                    "Playtime": "18 Hours Continuous"
                },
                "source_marketplace": "FLIPKART",
                "source_product_id": "FK-SPK-9921",
                "supplier_cost": Decimal("1100.00")
            },

            # 2. Mobiles and Accessories
            {
                "sku": "MOB-FLG-001",
                "name": "NeoZenith Ultra 5G (8GB RAM / 256GB Storage)",
                "category": "Mobiles and Accessories",
                "description": "Flagship 5G smartphone with 120Hz AMOLED Vision Display, 64MP OIS quad camera system, and 67W Turbo Flash charging.",
                "price": Decimal("21999.00"),
                "original_price": Decimal("28999.00"),
                "discount_pct": 24,
                "currency": "INR",
                "rating": 4.7,
                "reviews_count": 890,
                "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 30,
                "delivery_estimate": "Delivery in 1-2 business days",
                "specifications": {
                    "Processor": "Dimensity 8200 4nm Octa-Core",
                    "Display": "6.67 inch FHD+ 120Hz AMOLED",
                    "Battery": "5000 mAh with 67W fast charger",
                    "OS": "ZenithOS (Android 14 based)"
                },
                "source_marketplace": "AMAZON",
                "source_product_id": "AMZ-MOB-8820",
                "supplier_cost": Decimal("18500.00")
            },
            {
                "sku": "MOB-CHG-002",
                "name": "HyperCharge 65W GaN Fast Wall Charger",
                "category": "Mobiles and Accessories",
                "description": "Gallium Nitride multi-port fast adapter with Dual USB-C PD and USB-A Quick Charge 3.0 for laptops, tablets, and phones.",
                "price": Decimal("1299.00"),
                "original_price": Decimal("2499.00"),
                "discount_pct": 48,
                "currency": "INR",
                "rating": 4.9,
                "reviews_count": 420,
                "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 80,
                "delivery_estimate": "Delivery Tomorrow",
                "specifications": {
                    "Power": "65W GaN Tech",
                    "Ports": "2x USB-C + 1x USB-A",
                    "Protection": "Surge, Over-temperature, Short-circuit"
                },
                "source_marketplace": "MEESHO",
                "source_product_id": "MSH-CHG-771",
                "supplier_cost": Decimal("850.00")
            },

            # 3. Laptops and Computers
            {
                "sku": "LAP-PRO-001",
                "name": "AeroBook Pro 15.6-inch Ultrabook",
                "category": "Laptops and Computers",
                "description": "Sleek all-metal lightweight ultrabook powered by Intel Core i5 12th Gen, 16GB LPDDR5 RAM, 512GB NVMe SSD, and backlit keyboard.",
                "price": Decimal("46999.00"),
                "original_price": Decimal("59999.00"),
                "discount_pct": 22,
                "currency": "INR",
                "rating": 4.6,
                "reviews_count": 145,
                "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 18,
                "delivery_estimate": "Delivery in 2 business days",
                "specifications": {
                    "CPU": "Intel Core i5-1240P 12-Core",
                    "RAM": "16GB Dual-Channel 4800MHz",
                    "Storage": "512GB PCIe Gen4 SSD",
                    "Weight": "1.38 kg Ultra-portable"
                },
                "source_marketplace": "FLIPKART",
                "source_product_id": "FK-LAP-1029",
                "supplier_cost": Decimal("40000.00")
            },

            # 4. Fashion and Clothing
            {
                "sku": "FAS-JKT-001",
                "name": "UrbanEdge Quilted Bomber Jacket",
                "category": "Fashion and Clothing",
                "description": "Windproof quilted jacket with ribbed cuffs, premium brushed inner lining, and dual zippered utility pockets.",
                "price": Decimal("1899.00"),
                "original_price": Decimal("3999.00"),
                "discount_pct": 52,
                "currency": "INR",
                "rating": 4.5,
                "reviews_count": 210,
                "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 40,
                "delivery_estimate": "Delivery within 3 days",
                "specifications": {
                    "Material": "100% Water-repellent Poly-cotton",
                    "Fit": "Regular Modern Fit",
                    "Care": "Machine wash cold"
                },
                "source_marketplace": "MEESHO",
                "source_product_id": "MSH-JKT-332",
                "supplier_cost": Decimal("1150.00")
            },

            # 5. Men's Fashion
            {
                "sku": "MEN-SHT-001",
                "name": "Oxford Classic Pure Linen Formal Shirt",
                "category": "Men's Fashion",
                "description": "Tailored breathable 100% pure linen shirt designed for executive comfort, board meetings, and celebratory evening wear.",
                "price": Decimal("1499.00"),
                "original_price": Decimal("2499.00"),
                "discount_pct": 40,
                "currency": "INR",
                "rating": 4.7,
                "reviews_count": 315,
                "image_url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 55,
                "delivery_estimate": "Delivery Tomorrow",
                "specifications": {
                    "Fabric": "100% Natural Linen",
                    "Collar": "Cutaway Spread Collar",
                    "Pattern": "Solid Pastel"
                },
                "source_marketplace": "AMAZON",
                "source_product_id": "AMZ-MEN-9912",
                "supplier_cost": Decimal("950.00")
            },

            # 6. Women's Fashion
            {
                "sku": "WOM-KUR-001",
                "name": "Aura Silk Embroidered Anarkali Kurta Set",
                "category": "Women's Fashion",
                "description": "Handcrafted chanderi silk festive kurta set featuring delicate zari border embroidery, matching trousers, and organza dupatta.",
                "price": Decimal("2799.00"),
                "original_price": Decimal("5499.00"),
                "discount_pct": 49,
                "currency": "INR",
                "rating": 4.8,
                "reviews_count": 520,
                "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 35,
                "delivery_estimate": "Delivery in 2 business days",
                "specifications": {
                    "Set Includes": "Kurta, Trousers & Organza Dupatta",
                    "Fabric": "Pure Chanderi Silk Blend",
                    "Occasion": "Festive, Wedding & Occasion Wear"
                },
                "source_marketplace": "MEESHO",
                "source_product_id": "MSH-WOM-4401",
                "supplier_cost": Decimal("1650.00")
            },

            # 7. Home Appliances
            {
                "sku": "HAP-AIR-001",
                "name": "PureAir Smart HEPA Room Air Purifier",
                "category": "Home Appliances",
                "description": "Medical-grade H13 True HEPA filter air purifier with real-time PM2.5 digital display, whisper-quiet sleep mode, and Wi-Fi app controls.",
                "price": Decimal("6999.00"),
                "original_price": Decimal("11999.00"),
                "discount_pct": 42,
                "currency": "INR",
                "rating": 4.6,
                "reviews_count": 270,
                "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 25,
                "delivery_estimate": "Delivery Tomorrow",
                "specifications": {
                    "Coverage Area": "Up to 450 sq. ft.",
                    "Filtration": "Pre-filter + H13 True HEPA + Activated Carbon",
                    "Noise Level": "24dB Silent Night Mode"
                },
                "source_marketplace": "FLIPKART",
                "source_product_id": "FK-HAP-8812",
                "supplier_cost": Decimal("5200.00")
            },

            # 8. Kitchen Products
            {
                "sku": "KIT-FRY-001",
                "name": "CrispChef 4.5L Digital Air Fryer",
                "category": "Kitchen Products",
                "description": "Oil-free 360-degree rapid air circulation fryer with 8 preset cooking modes, touchscreen LED interface, and non-stick basket.",
                "price": Decimal("3899.00"),
                "original_price": Decimal("6999.00"),
                "discount_pct": 44,
                "currency": "INR",
                "rating": 4.8,
                "reviews_count": 480,
                "image_url": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 30,
                "delivery_estimate": "Delivery in 2 business days",
                "specifications": {
                    "Capacity": "4.5 Litres Family Size",
                    "Power": "1400 Watts High Efficiency",
                    "Temp Range": "80°C to 200°C"
                },
                "source_marketplace": "AMAZON",
                "source_product_id": "AMZ-KIT-2219",
                "supplier_cost": Decimal("2900.00")
            },

            # 9. Beauty and Personal Care
            {
                "sku": "BTY-SER-001",
                "name": "GlowBotanica 10% Vitamin C Radiance Serum",
                "category": "Beauty and Personal Care",
                "description": "Dermatologist-formulated skin brightening serum with stabilized Vitamin C, Ferulic Acid, and Hyaluronic Acid for even tone.",
                "price": Decimal("649.00"),
                "original_price": Decimal("1199.00"),
                "discount_pct": 46,
                "currency": "INR",
                "rating": 4.9,
                "reviews_count": 670,
                "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 90,
                "delivery_estimate": "Delivery Tomorrow",
                "specifications": {
                    "Volume": "30ml Dropper Bottle",
                    "Skin Type": "Suitable for all skin types",
                    "Key Actives": "10% Vitamin C, 1% Hyaluronic Acid"
                },
                "source_marketplace": "MEESHO",
                "source_product_id": "MSH-BTY-102",
                "supplier_cost": Decimal("350.00")
            },

            # 10. Grocery
            {
                "sku": "GRO-TEA-001",
                "name": "Royal Himalayan Estate Whole Leaf Green Tea (250g)",
                "category": "Grocery",
                "description": "First-flush single estate orthodox green tea harvested from high-altitude Himalayan plantations, rich in natural antioxidants.",
                "price": Decimal("499.00"),
                "original_price": Decimal("799.00"),
                "discount_pct": 37,
                "currency": "INR",
                "rating": 4.7,
                "reviews_count": 290,
                "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 70,
                "delivery_estimate": "Delivery Tomorrow",
                "specifications": {
                    "Weight": "250g Vacuum Sealed Tin",
                    "Origin": "Darjeeling & Kangra Valley",
                    "Organic Certified": "Yes, USDA & India Organic"
                },
                "source_marketplace": "FLIPKART",
                "source_product_id": "FK-GRO-338",
                "supplier_cost": Decimal("320.00")
            },

            # 11. Furniture
            {
                "sku": "FUR-CHR-001",
                "name": "ErgoRest Executive High-Back Mesh Chair",
                "category": "Furniture",
                "description": "Ergonomic work chair with adjustable lumbar support, 3D armrests, breathable mesh back, and multi-tilt lock mechanism.",
                "price": Decimal("8499.00"),
                "original_price": Decimal("14999.00"),
                "discount_pct": 43,
                "currency": "INR",
                "rating": 4.7,
                "reviews_count": 220,
                "image_url": "https://images.unsplash.com/photo-1580481077195-c2901a1d9539?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 15,
                "delivery_estimate": "Delivery within 3 business days",
                "specifications": {
                    "Weight Capacity": "140 kg Tested",
                    "Gas Lift": "Class 4 Heavy Duty Cylinder",
                    "Warranty": "3 Years Onsite Warranty"
                },
                "source_marketplace": "AMAZON",
                "source_product_id": "AMZ-FUR-5541",
                "supplier_cost": Decimal("6400.00")
            },

            # 12. Sports and Fitness
            {
                "sku": "SPT-DMB-001",
                "name": "FlexiGrip Adjustable Dumbbell Set (20kg Combo)",
                "category": "Sports and Fitness",
                "description": "Rubber-encased iron weights combo with quick-lock star collars, non-slip textured handles, and barbell converter rod.",
                "price": Decimal("2999.00"),
                "original_price": Decimal("5499.00"),
                "discount_pct": 45,
                "currency": "INR",
                "rating": 4.8,
                "reviews_count": 390,
                "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 25,
                "delivery_estimate": "Delivery in 2 business days",
                "specifications": {
                    "Total Weight": "20 kg (Plates: 4x2.5kg, 4x1.5kg, 4x1kg)",
                    "Material": "Cast Iron with Durable Vinyl Coating"
                },
                "source_marketplace": "FLIPKART",
                "source_product_id": "FK-SPT-7782",
                "supplier_cost": Decimal("2100.00")
            },

            # 13. Books
            {
                "sku": "BOK-ENT-001",
                "name": "The Autonomous Enterprise: Building AI Agentic Organizations",
                "category": "Books",
                "description": "Bestselling definitive guide on building autonomous AI agent architectures, self-executing business workflows, and voice intelligence.",
                "price": Decimal("599.00"),
                "original_price": Decimal("899.00"),
                "discount_pct": 33,
                "currency": "INR",
                "rating": 4.9,
                "reviews_count": 140,
                "image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 85,
                "delivery_estimate": "Delivery Tomorrow",
                "specifications": {
                    "Format": "Hardcover Edition, 380 Pages",
                    "Language": "English",
                    "Publisher": "TechFuture Press"
                },
                "source_marketplace": "AMAZON",
                "source_product_id": "AMZ-BOK-1120",
                "supplier_cost": Decimal("400.00")
            },

            # 14. Toys and Baby Products
            {
                "sku": "TOY-STM-001",
                "name": "RoboCraft Solar & Hydraulic STEM Building Kit",
                "category": "Toys and Baby Products",
                "description": "12-in-1 educational robotics kit for young minds, operating completely on solar energy and hydraulic mechanics without batteries.",
                "price": Decimal("1199.00"),
                "original_price": Decimal("2199.00"),
                "discount_pct": 45,
                "currency": "INR",
                "rating": 4.8,
                "reviews_count": 310,
                "image_url": "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 40,
                "delivery_estimate": "Delivery Tomorrow",
                "specifications": {
                    "Recommended Age": "8 - 14 Years",
                    "Models": "12 Convertible Configurations",
                    "Certification": "BIS Child Safety Approved"
                },
                "source_marketplace": "MEESHO",
                "source_product_id": "MSH-TOY-901",
                "supplier_cost": Decimal("750.00")
            },

            # 15. Automotive Accessories
            {
                "sku": "AUT-INF-001",
                "name": "TurbineMax 150PSI Digital Tyre Inflator",
                "category": "Automotive Accessories",
                "description": "Portable electric air compressor with emergency LED torch, auto-cutoff pressure sensor, and dual car 12V / rechargeable battery.",
                "price": Decimal("2299.00"),
                "original_price": Decimal("3999.00"),
                "discount_pct": 42,
                "currency": "INR",
                "rating": 4.7,
                "reviews_count": 280,
                "image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 30,
                "delivery_estimate": "Delivery in 2 business days",
                "specifications": {
                    "Max Pressure": "150 PSI Fast Inflation",
                    "Battery": "6000mAh Dual-Cell",
                    "Nozzles": "Included for Cars, Bikes, Balls"
                },
                "source_marketplace": "AMAZON",
                "source_product_id": "AMZ-AUT-3312",
                "supplier_cost": Decimal("1600.00")
            },

            # 16. Health and Lifestyle Products
            {
                "sku": "HLT-PST-001",
                "name": "SmartTrack Ergonomic Smart Posture Corrector",
                "category": "Health and Lifestyle Products",
                "description": "Vibration-assisted intelligent posture trainer that gently alerts you when slouching exceeds 25 degrees, supporting spine alignment.",
                "price": Decimal("899.00"),
                "original_price": Decimal("1899.00"),
                "discount_pct": 53,
                "currency": "INR",
                "rating": 4.6,
                "reviews_count": 190,
                "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80",
                "stock_quantity": 50,
                "delivery_estimate": "Delivery Tomorrow",
                "specifications": {
                    "Sensors": "Angle Sensing Gyroscope",
                    "Battery": "Type-C Rechargeable (15 Days Standby)",
                    "Material": "High-elastic Breathable Nylon"
                },
                "source_marketplace": "MEESHO",
                "source_product_id": "MSH-HLT-5510",
                "supplier_cost": Decimal("480.00")
            }
        ]

    @classmethod
    def sanitize_for_customer(cls, product_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Strips internal marketplace source information (Amazon, Flipkart, Meesho)
        before delivering product data to the customer portal.
        """
        clean = dict(product_dict)
        clean.pop("source_marketplace", None)
        clean.pop("source_product_id", None)
        clean.pop("supplier_cost", None)
        return clean

marketplace_service = MarketplaceService()

