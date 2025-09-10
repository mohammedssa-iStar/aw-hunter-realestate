from flask import Blueprint, request, jsonify, current_app
from src.models.user import db, User
from src.models.property import Property
from src.models.subscription import MarketingCampaign
from src.routes.auth import require_auth, require_role
from datetime import datetime, timedelta
import json
import requests
import os

marketing_bp = Blueprint('marketing', __name__)

# Social media platform configurations
SOCIAL_PLATFORMS = {
    'facebook': {
        'name': 'Facebook',
        'api_base': 'https://graph.facebook.com/v18.0',
        'required_permissions': ['pages_manage_posts', 'ads_management']
    },
    'instagram': {
        'name': 'Instagram',
        'api_base': 'https://graph.facebook.com/v18.0',
        'required_permissions': ['instagram_basic', 'instagram_content_publish']
    },
    'google': {
        'name': 'Google Ads',
        'api_base': 'https://googleads.googleapis.com/v14',
        'required_permissions': ['adwords']
    }
}

@marketing_bp.route('/campaigns', methods=['GET'])
@require_auth
def get_campaigns():
    """Get user's marketing campaigns"""
    try:
        user = request.current_user
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        platform = request.args.get('platform')
        status = request.args.get('status')
        
        query = MarketingCampaign.query.filter_by(user_id=user.id)
        
        if platform:
            query = query.filter_by(platform=platform)
        
        if status:
            query = query.filter_by(status=status)
        
        campaigns = query.order_by(MarketingCampaign.created_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'campaigns': [campaign.to_dict() for campaign in campaigns.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': campaigns.total,
                'pages': campaigns.pages,
                'has_next': campaigns.has_next,
                'has_prev': campaigns.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch campaigns', 'details': str(e)}), 500

@marketing_bp.route('/campaigns', methods=['POST'])
@require_auth
def create_campaign():
    """Create a new marketing campaign"""
    try:
        user = request.current_user
        data = request.get_json()
        
        # Check if user has marketing permissions
        if not user.has_active_subscription():
            return jsonify({'error': 'Active subscription required for marketing campaigns'}), 403
        
        # Validate required fields
        required_fields = ['name', 'platform', 'campaign_type', 'budget']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate platform
        if data['platform'] not in SOCIAL_PLATFORMS:
            return jsonify({'error': 'Invalid platform'}), 400
        
        # Create campaign
        campaign = MarketingCampaign(
            user_id=user.id,
            property_id=data.get('property_id'),
            name=data['name'],
            platform=data['platform'],
            campaign_type=data['campaign_type'],
            budget=int(data['budget'] * 100),  # Convert to fils
            daily_budget=int(data['daily_budget'] * 100) if data.get('daily_budget') else None,
            target_audience=json.dumps(data.get('target_audience', {})),
            status='draft'
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign created successfully',
            'campaign': campaign.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create campaign', 'details': str(e)}), 500

@marketing_bp.route('/campaigns/<int:campaign_id>', methods=['PUT'])
@require_auth
def update_campaign(campaign_id):
    """Update marketing campaign"""
    try:
        user = request.current_user
        campaign = MarketingCampaign.query.get(campaign_id)
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check ownership or admin permissions
        if campaign.user_id != user.id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        
        # Update fields
        updatable_fields = ['name', 'budget', 'daily_budget', 'target_audience', 'status']
        
        for field in updatable_fields:
            if field in data:
                if field in ['budget', 'daily_budget'] and data[field] is not None:
                    setattr(campaign, field, int(data[field] * 100))  # Convert to fils
                elif field == 'target_audience':
                    setattr(campaign, field, json.dumps(data[field]))
                else:
                    setattr(campaign, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign updated successfully',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update campaign', 'details': str(e)}), 500

@marketing_bp.route('/campaigns/<int:campaign_id>', methods=['DELETE'])
@require_auth
def delete_campaign(campaign_id):
    """Delete marketing campaign"""
    try:
        user = request.current_user
        campaign = MarketingCampaign.query.get(campaign_id)
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check ownership or admin permissions
        if campaign.user_id != user.id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        # If campaign is active, pause it first
        if campaign.status == 'active':
            campaign.status = 'paused'
        
        db.session.delete(campaign)
        db.session.commit()
        
        return jsonify({'message': 'Campaign deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete campaign', 'details': str(e)}), 500

@marketing_bp.route('/campaigns/<int:campaign_id>/launch', methods=['POST'])
@require_auth
def launch_campaign(campaign_id):
    """Launch marketing campaign"""
    try:
        user = request.current_user
        campaign = MarketingCampaign.query.get(campaign_id)
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check ownership
        if campaign.user_id != user.id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        if campaign.status != 'draft':
            return jsonify({'error': 'Only draft campaigns can be launched'}), 400
        
        # For demo purposes, we'll simulate campaign launch
        # In production, you would integrate with actual ad platforms
        
        try:
            # Simulate platform API call
            platform_campaign_id = f"{campaign.platform}_{campaign.id}_{datetime.utcnow().timestamp()}"
            
            # Update campaign status
            campaign.status = 'active'
            campaign.platform_campaign_id = platform_campaign_id
            campaign.start_date = datetime.utcnow()
            
            # Set end date based on budget and daily budget
            if campaign.daily_budget:
                days_duration = campaign.budget // campaign.daily_budget
                campaign.end_date = datetime.utcnow() + timedelta(days=days_duration)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Campaign launched successfully',
                'campaign': campaign.to_dict()
            }), 200
            
        except Exception as platform_error:
            return jsonify({
                'error': 'Failed to launch campaign on platform',
                'details': str(platform_error)
            }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to launch campaign', 'details': str(e)}), 500

@marketing_bp.route('/campaigns/<int:campaign_id>/pause', methods=['POST'])
@require_auth
def pause_campaign(campaign_id):
    """Pause marketing campaign"""
    try:
        user = request.current_user
        campaign = MarketingCampaign.query.get(campaign_id)
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check ownership
        if campaign.user_id != user.id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        if campaign.status != 'active':
            return jsonify({'error': 'Only active campaigns can be paused'}), 400
        
        # Update campaign status
        campaign.status = 'paused'
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign paused successfully',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to pause campaign', 'details': str(e)}), 500

@marketing_bp.route('/campaigns/<int:campaign_id>/metrics', methods=['GET'])
@require_auth
def get_campaign_metrics(campaign_id):
    """Get campaign performance metrics"""
    try:
        user = request.current_user
        campaign = MarketingCampaign.query.get(campaign_id)
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check ownership
        if campaign.user_id != user.id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        # For demo purposes, simulate some metrics
        # In production, you would fetch real metrics from ad platforms
        
        if campaign.status == 'active':
            # Simulate some performance data
            days_running = (datetime.utcnow() - campaign.start_date).days + 1
            simulated_impressions = days_running * 1000 + campaign.id * 100
            simulated_clicks = int(simulated_impressions * 0.02)  # 2% CTR
            simulated_leads = int(simulated_clicks * 0.1)  # 10% conversion
            simulated_cost = min(campaign.budget, days_running * (campaign.daily_budget or campaign.budget))
            
            # Update campaign with simulated data
            campaign.impressions = simulated_impressions
            campaign.clicks = simulated_clicks
            campaign.leads = simulated_leads
            campaign.cost_spent = simulated_cost
            db.session.commit()
        
        return jsonify({
            'campaign': campaign.to_dict(),
            'metrics': {
                'impressions': campaign.impressions,
                'clicks': campaign.clicks,
                'leads': campaign.leads,
                'cost_spent': campaign.get_cost_spent_aed(),
                'ctr': campaign.get_ctr(),
                'cpl': campaign.get_cpl(),
                'budget_remaining': campaign.get_budget_aed() - campaign.get_cost_spent_aed()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch metrics', 'details': str(e)}), 500

@marketing_bp.route('/social-share', methods=['POST'])
@require_auth
def share_property():
    """Share property on social media"""
    try:
        user = request.current_user
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['property_id', 'platforms', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        property_id = data['property_id']
        platforms = data['platforms']  # List of platforms
        message = data['message']
        
        # Get property
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Check ownership or permissions
        if property.owner_id != user.id and user.role not in ['admin', 'agent']:
            return jsonify({'error': 'Permission denied'}), 403
        
        # Check if user has social media promotion enabled
        if not user.social_media_promotion and user.role != 'admin':
            return jsonify({'error': 'Social media promotion not enabled in your plan'}), 403
        
        results = []
        
        for platform in platforms:
            try:
                # For demo purposes, simulate social media posting
                # In production, you would use actual social media APIs
                
                post_data = {
                    'platform': platform,
                    'property_id': property_id,
                    'message': message,
                    'property_title': property.title,
                    'property_price': property.price,
                    'property_location': property.location,
                    'property_image': property.main_image,
                    'posted_at': datetime.utcnow().isoformat(),
                    'post_id': f"{platform}_{property_id}_{datetime.utcnow().timestamp()}"
                }
                
                results.append({
                    'platform': platform,
                    'status': 'success',
                    'post_id': post_data['post_id'],
                    'message': f'Successfully posted to {platform}'
                })
                
            except Exception as platform_error:
                results.append({
                    'platform': platform,
                    'status': 'error',
                    'message': f'Failed to post to {platform}: {str(platform_error)}'
                })
        
        return jsonify({
            'message': 'Social media sharing completed',
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to share property', 'details': str(e)}), 500

@marketing_bp.route('/platforms', methods=['GET'])
@require_auth
def get_platforms():
    """Get available social media platforms"""
    try:
        user = request.current_user
        
        # Check user's subscription features
        user_platforms = []
        
        for platform_key, platform_info in SOCIAL_PLATFORMS.items():
            # Check if user has access to this platform
            has_access = False
            
            if user.role == 'admin':
                has_access = True
            elif platform_key == 'facebook' and user.has_active_subscription():
                # Facebook available for all paid plans
                has_access = True
            elif platform_key == 'google' and user.subscription_type == 'premium':
                # Google Ads only for premium
                has_access = True
            elif platform_key == 'instagram' and user.has_active_subscription():
                # Instagram available for all paid plans
                has_access = True
            
            user_platforms.append({
                'key': platform_key,
                'name': platform_info['name'],
                'has_access': has_access,
                'required_plan': 'premium' if platform_key == 'google' else 'basic'
            })
        
        return jsonify({
            'platforms': user_platforms,
            'user_subscription': user.subscription_type,
            'social_media_enabled': user.social_media_promotion
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch platforms', 'details': str(e)}), 500

@marketing_bp.route('/analytics', methods=['GET'])
@require_auth
def get_marketing_analytics():
    """Get marketing analytics overview"""
    try:
        user = request.current_user
        
        # Get user's campaigns
        campaigns = MarketingCampaign.query.filter_by(user_id=user.id).all()
        
        # Calculate totals
        total_campaigns = len(campaigns)
        active_campaigns = len([c for c in campaigns if c.status == 'active'])
        total_spent = sum(c.cost_spent for c in campaigns) / 100  # Convert to AED
        total_impressions = sum(c.impressions for c in campaigns)
        total_clicks = sum(c.clicks for c in campaigns)
        total_leads = sum(c.leads for c in campaigns)
        
        # Calculate averages
        avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        avg_cpl = (total_spent / total_leads) if total_leads > 0 else 0
        
        # Get campaign performance by platform
        platform_stats = {}
        for campaign in campaigns:
            platform = campaign.platform
            if platform not in platform_stats:
                platform_stats[platform] = {
                    'campaigns': 0,
                    'spent': 0,
                    'impressions': 0,
                    'clicks': 0,
                    'leads': 0
                }
            
            platform_stats[platform]['campaigns'] += 1
            platform_stats[platform]['spent'] += campaign.get_cost_spent_aed()
            platform_stats[platform]['impressions'] += campaign.impressions
            platform_stats[platform]['clicks'] += campaign.clicks
            platform_stats[platform]['leads'] += campaign.leads
        
        return jsonify({
            'overview': {
                'total_campaigns': total_campaigns,
                'active_campaigns': active_campaigns,
                'total_spent': round(total_spent, 2),
                'total_impressions': total_impressions,
                'total_clicks': total_clicks,
                'total_leads': total_leads,
                'avg_ctr': round(avg_ctr, 2),
                'avg_cpl': round(avg_cpl, 2)
            },
            'platform_stats': platform_stats,
            'recent_campaigns': [c.to_dict() for c in campaigns[-5:]]  # Last 5 campaigns
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch analytics', 'details': str(e)}), 500

# Admin routes for marketing management
@marketing_bp.route('/admin/campaigns', methods=['GET'])
@require_role('admin')
def get_all_campaigns():
    """Get all marketing campaigns (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        platform = request.args.get('platform')
        status = request.args.get('status')
        
        query = MarketingCampaign.query
        
        if platform:
            query = query.filter_by(platform=platform)
        
        if status:
            query = query.filter_by(status=status)
        
        campaigns = query.order_by(MarketingCampaign.created_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'campaigns': [campaign.to_dict() for campaign in campaigns.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': campaigns.total,
                'pages': campaigns.pages,
                'has_next': campaigns.has_next,
                'has_prev': campaigns.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch campaigns', 'details': str(e)}), 500

@marketing_bp.route('/admin/stats', methods=['GET'])
@require_role('admin')
def get_marketing_stats():
    """Get marketing statistics (admin only)"""
    try:
        # Get overall statistics
        total_campaigns = MarketingCampaign.query.count()
        active_campaigns = MarketingCampaign.query.filter_by(status='active').count()
        
        # Get total spend
        total_spent = db.session.query(
            db.func.sum(MarketingCampaign.cost_spent)
        ).scalar() or 0
        
        # Get platform distribution
        platform_stats = db.session.query(
            MarketingCampaign.platform,
            db.func.count(MarketingCampaign.id).label('count'),
            db.func.sum(MarketingCampaign.cost_spent).label('spent')
        ).group_by(MarketingCampaign.platform).all()
        
        return jsonify({
            'overview': {
                'total_campaigns': total_campaigns,
                'active_campaigns': active_campaigns,
                'total_spent': (total_spent or 0) / 100,  # Convert to AED
                'currency': 'AED'
            },
            'platform_distribution': [
                {
                    'platform': stat[0],
                    'campaigns': stat[1],
                    'spent': (stat[2] or 0) / 100
                }
                for stat in platform_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch stats', 'details': str(e)}), 500

