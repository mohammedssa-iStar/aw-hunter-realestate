from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Property details
    price = db.Column(db.BigInteger, nullable=False)  # Price in AED
    currency = db.Column(db.String(10), default='AED')
    bedrooms = db.Column(db.Integer, nullable=False)
    bathrooms = db.Column(db.Integer, nullable=False)
    area = db.Column(db.Integer, nullable=False)  # Area in square feet
    property_type = db.Column(db.String(50), nullable=False)  # Villa, Penthouse, Apartment, etc.
    status = db.Column(db.String(20), default='For Sale')  # For Sale, For Rent, Sold, etc.
    
    # Features and amenities
    features = db.Column(db.Text, nullable=True)  # JSON string of features
    
    # Media
    main_image = db.Column(db.String(500), nullable=True)
    gallery_images = db.Column(db.Text, nullable=True)  # JSON string of image URLs
    
    # Listing details
    featured = db.Column(db.Boolean, default=False)
    active = db.Column(db.Boolean, default=True)
    views = db.Column(db.Integer, default=0)
    
    # Relationships
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    agent_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = db.relationship('User', foreign_keys=[owner_id], backref='owned_properties')
    agent = db.relationship('User', foreign_keys=[agent_id], backref='managed_properties')
    
    def __repr__(self):
        return f'<Property {self.title}>'
    
    def to_dict(self):
        import json
        
        # Parse JSON fields safely
        features_list = []
        gallery_list = []
        
        try:
            if self.features:
                features_list = json.loads(self.features)
        except:
            features_list = []
            
        try:
            if self.gallery_images:
                gallery_list = json.loads(self.gallery_images)
        except:
            gallery_list = []
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'location': self.location,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'price': self.price,
            'currency': self.currency,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'area': self.area,
            'property_type': self.property_type,
            'status': self.status,
            'features': features_list,
            'main_image': self.main_image,
            'gallery_images': gallery_list,
            'featured': self.featured,
            'active': self.active,
            'views': self.views,
            'owner_id': self.owner_id,
            'agent_id': self.agent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'agent': {
                'name': self.agent.full_name if self.agent else None,
                'phone': self.agent.phone if self.agent else None,
                'email': self.agent.email if self.agent else None
            } if self.agent else None
        }

class PropertyInquiry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Contact details (for non-registered users)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    
    # Inquiry details
    message = db.Column(db.Text, nullable=True)
    inquiry_type = db.Column(db.String(50), default='General')  # General, Viewing, Purchase, etc.
    
    # Status
    status = db.Column(db.String(20), default='New')  # New, Contacted, Closed
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    property = db.relationship('Property', backref='inquiries')
    user = db.relationship('User', backref='inquiries')
    
    def to_dict(self):
        return {
            'id': self.id,
            'property_id': self.property_id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'message': self.message,
            'inquiry_type': self.inquiry_type,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'property': {
                'title': self.property.title,
                'location': self.property.location
            } if self.property else None
        }

class PropertyFavorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='favorites')
    property = db.relationship('Property', backref='favorited_by')
    
    # Unique constraint to prevent duplicate favorites
    __table_args__ = (db.UniqueConstraint('user_id', 'property_id', name='unique_user_property_favorite'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'property_id': self.property_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'property': self.property.to_dict() if self.property else None
        }

