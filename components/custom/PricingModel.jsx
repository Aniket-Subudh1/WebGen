'use client';
import { UserDetailContext } from '@/context/UserDetailContext';
import Lookup from '@/data/Lookup';
import React, { useContext, useState } from 'react';
import { Button } from '../ui/button';
import { Check, CreditCard, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

function PricingModel() {
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Format token count safely
  const formatTokens = (tokens) => {
    if (tokens === undefined || tokens === null) return '0';
    return typeof tokens === 'number' ? tokens.toLocaleString() : String(tokens);
  };

  const onPurchase = async (pricing) => {
    if (!userDetail?._id) {
      toast.error("Please sign in to purchase tokens");
      return;
    }
    
    setIsProcessing(true);
    setSelectedOption(pricing);
    
    try {
      // Simulate payment process
      toast.info("Processing your purchase...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demonstration, we'll just add tokens directly
      const currentTokens = userDetail?.token || 0;
      const token = Number(currentTokens) + Number(pricing.value);
      
      // Update tokens in database
      const response = await axios.put('/api/user/token', {
        token: token,
        userId: userDetail._id,
      });
      
      if (response.data) {
        // Update user in state
        setUserDetail(prev => ({ ...prev, token }));
        toast.success(`Successfully added ${pricing.value.toLocaleString()} tokens!`);
      }
    } catch (error) {
      console.error('Error updating tokens:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  return (
    <div className="container py-10">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">{Lookup.PRICING_DESC}</p>
        
        {userDetail && (
          <div className="max-w-md mx-auto mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between">
            <div>
              <h3 className="font-medium">Current Balance</h3>
              <p className="text-2xl font-bold mt-1">
                {formatTokens(userDetail.token)} <span className="text-sm font-normal text-muted-foreground">tokens</span>
              </p>
            </div>
            <Sparkles className="h-10 w-10 text-primary/50" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Lookup.PRICING_OPTIONS.map((pricing, index) => (
          <div 
            key={index}
            className={`flex flex-col border rounded-xl overflow-hidden transition-all ${
              selectedOption?.name === pricing.name 
                ? 'ring-2 ring-primary scale-[1.01] shadow-md' 
                : 'hover:shadow-md'
            }`}
          >
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-semibold">{pricing.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-bold">${pricing.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">one-time</span>
              </div>
              <p className="mt-2 text-muted-foreground flex-1">{pricing.desc}</p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                  <span><span className="font-semibold">{formatTokens(pricing.tokens)}</span> tokens</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                  <span>No subscription</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                  <span>Code generation</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-muted/30 border-t">
              <Button 
                className="w-full" 
                onClick={() => onPurchase(pricing)}
                disabled={!userDetail || isProcessing}
              >
                {isProcessing && selectedOption?.name === pricing.name ? (
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {isProcessing && selectedOption?.name === pricing.name ? 'Processing...' : 'Purchase'}
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Payment method information */}
      <div className="mt-12 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
        <div className="bg-muted/30 p-6 rounded-lg border">
          <p className="mb-4">For this demo version, token purchases are simulated. In a production environment, you would integrate with:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Stripe for credit card payments</li>
            <li>PayPal for alternative payment methods</li>
            <li>Crypto payment gateways for digital currencies</li>
          </ul>
          <p className="mt-4 text-muted-foreground text-sm">
            Note: When you click "Purchase", tokens will be added to your account directly without any actual payment processing.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PricingModel;