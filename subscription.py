from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class SubscriptionPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    display_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Pricing
    price_monthly = db.Column(db.Integer, nullable=False)  # Price in fils (1 AED = 100 fils)
    price_yearly = db.Column(db.Integer, nullable=True)
    currency = db.Column(db.String(10), default='AED')
    
    # Features
    max_properties = db.Column(db.Integer, default=0)  # 0 = unlimited
    social_media_promotion = db.Column(db.Boolean, default=False)
    priority_support = db.Column(db.Boolean, default=False)
    analytics_access = db.Column(db.Boolean, default=False)
    featured_listings = db.Column(db.Integer, default=0)
    
    # Marketing features
    google_ads_integration = db.Column(db.Boolean, default=False)
    facebook_ads_integration = db.Column(db.Boolean, default=False)
    lead_management = db.Column(db.Boolean, default=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<SubscriptionPlan {self.name}>'
    
    def get_price_aed(self, billing_cycle='monthly'):
        """Get price in AED"""
        if billing_cycle == 'yearly' and self.price_yearly:
            return self.price_yearly / 100
        return self.price_monthly / 100
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'price_monthly': self.get_price_aed('monthly'),
            'price_yearly': self.get_price_aed('yearly') if self.price_yearly else None,
            'currency': self.currency,
            'features': {
                'max_properties': self.max_properties,
                'social_media_promotion': self.social_media_promotion,
                'priority_support': self.priority_support,
                'analytics_access': self.analytics_access,
                'featured_listings': self.featured_listings,
                'google_ads_integration': self.google_ads_integration,
                'facebook_ads_integration': self.facebook_ads_integration,
                'lead_management': self.lead_management
            },
            'is_active': self.is_active,
            'sort_order': self.sort_order
        }

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Payment details
    stripe_payment_id = db.Column(db.String(255), unique=True, nullable=True)
    stripe_customer_id = db.Column(db.String(255), nullable=True)
    
    # Transaction details
    amount = db.Column(db.Integer, nullable=False)  # Amount in fils
    currency = db.Column(db.String(10), default='AED')
    description = db.Column(db.String(500), nullable=True)
    
    # Payment status
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, refunded
    payment_method = db.Column(db.String(50), nullable=True)  # card, bank_transfer, etc.
    
    # Subscription details
    subscription_plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plan.id'), nullable=True)
    billing_cycle = db.Column(db.String(20), default='monthly')  # monthly, yearly
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref='payments')
    subscription_plan = db.relationship('SubscriptionPlan', backref='payments')
    
    def __repr__(self):
        return f'<Payment {self.id}: {self.amount/100} {self.currency}>'
    
    def get_amount_aed(self):
        """Get amount in AED"""
        return self.amount / 100
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'stripe_payment_id': self.stripe_payment_id,
            'amount': self.get_amount_aed(),
            'currency': self.currency,
            'description': self.description,
            'status': self.status,
            'payment_method': self.payment_method,
            'billing_cycle': self.billing_cycle,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'subscription_plan': self.subscription_plan.to_dict() if self.subscription_plan else None
        }

class MarketingCampaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=True)
    
    # Campaign details
    name = db.Column(db.String(200), nullable=False)
    platform = db.Column(db.String(50), nullable=False)  # google, facebook, instagram
    campaign_type = db.Column(db.String(50), nullable=False)  # property_promotion, brand_awareness
    
    # Budget and targeting
    budget = db.Column(db.Integer, nullable=False)  # Budget in fils
    daily_budget = db.Column(db.Integer, nullable=True)
    target_audience = db.Column(db.Text, nullable=True)  # JSON string
    
    # Campaign status
    status = db.Column(db.String(20), default='draft')  # draft, active, paused, completed
    platform_campaign_id = db.Column(db.String(255), nullable=True)
    
    # Performance metrics
    impressions = db.Column(db.Integer, default=0)
    clicks = db.Column(db.Integer, default=0)
    leads = db.Column(db.Integer, default=0)
    cost_spent = db.Column(db.Integer, default=0)  # Amount spent in fils
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref='marketing_campaigns')
    property = db.relationship('Property', backref='marketing_campaigns')
    
    def __repr__(self):
        return f'<MarketingCampaign {self.name}>'
    
    def get_budget_aed(self):
        """Get budget in AED"""
        return self.budget / 100
    
    def get_cost_spent_aed(self):
        """Get cost spent in AED"""
        return self.cost_spent / 100
    
    def get_ctr(self):
        """Calculate click-through rate"""
        if self.impressions == 0:
            return 0
        return (self.clicks / self.impressions) * 100
    
    def get_cpl(self):
        """Calculate cost per lead"""
        if self.leads == 0:
            return 0
        return self.get_cost_spent_aed() / self.leads
    
    def to_dict(self):
        import json
        
        target_audience_data = {}
        try:
            if self.target_audience:
                target_audience_data = json.loads(self.target_audience)
        except:
            target_audience_data = {}
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'property_id': self.property_id,
            'name': self.name,
            'platform': self.platform,
            'campaign_type': self.campaign_type,
            'budget': self.get_budget_aed(),
            'daily_budget': self.daily_budget / 100 if self.daily_budget else None,
            'target_audience': target_audience_data,
            'status': self.status,
            'platform_campaign_id': self.platform_campaign_id,
            'performance': {
                'impressions': self.impressions,
                'clicks': self.clicks,
                'leads': self.leads,
                'cost_spent': self.get_cost_spent_aed(),
                'ctr': round(self.get_ctr(), 2),
                'cpl': round(self.get_cpl(), 2)
            },
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'property': {
                'title': self.property.title,
                'location': self.property.location
            } if self.property else None
        }

