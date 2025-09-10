from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile information
    full_name = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    avatar = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    
    # User role and permissions
    role = db.Column(db.String(20), default='user')  # user, agent, admin
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Subscription information
    subscription_type = db.Column(db.String(20), default='free')  # free, basic, premium
    subscription_start = db.Column(db.DateTime, nullable=True)
    subscription_end = db.Column(db.DateTime, nullable=True)
    free_trial_used = db.Column(db.Boolean, default=False)
    
    # Authentication tokens
    auth_token = db.Column(db.String(255), nullable=True)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    # Social media integration
    facebook_id = db.Column(db.String(100), nullable=True)
    google_id = db.Column(db.String(100), nullable=True)
    
    # Marketing preferences
    marketing_enabled = db.Column(db.Boolean, default=True)
    social_media_promotion = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def generate_auth_token(self):
        """Generate authentication token"""
        self.auth_token = secrets.token_urlsafe(32)
        return self.auth_token
    
    def generate_reset_token(self):
        """Generate password reset token"""
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=24)
        return self.reset_token
    
    def is_reset_token_valid(self):
        """Check if reset token is still valid"""
        if not self.reset_token or not self.reset_token_expires:
            return False
        return datetime.utcnow() < self.reset_token_expires
    
    def has_active_subscription(self):
        """Check if user has an active subscription"""
        if self.subscription_type == 'free':
            return False
        if not self.subscription_end:
            return False
        return datetime.utcnow() < self.subscription_end
    
    def can_list_properties(self):
        """Check if user can list properties"""
        if self.role in ['agent', 'admin']:
            return True
        return self.has_active_subscription() or not self.free_trial_used
    
    def get_subscription_status(self):
        """Get detailed subscription status"""
        if self.subscription_type == 'free':
            if not self.free_trial_used:
                return {
                    'type': 'free_trial_available',
                    'message': '1 week free trial available',
                    'can_list': True
                }
            else:
                return {
                    'type': 'free',
                    'message': 'Free account - upgrade to list properties',
                    'can_list': False
                }
        
        if self.has_active_subscription():
            days_left = (self.subscription_end - datetime.utcnow()).days
            return {
                'type': self.subscription_type,
                'message': f'{self.subscription_type.title()} subscription - {days_left} days left',
                'can_list': True,
                'days_left': days_left
            }
        else:
            return {
                'type': 'expired',
                'message': 'Subscription expired - renew to continue listing',
                'can_list': False
            }
    
    def start_free_trial(self):
        """Start the 1-week free trial"""
        if not self.free_trial_used:
            self.subscription_type = 'trial'
            self.subscription_start = datetime.utcnow()
            self.subscription_end = datetime.utcnow() + timedelta(days=7)
            self.free_trial_used = True
            return True
        return False
    
    def upgrade_subscription(self, subscription_type, duration_months=1):
        """Upgrade user subscription"""
        self.subscription_type = subscription_type
        self.subscription_start = datetime.utcnow()
        self.subscription_end = datetime.utcnow() + timedelta(days=30 * duration_months)
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'avatar': self.avatar,
            'bio': self.bio,
            'role': self.role,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'subscription_type': self.subscription_type,
            'marketing_enabled': self.marketing_enabled,
            'social_media_promotion': self.social_media_promotion,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'subscription_status': self.get_subscription_status()
        }
        
        if include_sensitive:
            data.update({
                'auth_token': self.auth_token,
                'subscription_start': self.subscription_start.isoformat() if self.subscription_start else None,
                'subscription_end': self.subscription_end.isoformat() if self.subscription_end else None,
                'free_trial_used': self.free_trial_used
            })
        
        return data

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    user = db.relationship('User', backref='sessions')
    
    def __repr__(self):
        return f'<UserSession {self.user_id}:{self.session_token[:8]}>'
    
    def is_valid(self):
        """Check if session is still valid"""
        return self.is_active and datetime.utcnow() < self.expires_at
    
    def extend_session(self, hours=24):
        """Extend session expiration"""
        self.expires_at = datetime.utcnow() + timedelta(hours=hours)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_token': self.session_token,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active
        }

