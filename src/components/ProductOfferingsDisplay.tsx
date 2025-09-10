import React from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Globe, Smartphone, Code, Users, Building2 } from 'lucide-react';

interface ProductOffering {
  name: string;
  features: string[];
  platform: string;
  description: string;
  target_market: string;
}

interface ProductOfferingsDisplayProps {
  offerings: Record<string, ProductOffering[]>;
}

const getPlatformIcon = (platform: string) => {
  const platforms = platform.toLowerCase();
  if (platforms.includes('web') && platforms.includes('mobile')) {
    return <Globe className="h-4 w-4" />;
  } else if (platforms.includes('mobile')) {
    return <Smartphone className="h-4 w-4" />;
  } else if (platforms.includes('api')) {
    return <Code className="h-4 w-4" />;
  } else if (platforms.includes('web')) {
    return <Globe className="h-4 w-4" />;
  }
  return <Globe className="h-4 w-4" />;
};

const getTargetMarketIcon = (targetMarket: string) => {
  switch (targetMarket.toLowerCase()) {
    case 'business':
      return <Building2 className="h-4 w-4" />;
    case 'consumer':
      return <Users className="h-4 w-4" />;
    case 'both':
      return <Users className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
};

const getTargetMarketVariant = (targetMarket: string) => {
  switch (targetMarket.toLowerCase()) {
    case 'business':
      return 'destructive' as const;
    case 'consumer':
      return 'secondary' as const;
    case 'both':
      return 'default' as const;
    default:
      return 'outline' as const;
  }
};

const ProductOfferingsDisplay: React.FC<ProductOfferingsDisplayProps> = ({ offerings }) => {
  if (!offerings || Object.keys(offerings).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No product offerings available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(offerings).map(([category, products]) => (
        <div key={category} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{category}</h3>
            <Separator />
          </div>
          
          <div className="grid gap-4">
            {products.map((product, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold text-foreground mb-1">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {product.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getPlatformIcon(product.platform)}
                        <span className="capitalize">{product.platform.replace('|', ' & ')}</span>
                      </Badge>
                      <Badge variant={getTargetMarketVariant(product.target_market)} className="flex items-center gap-1">
                        {getTargetMarketIcon(product.target_market)}
                        <span className="capitalize">{product.target_market}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Key Features</h4>
                    <ul className="space-y-1">
                      {product.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="flex-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductOfferingsDisplay;