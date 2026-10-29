from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.campaign import Campaign, CampaignLead
from app.models.customer import Customer
from app.schemas.campaign import CampaignCreate, CampaignUpdate, CampaignResponse, CampaignLeadResponse
from app.services.outbound_service import outbound_service

router = APIRouter()

@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    stmt = select(Campaign).order_by(desc(Campaign.created_at))
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=CampaignResponse)
async def create_campaign(req: CampaignCreate, db: AsyncSession = Depends(get_db)):
    campaign = Campaign(
        name=req.name,
        campaign_type=req.campaign_type,
        script_prompt=req.script_prompt,
        target_language=req.target_language,
        scheduled_at=req.scheduled_at,
        respect_dnd=req.respect_dnd,
        require_prior_consent=req.require_prior_consent,
        status="DRAFT"
    )
    db.add(campaign)
    await db.flush()

    # Populate leads from customer list
    if req.lead_customer_ids:
        c_stmt = select(Customer).where(Customer.id.in_(req.lead_customer_ids))
    else:
        # Default to first 5 customers with outbound consent
        c_stmt = select(Customer).where(Customer.consent_for_outbound == True).limit(5)
        
    c_res = await db.execute(c_stmt)
    customers = c_res.scalars().all()

    for cust in customers:
        lead = CampaignLead(
            campaign_id=campaign.id,
            customer_id=cust.id,
            phone=cust.phone,
            customer_name=cust.name,
            language=cust.preferred_language or req.target_language,
            status="PENDING"
        )
        db.add(lead)

    campaign.total_leads = len(customers)
    await db.commit()
    await db.refresh(campaign)
    return campaign

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Campaign).where(Campaign.id == campaign_id)
    res = await db.execute(stmt)
    camp = res.scalars().first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return camp

@router.get("/{campaign_id}/leads", response_model=List[CampaignLeadResponse])
async def list_campaign_leads(campaign_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(CampaignLead).where(CampaignLead.campaign_id == campaign_id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/{campaign_id}/launch")
async def launch_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    """
    Executes outbound campaign calls respecting consent and DND status.
    """
    result = await outbound_service.run_campaign_batch(db, campaign_id)
    return result

