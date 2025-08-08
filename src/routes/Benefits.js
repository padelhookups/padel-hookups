import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  LocalOffer,
  SportsTennis,
  Restaurant,
  FitnessCenter,
  Store,
  CheckCircle,
  Star,
  Phone,
  Language
} from '@mui/icons-material';

const Benefits = () => {
  const partners = [
    {
      name: "Padel Club Elite",
      logo: "🎾",
      category: "Courts",
      discount: "20% OFF",
      description: "Premium padel courts with professional lighting",
      benefits: ["Court booking discounts", "Equipment rental deals", "Group lesson rates"],
      contact: "+1 234-567-8900",
      website: "www.padelclubElite.com"
    },
    {
      name: "SportGear Pro",
      logo: "🏪",
      category: "Equipment",
      discount: "15% OFF",
      description: "Professional padel equipment and accessories",
      benefits: ["Racket discounts", "Free shipping", "Extended warranty"],
      contact: "+1 234-567-8901",
      website: "www.sportgearpro.com"
    },
    {
      name: "Healthy Bites",
      logo: "🥗",
      category: "Nutrition",
      discount: "10% OFF",
      description: "Sports nutrition and healthy meal plans",
      benefits: ["Meal plan discounts", "Protein supplements", "Nutrition consultation"],
      contact: "+1 234-567-8902",
      website: "www.healthybites.com"
    },
    {
      name: "Fit & Strong Gym",
      logo: "💪",
      category: "Fitness",
      discount: "25% OFF",
      description: "Complete fitness center with padel-specific training",
      benefits: ["Monthly membership discounts", "Personal training sessions", "Group fitness classes"],
      contact: "+1 234-567-8903",
      website: "www.fitstrong.com"
    }
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Courts': return <SportsTennis />;
      case 'Equipment': return <Store />;
      case 'Nutrition': return <Restaurant />;
      case 'Fitness': return <FitnessCenter />;
      default: return <LocalOffer />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Courts': return 'primary';
      case 'Equipment': return 'secondary';
      case 'Nutrition': return 'success';
      case 'Fitness': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, pb: 12 }}>

      {/* Member Benefits Overview */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #b88f34 0%, #d4af37 50%, #b8860b 100%)', color: 'white' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Star sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" component="h2" gutterBottom>
            Member Exclusive Benefits
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
            Save money while improving your padel game with our partner network
          </Typography>
          <Chip 
            label="Active Member" 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 'bold'
            }} 
          />
        </CardContent>
      </Card>

      {/* Partners Grid */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Our Partners
      </Typography>
      
      <Grid container spacing={3}>
        {partners.map((partner, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Partner Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'grey.100', fontSize: '1.5rem' }}>
                    {partner.logo}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3">
                      {partner.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip 
                        icon={getCategoryIcon(partner.category)}
                        label={partner.category}
                        size="small"
                        color={getCategoryColor(partner.category)}
                        variant="outlined"
                      />
                      <Chip 
                        label={partner.discount}
                        size="small"
                        color="error"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" paragraph>
                  {partner.description}
                </Typography>

                {/* Benefits List */}
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Member Benefits:
                </Typography>
                <List dense>
                  {partner.benefits.map((benefit, benefitIndex) => (
                    <ListItem key={benefitIndex} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={benefit}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Contact Info */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{partner.contact}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Language fontSize="small" color="action" />
                    <Typography variant="body2">{partner.website}</Typography>
                  </Box>
                </Box>
              </CardContent>

              {/* Action Button */}
              <Box sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  color={getCategoryColor(partner.category)}
                >
                  Claim {partner.discount}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* How to Use Benefits */}
      {/* <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            How to Use Your Benefits
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Show your Padel Hookups membership"
                secondary="Present your profile or membership card at participating partners"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Use promo codes online"
                secondary="Enter your member discount code when shopping online"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Contact partners directly"
                secondary="Call or visit partner websites for exclusive member pricing"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card> */}
    </Box>
  );
};

export default Benefits;
