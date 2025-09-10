import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Check, 
  Crown, 
  Star, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  Megaphone,
  CreditCard,
  Loader2,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscriptionAPI, utils } from '../lib/api'

const SubscriptionModal = ({ isOpen, onClose, selectedPlan = null }) => {
  const { user, updateUser, isAuthenticated } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedBilling, setSelectedBilling] = useState('monthly')
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadPlans()
    }
  }, [isOpen])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await subscriptionAPI.getPlans()
      setPlans(response.plans || [])
    } catch (error) {
      console.error('Failed to load plans:', error)
      setError('Failed to load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      setError('Please sign in to subscribe')
      return
    }

    try {
      setProcessingPayment(true)
      setError(null)

      // For demo purposes, we'll simulate the payment process
      // In production, you would integrate with Stripe Elements
      const response = await subscriptionAPI.subscribe({
        plan_id: plan.id,
        billing_cycle: selectedBilling,
        // payment_method_id would come from Stripe Elements
      })

      // Update user data
      updateUser(response.user)
      
      // Show success message and close modal
      alert(`Successfully subscribed to ${plan.display_name}!`)
      onClose()

    } catch (error) {
      setError(error.message || 'Payment failed. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleStartTrial = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to start free trial')
      return
    }

    try {
      setProcessingPayment(true)
      setError(null)

      const response = await subscriptionAPI.startTrial()
      updateUser(response.user)
      
      alert('Free trial started! You can now list properties for 1 week.')
      onClose()

    } catch (error) {
      setError(error.message || 'Failed to start trial')
    } finally {
      setProcessingPayment(false)
    }
  }

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'free':
        return <Users className="w-6 h-6" />
      case 'basic':
        return <Star className="w-6 h-6" />
      case 'premium':
        return <Crown className="w-6 h-6" />
      default:
        return <Zap className="w-6 h-6" />
    }
  }

  const getPlanColor = (planName) => {
    switch (planName) {
      case 'free':
        return 'from-slate-500 to-slate-600'
      case 'basic':
        return 'from-blue-500 to-blue-600'
      case 'premium':
        return 'from-amber-500 to-amber-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getFeatureIcon = (feature) => {
    const iconMap = {
      'social_media_promotion': <Megaphone className="w-4 h-4" />,
      'priority_support': <Shield className="w-4 h-4" />,
      'analytics_access': <BarChart3 className="w-4 h-4" />,
      'google_ads_integration': <Megaphone className="w-4 h-4" />,
      'facebook_ads_integration': <Megaphone className="w-4 h-4" />,
      'lead_management': <Users className="w-4 h-4" />
    }
    return iconMap[feature] || <Check className="w-4 h-4" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
            Choose Your Plan
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Select the perfect plan to showcase your luxury properties
          </p>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mt-6">
          <Tabs value={selectedBilling} onValueChange={setSelectedBilling} className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                  Save 17%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {plans.map((plan) => {
              const isCurrentPlan = user?.subscription_type === plan.name
              const isPopular = plan.name === 'basic'
              const price = selectedBilling === 'yearly' && plan.price_yearly 
                ? plan.price_yearly 
                : plan.price_monthly

              return (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    isPopular ? 'ring-2 ring-amber-500 scale-105' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center py-2 text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-2 text-sm font-semibold">
                      Current Plan
                    </div>
                  )}

                  <CardHeader className={`text-center ${isPopular || isCurrentPlan ? 'pt-12' : 'pt-6'}`}>
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r ${getPlanColor(plan.name)} flex items-center justify-center text-white`}>
                      {getPlanIcon(plan.name)}
                    </div>
                    
                    <CardTitle className="text-2xl font-bold">{plan.display_name}</CardTitle>
                    
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-gray-900">
                        {price === 0 ? 'Free' : `AED ${price.toLocaleString()}`}
                      </div>
                      {price > 0 && (
                        <div className="text-gray-500">
                          per {selectedBilling === 'yearly' ? 'year' : 'month'}
                        </div>
                      )}
                      {selectedBilling === 'yearly' && plan.price_yearly && plan.price_monthly && (
                        <div className="text-sm text-green-600 mt-1">
                          Save AED {((plan.price_monthly * 12) - plan.price_yearly).toLocaleString()} per year
                        </div>
                      )}
                    </div>

                    <p className="text-gray-600 mt-2">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Features List */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">
                          {plan.features.max_properties === 0 
                            ? 'Unlimited properties' 
                            : `Up to ${plan.features.max_properties} properties`}
                        </span>
                      </div>

                      {plan.features.featured_listings > 0 && (
                        <div className="flex items-center space-x-3">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm">
                            {plan.features.featured_listings} featured listings
                          </span>
                        </div>
                      )}

                      {Object.entries(plan.features).map(([feature, enabled]) => {
                        if (typeof enabled === 'boolean' && enabled && 
                            !['max_properties', 'featured_listings'].includes(feature)) {
                          const featureNames = {
                            social_media_promotion: 'Social media promotion',
                            priority_support: '24/7 priority support',
                            analytics_access: 'Advanced analytics',
                            google_ads_integration: 'Google Ads integration',
                            facebook_ads_integration: 'Facebook Ads integration',
                            lead_management: 'Lead management system'
                          }
                          
                          return (
                            <div key={feature} className="flex items-center space-x-3">
                              {getFeatureIcon(feature)}
                              <span className="text-sm">{featureNames[feature] || feature}</span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                      {plan.name === 'free' ? (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={handleStartTrial}
                          disabled={processingPayment || user?.free_trial_used}
                        >
                          {processingPayment ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Starting Trial...
                            </>
                          ) : user?.free_trial_used ? (
                            'Trial Used'
                          ) : (
                            'Start Free Trial'
                          )}
                        </Button>
                      ) : isCurrentPlan ? (
                        <Button className="w-full" variant="outline" disabled>
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          className={`w-full bg-gradient-to-r ${getPlanColor(plan.name)} hover:opacity-90`}
                          onClick={() => handleSubscribe(plan)}
                          disabled={processingPayment}
                        >
                          {processingPayment ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Subscribe Now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Features Comparison */}
        <div className="mt-12 border-t pt-8">
          <h3 className="text-xl font-semibold text-center mb-6">Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Features</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-2">{plan.display_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b">
                  <td className="py-2">Property Listings</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-2">
                      {plan.features.max_properties === 0 ? '∞' : plan.features.max_properties}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2">Featured Listings</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-2">
                      {plan.features.featured_listings || '0'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2">Social Media Promotion</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-2">
                      {plan.features.social_media_promotion ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2">Analytics & Reports</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-2">
                      {plan.features.analytics_access ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2">Google Ads Integration</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-2">
                      {plan.features.google_ads_integration ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2">Facebook Ads Integration</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="text-center py-2">
                      {plan.features.facebook_ads_integration ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Secure payment processing powered by Stripe. Your payment information is encrypted and secure.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SubscriptionModal

