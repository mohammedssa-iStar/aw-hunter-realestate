import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.property import Property, PropertyInquiry, PropertyFavorite
from src.models.subscription import SubscriptionPlan, Payment, MarketingCampaign
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.property import property_bp
from src.routes.subscription import subscription_bp
from src.routes.marketing import marketing_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'luxury_real_estate_secret_key_2024'

# Enable CORS for all routes
CORS(app, origins=['*'], supports_credentials=True)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(property_bp, url_prefix='/api')
app.register_blueprint(subscription_bp, url_prefix='/api/subscription')
app.register_blueprint(marketing_bp, url_prefix='/api/marketing')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def init_database():
    """Initialize database with sample data"""
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create default subscription plans if they don't exist
        if not SubscriptionPlan.query.first():
            plans = [
                {
                    'name': 'free',
                    'display_name': 'Free',
                    'description': 'Basic listing with 1-week trial',
                    'price_monthly': 0,
                    'max_properties': 1,
                    'social_media_promotion': False,
                    'priority_support': False,
                    'analytics_access': False,
                    'featured_listings': 0,
                    'google_ads_integration': False,
                    'facebook_ads_integration': False,
                    'lead_management': False,
                    'sort_order': 1
                },
                {
                    'name': 'basic',
                    'display_name': 'Basic',
                    'description': 'Perfect for individual property owners',
                    'price_monthly': 29900,  # 299 AED in fils
                    'price_yearly': 299900,  # 2999 AED in fils (2 months free)
                    'max_properties': 5,
                    'social_media_promotion': True,
                    'priority_support': False,
                    'analytics_access': True,
                    'featured_listings': 1,
                    'google_ads_integration': False,
                    'facebook_ads_integration': True,
                    'lead_management': True,
                    'sort_order': 2
                },
                {
                    'name': 'premium',
                    'display_name': 'Premium',
                    'description': 'For real estate professionals and agencies',
                    'price_monthly': 59900,  # 599 AED in fils
                    'price_yearly': 599900,  # 5999 AED in fils (2 months free)
                    'max_properties': 0,  # Unlimited
                    'social_media_promotion': True,
                    'priority_support': True,
                    'analytics_access': True,
                    'featured_listings': 5,
                    'google_ads_integration': True,
                    'facebook_ads_integration': True,
                    'lead_management': True,
                    'sort_order': 3
                }
            ]
            
            for plan_data in plans:
                plan = SubscriptionPlan(**plan_data)
                db.session.add(plan)
            
            db.session.commit()
            print("Created default subscription plans")

# Initialize database
init_database()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve React frontend"""
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    # Check if it's a built React app
    frontend_build_path = os.path.join(static_folder_path, 'frontend', 'dist')
    if os.path.exists(frontend_build_path):
        # Serve from built React app
        if path != "" and os.path.exists(os.path.join(frontend_build_path, path)):
            return send_from_directory(frontend_build_path, path)
        else:
            index_path = os.path.join(frontend_build_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(frontend_build_path, 'index.html')
    
    # Fallback to development React app
    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "Frontend not found. Please build the React app first.", 404

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors by serving React app"""
    return serve('')

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    db.session.rollback()
    return {"error": "Internal server error"}, 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'message': 'Luxury Real Estate API is running',
        'version': '1.0.0'
    }, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

